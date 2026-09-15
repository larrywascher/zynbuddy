"use client";

import { useState } from "react";
import { Navigation, ChevronUp, ChevronDown } from "lucide-react";
import { useMapStore } from "@/lib/store";

const PRESETS: { name: string; lat: number; lng: number }[] = [
  { name: "Mesa Center (85212)", lat: 33.3213, lng: -111.6444 },
  { name: "Signal Butte & Guadalupe", lat: 33.3112, lng: -111.6100 },
  { name: "Power & Baseline", lat: 33.3790, lng: -111.6828 },
  { name: "Ellsworth & Southern", lat: 33.3930, lng: -111.6050 },
  { name: "Val Vista & US-60", lat: 33.3820, lng: -111.7228 },
  { name: "Gilbert & Guadalupe", lat: 33.3600, lng: -111.7520 },
  { name: "Stapley & Main", lat: 33.4150, lng: -111.8120 },
];

export default function MockGPS() {
  const [isOpen, setIsOpen] = useState(false);
  const setCenter = useMapStore((s) => s.setCenter);
  const setZoom = useMapStore((s) => s.setZoom);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white z-[1000]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center gap-2 py-2 hover:bg-gray-800 transition-colors text-sm"
      >
        <Navigation className="h-4 w-4 text-green-400" />
        <span>Mock GPS</span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                setCenter([p.lat, p.lng]);
                setZoom(14);
              }}
              className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
