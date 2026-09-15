import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [recentReports, topConfirmed, bestDeals, topContributors] = await Promise.all([
    prisma.priceReport.findMany({
      where: { createdAt: { gte: twentyFourHoursAgo }, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        store: { select: { name: true, city: true } },
        user: { select: { name: true, trustScore: true } },
      },
    }),
    prisma.priceReport.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, status: "ACTIVE", isStale: false },
      orderBy: { confirmedCount: "desc" },
      take: 10,
      include: {
        store: { select: { name: true, city: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.priceReport.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: "ACTIVE",
        isStale: false,
        dealDescription: { not: null },
      },
      orderBy: { pricePerCan: "asc" },
      take: 10,
      include: {
        store: { select: { name: true, city: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { rewardPoints: "desc" },
      take: 10,
      select: { id: true, name: true, rewardPoints: true, trustScore: true, totalSubmissions: true },
    }),
  ]);

  const response = NextResponse.json({
    recentReports,
    topConfirmed,
    bestDeals,
    topContributors,
  });
  response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return response;
}
