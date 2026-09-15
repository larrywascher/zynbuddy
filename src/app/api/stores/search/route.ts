import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistance, getBoundingBox } from "@/lib/geo";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "33.3213");
  const lng = parseFloat(searchParams.get("lng") || "-111.6444");
  const radius = parseFloat(searchParams.get("radius") || "10");
  const sortBy = searchParams.get("sort") || "distance";
  const productTypes = searchParams.get("productTypes");
  const nicStrength = searchParams.get("nicStrength");
  const onlyWithPrices = searchParams.get("onlyWithPrices") === "true";
  const maxPrice = parseFloat(searchParams.get("maxPrice") || "0");

  const bbox = getBoundingBox(lat, lng, radius);

  const productTypeList = productTypes
    ? productTypes.split(",").filter(Boolean)
    : [];

  const hasProductFilter = productTypeList.length > 0;

  const priceWhere: Record<string, unknown> = { isStale: false, status: "ACTIVE" };
  if (hasProductFilter) {
    priceWhere.productType = { in: productTypeList };
  }
  if (nicStrength) {
    priceWhere.nicStrength = nicStrength;
  }

  const stores = await prisma.store.findMany({
    where: {
      latitude: { gte: bbox.minLat, lte: bbox.maxLat },
      longitude: { gte: bbox.minLng, lte: bbox.maxLng },
    },
    include: {
      prices: {
        where: priceWhere,
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      amenities: true,
    },
  });

  const results = stores
    .map((store) => {
      const distance = haversineDistance(lat, lng, store.latitude, store.longitude);
      const latestPrice = store.prices[0] || null;
      return {
        ...store,
        distance: Math.round(distance * 100) / 100,
        latestPrice: latestPrice
          ? {
              pricePerCan: latestPrice.pricePerCan,
              pricePerRoll: latestPrice.pricePerRoll,
              dealDescription: latestPrice.dealDescription,
              productBrand: latestPrice.productBrand,
              productVariant: latestPrice.productVariant,
              nicStrength: latestPrice.nicStrength,
              reportedAt: latestPrice.createdAt,
              confirmedCount: latestPrice.confirmedCount,
              lastConfirmedAt: latestPrice.lastConfirmedAt,
              status: latestPrice.status,
            }
          : null,
      };
    })
    .filter((s) => s.distance <= radius)
    .filter((s) => {
      if (hasProductFilter) return s.latestPrice !== null;
      if (onlyWithPrices) return s.latestPrice !== null;
      return true;
    })
    .filter((s) => {
      if (maxPrice > 0 && s.latestPrice) {
        return s.latestPrice.pricePerCan <= maxPrice;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price") {
        const priceA = a.latestPrice?.pricePerCan ?? Infinity;
        const priceB = b.latestPrice?.pricePerCan ?? Infinity;
        return priceA - priceB;
      }
      return a.distance - b.distance;
    });

  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  const total = results.length;
  const paginated = results.slice((page - 1) * limit, page * limit);

  const response = NextResponse.json({
    stores: paginated,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
  response.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
  return response;
}
