import { prisma } from "./prisma";

export async function logAudit(params: {
  userId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: string;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({ data: params });
  } catch {
    console.error("Audit log failed:", params.action);
  }
}
