import assert from "node:assert/strict";
import { test } from "node:test";

import {
  chunkMessage,
  markIdSeen,
  isWithinNightWindow,
  mayAnswerDespiteHuman,
  markSelfSent,
  wasSelfSent,
} from "@/lib/channel-utils";

test("chunkMessage: tin ngắn hơn giới hạn thì giữ nguyên một phần", () => {
  assert.deepEqual(chunkMessage("xin chào", 2000), ["xin chào"]);
});

test("chunkMessage: cắt ở ranh giới xuống dòng khi có thể", () => {
  const text = `${"a".repeat(80)}\n${"b".repeat(80)}`;
  const chunks = chunkMessage(text, 100);

  assert.equal(chunks.length, 2);
  assert.equal(chunks[0], "a".repeat(80));
  assert.equal(chunks[1], "b".repeat(80));
});

test("chunkMessage: mọi phần đều không vượt giới hạn", () => {
  const chunks = chunkMessage("x".repeat(5000), 2000);

  assert.ok(chunks.length >= 3);
  for (const chunk of chunks) {
    assert.ok(chunk.length <= 2000, `phần dài ${chunk.length} ký tự`);
  }
});

test("markIdSeen: lần đầu trả false, lần hai trả true", () => {
  const id = `test-${Math.random()}`;

  assert.equal(markIdSeen(id), false);
  assert.equal(markIdSeen(id), true);
});

test("markIdSeen: id null luôn trả false, không chặn xử lý", () => {
  assert.equal(markIdSeen(null), false);
  assert.equal(markIdSeen(null), false);
});

const AT_3AM_VN = new Date("2026-08-16T20:00:00Z");
const AT_9AM_VN = new Date("2026-08-17T02:00:00Z");
const AT_1130PM_VN = new Date("2026-08-17T16:30:00Z");
const AT_0030_VN = new Date("2026-08-16T17:30:00Z");

test("isWithinNightWindow: trong khung 1-6 giờ", () => {
  assert.equal(isWithinNightWindow(1, 6, AT_3AM_VN), true);
});

test("isWithinNightWindow: ngoài khung 1-6 giờ", () => {
  assert.equal(isWithinNightWindow(1, 6, AT_9AM_VN), false);
});

test("isWithinNightWindow: khung qua nửa đêm 22-6 tính cả hai phía", () => {
  assert.equal(isWithinNightWindow(22, 6, AT_1130PM_VN), true, "trước nửa đêm");
  assert.equal(isWithinNightWindow(22, 6, AT_0030_VN), true, "sau nửa đêm");
  assert.equal(isWithinNightWindow(22, 6, AT_9AM_VN), false, "ban ngày");
});

test("isWithinNightWindow: giờ bắt đầu tính vào khung, giờ kết thúc thì không", () => {
  assert.equal(isWithinNightWindow(1, 6, new Date("2026-08-16T18:00:00Z")), true, "01:00");
  assert.equal(isWithinNightWindow(1, 6, new Date("2026-08-16T22:59:00Z")), true, "05:59");
  assert.equal(isWithinNightWindow(1, 6, new Date("2026-08-16T23:00:00Z")), false, "06:00");
});

test("isWithinNightWindow: chưa cấu hình thì luôn false", () => {
  assert.equal(isWithinNightWindow(null, null, AT_3AM_VN), false);
  assert.equal(isWithinNightWindow(1, null, AT_3AM_VN), false, "thiếu giờ kết thúc");
  assert.equal(isWithinNightWindow(null, 6, AT_3AM_VN), false, "thiếu giờ bắt đầu");
});

test("isWithinNightWindow: hai giờ bằng nhau coi như tắt, không phải chạy 24/24", () => {
  assert.equal(isWithinNightWindow(1, 1, AT_3AM_VN), false);
  assert.equal(isWithinNightWindow(1, 1, AT_9AM_VN), false);
});

test("isWithinNightWindow: giờ ngoài 0-23 bị bỏ qua, không throw", () => {
  assert.equal(isWithinNightWindow(-1, 6, AT_3AM_VN), false);
  assert.equal(isWithinNightWindow(1, 24, AT_3AM_VN), false);
  assert.equal(isWithinNightWindow(1.5, 6, AT_3AM_VN), false);
});

test("isWithinNightWindow: khung 0-6 giờ chạy đúng ngay sau nửa đêm", () => {
  assert.equal(isWithinNightWindow(0, 6, AT_0030_VN), true);
  assert.equal(isWithinNightWindow(0, 6, AT_1130PM_VN), false);
});

test("mayAnswerDespiteHuman: ngoài khung giờ đêm thì luôn false", () => {
  const channel = { nightResumeStartHour: 1, nightResumeEndHour: 6 };
  const conversation = { handoverAt: new Date(Date.now() - 60 * 60_000) };

  assert.equal(mayAnswerDespiteHuman(channel, conversation), false);
});

test("mayAnswerDespiteHuman: chưa cấu hình khung giờ thì luôn false dù handoverAt null", () => {
  const channel = { nightResumeStartHour: null, nightResumeEndHour: null };

  assert.equal(mayAnswerDespiteHuman(channel, { handoverAt: null }), false);
});

test("markSelfSent + wasSelfSent: id vừa đăng ký thì nhận ra là tự gửi", () => {
  const id = `self-${Math.random()}`;

  assert.equal(wasSelfSent(id), false);
  markSelfSent(id);
  assert.equal(wasSelfSent(id), true);
});

test("markSelfSent: id null không làm gì, không throw", () => {
  markSelfSent(null);
  assert.equal(wasSelfSent(null), false);
});

test("wasSelfSent: id chưa từng đăng ký thì trả false", () => {
  assert.equal(wasSelfSent(`chua-dang-ky-${Math.random()}`), false);
});
