"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import StoreList from "@/components/StoreList";
import MapWrapper from "@/components/MapWrapper";
import { useMapStore, type StoreResult } from "@/lib/store";

export default function Home() {
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const {
    center,
    radius,
    maxPrice,
    sortBy,
    productTypes,
    nicStrength,
    onlyWithPrices,
    setCenter,
    setZoom,
  } = useMapStore();

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude]);
        setZoom(12);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [setCenter, setZoom]);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        lat: center[0].toString(),
        lng: center[1].toString(),
        radius: radius.toString(),
        sort: sortBy,
      });
      if (productTypes.length > 0) {
        params.set("productTypes", productTypes.join(","));
      }
      if (nicStrength) {
        params.set("nicStrength", nicStrength);
      }
      if (onlyWithPrices) {
        params.set("onlyWithPrices", "true");
      }
      if (maxPrice > 0) {
        params.set("maxPrice", maxPrice.toString());
      }
      const res = await fetch(`/api/stores/search?${params}`);
      const data = await res.json();
      setStores(data.stores || []);
    } catch (err) {
      console.error("Failed to fetch stores:", err);
    } finally {
      setLoading(false);
    }
  }, [center, radius, maxPrice, sortBy, productTypes, nicStrength, onlyWithPrices]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  function handleStoreSelect(store: StoreResult) {
    setSelectedStoreId(store.id);
    setCenter([store.latitude, store.longitude]);
    setZoom(15);
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <Header />
      <SearchBar />
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="lg:w-[400px] w-full lg:h-full h-80 overflow-y-auto border-r border-gray-200/50 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-gray-900 scrollbar-thin">
          <div className="p-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
            <h2 className="text-sm font-semibold dark:text-white">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Searching...
                </span>
              ) : (
                <span>{stores.length} stores found</span>
              )}
            </h2>
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-green-200 border-t-green-600 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Finding nearby stores...</p>
            </div>
          ) : (
            <StoreList
              stores={stores}
              selectedStoreId={selectedStoreId}
              onStoreSelect={handleStoreSelect}
            />
          )}
        </div>
        <div className="flex-1 p-2 min-h-[400px]">
          <MapWrapper stores={stores} onStoreSelect={handleStoreSelect} onStoreCreated={fetchStores} />
        </div>
      </div>
    </div>
  );
}
