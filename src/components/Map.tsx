"use client";

import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  Pane,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import type { StoreResult } from "@/lib/store";
import { useMapStore, PRODUCT_OPTIONS } from "@/lib/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Maximize2, Minimize2 } from "lucide-react";
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
  const setMapBounds = useMapStore((s) => s.setMapBounds);
  const prevBoundsKey = useRef("");
  const prevViewKey = useRef("");

  useEffect(() => {
    const key = `${center[0]},${center[1]},${zoom}`;
    if (key === prevViewKey.current) return;
    prevViewKey.current = key;
    map.setView(center, zoom);
  }, [map, center, zoom]);

  useEffect(() => {
    function updateBounds() {
      const b = map.getBounds();
      const key = `${b.getSouth().toFixed(6)},${b.getNorth().toFixed(6)},${b.getWest().toFixed(6)},${b.getEast().toFixed(6)}`;
      if (key === prevBoundsKey.current) return;
      prevBoundsKey.current = key;
      setMapBounds({
        minLat: b.getSouth(),
        maxLat: b.getNorth(),
        minLng: b.getWest(),
        maxLng: b.getEast(),
      });
    }
    updateBounds();
    map.on("moveend", updateBounds);
    return () => { map.off("moveend", updateBounds); };
  }, [map, setMapBounds]);

  return null;
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

async function reverseGeocode(lat: number, lng: number): Promise<{ name: string; address: string; city: string; state: string; zip: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "User-Agent": "ZynBuddy/1.0" } }
    );
    if (!res.ok) return { name: "", address: "", city: "", state: "", zip: "" };
    const data = await res.json();

    const name = data.name || data.address?.shop || data.address?.amenity || data.address?.building || "";
    const parts: string[] = [];
    const addr = data.address || {};
    if (addr.house_number && addr.road) parts.push(`${addr.house_number} ${addr.road}`);
    else if (addr.road) parts.push(addr.road);

    const city = addr.city || addr.town || addr.village || "";
    const state = addr.state || "";
    const zip = addr.postcode || "";

    return { name, address: parts.join(", "), city, state, zip };
  } catch {
    return { name: "", address: "", city: "", state: "", zip: "" };
  }
}

interface MapViewProps {
  stores: StoreResult[];
  onStoreSelect: (store: StoreResult) => void;
  onStoreCreated?: () => void;
  userPosition?: [number, number] | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function MapView({ stores, onStoreSelect, onStoreCreated, userPosition, isExpanded, onToggleExpand }: MapViewProps) {
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const productTypes = useMapStore((s) => s.productTypes);
  const { data: session } = useSession();
  const router = useRouter();
  const [clickedPos, setClickedPos] = useState<[number, number] | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geoData, setGeoData] = useState({ name: "", address: "", city: "", state: "", zip: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const markerRef = useRef<L.Marker>(null);

  async function handleMapClick(lat: number, lng: number) {
    if (!session) return;
    setClickedPos([lat, lng]);
    setMessage("");
    setGeocoding(true);
    setGeoData({ name: "", address: "", city: "", state: "", zip: "" });

    const geo = await reverseGeocode(lat, lng);
    setGeoData(geo);
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

    const res = await fetch("/api/stores/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: geoData.name || "Store",
        address: geoData.address,
        city: geoData.city,
        state: geoData.state,
        zipCode: geoData.zip,
        latitude: clickedPos[0],
        longitude: clickedPos[1],
        storeType: "GAS_STATION",
      }),
    });

    setSubmitting(false);
    if (res.ok) {
      const newStore = await res.json();
      setClickedPos(null);
      setGeoData({ name: "", address: "", city: "", state: "", zip: "" });
      onStoreCreated?.();
      router.push(`/store/${newStore.id}`);
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
        style={{ minHeight: "300px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater />
        {session && <MapClickHandler onMapClick={handleMapClick} />}

        {userPosition && (
          <Pane name="user-position" style={{ zIndex: 700 }}>
            <CircleMarker
              center={userPosition}
              radius={8}
              pathOptions={{
                color: "#ffffff",
                weight: 3,
                fillColor: "#3b82f6",
                fillOpacity: 1,
              }}
            >
              <Popup>
                <p className="text-xs font-medium">Your location</p>
              </Popup>
            </CircleMarker>
          </Pane>
        )}

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
              <div className="min-w-52">
                <h3 className="font-bold text-sm mb-1">Add New Store</h3>
                {geocoding ? (
                  <p className="text-xs text-gray-400 py-2 text-center">Looking up location...</p>
                ) : geoData.name ? (
                  <form onSubmit={handleSubmitNewStore} className="space-y-1.5">
                    <div className="text-xs">
                      <p className="font-semibold text-gray-800">{geoData.name}</p>
                      <p className="text-gray-500">{geoData.address || `${clickedPos[0].toFixed(4)}, ${clickedPos[1].toFixed(4)}`}</p>
                      {geoData.city && <p className="text-gray-500">{geoData.city}{geoData.state ? `, ${geoData.state}` : ""} {geoData.zip}</p>}
                    </div>
                    <p className="text-[10px] text-gray-400">You&apos;ll add prices on the next page.</p>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full px-2 py-1.5 bg-purple-600 text-white text-xs rounded font-medium hover:bg-purple-700 disabled:opacity-50"
                    >
                      {submitting ? "Adding..." : "Add Store & Report Price"}
                    </button>
                  </form>
                ) : (
                  <div className="text-xs text-center py-1">
                    <p className="text-gray-500">No business found at this location.</p>
                    <p className="text-[10px] text-gray-400 mt-1">Try tapping on or near a store.</p>
                  </div>
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

      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        {session && (
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              Tap map to add a store
            </p>
          </div>
        )}
        {onToggleExpand && (
          <button
            onClick={onToggleExpand}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700 transition-colors"
            title={isExpanded ? "Collapse map" : "Expand map"}
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            ) : (
              <Maximize2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
