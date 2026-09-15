import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      rewardPoints: true,
      trustScore: true,
      totalUpvotes: true,
      totalSubmissions: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, firstName, lastName, phone, currentPassword, newPassword } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = String(name).trim().slice(0, 50);
    if (firstName !== undefined) updateData.firstName = String(firstName).trim().slice(0, 50);
    if (lastName !== undefined) updateData.lastName = String(lastName).trim().slice(0, 50);
    if (phone !== undefined) {
      const cleaned = String(phone).replace(/[^0-9+\-() ]/g, "").slice(0, 20);
      updateData.phone = cleaned || null;
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password" },
          { status: 400 }
        );
      }
      if (String(newPassword).length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { passwordHash: true },
      });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      if (!user.passwordHash) {
        return NextResponse.json({ error: "Password not set for this account" }, { status: 400 });
      }

      const valid = await compare(String(currentPassword), user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
      }

      updateData.passwordHash = await hash(String(newPassword), 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        phone: true,
        rewardPoints: true,
        trustScore: true,
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
