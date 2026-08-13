import assert from "node:assert/strict";
import { test } from "node:test";

import { chunkMessage, markIdSeen } from "@/lib/channel-utils";

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
