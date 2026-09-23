"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StoreResult } from "@/lib/store";
import { useMapStore, PRODUCT_OPTIONS } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Maximize2, Minimize2, LocateFixed } from "lucide-react";
import { useSession } from "next-auth/react";

function getPriceColor(price: number | null | undefined): string {
  if (!price) return "#94a3b8";
  if (price <= 4.5) return "#16a34a";
  if (price <= 5.5) return "#f59e0b";
  return "#ef4444";
}

async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ name: string; address: string; city: string; state: string; zip: string }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "User-Agent": "ZynBuddy/1.0" } }
    );
    if (!res.ok) return { name: "", address: "", city: "", state: "", zip: "" };
    const data = await res.json();
    const name =
      data.name || data.address?.shop || data.address?.amenity || data.address?.building || "";
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
  onLocate?: () => void;
  locating?: boolean;
}

export default function MapView({
  stores,
  onStoreSelect,
  onStoreCreated,
  userPosition,
  isExpanded,
  onToggleExpand,
  onLocate,
  locating,
}: MapViewProps) {
  const center = useMapStore((s) => s.center);
  const zoom = useMapStore((s) => s.zoom);
  const productTypes = useMapStore((s) => s.productTypes);
  const setMapBounds = useMapStore((s) => s.setMapBounds);
  const { data: session } = useSession();
  const router = useRouter();

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const newStoreMarkerRef = useRef<maplibregl.Marker | null>(null);
  const prevViewKey = useRef("");
  const prevBoundsKey = useRef("");
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressStart = useRef<{ x: number; y: number } | null>(null);
  const openPopupStoreId = useRef<string | null>(null);

  const [clickedPos, setClickedPos] = useState<[number, number] | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geoData, setGeoData] = useState({ name: "", address: "", city: "", state: "", zip: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const submitRef = useRef<() => void>(() => {});

  // Keep submit handler ref current
  useEffect(() => {
    submitRef.current = async () => {
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
    };
  }, [clickedPos, session, geoData, onStoreCreated, router]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [center[1], center[0]],
      zoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    function updateBounds() {
      if (!map.current) return;
      const b = map.current.getBounds();
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

    map.current.on("load", updateBounds);
    map.current.on("moveend", updateBounds);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync center/zoom from zustand
  useEffect(() => {
    if (!map.current) return;
    const key = `${center[0]},${center[1]},${zoom}`;
    if (key === prevViewKey.current) return;
    prevViewKey.current = key;
    map.current.flyTo({ center: [center[1], center[0]], zoom, duration: 800 });
  }, [center, zoom]);

  // Long press handler
  useEffect(() => {
    if (!map.current || !session) return;
    const m = map.current;
    const canvas = m.getCanvasContainer();
    const HOLD_MS = 500;
    const MOVE_THRESHOLD = 10;

    function onDown(e: MouseEvent | TouchEvent) {
      const point = "touches" in e ? e.touches[0] : e;
      longPressStart.current = { x: point.clientX, y: point.clientY };
      longPressTimer.current = setTimeout(() => {
        if (!longPressStart.current || !map.current) return;
        const rect = canvas.getBoundingClientRect();
        const lngLat = map.current.unproject([
          longPressStart.current.x - rect.left,
          longPressStart.current.y - rect.top,
        ]);
        handleMapLongPress(lngLat.lat, lngLat.lng);
        longPressStart.current = null;
      }, HOLD_MS);
    }

    function onMove(e: MouseEvent | TouchEvent) {
      if (!longPressStart.current || !longPressTimer.current) return;
      const point = "touches" in e ? e.touches[0] : e;
      const dx = point.clientX - longPressStart.current.x;
      const dy = point.clientY - longPressStart.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > MOVE_THRESHOLD) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
        longPressStart.current = null;
      }
    }

    function onUp() {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      longPressStart.current = null;
    }

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onUp);
    canvas.addEventListener("touchstart", onDown, { passive: true });
    canvas.addEventListener("touchmove", onMove, { passive: true });
    canvas.addEventListener("touchend", onUp);

    return () => {
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("touchstart", onDown);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onUp);
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMapLongPress = useCallback(
    async (lat: number, lng: number) => {
      if (!session) return;
      setClickedPos([lat, lng]);
      setMessage("");
      setGeocoding(true);
      setGeoData({ name: "", address: "", city: "", state: "", zip: "" });
      const geo = await reverseGeocode(lat, lng);
      setGeoData(geo);
      setGeocoding(false);
    },
    [session]
  );

  // New-store marker + popup
  useEffect(() => {
    if (!map.current) return;

    if (newStoreMarkerRef.current) {
      newStoreMarkerRef.current.remove();
      newStoreMarkerRef.current = null;
    }
    if (!clickedPos) return;

    const el = document.createElement("div");
    el.innerHTML = `<div style="
      background:#8b5cf6;color:white;border-radius:50%;width:36px;height:36px;
      display:flex;align-items:center;justify-content:center;font-size:20px;
      font-weight:bold;border:3px solid white;box-shadow:0 2px 12px rgba(139,92,246,0.5);
      cursor:pointer;
    ">+</div>`;

    const popupNode = document.createElement("div");
    popupNode.style.fontFamily = "system-ui";
    popupNode.style.minWidth = "200px";

    const title = document.createElement("h3");
    title.textContent = "Add New Store";
    title.style.cssText = "font-weight:700;font-size:13px;margin:0 0 6px";
    popupNode.appendChild(title);

    if (geocoding) {
      const p = document.createElement("p");
      p.textContent = "Looking up location...";
      p.style.cssText = "font-size:11px;color:#999;text-align:center;padding:8px 0";
      popupNode.appendChild(p);
    } else if (geoData.name) {
      const nameP = document.createElement("p");
      nameP.textContent = geoData.name;
      nameP.style.cssText = "font-weight:600;color:#1f2937;font-size:11px;margin:0";
      popupNode.appendChild(nameP);

      const addrP = document.createElement("p");
      addrP.textContent =
        geoData.address || `${clickedPos[0].toFixed(4)}, ${clickedPos[1].toFixed(4)}`;
      addrP.style.cssText = "color:#6b7280;font-size:11px;margin:2px 0";
      popupNode.appendChild(addrP);

      if (geoData.city) {
        const cityP = document.createElement("p");
        cityP.textContent = `${geoData.city}${geoData.state ? `, ${geoData.state}` : ""} ${geoData.zip}`;
        cityP.style.cssText = "color:#6b7280;font-size:11px;margin:2px 0";
        popupNode.appendChild(cityP);
      }

      const hint = document.createElement("p");
      hint.textContent = "You'll add prices on the next page.";
      hint.style.cssText = "font-size:9px;color:#999;margin:6px 0 4px";
      popupNode.appendChild(hint);

      const btn = document.createElement("button");
      btn.textContent = submitting ? "Adding..." : "Add Store & Report Price";
      btn.disabled = submitting;
      btn.style.cssText =
        "width:100%;padding:6px;background:#7c3aed;color:white;font-size:11px;font-weight:500;border:none;border-radius:4px;cursor:pointer";
      btn.addEventListener("click", () => submitRef.current());
      popupNode.appendChild(btn);

      if (message) {
        const msgP = document.createElement("p");
        msgP.textContent = message;
        msgP.style.cssText = `font-size:9px;margin-top:4px;color:${message.includes("Failed") ? "#ef4444" : "#16a34a"}`;
        popupNode.appendChild(msgP);
      }
    } else {
      const noP = document.createElement("p");
      noP.textContent = "No business found at this location.";
      noP.style.cssText = "color:#6b7280;font-size:11px;text-align:center;margin:4px 0";
      popupNode.appendChild(noP);
      const hintP = document.createElement("p");
      hintP.textContent = "Try tapping on or near a store.";
      hintP.style.cssText = "font-size:9px;color:#999;text-align:center;margin:2px 0";
      popupNode.appendChild(hintP);
    }

    const popup = new maplibregl.Popup({ offset: 20, maxWidth: "260px" }).setDOMContent(popupNode);
    popup.on("close", () => {
      setClickedPos(null);
      setGeoData({ name: "", address: "", city: "", state: "", zip: "" });
      setMessage("");
    });

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([clickedPos[1], clickedPos[0]])
      .setPopup(popup)
      .addTo(map.current);

    marker.togglePopup();
    newStoreMarkerRef.current = marker;
  }, [clickedPos, geocoding, geoData, submitting, message]);

  // Store markers
  useEffect(() => {
    if (!map.current) return;
    const reopenId = openPopupStoreId.current;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const detailLink = (storeId: string) => {
      const base = `/store/${storeId}`;
      if (productTypes.length > 0) return `${base}?productTypes=${productTypes.join(",")}`;
      return base;
    };

    for (const store of stores) {
      const price = store.latestPrice?.pricePerCan;
      const color = getPriceColor(price);
      const label = price ? `$${price.toFixed(2)}` : "N/A";

      const el = document.createElement("div");
      el.style.cursor = "pointer";
      el.innerHTML = `<div style="
        background:${color};color:white;border-radius:24px;padding:5px 10px;
        font-size:12px;font-weight:700;white-space:nowrap;border:2px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);text-align:center;letter-spacing:-0.3px;
      ">${label}</div>`;

      const popup = new maplibregl.Popup({ offset: 20, maxWidth: "240px" }).setHTML(`
        <div style="font-family:system-ui;min-width:180px">
          <strong style="font-size:13px">${store.name}</strong>
          <p style="font-size:11px;color:#666;margin:2px 0">${store.address}</p>
          ${
            price
              ? `<span style="font-size:16px;font-weight:700;color:${color}">$${price.toFixed(2)}</span><span style="font-size:11px;color:#999">/can</span>`
              : '<span style="font-size:11px;color:#999">No prices reported</span>'
          }
          ${store.latestPrice?.dealDescription ? `<p style="font-size:11px;color:#16a34a;margin-top:4px">${store.latestPrice.dealDescription}</p>` : ""}
          <a href="${detailLink(store.id)}" style="font-size:11px;color:#2563eb;display:block;margin-top:4px">View Details &rarr;</a>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([store.longitude, store.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      popup.on("close", () => {
        if (openPopupStoreId.current === store.id) openPopupStoreId.current = null;
      });

      el.addEventListener("click", () => {
        onStoreSelect(store);
        openPopupStoreId.current = store.id;
        marker.togglePopup();
      });

      if (reopenId === store.id) {
        openPopupStoreId.current = store.id;
        marker.togglePopup();
      }

      markersRef.current.push(marker);
    }
  }, [stores, productTypes, onStoreSelect]);

  // User position marker
  useEffect(() => {
    if (!map.current) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (!userPosition) return;

    const el = document.createElement("div");
    el.innerHTML = `<div style="
      width:16px;height:16px;background:#3b82f6;border:3px solid white;border-radius:50%;
      box-shadow:0 0 0 2px rgba(59,130,246,0.3),0 2px 4px rgba(0,0,0,0.2);
    "></div>`;

    userMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([userPosition[1], userPosition[0]])
      .addTo(map.current);
  }, [userPosition]);

  // Resize map when container changes (expand/collapse)
  useEffect(() => {
    if (!map.current) return;
    const t = setTimeout(() => map.current?.resize(), 100);
    return () => clearTimeout(t);
  }, [isExpanded]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={mapContainer}
        className="h-full w-full rounded-2xl shadow-inner"
        style={{ minHeight: "300px" }}
      />

      <div className="absolute top-3 right-14 z-10 flex items-center gap-2">
        {session && (
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              Hold on map to add a store
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

      {onLocate && (
        <button
          onClick={onLocate}
          className={`absolute bottom-4 right-4 z-10 p-2.5 rounded-xl shadow-lg border transition-all ${
            locating
              ? "bg-green-50 border-green-500 animate-pulse"
              : "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-700"
          }`}
          title="Go to my location"
        >
          <LocateFixed
            className={`h-5 w-5 ${locating ? "text-green-500" : "text-gray-600 dark:text-gray-300"}`}
          />
        </button>
      )}
    </div>
  );
}
