import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

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

  if (existingVote) {
    if (existingVote.voteType === "CONFIRM") {
      return NextResponse.json({ error: "Already confirmed", alreadyVoted: true }, { status: 409 });
    }
    await prisma.priceVote.update({
      where: { id: existingVote.id },
      data: { voteType: "CONFIRM" },
    });
    await prisma.priceReport.update({
      where: { id: priceReportId },
      data: {
        confirmedCount: { increment: 1 },
        inaccurateCount: { decrement: 1 },
        lastConfirmedAt: new Date(),
      },
    });
  } else {
    await prisma.priceVote.create({
      data: { priceReportId, userId: session.user.id, voteType: "CONFIRM" },
    });
    await prisma.priceReport.update({
      where: { id: priceReportId },
      data: {
        confirmedCount: { increment: 1 },
        lastConfirmedAt: new Date(),
      },
    });
  }

  await prisma.user.update({
    where: { id: report.userId },
    data: { totalUpvotes: { increment: 1 } },
  });

  const reporter = await prisma.user.findUnique({
    where: { id: report.userId },
    select: { totalUpvotes: true, totalSubmissions: true },
  });
  if (reporter && reporter.totalSubmissions > 0) {
    const trustScore = Math.min(100, (reporter.totalUpvotes / reporter.totalSubmissions) * 20);
    await prisma.user.update({
      where: { id: report.userId },
      data: { trustScore: Math.round(trustScore * 10) / 10 },
    });
  }

  return NextResponse.json({ success: true });
}
