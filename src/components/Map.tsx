"use client";

import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { StoreResult } from "@/lib/store";
import { useMapStore, PRODUCT_OPTIONS, STRENGTH_OPTIONS } from "@/lib/store";
import Link from "next/link";
import { useSession } from "next-auth/react";

function getPriceColor(price: number | null | undefined): string {
  if (!price) return "#94a3b8";
  if (price <= 4.5) return "#16a34a";
  if (price <= 5.5) return "#f59e0b";
  return "#ef4444";
}

function createPriceIcon(price: number | null | undefined) {
  const color = getPriceColor(price);
  const label = price ? `$${price.toFixed(2)}` : "N/A";
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background:${color};
      color:white;
      border-radius:24px;
      padding:5px 10px;
      font-size:12px;
      font-weight:700;
      white-space:nowrap;
      border:2px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.25);
      text-align:center;
      letter-spacing:-0.3px;
    ">${label}</div>`,
    iconSize: [64, 30],
    iconAnchor: [32, 15],
  });
}

function createNewStoreIcon() {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background:#8b5cf6;
      color:white;
      border-radius:50%;
      width:36px;
      height:36px;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:20px;
      font-weight:bold;
      border:3px solid white;
      box-shadow:0 2px 12px rgba(139,92,246,0.5);
    ">+</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function MapUpdater() {
  const map = useMap();
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);

  return null;
}

interface AddStoreFormData {
  name: string;
  address: string;
  productType: string;
  productBrand: string;
  pricePerCan: string;
  nicStrength: string;
  storeType: string;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

async function reverseGeocode(lat: number, lng: number): Promise<{ name: string; address: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "User-Agent": "ZynBuddy/1.0" } }
    );
    if (!res.ok) return { name: "", address: "" };
    const data = await res.json();

    const name = data.name || data.address?.shop || data.address?.amenity || data.address?.building || "";
    const parts: string[] = [];
    const addr = data.address || {};
    if (addr.house_number && addr.road) parts.push(`${addr.house_number} ${addr.road}`);
    else if (addr.road) parts.push(addr.road);
    if (addr.city || addr.town || addr.village) parts.push(addr.city || addr.town || addr.village);
    if (addr.state) parts.push(addr.state);
    if (addr.postcode) parts.push(addr.postcode);

    return { name, address: parts.join(", ") };
  } catch {
    return { name: "", address: "" };
  }
}

interface MapViewProps {
  stores: StoreResult[];
  onStoreSelect: (store: StoreResult) => void;
  onStoreCreated?: () => void;
}

export default function MapView({ stores, onStoreSelect, onStoreCreated }: MapViewProps) {
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const productTypes = useMapStore((s) => s.productTypes);
  const { data: session } = useSession();
  const [clickedPos, setClickedPos] = useState<[number, number] | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [formData, setFormData] = useState<AddStoreFormData>({
    name: "",
    address: "",
    productType: "ZYN",
    productBrand: "Zyn",
    pricePerCan: "",
    nicStrength: "",
    storeType: "GAS_STATION",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const markerRef = useRef<L.Marker>(null);

  async function handleMapClick(lat: number, lng: number) {
    if (!session) return;
    setClickedPos([lat, lng]);
    setMessage("");
    setGeocoding(true);
    setFormData((prev) => ({ ...prev, name: "", address: "" }));

    const geo = await reverseGeocode(lat, lng);
    setFormData((prev) => ({
      ...prev,
      name: geo.name,
      address: geo.address,
    }));
    setGeocoding(false);

    setTimeout(() => {
      markerRef.current?.openPopup();
    }, 100);
  }

  async function handleSubmitNewStore(e: React.FormEvent) {
    e.preventDefault();
    if (!clickedPos || !session) return;
    setSubmitting(true);
    setMessage("");

    const product = PRODUCT_OPTIONS.find((p) => p.value === formData.productType);

    const res = await fetch("/api/stores/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.name,
        address: formData.address,
        latitude: clickedPos[0],
        longitude: clickedPos[1],
        storeType: formData.storeType,
        productType: formData.productType,
        productBrand: product?.label || formData.productBrand,
        pricePerCan: formData.pricePerCan,
        nicStrength: formData.nicStrength || undefined,
      }),
    });

    setSubmitting(false);
    if (res.ok) {
      setMessage("Store added! +50 points");
      setClickedPos(null);
      setFormData({ name: "", address: "", productType: "ZYN", productBrand: "Zyn", pricePerCan: "", nicStrength: "", storeType: "GAS_STATION" });
      onStoreCreated?.();
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed to add store");
    }
  }

  const detailLink = (storeId: string) => {
    const base = `/store/${storeId}`;
    if (productTypes.length > 0) {
      return `${base}?productTypes=${productTypes.join(",")}`;
    }
    return base;
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full rounded-2xl shadow-inner"
        style={{ minHeight: "400px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater />
        {session && <MapClickHandler onMapClick={handleMapClick} />}
        {stores.map((store) => (
          <Marker
            key={store.id}
            position={[store.latitude, store.longitude]}
            icon={createPriceIcon(store.latestPrice?.pricePerCan)}
            eventHandlers={{
              click: () => onStoreSelect(store),
            }}
          >
            <Popup>
              <div className="min-w-48">
                <h3 className="font-bold text-sm">{store.name}</h3>
                <p className="text-xs text-gray-600">{store.address}</p>
                {store.latestPrice ? (
                  <div className="mt-1">
                    <span className="text-lg font-bold" style={{ color: getPriceColor(store.latestPrice.pricePerCan) }}>
                      ${store.latestPrice.pricePerCan.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500">/can</span>
                    {store.latestPrice.dealDescription && (
                      <p className="text-xs text-green-600 mt-1">
                        {store.latestPrice.dealDescription}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">No prices reported</p>
                )}
                <Link
                  href={detailLink(store.id)}
                  className="text-xs text-blue-600 hover:underline mt-1 block"
                >
                  View Details &rarr;
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
        {clickedPos && (
          <Marker
            position={clickedPos}
            icon={createNewStoreIcon()}
            ref={markerRef}
          >
            <Popup>
              <div className="min-w-56">
                <h3 className="font-bold text-sm mb-1">Add New Store</h3>
                <p className="text-[10px] text-gray-500 mb-2">
                  {clickedPos[0].toFixed(4)}, {clickedPos[1].toFixed(4)}
                </p>
                {geocoding ? (
                  <p className="text-xs text-gray-400 py-2 text-center">Looking up location...</p>
                ) : (
                  <form onSubmit={handleSubmitNewStore} className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="Store name *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-2 py-1 text-xs border rounded"
                    />
                    <input
                      type="text"
                      placeholder="Address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-2 py-1 text-xs border rounded"
                    />
                    <select
                      value={formData.storeType}
                      onChange={(e) => setFormData({ ...formData, storeType: e.target.value })}
                      className="w-full px-2 py-1 text-xs border rounded"
                    >
                      <option value="GAS_STATION">Gas Station</option>
                      <option value="CONVENIENCE_STORE">Convenience Store</option>
                      <option value="SMOKE_SHOP">Smoke Shop</option>
                      <option value="GROCERY">Grocery</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <select
                      value={formData.productType}
                      onChange={(e) => {
                        const opt = PRODUCT_OPTIONS.find((p) => p.value === e.target.value);
                        setFormData({ ...formData, productType: e.target.value, productBrand: opt?.label || e.target.value });
                      }}
                      className="w-full px-2 py-1 text-xs border rounded"
                    >
                      {PRODUCT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <select
                      value={formData.nicStrength}
                      onChange={(e) => setFormData({ ...formData, nicStrength: e.target.value })}
                      className="w-full px-2 py-1 text-xs border rounded"
                    >
                      {STRENGTH_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="100"
                      placeholder="Price per can ($) *"
                      value={formData.pricePerCan}
                      onChange={(e) => setFormData({ ...formData, pricePerCan: e.target.value })}
                      required
                      className="w-full px-2 py-1 text-xs border rounded"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full px-2 py-1.5 bg-purple-600 text-white text-xs rounded font-medium hover:bg-purple-700 disabled:opacity-50"
                    >
                      {submitting ? "Adding..." : "Add Store (+50 pts)"}
                    </button>
                  </form>
                )}
                {message && (
                  <p className={`text-[10px] mt-1 ${message.includes("Failed") ? "text-red-500" : "text-green-600"}`}>
                    {message}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {session && (
        <div className="absolute top-3 right-3 z-[1000] bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
            Click map to add a store
          </p>
        </div>
      )}
    </div>
  );
}
