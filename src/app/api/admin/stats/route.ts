import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET() {
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

  const [
    totalUsers,
    totalStores,
    totalPriceReports,
    activePriceReports,
    pendingReports,
    staleReports,
    totalReviews,
    totalProductRequests,
    recentUsers,
    recentPrices,
    topReporters,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.store.count(),
    prisma.priceReport.count(),
    prisma.priceReport.count({ where: { status: "ACTIVE", isStale: false } }),
    prisma.priceReport.count({ where: { status: "PENDING_VERIFICATION" } }),
    prisma.priceReport.count({ where: { isStale: true } }),
    prisma.review.count(),
    prisma.productRequest.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, email: true, name: true, role: true, rewardPoints: true, trustScore: true, createdAt: true },
    }),
    prisma.priceReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true } }, store: { select: { name: true } } },
    }),
    prisma.user.findMany({
      orderBy: { totalSubmissions: "desc" },
      take: 10,
      select: { id: true, name: true, email: true, totalSubmissions: true, totalUpvotes: true, trustScore: true, rewardPoints: true },
    }),
  ]);

  let dbSizeBytes = 0;
  try {
    const dbUrl = process.env.DATABASE_URL || "";
    const dbPath = dbUrl.replace("file:", "");
    if (dbPath && fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      dbSizeBytes = stats.size;
    }
  } catch {
    // ignore
  }

  return NextResponse.json({
    counts: {
      users: totalUsers,
      stores: totalStores,
      priceReports: totalPriceReports,
      activePriceReports,
      pendingReports,
      staleReports,
      reviews: totalReviews,
      productRequests: totalProductRequests,
    },
    dbSizeBytes,
    dbSizeMB: Math.round((dbSizeBytes / (1024 * 1024)) * 100) / 100,
    recentUsers,
    recentPrices,
    topReporters,
  });
}
