"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
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
  ArrowRight,
  MessageSquare,
  Navigation,
  CheckCircle,
  XCircle,
  HelpCircle,
  Sparkles
} from "lucide-react";
import UserNavDropdown from "@/components/UserNavDropdown";

// Import MapComponent dynamically without SSR (FR-02)
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] sm:min-h-[520px] flex items-center justify-center bg-slate-100 rounded-3xl text-slate-400 font-medium text-sm">
      <RotateCw className="w-5 h-5 animate-spin mr-2" />
      Memuat Peta Navigasi Leaflet...
    </div>
  ),
});

interface WeatherNode {
  name?: string;
  temp?: number;
  temp_c?: number;
  description?: string;
  condition?: string;
  icon?: string;
  reference_time?: string;
  is_available?: boolean;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [vehicle, setVehicle] = useState<"motor" | "mobil">("motor");
  const [plate, setPlate] = useState<"Ganjil" | "Genap">("Genap");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: string; text: string } | null>(null);

  // Proteksi halaman Navigator: harus login terlebih dahulu
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data?.authenticated) {
          router.replace("/login");
        }
      })
      .catch(() => {});
  }, [router]);

  // FR-06: State Modul Klarifikasi Asisten
  const [clarification, setClarification] = useState<{
    needed: boolean;
    message: string;
    missingOrigin: boolean;
    missingDest: boolean;
    extracted: { origin?: string; destination?: string; vehicle?: string };
  } | null>(null);
  const [clarificationInput, setClarificationInput] = useState("");

  // Result state from backend (FR-02, FR-03, FR-04, FR-05)
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
      origin: WeatherNode;
      midpoint: WeatherNode;
      destination: WeatherNode;
    };
    risk?: {
      risk_level?: string;
      level?: string;
      rain_detected?: boolean;
      rain_locations?: string[];
      primary_weather_icon?: string;
      missing_weather?: string[];
    };
    advice?: string;
    entities?: {
      origin: string;
      destination: string;
      vehicle: string;
      plate?: string;
    };
    pitstop?: {
      needed: boolean;
      shelter_name: string;
      distance_before_km: number;
      reason: string;
      advice: string;
      coords: { lat: number; lon: number } | null;
    };
    zero_tilang?: {
      status: "aman" | "waspada" | "perhatian";
      rule_type: string;
      title: string;
      message: string;
      restricted_zones: string[];
      safe_alternative_note: string;
      today_date_number: number;
      today_rule: "Ganjil" | "Genap";
      user_plate: "Ganjil" | "Genap";
      is_rush_hour: boolean;
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

  // Voice Recognition via Web Speech API (FR-01)
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
      console.error("Speech recognition error:", err);
      setIsRecording(false);
    }
  };

  const handleExecuteRoute = async (searchQuery: string, searchVehicle: "motor" | "mobil", searchPlate: "Ganjil" | "Genap" = plate) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setAlertMessage(null);
    setClarification(null);

    try {
      const resp = await fetch("/api/process-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, vehicle: searchVehicle, plate: searchPlate }),
      });

      const data = await resp.json();

      // FR-06: Tangani Modul Klarifikasi Asisten jika informasi belum lengkap
      if (!data.success && data.clarification_needed) {
        const extracted = data.extracted || {};
        setClarification({
          needed: true,
          message: data.message || "Mohon lengkapi informasi perjalanan Anda.",
          missingOrigin: !extracted.origin,
          missingDest: !extracted.destination,
          extracted
        });
        setResultData(null); // Jangan buat rute palsu (NFR & AC 3)
        return;
      }

      // NFR & AC 3: Penanganan Kegagalan Layanan Eksternal (Nominatim/OSRM)
      if (!data.success) {
        setResultData(null); // Jangan buat rute palsu!
        setAlertMessage({
          type: "warning",
          text: data.message || "Gagal memproses rute perjalanan. Layanan geocoding atau routing tidak menemukan lokasi.",
        });
        return;
      }

      // Validasi berhasil (AC 1)
      setResultData(data);
    } catch (err) {
      console.error("API error:", err);
      setResultData(null);
      setAlertMessage({
        type: "danger",
        text: "Terjadi gangguan koneksi saat memproses rute perjalanan. Silakan coba sesaat lagi.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteRoute(query, vehicle, plate);
  };

  // Submit klarifikasi tambahan dari pengguna (FR-06 & AC 2)
  const handleClarificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarification || !clarificationInput.trim()) return;

    let synthesizedQuery = "";
    if (clarification.missingOrigin && clarification.extracted.destination) {
      synthesizedQuery = `Dari ${clarificationInput.trim()} ke ${clarification.extracted.destination} naik ${vehicle}`;
    } else if (clarification.missingDest && clarification.extracted.origin) {
      synthesizedQuery = `Dari ${clarification.extracted.origin} ke ${clarificationInput.trim()} naik ${vehicle}`;
    } else {
      synthesizedQuery = clarificationInput.trim();
    }

    setQuery(synthesizedQuery);
    setClarification(null);
    setClarificationInput("");
    handleExecuteRoute(synthesizedQuery, vehicle, plate);
  };

  // Preset prompts
  const applyPreset = (presetText: string, presetVehicle: "motor" | "mobil" = "motor", presetPlate: "Ganjil" | "Genap" = plate) => {
    setQuery(presetText);
    setVehicle(presetVehicle);
    handleExecuteRoute(presetText, presetVehicle, presetPlate);
  };

  // Deteksi ikon cuaca relevan untuk Kartu AI Advisor (FR-05)
  const weatherIconCode =
    resultData?.risk?.primary_weather_icon ||
    resultData?.weather?.midpoint?.icon ||
    "01d";
  const weatherIconUrl = `https://openweathermap.org/img/wn/${weatherIconCode}@2x.png`;

  const riskLevelText = resultData?.risk?.risk_level || resultData?.risk?.level || "Rendah";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-[100] bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-lg text-slate-900 tracking-tight">
            <div className="relative w-8 h-8 rounded-xl bg-sky-50 p-1 border border-sky-100 overflow-hidden shadow-sm flex items-center justify-center">
              <Image src="/images/logo.png" alt="SmartRoute Logo" width={28} height={28} className="object-contain" />
            </div>
            <span>SmartRoute AI</span>
            <span className="text-[10px] font-bold bg-sky-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
              Navigator
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            <nav className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm font-semibold">
              <Link href="/home" className="text-sky-600 border-b-2 border-sky-600 pb-1 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                <span>Rencana Rute</span>
              </Link>
              <Link href="/history" className="text-slate-600 hover:text-sky-600 transition-colors flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Riwayat</span>
              </Link>
            </nav>
            <UserNavDropdown />
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          {/* ========================================================
               KOLOM KIRI: INPUT PINTAR, ASISTEN AI, KLARIFIKASI, RUTE
               ======================================================== */}
          <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-5">
            
            {/* FR-01: Panel Input Pintar (Teks & Suara) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h5 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <Compass className="w-5 h-5 text-sky-600" />
                  <span>Asisten Rute & Cuaca</span>
                </h5>
                <span className="text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-full">
                  Groq AI LPU
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3 sm:mb-4 leading-relaxed">
                Ketik instruksi rute dalam bahasa santai atau tekan tombol mikrofon untuk input suara.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <div>
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Contoh: Dari Margonda Depok ke Tebet Eco Park naik motor jangan lewat jalan licin..."
                      required
                      className="w-full text-base sm:text-sm font-medium bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 pr-12 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all resize-none"
                    />
                    <button
                      type="button"
                      onClick={toggleVoice}
                      title="Gunakan Input Suara (Web Speech API)"
                      className={`absolute right-3 top-3 p-2 rounded-xl border transition-all ${
                        isRecording
                          ? "bg-rose-500 text-white border-rose-600 animate-pulse shadow-md"
                          : "bg-white text-slate-500 border-slate-200 hover:text-sky-600 hover:bg-sky-50"
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                  {isRecording && (
                    <span className="text-[11px] text-rose-600 font-semibold mt-1.5 inline-flex items-center gap-1.5 animate-fadeIn">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      Mendengarkan suara Anda via Web Speech API...
                    </span>
                  )}
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Contoh Cepat Skenario:
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => applyPreset("Dari Margonda Depok ke Tebet Eco Park naik motor", "motor")}
                      className="text-[11px] font-semibold bg-slate-50 hover:bg-sky-50 hover:text-sky-700 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full transition"
                    >
                      🏍️ Margonda ➔ Tebet
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("Kampus D Margonda ke Bundaran HI naik motor", "motor")}
                      className="text-[11px] font-semibold bg-slate-50 hover:bg-sky-50 hover:text-sky-700 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full transition"
                    >
                      🏍️ Depok ➔ Bundaran HI
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("Dari Cibubur ke Monas Jakarta Pusat bawa mobil", "mobil")}
                      className="text-[11px] font-semibold bg-slate-50 hover:bg-sky-50 hover:text-sky-700 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full transition"
                    >
                      🚗 Cibubur ➔ Monas
                    </button>
                  </div>
                </div>

                {/* Moda Kendaraan (Focus: Pengendara Sepeda Motor) */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Moda Kendaraan:</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setVehicle("motor")}
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
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
                      className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
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

                {/* Zero-Tilang: Opsi Plat Nomor (Ganjil-Genap) */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Zero-Tilang (Plat Nomor):</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Aturan Ganjil-Genap Jakarta
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPlate("Ganjil")}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                        plate === "Ganjil"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm ring-1 ring-emerald-300"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Plat Ganjil (1, 3, 5, 7, 9)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlate("Genap")}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                        plate === "Genap"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm ring-1 ring-emerald-300"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      Plat Genap (0, 2, 4, 6, 8)
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-sky-600/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-60"
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

              {/* Status Alert Error (NFR & AC 3) */}
              {alertMessage && (
                <div
                  className={`mt-4 p-3 rounded-xl text-xs font-medium border flex items-start gap-2.5 ${
                    alertMessage.type === "danger"
                      ? "bg-rose-50 text-rose-800 border-rose-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{alertMessage.text}</span>
                </div>
              )}
            </div>

            {/* ========================================================
                 FR-06: MODUL KLARIFIKASI ASISTEN (AC 2)
                 Jika input ambigu / belum lengkap, asisten meminta lokasi asal/tujuan
                 ======================================================== */}
            {clarification && (
              <div className="bg-sky-50 border-1.5 border-sky-200 rounded-3xl p-5 shadow-sm animate-fadeIn">
                <div className="flex items-center gap-2.5 mb-2 text-sky-800">
                  <div className="w-8 h-8 rounded-full bg-sky-600 text-white flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h6 className="font-extrabold text-sm text-slate-900 mb-0">Asisten SmartRoute Butuh Klarifikasi</h6>
                    <span className="text-[11px] text-sky-700">FR-06 Dialog Klarifikasi Rute</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 mb-3 leading-relaxed">
                  {clarification.missingOrigin && clarification.extracted.destination ? (
                    <>
                      Saya menangkap tujuan perjalanan Anda ke{" "}
                      <strong className="text-slate-900">"{clarification.extracted.destination}"</strong>, namun{" "}
                      <strong className="text-rose-600">titik awal keberangkatan</strong> belum Anda sebutkan. Mohon lengkapi lokasi asal Anda:
                    </>
                  ) : clarification.missingDest && clarification.extracted.origin ? (
                    <>
                      Saya mendeteksi titik awal dari{" "}
                      <strong className="text-slate-900">"{clarification.extracted.origin}"</strong>, namun lokasi tujuan belum Anda sebutkan. Mau pergi ke mana?
                    </>
                  ) : (
                    clarification.message
                  )}
                </p>

                <form onSubmit={handleClarificationSubmit} className="space-y-2.5">
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={clarificationInput}
                      onChange={(e) => setClarificationInput(e.target.value)}
                      placeholder={
                        clarification.missingOrigin
                          ? "Ketik lokasi awal Anda (cth: Margonda, Depok / Stasiun UI)"
                          : "Ketik lokasi tujuan (cth: Tebet Eco Park, Jakarta)"
                      }
                      className="w-full text-base sm:text-xs font-semibold pl-3.5 pr-20 py-2.5 rounded-xl border border-sky-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setClarificationInput("Margonda, Depok (GPS)")}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-700 text-[10px] font-bold transition flex items-center gap-1"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>GPS</span>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Lanjutkan Analisis Rute</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setClarification(null)}
                      className="py-2 px-3 bg-white border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ========================================================
                 FR-05: KARTU AI ADVISOR (SARAN KESELAMATAN + IKON CUACA)
                 ======================================================== */}
            {resultData && resultData.advice && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm animate-fadeIn">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h6 className="font-extrabold text-slate-900 text-sm mb-0">AI Safety Advisor</h6>
                      <span className="text-[10px] text-slate-400">Rekomendasi Keselamatan Komuter</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      riskLevelText.toLowerCase().includes("tinggi")
                        ? "bg-rose-100 text-rose-700 border border-rose-200"
                        : riskLevelText.toLowerCase().includes("sedang")
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    Risiko: {riskLevelText}
                  </span>
                </div>

                {/* Ikon Cuaca yang Relevan (FR-05) */}
                <div className="p-3 bg-slate-50 rounded-2xl mb-3 border border-slate-200/80 flex items-center gap-3">
                  <img
                    src={weatherIconUrl}
                    alt="Ikon Cuaca"
                    className="w-12 h-12 flex-shrink-0 object-contain drop-shadow"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {resultData.risk?.rain_detected
                        ? "⚠️ Terpantau Potensi Hujan di Rute"
                        : "☀️ Cuaca Kondusif & Terang"}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {resultData.risk?.rain_locations && resultData.risk.rain_locations.length > 0
                        ? `Area Hujan: ${resultData.risk.rain_locations.join(", ")}`
                        : "Tidak ada badai ekstrem terdeteksi"}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-sky-50/50 p-3.5 rounded-2xl border border-sky-100">
                  {resultData.advice}
                </p>
              </div>
            )}

            {/* ========================================================
                 FITUR 1: 🧥 JAS HUJAN PITSTOP PREDICTOR
                 ======================================================== */}
            {resultData?.pitstop?.needed && (
              <div className="bg-gradient-to-br from-violet-50 to-purple-50/60 border border-violet-200 rounded-3xl p-5 sm:p-6 shadow-sm animate-fadeIn">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      🧥
                    </div>
                    <div>
                      <h6 className="font-extrabold text-slate-900 text-sm mb-0">
                        Jas Hujan Pitstop Predictor
                      </h6>
                      <span className="text-[10px] text-violet-700 font-semibold">
                        Fitur Proteksi Pemotor Sebelum Kehujanan
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-violet-100 text-violet-800 border border-violet-300 px-2.5 py-1 rounded-full uppercase">
                    Pitstop Aktif
                  </span>
                </div>

                <div className="bg-white/90 rounded-2xl p-3.5 border border-violet-100 mb-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Rekomendasi Titik Singgah:</span>
                    <strong className="text-violet-950 text-right">{resultData.pitstop.shelter_name}</strong>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Jarak Sebelum Titik Hujan:</span>
                    <span className="font-bold text-violet-700">± {resultData.pitstop.distance_before_km} km</span>
                  </div>
                  <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-violet-600 flex-shrink-0" />
                    <span>Pin bertanda <strong>🧥 ungu</strong> telah ditandai pada peta navigasi.</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-violet-100/60 p-3 rounded-xl border border-violet-200/60">
                  {resultData.pitstop.advice}
                </p>
              </div>
            )}

            {/* ========================================================
                 FITUR 2: 🛵 ZERO-TILANG & JALUR AMAN MOTOR / GANJIL-GENAP
                 ======================================================== */}
            {resultData?.zero_tilang && (
              <div
                className={`border rounded-3xl p-5 sm:p-6 shadow-sm animate-fadeIn ${
                  resultData.zero_tilang.status === "waspada"
                    ? "bg-amber-50/80 border-amber-200"
                    : "bg-emerald-50/70 border-emerald-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm ${
                        resultData.zero_tilang.status === "waspada" ? "bg-amber-500" : "bg-emerald-600"
                      }`}
                    >
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h6 className="font-extrabold text-slate-900 text-sm mb-0">
                        Zero-Tilang Guard
                      </h6>
                      <span
                        className={`text-[10px] font-semibold ${
                          resultData.zero_tilang.status === "waspada" ? "text-amber-700" : "text-emerald-700"
                        }`}
                      >
                        {resultData.zero_tilang.rule_type === "motor_guard"
                          ? "Filter Jalur Bebas Tilang & Non-JLNT"
                          : "Kepatuhan Ganjil-Genap Protokol"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      resultData.zero_tilang.status === "waspada"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    }`}
                  >
                    {resultData.zero_tilang.status.toUpperCase()}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-900 mb-1.5">
                  {resultData.zero_tilang.title}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed mb-3">
                  {resultData.zero_tilang.message}
                </p>

                {resultData.zero_tilang.safe_alternative_note && (
                  <div className="bg-white/90 rounded-2xl p-3 border border-slate-200 text-xs text-slate-800 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Rekomendasi Jalur Aman: </span>
                      <span>{resultData.zero_tilang.safe_alternative_note}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================
                 FR-03: INFORMASI DETAIL RUTE (OSRM ROUTING ENGINE)
                 Asal, Tujuan, Kendaraan, Jarak, dan Estimasi Waktu
                 ======================================================== */}
            {resultData && resultData.route && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm animate-fadeIn">
                <h6 className="font-extrabold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-sky-600" />
                  <span>Detail Rute Perjalanan (FR-03)</span>
                </h6>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Titik Awal (Origin):</span>
                    <strong className="text-slate-900 text-right">{resultData.entities?.origin || "-"}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Titik Tujuan (Destination):</span>
                    <strong className="text-slate-900 text-right">{resultData.entities?.destination || "-"}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Total Jarak Tempuh:</span>
                    <strong className="text-sky-600 font-extrabold">{resultData.route.distance_km} km</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Estimasi Waktu Tempuh:</span>
                    <strong className="text-slate-900">~{resultData.route.duration_min} menit</strong>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Moda Transportasi:</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 capitalize">
                      {vehicle === "mobil" ? "Mobil Pribadi" : "Sepeda Motor"}
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* ========================================================
               KOLOM KANAN: SAMPLING CUACA 3 TITIK (FR-04) & MAP CANVAS (FR-02)
               ======================================================== */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* FR-04: Informasi Cuaca 3 Titik Spesifik dengan WAKTU ACUAN */}
            {resultData && resultData.weather && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fadeIn">
                {/* Titik Awal */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm border-l-4 border-l-emerald-500">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">
                      Titik Awal
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      🕒 {resultData.weather.origin.reference_time || "08:00 WIB"}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs truncate">
                    {resultData.entities?.origin || resultData.weather.origin.name || "Titik Keberangkatan"}
                  </div>
                  <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-slate-100">
                    <span className="text-xs text-slate-500 capitalize">
                      {resultData.weather.origin.description || "Cerah"}
                    </span>
                    <span className="font-black text-slate-900 text-base">
                      {resultData.weather.origin.temp_c ?? resultData.weather.origin.temp ?? 29}°C
                    </span>
                  </div>
                </div>

                {/* Titik Tengah (Midpoint) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm border-l-4 border-l-amber-500">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">
                      Titik Tengah (Midpoint)
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      🕒 {resultData.weather.midpoint.reference_time || "08:00 WIB"}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs truncate">
                    {resultData.weather.midpoint.name || "Sampling Jalur Tengah"}
                  </div>
                  <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-slate-100">
                    <span className="text-xs text-slate-500 capitalize">
                      {resultData.weather.midpoint.description || "Berawan"}
                    </span>
                    <span className="font-black text-slate-900 text-base">
                      {resultData.weather.midpoint.temp_c ?? resultData.weather.midpoint.temp ?? 28}°C
                    </span>
                  </div>
                </div>

                {/* Titik Akhir */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm border-l-4 border-l-rose-500">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold text-rose-600 uppercase tracking-wider">
                      Titik Akhir
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      🕒 {resultData.weather.destination.reference_time || "08:00 WIB"}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs truncate">
                    {resultData.entities?.destination || resultData.weather.destination.name || "Titik Kedatangan"}
                  </div>
                  <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-slate-100">
                    <span className="text-xs text-slate-500 capitalize">
                      {resultData.weather.destination.description || "Cerah"}
                    </span>
                    <span className="font-black text-slate-900 text-base">
                      {resultData.weather.destination.temp_c ?? resultData.weather.destination.temp ?? 29}°C
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* FR-02: Map Canvas (Leaflet.js) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-2.5 shadow-sm overflow-hidden relative">
              <MapComponent
                routeGeometry={resultData?.route?.coordinates}
                originCoords={
                  resultData?.route
                    ? {
                        lat: resultData.route.origin.lat,
                        lon: resultData.route.origin.lon,
                        name: resultData.entities?.origin || "Titik Awal",
                        weather: resultData.weather?.origin,
                      }
                    : undefined
                }
                midpointCoords={
                  resultData?.route?.midpoint
                    ? {
                        lat: resultData.route.midpoint.lat,
                        lon: resultData.route.midpoint.lon,
                        name: "Titik Tengah (Sampling Cuaca)",
                        weather: resultData.weather?.midpoint,
                      }
                    : undefined
                }
                destCoords={
                  resultData?.route
                    ? {
                        lat: resultData.route.destination.lat,
                        lon: resultData.route.destination.lon,
                        name: resultData.entities?.destination || "Titik Akhir",
                        weather: resultData.weather?.destination,
                      }
                    : undefined
                }
                pitstop={resultData?.pitstop}
              />
            </div>

            {/* Info Footer Note */}
            <div className="flex justify-between items-center text-[11px] text-slate-400 px-2">
              <span>Leaflet.js Canvas • OSRM Routing Engine • OpenWeatherMap Multi-Point Sampling</span>
              <span>SmartRoute AI</span>
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <span>&copy; 2026 SmartRoute AI — Asisten Navigasi & Telemetri Cuaca Real-Time.</span>
          <span>Didesain khusus untuk keselamatan pengendara komuter harian.</span>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Memuat SmartRoute AI...</div>}>
      <HomeContent />
    </Suspense>
  );
}
