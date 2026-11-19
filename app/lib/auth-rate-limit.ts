import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./server-db";

type RateLimit = {
  key: string;
  limit: number;
  windowSeconds: number;
};

type RateLimitResult = {
  attempts: number;
  reset_at: Date;
};

let requestsSinceCleanup = 0;

function getClientAddress(request: Request) {
  const forwardedAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return request.headers.get("x-real-ip")?.trim() || forwardedAddress || "unknown";
}

function hashKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function consumeLimit(key: string, limit: number, windowSeconds: number) {
  const [bucket] = await prisma.$queryRaw<RateLimitResult[]>(Prisma.sql`
    INSERT INTO auth_rate_limits (bucket_key, attempts, window_started_at)
    VALUES (${key}, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (bucket_key) DO UPDATE SET
      attempts = CASE
        WHEN auth_rate_limits.window_started_at <= CURRENT_TIMESTAMP - (${windowSeconds} * INTERVAL '1 second')
        THEN 1
        ELSE LEAST(auth_rate_limits.attempts + 1, ${limit + 1})
      END,
      window_started_at = CASE
        WHEN auth_rate_limits.window_started_at <= CURRENT_TIMESTAMP - (${windowSeconds} * INTERVAL '1 second')
        THEN CURRENT_TIMESTAMP
        ELSE auth_rate_limits.window_started_at
      END
    RETURNING attempts, window_started_at + (${windowSeconds} * INTERVAL '1 second') AS reset_at
  `);

  return bucket.attempts > limit
    ? Math.max(1, Math.ceil((bucket.reset_at.getTime() - Date.now()) / 1000))
    : null;
}

export async function checkAuthRateLimit(request: Request, action: "login" | "register", email: string) {
  const address = getClientAddress(request);
  const limits: RateLimit[] = action === "login"
    ? [
      { key: `login:ip:${address}`, limit: 10, windowSeconds: 15 * 60 },
      { key: `login:email:${email}`, limit: 5, windowSeconds: 15 * 60 },
    ]
    : [
      { key: `register:ip:${address}`, limit: 5, windowSeconds: 60 * 60 },
      { key: `register:email:${email}`, limit: 3, windowSeconds: 60 * 60 },
    ];

  let retryAfter: number | null = null;
  for (const limit of limits) {
    const wait = await consumeLimit(hashKey(limit.key), limit.limit, limit.windowSeconds);
    if (wait !== null) retryAfter = Math.max(retryAfter ?? 0, wait);
  }

  requestsSinceCleanup += 1;
  if (requestsSinceCleanup >= 100) {
    requestsSinceCleanup = 0;
    await prisma.$executeRaw(Prisma.sql`
      DELETE FROM auth_rate_limits
      WHERE window_started_at < CURRENT_TIMESTAMP - INTERVAL '1 day'
    `);
  }

  return retryAfter;
}
