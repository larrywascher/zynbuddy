import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type, label, category } = await req.json();
  if (!type || !label) {
    return NextResponse.json({ error: "type and label are required" }, { status: 400 });
  }

  const sanitizedType = type.toUpperCase().replace(/[^A-Z0-9_]/g, "_").slice(0, 50);

  const existing = await prisma.product.findUnique({ where: { type: sanitizedType } });
  if (existing) {
    return NextResponse.json({ error: "Product type already exists" }, { status: 409 });
  }

  const maxSort = await prisma.product.findFirst({ orderBy: { sortOrder: "desc" } });

  const product = await prisma.product.create({
    data: {
      type: sanitizedType,
      label: label.trim().slice(0, 100),
      category: category || "NICOTINE_POUCH",
      sortOrder: (maxSort?.sortOrder ?? 0) + 1,
    },
  });

  return NextResponse.json(product, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type } = await req.json();
  if (!type) {
    return NextResponse.json({ error: "type is required" }, { status: 400 });
  }

  const deleted = await prisma.priceReport.deleteMany({
    where: { productType: type },
  });

  await prisma.product.delete({ where: { type } }).catch(() => {});

  return NextResponse.json({
    success: true,
    deletedPriceReports: deleted.count,
  });
}
