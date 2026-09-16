import { create } from "zustand";

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface MapState {
  center: [number, number];
  zoom: number;
  radius: number;
  maxPrice: number;
  sortBy: "distance" | "price";
  productTypes: string[];
  nicStrength: string;
  onlyWithPrices: boolean;
  mapBounds: MapBounds | null;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setRadius: (radius: number) => void;
  setMaxPrice: (maxPrice: number) => void;
  setSortBy: (sortBy: "distance" | "price") => void;
  setProductTypes: (types: string[]) => void;
  setNicStrength: (strength: string) => void;
  setOnlyWithPrices: (v: boolean) => void;
  setMapBounds: (bounds: MapBounds) => void;
}

export const useMapStore = create<MapState>((set) => ({
  center: [39.8283, -98.5795],
  zoom: 4,
  radius: 10,
  maxPrice: 0,
  sortBy: "distance",
  productTypes: [],
  nicStrength: "",
  onlyWithPrices: false,
  mapBounds: null,
  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setRadius: (radius) => set({ radius }),
  setMaxPrice: (maxPrice) => set({ maxPrice }),
  setSortBy: (sortBy) => set({ sortBy }),
  setProductTypes: (productTypes) => set({ productTypes }),
  setNicStrength: (nicStrength) => set({ nicStrength }),
  setOnlyWithPrices: (onlyWithPrices) => set({ onlyWithPrices }),
  setMapBounds: (mapBounds) => set({ mapBounds }),
}));

export interface StoreResult {
  id: string;
  name: string;
  brand: string | null;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  storeType: string;
  distance: number;
  latestPrice: {
    pricePerCan: number;
    pricePerRoll: number | null;
    dealDescription: string | null;
    productBrand: string;
    productVariant: string | null;
    nicStrength: string | null;
    reportedAt: string;
    confirmedCount: number;
    lastConfirmedAt: string | null;
    status: string;
  } | null;
}

export const PRODUCT_OPTIONS = [
  { value: "ZYN", label: "Zyn" },
  { value: "VELO", label: "Velo" },
  { value: "ON_NICOTINE", label: "On!" },
  { value: "CAMEL_SNUS", label: "Camel Snus" },
  { value: "ROGUE", label: "Rogue" },
  { value: "LUCY", label: "Lucy" },
  { value: "ALP", label: "Alp" },
  { value: "ZEO_UNIVERSE", label: "ZEO Universe" },
  { value: "OTHER_NICOTINE", label: "Other Nicotine" },
  { value: "VAPE", label: "Vape" },
  { value: "CIGAR", label: "Cigar" },
  { value: "BOURBON", label: "Bourbon" },
] as const;

export const STRENGTH_OPTIONS = [
  { value: "", label: "Any Strength" },
  { value: "3", label: "3mg" },
  { value: "6", label: "6mg" },
  { value: "8", label: "8mg" },
  { value: "12", label: "12mg" },
] as const;

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
