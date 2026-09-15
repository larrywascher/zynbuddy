import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isValidEmail, sanitizeInput, generateToken } from "@/lib/sanitize";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }
    if (password.length > 128) {
      return NextResponse.json(
        { error: "Password must be 128 characters or less" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const sanitizedName = name ? sanitizeInput(name, 50) : trimmedEmail.split("@")[0];

    const passwordHash = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        passwordHash,
        name: sanitizedName,
        emailVerified: false,
      },
    });

    const token = generateToken();
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await logAudit({
      userId: user.id,
      action: "USER_REGISTERED",
      targetType: "User",
      targetId: user.id,
      details: `Email: ${trimmedEmail}`,
    });

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        verificationToken: token,
        requiresVerification: true,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
