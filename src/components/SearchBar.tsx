"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X, Sparkles, LocateFixed } from "lucide-react";
import { useMapStore, PRODUCT_OPTIONS, STRENGTH_OPTIONS } from "@/lib/store";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [locating, setLocating] = useState(false);
  const radius = useMapStore((s) => s.radius);
  const maxPrice = useMapStore((s) => s.maxPrice);
  const sortBy = useMapStore((s) => s.sortBy);
  const productTypes = useMapStore((s) => s.productTypes);
  const nicStrength = useMapStore((s) => s.nicStrength);
  const onlyWithPrices = useMapStore((s) => s.onlyWithPrices);
  const setCenter = useMapStore((s) => s.setCenter);
  const setRadiusRaw = useMapStore((s) => s.setRadius);
  const setMaxPrice = useMapStore((s) => s.setMaxPrice);
  const setSortBy = useMapStore((s) => s.setSortBy);
  const setZoom = useMapStore((s) => s.setZoom);
  const setProductTypes = useMapStore((s) => s.setProductTypes);
  const setNicStrength = useMapStore((s) => s.setNicStrength);
  const setOnlyWithPrices = useMapStore((s) => s.setOnlyWithPrices);
  const setUserPosition = useMapStore((s) => s.setUserPosition);

  async function nominatimSearch(params: Record<string, string>): Promise<Record<string, unknown>[]> {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?` + new URLSearchParams(params),
      { headers: { "User-Agent": "ZynBuddy/1.0" } }
    );
    return res.json();
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    try {
      const base = { format: "json", countrycodes: "us", limit: "5", addressdetails: "1" };
      let results: Record<string, unknown>[] = [];

      const addressMatch = q.match(/^(\d+\s+.+?),\s*(.+?),\s*([A-Z]{2})\s*(\d{5})?$/i);
      if (addressMatch) {
        const structured: Record<string, string> = {
          ...base,
          street: addressMatch[1],
          city: addressMatch[2],
          state: addressMatch[3],
        };
        if (addressMatch[4]) structured.postalcode = addressMatch[4];
        results = await nominatimSearch(structured);

        if (results.length === 0) {
          results = await nominatimSearch({ ...base, q });
        }

        if (results.length === 0) {
          const fallback = addressMatch[4] || `${addressMatch[2]}, ${addressMatch[3]}`;
          results = await nominatimSearch({ ...base, q: fallback });
        }
      } else {
        results = await nominatimSearch({ ...base, q });
      }

      if (results.length > 0) {
        const best = results[0];
        const coords: [number, number] = [parseFloat(best.lat as string), parseFloat(best.lon as string)];
        setCenter(coords);
        setUserPosition(coords);
        const addr = best.address as Record<string, string> | undefined;
        const isStreetLevel = best.type === "house" || best.type === "building" || addr?.house_number;
        setZoom(isStreetLevel ? 16 : 13);
      }
    } catch {
      // geocoding failed silently
    }
  }

  function handleLocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setCenter(coords);
        setUserPosition(coords);
        setZoom(12);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function diameterToZoom(miles: number): number {
    if (miles <= 1) return 16;
    if (miles <= 2) return 15;
    if (miles <= 3) return 14;
    if (miles <= 5) return 13;
    if (miles <= 8) return 12;
    if (miles <= 12) return 11;
    return 10;
  }

  function setRadius(r: number) {
    setRadiusRaw(r);
    setZoom(diameterToZoom(r));
  }

  function toggleProduct(value: string) {
    if (productTypes.includes(value)) {
      setProductTypes(productTypes.filter((p) => p !== value));
    } else {
      setProductTypes([...productTypes, value]);
    }
  }

  const activeFilterCount = productTypes.length + (nicStrength ? 1 : 0) + (onlyWithPrices ? 1 : 0);

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 px-4 py-3 space-y-2.5">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city, ZIP, or address"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 dark:text-white transition-shadow shadow-sm"
          />
        </div>
        <button
          type="submit"
          className="btn-primary px-5 py-2.5 text-sm"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          title="Use my location"
          className={`p-2.5 border rounded-xl transition-all shadow-sm ${
            locating
              ? "border-green-500 bg-green-50 dark:bg-green-900/20 animate-pulse"
              : "border-gray-200 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-400"
          }`}
        >
          <LocateFixed className={`h-4 w-4 ${locating ? "text-green-500" : "text-gray-500 dark:text-gray-400"}`} />
        </button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`relative p-2.5 border rounded-xl transition-all ${
            showFilters || activeFilterCount > 0
              ? "border-green-500 bg-green-50 dark:bg-green-900/20 shadow-green-500/10 shadow-lg"
              : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm"
          }`}
        >
          <SlidersHorizontal className="h-4 w-4 dark:text-white" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg">
              {activeFilterCount}
            </span>
          )}
        </button>
      </form>

      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Distance</span>
            <span className="text-xs font-bold text-green-600">{radius} mi</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 accent-green-600"
          />
          <div className="flex justify-between mt-0.5">
            {[1, 5, 10, 15, 20].map((v) => (
              <span key={v} className={`text-[9px] ${radius === v ? "text-green-600 font-bold" : "text-gray-400"}`}>{v}</span>
            ))}
          </div>
        </div>
        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Max Price</span>
            <span className="text-xs font-bold text-green-600">{maxPrice === 0 ? "Any" : `$${maxPrice}`}</span>
          </div>
          <input
            type="range"
            min={0}
            max={15}
            step={1}
            value={maxPrice}
            onChange={(e) => setMaxPrice(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 accent-green-600"
          />
          <div className="flex justify-between mt-0.5">
            {[0, 5, 10, 15].map((v) => (
              <span key={v} className={`text-[9px] ${maxPrice === v ? "text-green-600 font-bold" : "text-gray-400"}`}>{v === 0 ? "Any" : `$${v}`}</span>
            ))}
          </div>
        </div>
      </div>

      {productTypes.length > 0 && !showFilters && (
        <div className="flex flex-wrap gap-1.5">
          {productTypes.map((pt) => {
            const opt = PRODUCT_OPTIONS.find((o) => o.value === pt);
            return (
              <span
                key={pt}
                className="inline-flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full font-medium"
              >
                {opt?.label || pt}
                <button onClick={() => toggleProduct(pt)} className="hover:text-green-900 dark:hover:text-green-100">
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          {nicStrength && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full font-medium">
              {nicStrength}mg
              <button onClick={() => setNicStrength("")}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {showFilters && (
        <div className="space-y-4 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700/50">
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2 dark:text-white">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sort</span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "distance" | "price")
                }
                className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-sm shadow-sm"
              >
                <option value="distance">Distance</option>
                <option value="price">Lowest Price</option>
              </select>
            </label>
            <label className="flex items-center gap-2 dark:text-white">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Strength</span>
              <select
                value={nicStrength}
                onChange={(e) => setNicStrength(e.target.value)}
                className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-sm shadow-sm"
              >
                {STRENGTH_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 dark:text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyWithPrices}
                onChange={(e) => setOnlyWithPrices(e.target.checked)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-4 h-4"
              />
              <span className="text-sm">Only stores with prices</span>
            </label>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2.5 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Filter by Product
            </p>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleProduct(opt.value)}
                  className={`text-xs px-3.5 py-1.5 rounded-full border transition-all font-medium ${
                    productTypes.includes(opt.value)
                      ? "bg-green-600 text-white border-green-600 shadow-md shadow-green-600/20"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-green-400 hover:text-green-600 shadow-sm"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
