"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface Store {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  latestPrice?: { pricePerCan: number; dealDescription?: string | null } | null;
}

const CENTER: [number, number] = [-111.6444, 33.3213]; // 85212 Mesa AZ [lng, lat]

function getPriceColor(price: number | null | undefined): string {
  if (!price) return "#94a3b8";
  if (price <= 4.5) return "#16a34a";
  if (price <= 5.5) return "#f59e0b";
  return "#ef4444";
}

export default function Test1Page() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [query, setQuery] = useState("");
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: CENTER,
      zoom: 12,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");
    map.current.addControl(
      new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }),
      "bottom-right"
    );
    map.current.on("load", () => setMapReady(true));

    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const m = map.current!;
    const c = m.getCenter();
    fetch(`/api/stores/search?lat=${c.lat}&lng=${c.lng}&radius=10&sort=distance`)
      .then((r) => r.json())
      .then((d) => setStores(d.stores || []))
      .catch(() => {});
  }, [mapReady]);

  useEffect(() => {
    if (!map.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const store of stores) {
      const price = store.latestPrice?.pricePerCan;
      const color = getPriceColor(price);
      const label = price ? `$${price.toFixed(2)}` : "N/A";

      const el = document.createElement("div");
      el.innerHTML = `<div style="background:${color};color:white;border-radius:24px;padding:4px 8px;font-size:11px;font-weight:700;white-space:nowrap;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer">${label}</div>`;

      const popup = new maplibregl.Popup({ offset: 20 }).setHTML(`
        <div style="font-family:system-ui;min-width:180px">
          <strong style="font-size:13px">${store.name}</strong>
          <p style="font-size:11px;color:#666;margin:2px 0">${store.address}</p>
          ${price ? `<span style="font-size:16px;font-weight:700;color:${color}">$${price.toFixed(2)}</span><span style="font-size:11px;color:#999">/can</span>` : '<span style="font-size:11px;color:#999">No prices reported</span>'}
          ${store.latestPrice?.dealDescription ? `<p style="font-size:11px;color:#16a34a;margin-top:4px">${store.latestPrice.dealDescription}</p>` : ""}
          <a href="/store/${store.id}" style="font-size:11px;color:#2563eb;display:block;margin-top:4px">View Details &rarr;</a>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([store.longitude, store.latitude])
        .setPopup(popup)
        .addTo(map.current!);
      markersRef.current.push(marker);
    }
  }, [stores]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || !map.current) return;
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=3&lang=en`, { headers: { "User-Agent": "ZynBuddy/1.0" } });
      const data = await res.json();
      const us = data.features?.filter((f: Record<string, unknown>) => (f.properties as Record<string, unknown>)?.countrycode === "US");
      if (us?.length) {
        const [lng, lat] = us[0].geometry.coordinates;
        map.current.flyTo({ center: [lng, lat], zoom: 14 });
        fetch(`/api/stores/search?lat=${lat}&lng=${lng}&radius=10&sort=distance`)
          .then((r) => r.json())
          .then((d) => setStores(d.stores || []));
      }
    } catch {}
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", background: "#16a34a", display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ color: "white", fontWeight: 700, fontSize: 14, marginRight: 8 }}>Test 1: MapLibre GL + OSM Raster</span>
        <form onSubmit={handleSearch} style={{ flex: 1, display: "flex", gap: 8 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search address..."
            style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "none", fontSize: 14 }}
          />
          <button type="submit" style={{ padding: "8px 16px", background: "white", color: "#16a34a", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Go</button>
        </form>
        <a href="/test2" style={{ color: "white", fontSize: 12, textDecoration: "underline" }}>Test 2 &rarr;</a>
        <a href="/" style={{ color: "white", fontSize: 12, textDecoration: "underline" }}>Main &rarr;</a>
      </div>
      <div ref={mapContainer} style={{ flex: 1 }} />
      <div style={{ padding: "6px 16px", background: "#f1f5f9", fontSize: 11, color: "#64748b", textAlign: "center" }}>
        MapLibre GL JS + OpenStreetMap raster tiles &bull; {stores.length} stores loaded
      </div>
    </div>
  );
}
