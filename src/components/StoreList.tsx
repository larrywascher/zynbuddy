"use client";

import type { StoreResult } from "@/lib/store";
import { useMapStore } from "@/lib/store";
import { MapPin, DollarSign, Clock, ThumbsUp, Tag, Zap, Shield } from "lucide-react";
import Link from "next/link";

function getFreshnessStyle(reportedAt: string): {
  priceClass: string;
  label: string;
  icon: "fresh" | "normal" | "stale";
} {
  const ageMs = Date.now() - new Date(reportedAt).getTime();
  const hours = ageMs / (1000 * 60 * 60);

  if (hours < 2) {
    return {
      priceClass: "text-green-600 font-black text-2xl",
      label: "Just reported",
      icon: "fresh",
    };
  }
  if (hours > 72) {
    return {
      priceClass: "text-gray-400 font-medium text-lg",
      label: "3+ days old",
      icon: "stale",
    };
  }
  return {
    priceClass: "text-xl font-bold",
    label: "",
    icon: "normal",
  };
}

function getPriceColor(price: number | null | undefined): string {
  if (!price) return "text-gray-400";
  if (price <= 4.5) return "text-green-600";
  if (price <= 5.5) return "text-amber-500";
  return "text-red-500";
}

function getStoreTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    GAS_STATION: "Gas Station",
    CONVENIENCE_STORE: "Convenience",
    SMOKE_SHOP: "Smoke Shop",
    GROCERY: "Grocery",
    LIQUOR_STORE: "Liquor Store",
    OTHER: "Other",
  };
  return labels[type] || type;
}

interface StoreListProps {
  stores: StoreResult[];
  selectedStoreId: string | null;
  onStoreSelect: (store: StoreResult) => void;
}

export default function StoreList({
  stores,
  selectedStoreId,
  onStoreSelect,
}: StoreListProps) {
  const productTypes = useMapStore((s) => s.productTypes);

  if (stores.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <MapPin className="h-8 w-8 text-gray-300" />
        </div>
        <p className="font-medium">No stores found</p>
        <p className="text-sm mt-1 text-gray-400">Try expanding your search radius or changing filters.</p>
      </div>
    );
  }

  const detailLink = (storeId: string) => {
    const base = `/store/${storeId}`;
    if (productTypes.length > 0) {
      return `${base}?productTypes=${productTypes.join(",")}`;
    }
    return base;
  };

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {stores.map((store, idx) => {
        const freshness = store.latestPrice
          ? getFreshnessStyle(store.latestPrice.reportedAt)
          : null;

        return (
          <button
            key={store.id}
            onClick={() => onStoreSelect(store)}
            className={`w-full text-left p-4 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-all ${
              selectedStoreId === store.id
                ? "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500"
                : ""
            }`}
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-300 dark:text-gray-600 tabular-nums">
                    {idx + 1}
                  </span>
                  <h3 className="font-semibold text-sm truncate dark:text-white">
                    {store.name}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{store.address}</span>
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">
                    {getStoreTypeLabel(store.storeType)}
                  </span>
                  <span className="text-[10px] text-gray-400">{store.distance} mi</span>
                </div>
                {store.latestPrice?.dealDescription && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1 font-medium">
                    <Tag className="h-3 w-3" />
                    {store.latestPrice.dealDescription}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                {store.latestPrice && freshness ? (
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-end gap-1">
                      {freshness.icon === "fresh" && (
                        <Zap className="h-4 w-4 text-green-500 fill-green-500" />
                      )}
                      <p
                        className={`${
                          freshness.icon === "stale"
                            ? freshness.priceClass
                            : `${freshness.priceClass} ${getPriceColor(
                                store.latestPrice.pricePerCan
                              )}`
                        }`}
                      >
                        ${store.latestPrice.pricePerCan.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-[10px] text-gray-400">/can</p>
                    {freshness.label && (
                      <p
                        className={`text-[10px] mt-0.5 ${
                          freshness.icon === "fresh"
                            ? "text-green-500 font-semibold"
                            : "text-gray-400 italic"
                        }`}
                      >
                        {freshness.label}
                      </p>
                    )}
                    {store.latestPrice.confirmedCount > 0 && (
                      <p className="text-[10px] text-gray-400 flex items-center justify-end gap-0.5 mt-0.5">
                        <ThumbsUp className="h-2.5 w-2.5" />
                        {store.latestPrice.confirmedCount}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 flex items-center justify-end gap-0.5">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(
                        store.latestPrice.reportedAt
                      ).toLocaleDateString()}
                    </p>
                    {store.latestPrice.status === "PENDING_VERIFICATION" && (
                      <span className="text-[10px] text-yellow-600 flex items-center justify-end gap-0.5">
                        <Shield className="h-2.5 w-2.5" /> Pending
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-300 dark:text-gray-600 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    N/A
                  </p>
                )}
              </div>
            </div>
            <Link
              href={detailLink(store.id)}
              className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 mt-2 inline-flex items-center gap-1 font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              View Details
              <span className="text-[10px]">&rarr;</span>
            </Link>
          </button>
        );
      })}
    </div>
  );
}
