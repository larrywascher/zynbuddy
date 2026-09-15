import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

const STALE_THRESHOLD = 10;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed } = await checkRateLimit(`vote:${session.user.id}`, "price-vote");
  if (!allowed) {
    return NextResponse.json({ error: "Too many votes. Try again later." }, { status: 429 });
  }

  const { priceReportId } = await req.json();
  if (!priceReportId) {
    return NextResponse.json({ error: "priceReportId is required" }, { status: 400 });
  }

  const report = await prisma.priceReport.findUnique({ where: { id: priceReportId } });
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  if (report.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot vote on your own report" }, { status: 403 });
  }

  const existingVote = await prisma.priceVote.findUnique({
    where: { priceReportId_userId: { priceReportId, userId: session.user.id } },
  });

  let newCount = report.inaccurateCount;

  if (existingVote) {
    if (existingVote.voteType === "INACCURATE") {
      return NextResponse.json({ error: "Already flagged", alreadyVoted: true }, { status: 409 });
    }
    await prisma.priceVote.update({
      where: { id: existingVote.id },
      data: { voteType: "INACCURATE" },
    });
    newCount = report.inaccurateCount + 1;
    await prisma.priceReport.update({
      where: { id: priceReportId },
      data: {
        inaccurateCount: newCount,
        confirmedCount: { decrement: 1 },
        isStale: newCount >= STALE_THRESHOLD,
      },
    });
  } else {
    newCount = report.inaccurateCount + 1;
    await prisma.priceVote.create({
      data: { priceReportId, userId: session.user.id, voteType: "INACCURATE" },
    });
    await prisma.priceReport.update({
      where: { id: priceReportId },
      data: {
        inaccurateCount: newCount,
        isStale: newCount >= STALE_THRESHOLD,
      },
    });
  }

  return NextResponse.json({ success: true, inaccurateCount: newCount, isStale: newCount >= STALE_THRESHOLD });
}
