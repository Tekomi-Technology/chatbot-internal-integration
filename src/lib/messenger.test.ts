import assert from "node:assert/strict";
import { test } from "node:test";

import {
  collectHandoverRequests,
  collectHumanEchoes,
  collectTextEvents,
} from "@/lib/messenger";

/** Payload Facebook gửi khi nhân viên kéo hội thoại sang "Inbox". */
const HANDOVER_PAYLOAD = {
  object: "page",
  entry: [
    {
      id: "page-1",
      messaging: [
        {
          sender: { id: "psid-1" },
          recipient: { id: "page-1" },
          timestamp: 1458692752478,
          request_thread_control: {
            requested_owner_app_id: "263902037430900",
            metadata: "cần người thật",
          },
        },
      ],
    },
  ],
};

const TEXT_PAYLOAD = {
  object: "page",
  entry: [
    {
      id: "page-1",
      messaging: [
        {
          sender: { id: "psid-1" },
          message: { mid: "mid-1", text: "cho hỏi giá" },
        },
      ],
    },
  ],
};

test("collectHandoverRequests: payload chuẩn ra đúng một yêu cầu", () => {
  assert.deepEqual(collectHandoverRequests(HANDOVER_PAYLOAD), [
    {
      pageId: "page-1",
      psid: "psid-1",
      requestedOwnerAppId: "263902037430900",
    },
  ]);
});

test("collectHandoverRequests: app id dạng số vẫn ra chuỗi", () => {
  const payload = {
    ...HANDOVER_PAYLOAD,
    entry: [
      {
        id: "page-1",
        messaging: [
          {
            sender: { id: "psid-1" },
            request_thread_control: { requested_owner_app_id: 263902037430900 },
          },
        ],
      },
    ],
  };

  assert.equal(
    collectHandoverRequests(payload)[0].requestedOwnerAppId,
    "263902037430900",
  );
});

test("collectHandoverRequests: một entry chứa nhiều sự kiện thì ra nhiều yêu cầu", () => {
  const payload = {
    object: "page",
    entry: [
      {
        id: "page-1",
        messaging: [
          {
            sender: { id: "psid-1" },
            request_thread_control: { requested_owner_app_id: "app-a" },
          },
          {
            sender: { id: "psid-2" },
            request_thread_control: { requested_owner_app_id: "app-a" },
          },
        ],
      },
    ],
  };

  assert.equal(collectHandoverRequests(payload).length, 2);
});

test("collectHandoverRequests: tin nhắn thường bị bỏ qua", () => {
  assert.deepEqual(collectHandoverRequests(TEXT_PAYLOAD), []);
});

test("collectHandoverRequests: pass_thread_control bị bỏ qua có chủ đích", () => {
  const payload = {
    object: "page",
    entry: [
      {
        id: "page-1",
        messaging: [
          {
            sender: { id: "psid-1" },
            pass_thread_control: { new_owner_app_id: "app-cua-ta" },
          },
        ],
      },
    ],
  };

  assert.deepEqual(collectHandoverRequests(payload), []);
});

test("collectHandoverRequests: thiếu trường thì trả mảng rỗng, không throw", () => {
  assert.deepEqual(collectHandoverRequests(null), []);
  assert.deepEqual(collectHandoverRequests({}), []);
  assert.deepEqual(collectHandoverRequests({ object: "page" }), []);
  assert.deepEqual(
    collectHandoverRequests({ object: "page", entry: [{ id: "page-1" }] }),
    [],
  );
  assert.deepEqual(
    collectHandoverRequests({
      object: "page",
      entry: [
        {
          id: "page-1",
          messaging: [{ request_thread_control: { requested_owner_app_id: "a" } }],
        },
      ],
    }),
    [],
    "thiếu sender.id thì phải bỏ",
  );
});

test("collectHandoverRequests: object khác 'page' thì bỏ", () => {
  assert.deepEqual(
    collectHandoverRequests({ ...HANDOVER_PAYLOAD, object: "instagram" }),
    [],
  );
});

test("collectTextEvents: payload handover không lọt vào luồng trả lời", () => {
  assert.deepEqual(collectTextEvents(HANDOVER_PAYLOAD), []);
});

/**
 * Ghi lại bằng test một hành vi đã gây sự cố thật: khi Handover Protocol bật
 * trên Page mà app không giữ quyền điều khiển thread, Facebook chuyển tin của
 * khách sang `entry[].standby[]`. Cả hai parser đều bỏ qua, nên webhook trả 200
 * mà bot im hoàn toàn và không ghi log gì — trông y hệt lỗi code.
 *
 * Test này không đòi hỏi phải xử lý `standby`; nó chốt lại rằng KHÔNG xử lý là
 * hành vi hiện tại, để lần sau ai đọc cũng biết đây là cấu hình Meta chứ không
 * phải parser hỏng.
 */
test("collectTextEvents: tin nằm ở standby thì bị bỏ qua — dấu hiệu app không giữ quyền thread", () => {
  const standbyPayload = {
    object: "page",
    entry: [
      {
        id: "page-1",
        standby: [
          {
            sender: { id: "psid-1" },
            recipient: { id: "page-1" },
            message: { mid: "mid-1", text: "cho hỏi giá" },
          },
        ],
      },
    ],
  };

  assert.deepEqual(collectTextEvents(standbyPayload), []);
  assert.deepEqual(collectHandoverRequests(standbyPayload), []);
});

// --- Echo: nhân viên tiếp quản hội thoại ------------------------------------

/** App ID của app này. Mọi echo mang app id khác đều là người khác nhắn cho khách. */
const OWN_APP_ID = "1404277608284195";

/** App ID của Page Inbox — quan sát được trong log thật ngày 2026-08-17. */
const PAGE_INBOX_APP_ID = "263902037430900";

/**
 * Echo Facebook gửi khi nhân viên gõ tay một tin từ Hộp thư.
 *
 * Chú ý chiều: `sender` là PAGE, `recipient` là KHÁCH. Ngược hẳn với payload
 * tin nhắn thường.
 */
const HUMAN_ECHO_PAYLOAD = {
  object: "page",
  entry: [
    {
      id: "page-1",
      messaging: [
        {
          sender: { id: "page-1" },
          recipient: { id: "psid-1" },
          timestamp: 1458692752478,
          message: {
            is_echo: true,
            app_id: PAGE_INBOX_APP_ID,
            mid: "mid-echo-1",
            text: "Chào bạn, mình là Tú bên TKC",
          },
        },
      ],
    },
  ],
};

/** Echo của chính bot. Nhận nhầm cái này là bot tự bịt miệng mình vĩnh viễn. */
const OWN_ECHO_PAYLOAD = {
  object: "page",
  entry: [
    {
      id: "page-1",
      messaging: [
        {
          sender: { id: "page-1" },
          recipient: { id: "psid-1" },
          message: {
            is_echo: true,
            app_id: OWN_APP_ID,
            mid: "mid-echo-2",
            text: "Xin chào, tôi là trợ lý nội bộ",
          },
        },
      ],
    },
  ],
};

test("collectHumanEchoes: echo của nhân viên lấy PSID từ recipient, không phải sender", () => {
  assert.deepEqual(collectHumanEchoes(HUMAN_ECHO_PAYLOAD, OWN_APP_ID), [
    { pageId: "page-1", psid: "psid-1", senderAppId: PAGE_INBOX_APP_ID },
  ]);
});

test("collectHumanEchoes: echo của chính app ta bị bỏ qua", () => {
  assert.deepEqual(collectHumanEchoes(OWN_ECHO_PAYLOAD, OWN_APP_ID), []);
});

test("collectHumanEchoes: app id dạng số vẫn so khớp đúng", () => {
  const payload = {
    object: "page",
    entry: [
      {
        id: "page-1",
        messaging: [
          {
            sender: { id: "page-1" },
            recipient: { id: "psid-1" },
            message: { is_echo: true, app_id: Number(OWN_APP_ID) },
          },
        ],
      },
    ],
  };

  assert.deepEqual(collectHumanEchoes(payload, OWN_APP_ID), []);
});

test("collectHumanEchoes: echo không có app_id vẫn tính là người khác gửi", () => {
  const payload = {
    object: "page",
    entry: [
      {
        id: "page-1",
        messaging: [
          {
            sender: { id: "page-1" },
            recipient: { id: "psid-1" },
            message: { is_echo: true, mid: "mid-3", text: "gửi từ app Trang" },
          },
        ],
      },
    ],
  };

  assert.deepEqual(collectHumanEchoes(payload, OWN_APP_ID), [
    { pageId: "page-1", psid: "psid-1", senderAppId: null },
  ]);
});

test("collectHumanEchoes: tin thường của khách không phải echo", () => {
  assert.deepEqual(collectHumanEchoes(TEXT_PAYLOAD, OWN_APP_ID), []);
});

test("collectHumanEchoes: thiếu MESSENGER_APP_ID thì TẮT hẳn tính năng", () => {
  // Fail-safe. Không biết app id của mình thì mọi echo — kể cả của bot — đều
  // trông như người lạ, và bot sẽ tự bịt miệng ngay sau câu trả lời đầu tiên.
  // Thà không chạy tính năng còn hơn.
  assert.deepEqual(collectHumanEchoes(HUMAN_ECHO_PAYLOAD, null), []);
  assert.deepEqual(collectHumanEchoes(HUMAN_ECHO_PAYLOAD, ""), []);
});

test("collectHumanEchoes: thiếu trường thì trả mảng rỗng, không throw", () => {
  assert.deepEqual(collectHumanEchoes(null, OWN_APP_ID), []);
  assert.deepEqual(collectHumanEchoes({}, OWN_APP_ID), []);
  assert.deepEqual(collectHumanEchoes({ object: "page" }, OWN_APP_ID), []);
  assert.deepEqual(
    collectHumanEchoes(
      {
        object: "page",
        entry: [
          {
            id: "page-1",
            messaging: [{ message: { is_echo: true, app_id: "app-la" } }],
          },
        ],
      },
      OWN_APP_ID,
    ),
    [],
    "thiếu recipient.id thì phải bỏ",
  );
});

test("collectHumanEchoes: payload handover không lọt vào luồng echo", () => {
  assert.deepEqual(collectHumanEchoes(HANDOVER_PAYLOAD, OWN_APP_ID), []);
});

test("collectTextEvents: echo của nhân viên KHÔNG bị coi là tin của khách", () => {
  assert.deepEqual(collectTextEvents(HUMAN_ECHO_PAYLOAD), []);
});
