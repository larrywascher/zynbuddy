"use client";

import type { StoreResult } from "@/lib/store";
import { useMapStore } from "@/lib/store";
import { MapPin, Tag, ThumbsUp } from "lucide-react";
import Link from "next/link";

function getPriceColor(price: number | null | undefined): string {
  if (!price) return "text-gray-400";
  if (price <= 4.5) return "text-green-600";
  if (price <= 5.5) return "text-amber-500";
  return "text-red-500";
}

function getStoreTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    GAS_STATION: "Gas",
    CONVENIENCE_STORE: "Convenience",
    SMOKE_SHOP: "Smoke Shop",
    GROCERY: "Grocery",
    LIQUOR_STORE: "Liquor",
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
      <div className="p-6 text-center text-gray-500">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-2">
          <MapPin className="h-6 w-6 text-gray-300" />
        </div>
        <p className="text-sm font-medium">No stores found</p>
        <p className="text-xs mt-1 text-gray-400">Try expanding your search radius or changing filters.</p>
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
      {stores.map((store) => (
        <button
          key={store.id}
          onClick={() => onStoreSelect(store)}
          className={`w-full text-left px-3 py-2 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-all ${
            selectedStoreId === store.id
              ? "bg-green-50 dark:bg-green-900/20 border-l-3 border-green-500"
              : ""
          }`}
        >
          <div className="flex justify-between items-center gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-xs truncate dark:text-white">
                {store.name}
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                {store.address} &middot; {store.distance} mi
                <span className="text-gray-300 dark:text-gray-600 ml-0.5">&middot;</span>
                <span>{getStoreTypeLabel(store.storeType)}</span>
              </p>
              {store.latestPrice?.dealDescription && (
                <p className="text-[10px] text-green-600 dark:text-green-400 truncate flex items-center gap-0.5 mt-0.5">
                  <Tag className="h-2.5 w-2.5 flex-shrink-0" />
                  {store.latestPrice.dealDescription}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              {store.latestPrice ? (
                <div className="flex items-center gap-1">
                  {store.latestPrice.confirmedCount > 0 && (
                    <span className="text-[9px] text-gray-400 flex items-center gap-0.5">
                      <ThumbsUp className="h-2 w-2" />
                      {store.latestPrice.confirmedCount}
                    </span>
                  )}
                  <span className={`text-sm font-bold ${getPriceColor(store.latestPrice.pricePerCan)}`}>
                    ${store.latestPrice.pricePerCan.toFixed(2)}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-gray-300 dark:text-gray-600">N/A</span>
              )}
            </div>
          </div>
          <Link
            href={detailLink(store.id)}
            className="text-[10px] text-green-600 dark:text-green-400 hover:text-green-700 font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            View Details &rarr;
          </Link>
        </button>
      ))}
    </div>
  );
}
