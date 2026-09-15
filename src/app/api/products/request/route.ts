import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { brandName, productType, description } = await req.json();
  if (!brandName) {
    return NextResponse.json(
      { error: "brandName is required" },
      { status: 400 }
    );
  }

  const existing = await prisma.productRequest.findFirst({
    where: { brandName: { equals: brandName } },
  });

  if (existing) {
    await prisma.productRequest.update({
      where: { id: existing.id },
      data: { voteCount: { increment: 1 } },
    });
    return NextResponse.json({ request: existing, voted: true });
  }

  const request = await prisma.productRequest.create({
    data: {
      userId: session.user.id,
      brandName,
      productType,
      description,
    },
  });

  return NextResponse.json({ request, voted: false }, { status: 201 });
}

export async function GET() {
  const requests = await prisma.productRequest.findMany({
    orderBy: { voteCount: "desc" },
    take: 50,
    include: { user: { select: { name: true } } },
  });
  return NextResponse.json(requests);
}
