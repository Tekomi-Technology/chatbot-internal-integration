import assert from "node:assert/strict";
import { test } from "node:test";

import { checkRateLimit } from "@/lib/rate-limit";

test("checkRateLimit: dùng config tuỳ chỉnh thay vì mặc định", () => {
  const id = `test-custom-${Math.random()}`;
  const config = { limit: 2, windowMs: 60_000 };

  assert.equal(checkRateLimit(id, config).success, true);
  assert.equal(checkRateLimit(id, config).success, true);
  assert.equal(checkRateLimit(id, config).success, false);
});

test("checkRateLimit: không truyền config vẫn chạy được (dùng mặc định)", () => {
  const id = `test-default-${Math.random()}`;
  assert.equal(checkRateLimit(id).success, true);
});

test("checkRateLimit: hai định danh khác nhau có bucket riêng", () => {
  const config = { limit: 1, windowMs: 60_000 };
  const idA = `test-a-${Math.random()}`;
  const idB = `test-b-${Math.random()}`;

  assert.equal(checkRateLimit(idA, config).success, true);
  assert.equal(checkRateLimit(idB, config).success, true);
});
