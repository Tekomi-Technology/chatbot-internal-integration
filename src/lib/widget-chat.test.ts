import assert from "node:assert/strict";
import { test } from "node:test";

import { isStaffResumeExpired, serializeWidgetMessage } from "@/lib/widget-chat";

test("isStaffResumeExpired: chưa từng có nhân viên trả lời thì luôn hết hạn", () => {
  assert.equal(isStaffResumeExpired(null, 24, new Date()), true);
});

test("isStaffResumeExpired: trong hạn giờ cấu hình thì chưa hết hạn", () => {
  const now = new Date("2026-08-17T12:00:00Z");
  const lastStaffReplyAt = new Date("2026-08-17T11:00:00Z");
  assert.equal(isStaffResumeExpired(lastStaffReplyAt, 24, now), false);
});

test("isStaffResumeExpired: đúng hoặc quá số giờ cấu hình thì hết hạn", () => {
  const now = new Date("2026-08-18T11:00:00Z");
  const lastStaffReplyAt = new Date("2026-08-17T11:00:00Z");
  assert.equal(isStaffResumeExpired(lastStaffReplyAt, 24, now), true);
});

test("isStaffResumeExpired: chưa tới đúng mốc thì vẫn còn hạn (biên dưới)", () => {
  const now = new Date("2026-08-17T10:59:59.999Z");
  const lastStaffReplyAt = new Date("2026-08-16T11:00:00Z");
  assert.equal(isStaffResumeExpired(lastStaffReplyAt, 24, now), false);
});

test("isStaffResumeExpired: số giờ cấu hình nhỏ hơn vẫn tính đúng", () => {
  const now = new Date("2026-08-17T13:00:01Z");
  const lastStaffReplyAt = new Date("2026-08-17T12:00:00Z");
  assert.equal(isStaffResumeExpired(lastStaffReplyAt, 1, now), true);
});

test("serializeWidgetMessage: chuyển Date thành ISO string", () => {
  const result = serializeWidgetMessage({
    sender: "STAFF",
    text: "Chào bạn",
    createdAt: new Date("2026-08-17T10:00:00.000Z"),
  });

  assert.deepEqual(result, {
    sender: "STAFF",
    text: "Chào bạn",
    createdAt: "2026-08-17T10:00:00.000Z",
  });
});
