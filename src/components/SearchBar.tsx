"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X, Sparkles } from "lucide-react";
import { useMapStore, PRODUCT_OPTIONS, STRENGTH_OPTIONS } from "@/lib/store";

const ZIP_COORDS: Record<string, [number, number]> = {
  "85120": [33.3893, -111.5483],
  "85142": [33.3114, -111.5844],
  "85201": [33.4152, -111.8315],
  "85202": [33.4050, -111.8405],
  "85203": [33.4350, -111.8105],
  "85204": [33.3989, -111.7954],
  "85205": [33.4213, -111.7278],
  "85206": [33.3820, -111.7228],
  "85207": [33.4213, -111.6728],
  "85208": [33.3620, -111.6978],
  "85209": [33.3620, -111.6478],
  "85210": [33.3820, -111.8428],
  "85211": [33.3950, -111.8100],
  "85212": [33.3213, -111.6444],
  "85213": [33.4213, -111.6228],
  "85215": [33.4600, -111.6800],
  "85216": [33.3800, -111.8300],
  "85224": [33.3060, -111.8430],
  "85225": [33.3060, -111.8100],
  "85233": [33.3530, -111.7890],
  "85234": [33.3530, -111.7500],
  "85236": [33.3200, -111.7200],
  "85249": [33.2580, -111.7700],
  "85286": [33.3780, -111.9180],
  "85296": [33.2890, -111.7600],
  "85297": [33.2700, -111.6800],
  "85298": [33.2800, -111.6400],
  "85295": [33.3100, -111.7300],
};

export default function SearchBar() {
  const [zipCode, setZipCode] = useState("85212");
  const [showFilters, setShowFilters] = useState(false);
  const {
    radius,
    maxPrice,
    sortBy,
    productTypes,
    nicStrength,
    onlyWithPrices,
    setCenter,
    setRadius,
    setMaxPrice,
    setSortBy,
    setZoom,
    setProductTypes,
    setNicStrength,
    setOnlyWithPrices,
  } = useMapStore();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const coords = ZIP_COORDS[zipCode];
    if (coords) {
      setCenter(coords);
      setZoom(13);
    }
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
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Enter ZIP code (e.g. 85212)"
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
            min={5}
            max={25}
            step={5}
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 accent-green-600"
          />
          <div className="flex justify-between mt-0.5">
            {[5, 10, 15, 20, 25].map((v) => (
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
            max={20}
            step={1}
            value={maxPrice}
            onChange={(e) => setMaxPrice(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 accent-green-600"
          />
          <div className="flex justify-between mt-0.5">
            {[0, 5, 10, 15, 20].map((v) => (
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
