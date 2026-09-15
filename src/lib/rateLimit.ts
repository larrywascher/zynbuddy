import { prisma } from "./prisma";

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS: Record<string, number> = {
  "price-report": 5,
  "price-vote": 20,
  "store-create": 3,
  default: 30,
};

export async function checkRateLimit(
  key: string,
  action: string = "default"
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = MAX_REQUESTS[action] ?? MAX_REQUESTS.default;
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_MS);

  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing || existing.windowStart < windowStart) {
    await prisma.rateLimit.upsert({
      where: { key },
      update: { count: 1, windowStart: now },
      create: { key, count: 1, windowStart: now },
    });
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });

  return { allowed: true, remaining: limit - existing.count - 1 };
}

export async function cleanupExpiredRateLimits() {
  const cutoff = new Date(Date.now() - 5 * 60 * 1000);
  await prisma.rateLimit.deleteMany({
    where: { windowStart: { lt: cutoff } },
  });
}
