import { createHash } from "node:crypto";

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  collectZaloTextEvents,
  readZaloResult,
  verifyZaloSignature,
  ZaloError,
} from "@/lib/zalo";

const APP_ID = "1234567890";
const SECRET = "secret-key-cua-app";

/** Dựng cặp (rawBody, header chữ ký) hợp lệ để test. */
function signedPayload(body: Record<string, unknown>) {
  const rawBody = JSON.stringify(body);
  const mac = createHash("sha256")
    .update(APP_ID + rawBody + String(body.timestamp) + SECRET)
    .digest("hex");
  return { rawBody, header: `mac=${mac}` };
}

const SAMPLE = {
  app_id: APP_ID,
  event_name: "user_send_text",
  timestamp: "1616563937956",
  sender: { id: "user-abc" },
  recipient: { id: "oa-xyz" },
  message: { text: "cho hỏi giá", msg_id: "msg-1" },
};

test("verifyZaloSignature: chữ ký đúng thì pass", () => {
  const { rawBody, header } = signedPayload(SAMPLE);

  assert.equal(verifyZaloSignature(rawBody, header, APP_ID, SECRET), true);
});

test("verifyZaloSignature: chấp nhận cả dạng hash trần không có tiền tố mac=", () => {
  const { rawBody, header } = signedPayload(SAMPLE);
  const bare = header.slice("mac=".length);

  assert.equal(verifyZaloSignature(rawBody, bare, APP_ID, SECRET), true);
});

test("verifyZaloSignature: sai một ký tự thì fail", () => {
  const { rawBody, header } = signedPayload(SAMPLE);
  const broken = header.slice(0, -1) + (header.endsWith("a") ? "b" : "a");

  assert.equal(verifyZaloSignature(rawBody, broken, APP_ID, SECRET), false);
});

test("verifyZaloSignature: thiếu header thì fail", () => {
  const { rawBody } = signedPayload(SAMPLE);

  assert.equal(verifyZaloSignature(rawBody, null, APP_ID, SECRET), false);
});

test("verifyZaloSignature: sai secret thì fail", () => {
  const { rawBody, header } = signedPayload(SAMPLE);

  assert.equal(verifyZaloSignature(rawBody, header, APP_ID, "secret-khac"), false);
});

test("verifyZaloSignature: header rác không làm throw", () => {
  const { rawBody } = signedPayload(SAMPLE);

  assert.equal(verifyZaloSignature(rawBody, "mac=zzz", APP_ID, SECRET), false);
  assert.equal(verifyZaloSignature(rawBody, "", APP_ID, SECRET), false);
});

test("collectZaloTextEvents: payload chuẩn ra đúng một sự kiện", () => {
  assert.deepEqual(collectZaloTextEvents(SAMPLE), [
    {
      oaId: "oa-xyz",
      userId: "user-abc",
      text: "cho hỏi giá",
      msgId: "msg-1",
    },
  ]);
});

test("collectZaloTextEvents: cắt khoảng trắng thừa trong nội dung", () => {
  const events = collectZaloTextEvents({
    ...SAMPLE,
    message: { text: "  còn hàng không  ", msg_id: "msg-2" },
  });

  assert.equal(events[0].text, "còn hàng không");
});

test("collectZaloTextEvents: bỏ qua event không phải user_send_text", () => {
  for (const eventName of ["follow", "unfollow", "user_send_image", "oa_send_text"]) {
    assert.deepEqual(
      collectZaloTextEvents({ ...SAMPLE, event_name: eventName }),
      [],
      `event ${eventName} lẽ ra phải bị bỏ`,
    );
  }
});

test("collectZaloTextEvents: bỏ qua tin rỗng hoặc chỉ có khoảng trắng", () => {
  assert.deepEqual(
    collectZaloTextEvents({ ...SAMPLE, message: { text: "   ", msg_id: "m" } }),
    [],
  );
});

test("collectZaloTextEvents: thiếu trường thì trả mảng rỗng, không throw", () => {
  assert.deepEqual(collectZaloTextEvents(null), []);
  assert.deepEqual(collectZaloTextEvents({}), []);
  assert.deepEqual(collectZaloTextEvents({ event_name: "user_send_text" }), []);
  assert.deepEqual(
    collectZaloTextEvents({ ...SAMPLE, recipient: {} }),
    [],
  );
});

test("collectZaloTextEvents: thiếu msg_id vẫn xử lý, chỉ mất khả năng chống trùng", () => {
  const events = collectZaloTextEvents({
    ...SAMPLE,
    message: { text: "xin chào" },
  });

  assert.equal(events.length, 1);
  assert.equal(events[0].msgId, null);
});

test("readZaloResult: error = 0 là thành công", () => {
  const raw = JSON.stringify({ data: { message_id: "m1" }, error: 0, message: "Success" });

  assert.deepEqual(readZaloResult(200, raw), {
    data: { message_id: "m1" },
    error: 0,
    message: "Success",
  });
});

test("readZaloResult: HTTP 200 nhưng error khác 0 vẫn là lỗi", () => {
  const raw = JSON.stringify({ error: -32, message: "Ngoài cửa sổ 7 ngày" });

  assert.throws(
    () => readZaloResult(200, raw),
    (error: unknown) =>
      error instanceof ZaloError &&
      error.code === -32 &&
      error.message.includes("Ngoài cửa sổ 7 ngày"),
  );
});

test("readZaloResult: HTTP lỗi thì ném ZaloError kể cả khi body không phải JSON", () => {
  assert.throws(
    () => readZaloResult(502, "<html>bad gateway</html>"),
    (error: unknown) => error instanceof ZaloError && error.code === 502,
  );
});

test("readZaloResult: body rỗng thì ném ZaloError, không throw SyntaxError", () => {
  assert.throws(
    () => readZaloResult(200, ""),
    (error: unknown) => error instanceof ZaloError,
  );
});

test("readZaloResult: HTTP 200 + JSON không có trường error là thành công — đây chính là hình dạng phản hồi thành công của OAuth endpoint", () => {
  const raw = JSON.stringify({
    access_token: "a",
    refresh_token: "r",
    expires_in: "3600",
  });

  assert.deepEqual(readZaloResult(200, raw), {
    access_token: "a",
    refresh_token: "r",
    expires_in: "3600",
  });
});

test("readZaloResult: HTTP 401 + JSON hợp lệ nhưng không có trường error vẫn ném ZaloError với code 401", () => {
  const raw = JSON.stringify({ message: "Unauthorized" });

  assert.throws(
    () => readZaloResult(401, raw),
    (error: unknown) => error instanceof ZaloError && error.code === 401,
  );
});

test("readZaloResult: error dạng CHUỖI khác 0 vẫn phải là lỗi, không được lọt qua như thành công", () => {
  const raw = JSON.stringify({ error: "-32", message: "Ngoài cửa sổ 7 ngày" });

  assert.throws(
    () => readZaloResult(200, raw),
    (error: unknown) =>
      error instanceof ZaloError &&
      error.code === -32 &&
      error.message.includes("Ngoài cửa sổ 7 ngày"),
  );
});

test("readZaloResult: error dạng chuỗi \"0\" vẫn là thành công", () => {
  const raw = JSON.stringify({ data: { message_id: "m1" }, error: "0" });

  assert.deepEqual(readZaloResult(200, raw), { data: { message_id: "m1" }, error: "0" });
});

test("readZaloResult: error không ép được thành số thì ném lỗi thay vì đoán là thành công", () => {
  const raw = JSON.stringify({ error: "boom" });

  assert.throws(
    () => readZaloResult(200, raw),
    (error: unknown) => error instanceof ZaloError,
  );
});
