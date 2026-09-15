import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = await checkRateLimit(`store:${session.user.id}`, "store-create");
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many store submissions. Try again later." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { name, address, city, state, zipCode, latitude, longitude, storeType, productType, productBrand, pricePerCan, nicStrength, productVariant } = body;

  if (!name || !latitude || !longitude) {
    return NextResponse.json(
      { error: "name, latitude, and longitude are required" },
      { status: 400 }
    );
  }

  if (name.length > 100 || (address && address.length > 200)) {
    return NextResponse.json({ error: "Input too long" }, { status: 400 });
  }

  const store = await prisma.store.create({
    data: {
      name: name.trim().slice(0, 100),
      address: (address || "").trim().slice(0, 200),
      city: (city || "Unknown").trim().slice(0, 50),
      state: (state || "AZ").trim().slice(0, 2),
      zipCode: (zipCode || "00000").trim().slice(0, 10),
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      storeType: storeType || "OTHER",
      addedByUser: session.user.id,
    },
  });

  if (pricePerCan && parseFloat(pricePerCan) > 0 && parseFloat(pricePerCan) <= 100) {
    await prisma.priceReport.create({
      data: {
        storeId: store.id,
        userId: session.user.id,
        productType: productType || "ZYN",
        productBrand: productBrand || "Zyn",
        productVariant: productVariant || null,
        nicStrength: nicStrength || null,
        pricePerCan: parseFloat(pricePerCan),
        status: "ACTIVE",
      },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        rewardPoints: { increment: 50 },
        totalSubmissions: { increment: 1 },
      },
    });

    await prisma.rewardsLedger.create({
      data: {
        userId: session.user.id,
        points: 50,
        reason: "Added new store location with first price",
        referenceId: store.id,
      },
    });
  }

  return NextResponse.json(store, { status: 201 });
}
