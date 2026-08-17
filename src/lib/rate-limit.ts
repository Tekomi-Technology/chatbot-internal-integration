import "server-only";

import { env } from "@/lib/env";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const SWEEP_INTERVAL_MS = 60_000;
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
};

export function checkRateLimit(identifier: string): RateLimitResult {
  const { limit, windowMs } = env.widgetRateLimit;
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(identifier);
  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 1, resetAt: now + windowMs };
    buckets.set(identifier, bucket);
    return { success: true, limit, remaining: limit - 1, resetAt: bucket.resetAt };
  }

  existing.count += 1;
  const remaining = Math.max(0, limit - existing.count);
  const success = existing.count <= limit;

  return {
    success,
    limit,
    remaining,
    resetAt: existing.resetAt,
    retryAfterSeconds: success
      ? undefined
      : Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
