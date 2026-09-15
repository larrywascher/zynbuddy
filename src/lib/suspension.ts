import { prisma } from "./prisma";
import { logAudit } from "./audit";

export async function checkSuspension(userId: string): Promise<{ suspended: boolean; reason?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuspended: true, suspendedReason: true, suspendedUntil: true },
  });
  if (!user) return { suspended: false };

  if (!user.isSuspended) return { suspended: false };

  if (user.suspendedUntil && user.suspendedUntil < new Date()) {
    await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: false, suspendedReason: null, suspendedUntil: null },
    });
    return { suspended: false };
  }

  return { suspended: true, reason: user.suspendedReason || "Account suspended" };
}

export async function suspendUser(params: {
  userId: string;
  reason: string;
  durationHours?: number;
  adminId?: string;
}) {
  const suspendedUntil = params.durationHours
    ? new Date(Date.now() + params.durationHours * 60 * 60 * 1000)
    : null;

  await prisma.user.update({
    where: { id: params.userId },
    data: {
      isSuspended: true,
      suspendedReason: params.reason,
      suspendedUntil,
    },
  });

  await logAudit({
    userId: params.adminId || "SYSTEM",
    action: "SUSPEND_USER",
    targetType: "User",
    targetId: params.userId,
    details: `${params.reason}${suspendedUntil ? ` until ${suspendedUntil.toISOString()}` : " (permanent)"}`,
  });
}

export async function unsuspendUser(userId: string, adminId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { isSuspended: false, suspendedReason: null, suspendedUntil: null },
  });

  await logAudit({
    userId: adminId,
    action: "UNSUSPEND_USER",
    targetType: "User",
    targetId: userId,
  });
}

export async function checkAbuseThresholds(userId: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [recentReports, recentInaccurateFlagged] = await Promise.all([
    prisma.priceReport.count({
      where: { userId, createdAt: { gte: oneHourAgo } },
    }),
    prisma.priceReport.count({
      where: { userId, inaccurateCount: { gte: 3 }, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
  ]);

  if (recentReports > 20) {
    await suspendUser({
      userId,
      reason: "Automated: excessive price report submissions (>20/hour)",
      durationHours: 24,
    });
    return true;
  }

  if (recentInaccurateFlagged >= 5) {
    await suspendUser({
      userId,
      reason: "Automated: multiple price reports flagged as inaccurate (5+ in 24h)",
      durationHours: 48,
    });
    return true;
  }

  return false;
}
