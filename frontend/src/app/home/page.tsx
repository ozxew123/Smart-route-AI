"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Mic,
  Search,
  Bike,
  Car,
  CloudSun,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Clock,
  MapPin,
  Compass,
  ArrowRight
} from "lucide-react";

// Import MapComponent dynamically without SSR
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-100 rounded-2xl text-slate-400 font-medium text-sm">
      <RotateCw className="w-5 h-5 animate-spin mr-2" />
      Memuat Peta Navigasi...
    </div>
  ),
});

function HomeContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [vehicle, setVehicle] = useState<"motor" | "mobil">("motor");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: string; text: string } | null>(null);

  // Result state from backend
  const [resultData, setResultData] = useState<{
    route?: {
      coordinates: [number, number][];
      distance_km: number;
      duration_min: number;
      origin: { lat: number; lon: number };
      midpoint: { lat: number; lon: number };
      destination: { lat: number; lon: number };
    };
    weather?: {
      origin: { name: string; temp: number; description: string; icon: string };
      midpoint: { name: string; temp: number; description: string; icon: string };
      destination: { name: string; temp: number; description: string; icon: string };
    };
    risk?: {
      level: string;
      color: string;
      title: string;
      reasons: string[];
    };
    advice?: string;
    entities?: {
      origin: string;
      destination: string;
      vehicle: string;
    };
  } | null>(null);

  // Handle URL query parameters for repeating search
  useEffect(() => {
    const qParam = searchParams.get("q") || searchParams.get("query");
    const vehParam = searchParams.get("vehicle");
    const autoParam = searchParams.get("auto");

    if (qParam) {
      setQuery(decodeURIComponent(qParam));
      if (vehParam === "motor" || vehParam === "mobil") {
        setVehicle(vehParam);
      }

      if (autoParam === "1" || autoParam === "true") {
        setTimeout(() => {
          handleExecuteRoute(decodeURIComponent(qParam), (vehParam as "motor" | "mobil") || "motor");
        }, 500);
      }
    }
  }, [searchParams]);

  // Voice Recognition (Web Speech API)
  const toggleVoice = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Browser Anda tidak mendukung Web Speech API. Gunakan Google Chrome atau Edge.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "id-ID";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  const handleExecuteRoute = async (searchQuery: string, searchVehicle: "motor" | "mobil") => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setAlertMessage(null);

    try {
      const resp = await fetch("/api/process-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, vehicle: searchVehicle }),
      });

      const data = await resp.json();

      if (!data.success) {
        setAlertMessage({
          type: "warning",
          text: data.message || "Gagal memproses rute perjalanan.",
        });
        return;
      }

      setResultData(data);
    } catch (err) {
      console.error("API error:", err);
      setAlertMessage({
        type: "danger",
        text: "Terjadi gangguan koneksi ke server Flask backend. Pastikan server Flask aktif di port 5000.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteRoute(query, vehicle);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-lg text-slate-900 tracking-tight">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-sm">
              <Image src="/images/logo.png" alt="SmartRoute Logo" fill className="object-cover" />
            </div>
            <span>SmartRoute AI</span>
          </Link>

          <nav className="flex items-center gap-5 text-sm font-semibold">
            <Link href="/home" className="text-sky-600 border-b-2 border-sky-600 pb-1">
              Rencana Rute
            </Link>
            <Link href="/history" className="text-slate-600 hover:text-sky-600 transition-colors">
              Riwayat
            </Link>
            <Link href="/login" className="text-slate-600 hover:text-sky-600 transition-colors">
              Masuk
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Input Form & Advisory Cards (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            
            {/* Input Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h5 className="font-extrabold text-slate-900 text-lg mb-1 flex items-center gap-2">
                <Compass className="w-5 h-5 text-sky-600" />
                <span>Asisten Rute & Cuaca</span>
              </h5>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Tuliskan perintah dalam bahasa sehari-hari atau gunakan tombol mikrofon untuk input suara.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Contoh: Dari Depok ke Tebet naik motor hindari jalan licin..."
                      required
                      className="w-full text-sm font-medium bg-slate-50 border border-slate-200 rounded-2xl p-3.5 pr-12 focus:bg-white focus:border-sky-500 outline-none transition-all resize-none"
                    />
                    <button
                      type="button"
                      onClick={toggleVoice}
                      title="Gunakan Input Suara (Web Speech API)"
                      className={`absolute right-3 top-3 p-2 rounded-xl border transition-colors ${
                        isRecording
                          ? "bg-rose-50 text-rose-600 border-rose-300 animate-pulse"
                          : "bg-white text-slate-500 border-slate-200 hover:text-rose-600"
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                  {isRecording && (
                    <span className="text-[11px] text-rose-600 font-semibold mt-1 inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      Mendengarkan suara Anda...
                    </span>
                  )}
                </div>

                {/* Vehicle Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">Moda Kendaraan:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setVehicle("motor")}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                        vehicle === "motor"
                          ? "bg-sky-50 text-sky-700 border-sky-300 shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Bike className="w-4 h-4" />
                      <span>Sepeda Motor</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVehicle("mobil")}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold border transition-all ${
                        vehicle === "mobil"
                          ? "bg-amber-50 text-amber-700 border-amber-300 shadow-sm"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Car className="w-4 h-4" />
                      <span>Mobil Pribadi</span>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-2xl shadow-md shadow-sky-600/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Menganalisis Rute & Cuaca...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Analisis Rute & Cuaca</span>
                    </>
                  )}
                </button>
              </form>

              {/* Status Alert */}
              {alertMessage && (
                <div
                  className={`mt-4 p-3 rounded-xl text-xs font-medium border ${
                    alertMessage.type === "danger"
                      ? "bg-rose-50 text-rose-800 border-rose-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {alertMessage.text}
                </div>
              )}
            </div>

            {/* AI Safety Advisor Card (Visible when result exists) */}
            {resultData && resultData.advice && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h6 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>AI Safety Advisor</span>
                  </h6>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      resultData.risk?.level === "tinggi"
                        ? "bg-rose-100 text-rose-700"
                        : resultData.risk?.level === "sedang"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    Risiko: {resultData.risk?.level || "Normal"}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  {resultData.advice}
                </p>
              </div>
            )}

            {/* Route Summary Card */}
            {resultData && resultData.route && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h6 className="font-extrabold text-slate-900 text-sm mb-3">Ringkasan Jalur OSRM</h6>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Total Jarak:</span>
                    <strong className="text-slate-900">{resultData.route.distance_km} km</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Estimasi Waktu:</span>
                    <strong className="text-slate-900">~{resultData.route.duration_min} menit</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Moda Transportasi:</span>
                    <strong className="text-slate-900 capitalize">{vehicle}</strong>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: 3-Point Weather Badges + Leaflet Map (col-span-7) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* 3-Point Weather Telemetry Row (Shown when weather exists) */}
            {resultData && resultData.weather && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Origin */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm border-l-4 border-l-emerald-500">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                    Titik Awal
                  </span>
                  <div className="font-bold text-slate-900 text-xs truncate">
                    {resultData.weather.origin.name || "Lokasi Asal"}
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xs text-slate-500 capitalize">
                      {resultData.weather.origin.description}
                    </span>
                    <span className="font-extrabold text-slate-900 text-base">
                      {resultData.weather.origin.temp}°C
                    </span>
                  </div>
                </div>

                {/* Midpoint */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm border-l-4 border-l-amber-500">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-1">
                    Titik Tengah (Midpoint)
                  </span>
                  <div className="font-bold text-slate-900 text-xs truncate">
                    {resultData.weather.midpoint.name || "Titik Tengah"}
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xs text-slate-500 capitalize">
                      {resultData.weather.midpoint.description}
                    </span>
                    <span className="font-extrabold text-slate-900 text-base">
                      {resultData.weather.midpoint.temp}°C
                    </span>
                  </div>
                </div>

                {/* Destination */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm border-l-4 border-l-rose-500">
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block mb-1">
                    Titik Akhir
                  </span>
                  <div className="font-bold text-slate-900 text-xs truncate">
                    {resultData.weather.destination.name || "Lokasi Tujuan"}
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-xs text-slate-500 capitalize">
                      {resultData.weather.destination.description}
                    </span>
                    <span className="font-extrabold text-slate-900 text-base">
                      {resultData.weather.destination.temp}°C
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Leaflet Map Canvas */}
            <div className="bg-white border border-slate-200 rounded-3xl p-3 shadow-sm h-[560px] overflow-hidden">
              <MapComponent
                routeGeometry={resultData?.route?.coordinates}
                originCoords={
                  resultData?.route?.origin
                    ? {
                        lat: resultData.route.origin.lat,
                        lon: resultData.route.origin.lon,
                        name: resultData.entities?.origin,
                      }
                    : undefined
                }
                midpointCoords={
                  resultData?.route?.midpoint
                    ? {
                        lat: resultData.route.midpoint.lat,
                        lon: resultData.route.midpoint.lon,
                        name: "Titik Tengah Jalur (OSRM)",
                      }
                    : undefined
                }
                destCoords={
                  resultData?.route?.destination
                    ? {
                        lat: resultData.route.destination.lat,
                        lon: resultData.route.destination.lon,
                        name: resultData.entities?.destination,
                      }
                    : undefined
                }
              />
            </div>

          </div>

        </div>
      </main>

    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Memuat Rencana Rute...</div>}>
      <HomeContent />
    </Suspense>
  );
}

