"use client";

import { useEffect, useState, useCallback } from "react";
import { List, MapIcon } from "lucide-react";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import StoreList from "@/components/StoreList";
import MapWrapper from "@/components/MapWrapper";
import { useMapStore, type StoreResult, type MapBounds } from "@/lib/store";

export default function Home() {
  const [stores, setStores] = useState<StoreResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
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
    mapBounds,
  } = useMapStore();

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPosition(coords);
        setCenter(coords);
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
        radius: (radius / 2).toString(),
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

  function isInBounds(store: StoreResult, bounds: MapBounds): boolean {
    return (
      store.latitude >= bounds.minLat &&
      store.latitude <= bounds.maxLat &&
      store.longitude >= bounds.minLng &&
      store.longitude <= bounds.maxLng
    );
  }

  const visibleStores = mapBounds
    ? stores.filter((s) => isInBounds(s, mapBounds))
    : stores;

  function handleStoreSelect(store: StoreResult) {
    setSelectedStoreId(store.id);
    setCenter([store.latitude, store.longitude]);
    setZoom(15);
    setMobileView("map");
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      <Header />
      <SearchBar />

      {/* Mobile toggle */}
      <div className="lg:hidden flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <button
          onClick={() => setMobileView("list")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${
            mobileView === "list"
              ? "text-green-600 border-b-2 border-green-500 bg-green-50/50 dark:bg-green-900/10"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <List className="h-3.5 w-3.5" />
          List
        </button>
        <button
          onClick={() => setMobileView("map")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${
            mobileView === "map"
              ? "text-green-600 border-b-2 border-green-500 bg-green-50/50 dark:bg-green-900/10"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <MapIcon className="h-3.5 w-3.5" />
          Map
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Store list */}
        <div
          className={`lg:w-[400px] w-full overflow-y-auto border-r border-gray-200/50 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-gray-900 scrollbar-thin transition-all ${
            mobileView === "map" ? "hidden lg:block" : "flex-1 lg:flex-none lg:h-full"
          }`}
        >
          <div className="p-2 px-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
            <h2 className="text-xs font-semibold dark:text-white">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Searching...
                </span>
              ) : (
                <span>{visibleStores.length} stores found</span>
              )}
            </h2>
          </div>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-200 border-t-green-600 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Finding nearby stores...</p>
            </div>
          ) : (
            <StoreList
              stores={visibleStores}
              selectedStoreId={selectedStoreId}
              onStoreSelect={handleStoreSelect}
            />
          )}
        </div>

        {/* Map */}
        <div
          className={`p-1.5 transition-all ${
            mobileView === "list"
              ? "h-[25vh] lg:h-auto lg:flex-1"
              : "flex-1 min-h-[60vh] lg:min-h-0"
          }`}
        >
          <MapWrapper
            stores={stores}
            onStoreSelect={handleStoreSelect}
            onStoreCreated={fetchStores}
            userPosition={userPosition}
            isExpanded={mobileView === "map"}
            onToggleExpand={() => setMobileView(mobileView === "map" ? "list" : "map")}
          />
        </div>
      </div>
    </div>
  );
}
