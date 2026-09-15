import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user, recentLedger, stats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { rewardPoints: true, totalSubmissions: true, totalUpvotes: true, trustScore: true },
    }),
    prisma.rewardsLedger.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, points: true, reason: true, createdAt: true },
    }),
    prisma.priceReport.count({
      where: { userId: session.user.id, status: "ACTIVE" },
    }),
  ]);

  return NextResponse.json({
    rewardPoints: user?.rewardPoints || 0,
    totalSubmissions: user?.totalSubmissions || 0,
    totalUpvotes: user?.totalUpvotes || 0,
    trustScore: user?.trustScore || 100,
    activePrices: stats,
    recentActivity: recentLedger,
  });
}
