import assert from "node:assert/strict";
import { test } from "node:test";

import { collectHandoverRequests, collectTextEvents } from "@/lib/messenger";

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
