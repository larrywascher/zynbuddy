import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { checkSuspension, checkAbuseThresholds } from "@/lib/suspension";
import { logAudit } from "@/lib/audit";
import { sanitizeInput, containsHarmfulContent } from "@/lib/sanitize";

const DEVIATION_THRESHOLD = 0.5;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { suspended, reason } = await checkSuspension(session.user.id);
  if (suspended) {
    return NextResponse.json({ error: `Account suspended: ${reason}` }, { status: 403 });
  }

  const { allowed } = await checkRateLimit(`report:${session.user.id}`, "price-report");
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many price reports. Try again in a minute." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const {
      storeId,
      productType = "ZYN",
      productBrand = "Zyn",
      productVariant,
      nicStrength,
      pricePerCan,
      pricePerRoll,
      dealDescription,
    } = body;

    if (!storeId || pricePerCan === undefined) {
      return NextResponse.json(
        { error: "storeId and pricePerCan are required" },
        { status: 400 }
      );
    }

    const parsedPrice = parseFloat(pricePerCan);
    if (isNaN(parsedPrice) || parsedPrice <= 0 || parsedPrice > 100) {
      return NextResponse.json(
        { error: "Price must be between $0.01 and $100.00" },
        { status: 400 }
      );
    }

    if (dealDescription && containsHarmfulContent(dealDescription)) {
      await logAudit({
        userId: session.user.id,
        action: "HARMFUL_CONTENT_BLOCKED",
        targetType: "PriceReport",
        details: `Deal description contained harmful content`,
      });
      return NextResponse.json({ error: "Content violates community guidelines" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const recentPrices = await prisma.priceReport.findMany({
      where: {
        storeId,
        productType,
        isStale: false,
        status: "ACTIVE",
        createdAt: { gte: threeDaysAgo },
      },
      select: { pricePerCan: true },
    });

    let status = "ACTIVE";
    if (recentPrices.length >= 2) {
      const avg =
        recentPrices.reduce((sum, p) => sum + p.pricePerCan, 0) /
        recentPrices.length;
      const deviation = Math.abs(parsedPrice - avg) / avg;
      if (deviation > DEVIATION_THRESHOLD) {
        status = "PENDING_VERIFICATION";
      }
    }

    const sanitizedDeal = dealDescription ? sanitizeInput(dealDescription, 200) : null;
    const sanitizedVariant = productVariant ? sanitizeInput(productVariant, 100) : null;

    const priceReport = await prisma.priceReport.create({
      data: {
        storeId,
        userId: session.user.id,
        productType,
        productBrand: sanitizeInput(productBrand, 50),
        productVariant: sanitizedVariant,
        nicStrength,
        pricePerCan: parsedPrice,
        pricePerRoll: pricePerRoll ? parseFloat(pricePerRoll) : null,
        dealDescription: sanitizedDeal,
        status,
      },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        rewardPoints: { increment: 20 },
        totalSubmissions: { increment: 1 },
      },
    });

    await prisma.rewardsLedger.create({
      data: {
        userId: session.user.id,
        points: 20,
        reason: "Price report submitted",
        referenceId: priceReport.id,
      },
    });

    await logAudit({
      userId: session.user.id,
      action: "PRICE_REPORTED",
      targetType: "PriceReport",
      targetId: priceReport.id,
      details: `$${parsedPrice} at ${store.name} (${productType})`,
    });

    await checkAbuseThresholds(session.user.id);

    return NextResponse.json(
      {
        priceReport,
        pointsEarned: 20,
        pendingVerification: status === "PENDING_VERIFICATION",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to submit price report" },
      { status: 500 }
    );
  }
}
