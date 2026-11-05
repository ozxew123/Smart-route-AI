"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";

interface MapProps {
  routeGeometry?: [number, number][];
  originCoords?: { lat: number; lon: number; name?: string };
  midpointCoords?: { lat: number; lon: number; name?: string };
  destCoords?: { lat: number; lon: number; name?: string };
}

export default function MapComponent({
  routeGeometry,
  originCoords,
  midpointCoords,
  destCoords
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Inisialisasi peta Jabodetabek default
    const map = L.map(mapContainerRef.current).setView([-6.3686, 106.8331], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Custom marker icon helper
    const createPin = (color: string, label: string) =>
      L.divIcon({
        className: "custom-div-icon",
        html: `
          <div style="
            background-color: ${color};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: bold;
          ">
            ${label}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

    // 1. Gambar Route Polyline jika ada
    if (routeGeometry && routeGeometry.length > 0) {
      const polyline = L.polyline(routeGeometry, {
        color: "#0284C7",
        weight: 5,
        opacity: 0.85,
      }).addTo(layerGroup);

      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    }

    // 2. Tambahkan Pin Titik Awal (Hijau)
    if (originCoords) {
      L.marker([originCoords.lat, originCoords.lon], {
        icon: createPin("#10B981", "A"),
      })
        .bindPopup(`<strong>Titik Awal:</strong> ${originCoords.name || "Asal"}`)
        .addTo(layerGroup);
    }

    // 3. Tambahkan Pin Titik Tengah (Kuning/Oranye)
    if (midpointCoords) {
      L.marker([midpointCoords.lat, midpointCoords.lon], {
        icon: createPin("#F59E0B", "M"),
      })
        .bindPopup(`<strong>Titik Tengah:</strong> ${midpointCoords.name || "Midpoint"}`)
        .addTo(layerGroup);
    }

    // 4. Tambahkan Pin Titik Akhir (Merah)
    if (destCoords) {
      L.marker([destCoords.lat, destCoords.lon], {
        icon: createPin("#EF4444", "B"),
      })
        .bindPopup(`<strong>Titik Akhir:</strong> ${destCoords.name || "Tujuan"}`)
        .addTo(layerGroup);
    }
  }, [routeGeometry, originCoords, midpointCoords, destCoords]);

  return <div ref={mapContainerRef} className="w-full h-full min-h-[500px] rounded-2xl z-0" />;
}

