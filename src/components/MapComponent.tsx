"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";

interface WeatherPoint {
  temp?: number;
  temp_c?: number;
  condition?: string;
  description?: string;
  reference_time?: string;
}

interface MapProps {
  routeGeometry?: [number, number][];
  originCoords?: { lat: number; lon: number; name?: string; weather?: WeatherPoint };
  midpointCoords?: { lat: number; lon: number; name?: string; weather?: WeatherPoint };
  destCoords?: { lat: number; lon: number; name?: string; weather?: WeatherPoint };
  pitstop?: {
    needed: boolean;
    shelter_name: string;
    distance_before_km: number;
    advice: string;
    coords: { lat: number; lon: number } | null;
  } | null;
}

export default function MapComponent({
  routeGeometry,
  originCoords,
  midpointCoords,
  destCoords,
  pitstop,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Inisialisasi peta Jabodetabek default dengan Canvas Renderer cepat
    const map = L.map(mapContainerRef.current, {
      preferCanvas: true,
      zoomControl: true,
    }).setView([-6.3686, 106.8331], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18,
      keepBuffer: 2,
      updateWhenIdle: true,
      updateWhenZooming: false,
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

    // Bersihkan layer sebelumnya agar TIDAK merender rute palsu jika gagal (NFR & AC 3)
    layerGroup.clearLayers();

    // Custom marker icon helper (FR-02)
    const createPin = (color: string, label: string) =>
      L.divIcon({
        className: "custom-div-icon",
        html: `
          <div style="
            background-color: ${color};
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: 800;
          ">
            ${label}
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

    // 1. Gambar Route Polyline jika ada (FR-02)
    if (routeGeometry && routeGeometry.length > 0) {
      const polyline = L.polyline(routeGeometry, {
        color: "#0284C7",
        weight: 5,
        opacity: 0.85,
      }).addTo(layerGroup);

      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    }

    // 2. Tambahkan Pin Titik Awal (Hijau) (FR-02 & FR-04)
    if (originCoords) {
      const w = originCoords.weather;
      const tempStr = w ? `${w.temp_c || w.temp || 29}°C` : "";
      const descStr = w ? (w.description || "Cerah") : "";
      const timeStr = w ? (w.reference_time || "Acuan: Real-Time") : "";

      L.marker([originCoords.lat, originCoords.lon], {
        icon: createPin("#10B981", "A"),
      })
        .bindPopup(`
          <div style="min-width: 140px; font-family: sans-serif;">
            <span style="background: #ECFDF5; color: #059669; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">Titik Awal</span>
            <div style="font-weight: bold; margin-top: 4px; font-size: 13px;">${originCoords.name || "Lokasi Asal"}</div>
            ${tempStr ? `<div style="font-size: 12px; color: #475569; margin-top: 2px;">${tempStr} • ${descStr}</div>` : ""}
            ${timeStr ? `<div style="font-size: 11px; color: #64748B; margin-top: 2px;">🕒 ${timeStr}</div>` : ""}
          </div>
        `)
        .addTo(layerGroup);
    }

    // 3. Tambahkan Pin Titik Tengah (Sampling Cuaca) (Kuning/Oranye) (FR-02 & FR-04)
    if (midpointCoords) {
      const w = midpointCoords.weather;
      const tempStr = w ? `${w.temp_c || w.temp || 28}°C` : "";
      const descStr = w ? (w.description || "Berawan") : "";
      const timeStr = w ? (w.reference_time || "Acuan: Real-Time") : "";

      L.marker([midpointCoords.lat, midpointCoords.lon], {
        icon: createPin("#F59E0B", "M"),
      })
        .bindPopup(`
          <div style="min-width: 150px; font-family: sans-serif;">
            <span style="background: #FFFBEB; color: #D97706; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">Titik Tengah (Sampling Cuaca)</span>
            <div style="font-weight: bold; margin-top: 4px; font-size: 13px;">${midpointCoords.name || "Jalur Tengah"}</div>
            ${tempStr ? `<div style="font-size: 12px; color: #475569; margin-top: 2px;">${tempStr} • ${descStr}</div>` : ""}
            ${timeStr ? `<div style="font-size: 11px; color: #64748B; margin-top: 2px;">🕒 ${timeStr}</div>` : ""}
          </div>
        `)
        .addTo(layerGroup);
    }

    // 4. Tambahkan Pin Titik Akhir (Merah) (FR-02 & FR-04)
    if (destCoords) {
      const w = destCoords.weather;
      const tempStr = w ? `${w.temp_c || w.temp || 29}°C` : "";
      const descStr = w ? (w.description || "Cerah") : "";
      const timeStr = w ? (w.reference_time || "Acuan: Real-Time") : "";

      L.marker([destCoords.lat, destCoords.lon], {
        icon: createPin("#EF4444", "B"),
      })
        .bindPopup(`
          <div style="min-width: 140px; font-family: sans-serif;">
            <span style="background: #FEF2F2; color: #DC2626; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">Titik Akhir</span>
            <div style="font-weight: bold; margin-top: 4px; font-size: 13px;">${destCoords.name || "Lokasi Tujuan"}</div>
            ${tempStr ? `<div style="font-size: 12px; color: #475569; margin-top: 2px;">${tempStr} • ${descStr}</div>` : ""}
            ${timeStr ? `<div style="font-size: 11px; color: #64748B; margin-top: 2px;">🕒 ${timeStr}</div>` : ""}
          </div>
        `)
        .addTo(layerGroup);
    }

    // 5. Tambahkan Pin Khusus: Pitstop Jas Hujan Predictor (Ungu)
    if (pitstop && pitstop.needed && pitstop.coords) {
      L.marker([pitstop.coords.lat, pitstop.coords.lon], {
        icon: L.divIcon({
          className: "custom-div-icon",
          html: `
            <div style="
              background-color: #8B5CF6;
              width: 34px;
              height: 34px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 4px 14px rgba(139, 92, 246, 0.6);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              cursor: pointer;
            ">
              🧥
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
      })
        .bindPopup(`
          <div style="min-width: 180px; font-family: sans-serif;">
            <span style="background: #F5F3FF; color: #7C3AED; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px;">🧥 Rekomendasi Pitstop Jas Hujan</span>
            <div style="font-weight: bold; margin-top: 5px; font-size: 13px; color: #1E1B4B;">${pitstop.shelter_name}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4;">${pitstop.advice}</div>
          </div>
        `)
        .addTo(layerGroup);
    }
  }, [routeGeometry, originCoords, midpointCoords, destCoords, pitstop]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full min-h-[300px] sm:min-h-[440px] lg:min-h-[520px] rounded-2xl z-0 touch-pan-x"
    />
  );
}
