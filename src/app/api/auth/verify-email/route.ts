import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const verification = await prisma.emailVerification.findUnique({
    where: { token },
    include: { user: { select: { id: true, email: true, emailVerified: true } } },
  });

  if (!verification) {
    return NextResponse.json({ error: "Invalid verification link" }, { status: 404 });
  }

  if (verification.used) {
    return NextResponse.json({ error: "Link already used", alreadyVerified: true }, { status: 400 });
  }

  if (verification.expiresAt < new Date()) {
    return NextResponse.json({ error: "Verification link expired. Please request a new one." }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: true },
    }),
    prisma.emailVerification.update({
      where: { id: verification.id },
      data: { used: true },
    }),
  ]);

  await logAudit({
    userId: verification.userId,
    action: "EMAIL_VERIFIED",
    targetType: "User",
    targetId: verification.userId,
  });

  return NextResponse.json({ success: true, email: verification.user.email });
}

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, emailVerified: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ alreadyVerified: true });
  }

  const { generateToken } = await import("@/lib/sanitize");
  const token = generateToken();

  await prisma.emailVerification.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ token, message: "Verification token created" });
}
