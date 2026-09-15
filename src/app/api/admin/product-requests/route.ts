import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const requests = await prisma.productRequest.findMany({
    orderBy: [{ status: "asc" }, { voteCount: "desc" }, { createdAt: "desc" }],
    include: {
      user: { select: { name: true, email: true, trustScore: true } },
    },
  });

  return NextResponse.json(requests);
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { requestId, action, adminNote } = await req.json();
  if (!requestId || !action) {
    return NextResponse.json({ error: "requestId and action required" }, { status: 400 });
  }

  if (!["APPROVED", "REJECTED"].includes(action)) {
    return NextResponse.json({ error: "action must be APPROVED or REJECTED" }, { status: 400 });
  }

  const request = await prisma.productRequest.findUnique({ where: { id: requestId } });
  if (!request) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  const updated = await prisma.productRequest.update({
    where: { id: requestId },
    data: {
      status: action,
      adminNote: adminNote || null,
      reviewedAt: new Date(),
      reviewedById: admin.userId,
    },
  });

  if (action === "APPROVED") {
    const existing = await prisma.product.findUnique({ where: { type: request.brandName.toUpperCase().replace(/\s+/g, "_") } });
    if (!existing) {
      await prisma.product.create({
        data: {
          type: request.brandName.toUpperCase().replace(/\s+/g, "_"),
          label: request.brandName,
          category: request.productType || "NICOTINE_POUCH",
        },
      });
    }
  }

  await logAudit({
    userId: admin.userId,
    action: `PRODUCT_REQUEST_${action}`,
    targetType: "ProductRequest",
    targetId: requestId,
    details: `${request.brandName}${adminNote ? `: ${adminNote}` : ""}`,
  });

  return NextResponse.json(updated);
}
