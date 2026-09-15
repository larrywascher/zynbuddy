import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { suspendUser, unsuspendUser } from "@/lib/suspension";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, id: true },
  });
  if (user?.role !== "ADMIN") return null;
  return { userId: user.id };
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, reason, durationHours } = await req.json();
  if (!userId || !reason) {
    return NextResponse.json({ error: "userId and reason required" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.role === "ADMIN") {
    return NextResponse.json({ error: "Cannot suspend admin users" }, { status: 400 });
  }

  await suspendUser({
    userId,
    reason,
    durationHours: durationHours || 24,
    adminId: admin.userId,
  });

  return NextResponse.json({ success: true, message: `User suspended for ${durationHours || 24} hours` });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  await unsuspendUser(userId, admin.userId);

  return NextResponse.json({ success: true, message: "User unsuspended" });
}
