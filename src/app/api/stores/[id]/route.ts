import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const productTypes = searchParams.get("productTypes");

  const productTypeList = productTypes
    ? productTypes.split(",").filter(Boolean)
    : [];

  const priceWhere: Record<string, unknown> = {};
  if (productTypeList.length > 0) {
    priceWhere.productType = { in: productTypeList };
  }

  const store = await prisma.store.findUnique({
    where: { id },
    include: {
      prices: {
        where: priceWhere,
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { id: true, name: true, trustScore: true } } },
      },
      amenities: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  return NextResponse.json(store);
}
