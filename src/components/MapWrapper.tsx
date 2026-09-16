"use client";

import { memo } from "react";
import dynamic from "next/dynamic";
import type { StoreResult } from "@/lib/store";

const MapView = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-2xl">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Loading map...</p>
      </div>
    </div>
  ),
});

interface MapWrapperProps {
  stores: StoreResult[];
  onStoreSelect: (store: StoreResult) => void;
  onStoreCreated?: () => void;
  userPosition?: [number, number] | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default memo(function MapWrapper({ stores, onStoreSelect, onStoreCreated, userPosition, isExpanded, onToggleExpand }: MapWrapperProps) {
  return <MapView stores={stores} onStoreSelect={onStoreSelect} onStoreCreated={onStoreCreated} userPosition={userPosition} isExpanded={isExpanded} onToggleExpand={onToggleExpand} />;
});
