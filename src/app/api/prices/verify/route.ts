import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { priceReportId } = await req.json();
    if (!priceReportId) {
      return NextResponse.json(
        { error: "priceReportId is required" },
        { status: 400 }
      );
    }

    const report = await prisma.priceReport.findUnique({
      where: { id: priceReportId },
    });

    if (!report) {
      return NextResponse.json({ error: "Price report not found" }, { status: 404 });
    }

    if (report.status !== "PENDING_VERIFICATION") {
      return NextResponse.json(
        { error: "This price report is not pending verification" },
        { status: 400 }
      );
    }

    if (report.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot verify your own price report" },
        { status: 403 }
      );
    }

    const updated = await prisma.priceReport.update({
      where: { id: priceReportId },
      data: {
        status: "ACTIVE",
        verifiedByUserId: session.user.id,
        confirmedCount: { increment: 1 },
        lastConfirmedAt: new Date(),
      },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { rewardPoints: { increment: 10 } },
    });

    await prisma.rewardsLedger.create({
      data: {
        userId: session.user.id,
        points: 10,
        reason: "Verified a flagged price",
        referenceId: priceReportId,
      },
    });

    return NextResponse.json({ priceReport: updated, pointsEarned: 10 });
  } catch {
    return NextResponse.json(
      { error: "Failed to verify price" },
      { status: 500 }
    );
  }
}
