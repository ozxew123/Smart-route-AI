"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Clock,
  MapPin,
  Bike,
  Car,
  RotateCw,
  Trash2,
  Eye,
  Search,
  CheckCircle,
  Plus,
  ShieldCheck,
  Compass,
  X,
  ArrowRight,
  Sun,
  CloudRain,
  Cloud,
  Activity,
  Gauge,
  LogOut,
  Radio
} from "lucide-react";
import UserNavDropdown from "@/components/UserNavDropdown";

interface HistoryItem {
  id: number;
  created_at: string;
  origin: string;
  destination: string;
  vehicle: string;
  raw_query: string;
  route_data?: { distance_km?: number; duration_min?: number };
  weather_data?: {
    origin?: { name?: string; temp?: number; description?: string };
    midpoint?: { name?: string; temp?: number; description?: string };
    destination?: { name?: string; temp?: number; description?: string };
  };
  ai_advice?: string;
}

const fallbackDemoData: HistoryItem[] = [
  {
    id: 101,
    created_at: "2026-11-05 19:45:00",
    origin: "Margonda, Depok",
    destination: "Tebet Eco Park, Jakarta Selatan",
    vehicle: "motor",
    raw_query: "Dari Margonda Depok ke Tebet Eco Park naik motor jangan lewat jalan licin",
    route_data: { distance_km: 18.4, duration_min: 42 },
    ai_advice: "Waspada potensi hujan di titik tengah (Pasar Minggu). Gunakan jas hujan setelan dan kurangi kecepatan ke 40 km/jam pada aspal basah.",
    weather_data: {
      origin: { name: "Depok", temp: 32, description: "Cerah Berawan" },
      midpoint: { name: "Pasar Minggu", temp: 27, description: "Hujan Ringan" },
      destination: { name: "Tebet", temp: 25, description: "Hujan Sedang" }
    }
  },
  {
    id: 102,
    created_at: "2026-11-04 07:15:00",
    origin: "Kampus D Margonda",
    destination: "Bundaran HI, Jakarta Pusat",
    vehicle: "motor",
    raw_query: "Kampus D Gunadarma ke Bundaran HI naik motor santai",
    route_data: { distance_km: 23.1, duration_min: 54 },
    ai_advice: "Cuaca cerah berawan di titik awal dan tengah, gerimis terpantau di Jakarta Pusat. Sedia jas hujan di bagasi motor.",
    weather_data: {
      origin: { name: "Kampus D Margonda", temp: 31, description: "Berawan Sejuk" },
      midpoint: { name: "Pancoran", temp: 29, description: "Mendung" },
      destination: { name: "Bundaran HI", temp: 26, description: "Gerimis Ringan" }
    }
  },
  {
    id: 103,
    created_at: "2026-11-02 14:30:00",
    origin: "Cibubur Junction",
    destination: "Monas, Jakarta Pusat",
    vehicle: "mobil",
    raw_query: "Dari Cibubur ke Monas Jakarta Pusat bawa mobil keluarga",
    route_data: { distance_km: 25.8, duration_min: 38 },
    ai_advice: "Kondisi cuaca sangat kondusif di seluruh titik rute. Patuhi batas kecepatan normal jalan tol 60-80 km/jam.",
    weather_data: {
      origin: { name: "Cibubur", temp: 29, description: "Berawan" },
      midpoint: { name: "Cawang", temp: 30, description: "Berawan" },
      destination: { name: "Gambir/Monas", temp: 31, description: "Cerah Berawan" }
    }
  }
];

export default function HistoryPage() {
  const router = useRouter();
  const [histories, setHistories] = useState<HistoryItem[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState<"all" | "motor" | "mobil">("all");
  const [selectedDetail, setSelectedDetail] = useState<HistoryItem | null>(null);

  useEffect(() => {
    // Proteksi halaman Riwayat: harus login terlebih dahulu
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data?.authenticated) {
          router.replace("/login");
        }
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    fetchHistories();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        const input = document.getElementById("searchHistoryInput");
        if (input) input.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchHistories = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch("/api/history", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setHistories(data);
          return;
        }
      }
      setHistories(fallbackDemoData);
    } catch {
      setHistories(fallbackDemoData);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan rute ini?")) return;
    try {
      await fetch(`/api/history/${id}`, { method: "DELETE" });
    } catch {
      // offline/demo fallback
    }
    setHistories((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredItems = histories.filter((item) => {
    const isCar = (item.vehicle || "").toLowerCase().includes("mobil") || (item.vehicle || "").toLowerCase().includes("car");
    if (vehicleFilter === "motor" && isCar) return false;
    if (vehicleFilter === "mobil" && !isCar) return false;

    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const origin = (item.origin || "").toLowerCase();
    const dest = (item.destination || "").toLowerCase();
    const raw = (item.raw_query || "").toLowerCase();
    const date = (item.created_at || "").toLowerCase();
    return origin.includes(q) || dest.includes(q) || raw.includes(q) || date.includes(q);
  });

  const motorCount = histories.filter((it) => !(it.vehicle || "").toLowerCase().includes("mobil") && !(it.vehicle || "").toLowerCase().includes("car")).length;
  const mobilCount = histories.filter((it) => (it.vehicle || "").toLowerCase().includes("mobil") || (it.vehicle || "").toLowerCase().includes("car")).length;

  let totalKm = 0;
  let totalMin = 0;
  histories.forEach((it) => {
    if (it.route_data?.distance_km) totalKm += Number(it.route_data.distance_km);
    if (it.route_data?.duration_min) totalMin += Number(it.route_data.duration_min);
  });
  const avgMin = histories.length > 0 ? Math.round(totalMin / histories.length) : 0;

  return (
    <div className="min-h-screen bg-[#F0F6FC] text-slate-800 flex flex-col relative overflow-x-hidden">
      
      {/* ==============================================================
           ANIMATED TRAFFIC & HIGHWAY BACKGROUND (MOTORCYCLE & CAR)
           ============================================================== */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-90">
        {/* Ambient Skyline Gradient & Radar Ring */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-[radial-gradient(circle_at_15%_30%,rgba(56,189,248,0.14)_0%,transparent_50%),radial-gradient(circle_at_85%_25%,rgba(2,132,199,0.12)_0%,transparent_50%)]" />
        
        {/* Top Highway Lane (East-to-West Traffic) */}
        <div className="absolute w-full left-0 bottom-[210px] h-16 bg-gradient-to-b from-slate-200/25 via-slate-300/40 to-slate-200/25 border-y border-dashed border-sky-400/30">
          <div className="absolute top-1/2 left-0 w-[200%] h-[3px] -translate-y-1/2 bg-[repeating-linear-gradient(90deg,#F59E0B_0,#F59E0B_32px,transparent_32px,transparent_64px)] opacity-35 anim-stripe-flow-rev" />
          
          {/* Moving Westbound Motor */}
          <div className="absolute bottom-2 moving-vehicle anim-drive-west-1">
            <svg width="68" height="36" viewBox="0 0 100 55" fill="none">
              <circle cx="24" cy="40" r="10" fill="#0F172A" stroke="#64748B" strokeWidth="2.5" />
              <circle cx="78" cy="40" r="10" fill="#0F172A" stroke="#64748B" strokeWidth="2.5" />
              <path d="M24 40 L44 26 L62 26 L78 40 L52 40 Z" fill="#F59E0B" />
              <circle cx="48" cy="12" r="7.5" fill="#0F172A" />
              <path d="M42 22 C42 16 54 16 54 22 L56 32 L40 32 Z" fill="#1E293B" />
              <path d="M40 24 L28 26" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>

          {/* Moving Westbound Car */}
          <div className="absolute bottom-1 moving-vehicle anim-drive-west-2">
            <svg width="95" height="38" viewBox="0 0 130 52" fill="none">
              <circle cx="32" cy="41" r="10" fill="#0F172A" stroke="#94A3B8" strokeWidth="2.5" />
              <circle cx="98" cy="41" r="10" fill="#0F172A" stroke="#94A3B8" strokeWidth="2.5" />
              <path d="M12 36 L24 22 L50 14 L95 14 L114 26 L122 36 L120 42 L12 42 Z" fill="#0284C7" />
              <path d="M30 22 L49 17 L50 26 L27 26 Z" fill="#E0F2FE" opacity="0.85" />
              <path d="M54 17 L90 17 L88 26 L54 26 Z" fill="#E0F2FE" opacity="0.85" />
              <rect x="119" y="30" width="4" height="6" rx="2" fill="#EF4444" />
            </svg>
          </div>
        </div>

        {/* Bottom Highway Lane (West-to-East Traffic) */}
        <div className="absolute w-full left-0 bottom-8 h-[70px] bg-gradient-to-b from-slate-200/35 via-sky-100/40 to-slate-200/35 border-t border-sky-400/30 border-b-2 border-sky-600/35">
          <div className="absolute top-1/2 left-0 w-[200%] h-[3px] -translate-y-1/2 bg-[repeating-linear-gradient(90deg,#0284C7_0,#0284C7_32px,transparent_32px,transparent_64px)] opacity-40 anim-stripe-flow" />
          
          {/* Moving Eastbound Motor */}
          <div className="absolute bottom-3 moving-vehicle anim-drive-east-1">
            <svg width="72" height="40" viewBox="0 0 100 55" fill="none">
              <polygon points="86,28 135,10 135,46" fill="#FDE047" opacity="0.45" />
              <circle cx="22" cy="40" r="11" fill="#0F172A" stroke="#0284C7" strokeWidth="2.5" />
              <circle cx="78" cy="40" r="11" fill="#0F172A" stroke="#0284C7" strokeWidth="2.5" />
              <path d="M22 40 L44 32 L58 32 L78 40 L65 40 L45 36 Z" fill="#0284C7" />
              <circle cx="46" cy="14" r="8" fill="#0F172A" />
              <path d="M38 24 C38 18 52 18 52 24 L54 36 L36 36 Z" fill="#0369A1" />
              <circle cx="80" cy="28" r="3" fill="#FDE047" />
            </svg>
          </div>

          {/* Moving Eastbound Car */}
          <div className="absolute bottom-2 moving-vehicle anim-drive-east-2">
            <svg width="102" height="40" viewBox="0 0 130 52" fill="none">
              <polygon points="116,32 165,16 165,48" fill="#38BDF8" opacity="0.38" />
              <circle cx="34" cy="41" r="10" fill="#0F172A" stroke="#38BDF8" strokeWidth="2.5" />
              <circle cx="100" cy="41" r="10" fill="#0F172A" stroke="#38BDF8" strokeWidth="2.5" />
              <path d="M8 38 L22 26 L48 16 L88 16 L112 26 L124 38 L122 43 L8 43 Z" fill="#0F172A" />
              <path d="M26 25 L46 19 L48 27 L24 27 Z" fill="#BAE6FD" opacity="0.85" />
              <path d="M52 19 L84 19 L82 27 L52 27 Z" fill="#BAE6FD" opacity="0.85" />
              <rect x="120" y="32" width="4" height="4" rx="2" fill="#38BDF8" />
            </svg>
          </div>
        </div>
      </div>

      {/* ==============================================================
           NAVBAR
           ============================================================== */}
      <header className="sticky top-0 z-[100] bg-white border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center p-1 border border-sky-100 shadow-sm">
              <Image src="/images/logo.png" alt="SmartRoute Logo" width={32} height={32} className="object-contain" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-slate-900 tracking-tight">SmartRoute AI</span>
              <span className="text-[10px] font-bold bg-gradient-to-r from-sky-600 to-cyan-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                Dashboard
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            <nav className="flex items-center gap-3 sm:gap-5 text-xs sm:text-sm font-semibold">
              <Link href="/home" className="text-slate-600 hover:text-sky-600 flex items-center gap-1.5 transition">
                <Compass className="w-4 h-4" />
                <span>Rencana Rute</span>
              </Link>
              <Link href="/history" className="text-sky-600 flex items-center gap-1.5 transition">
                <Clock className="w-4 h-4" />
                <span>Riwayat</span>
              </Link>
            </nav>
            <UserNavDropdown />
          </div>
        </div>
      </header>

      {/* ==============================================================
           MAIN CONTENT
           ============================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 z-10">
        
        {/* Live Telemetry Ticker Bar */}
        <div className="bg-white/85 backdrop-blur-md border border-sky-200/80 rounded-2xl px-4 py-2.5 mb-5 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM ONLINE
            </span>
            <span className="text-slate-600 font-medium hidden sm:inline">
              <CloudRain className="w-3.5 h-3.5 inline text-sky-500 mr-1" />
              OpenWeather 3-Point Radar Telemetry Aktif
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <span>
              OSRM Engine: <strong className="text-slate-700">Jabodetabek Ready</strong>
            </span>
            <span>•</span>
            <span>
              AI Decision Engine: <strong className="text-slate-700">Groq AI Ultra-Fast LPU</strong>
            </span>
          </div>
        </div>

        {/* Dashboard Header Banner */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-sky-500 to-sky-600" />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                Command Center Riwayat Perjalanan
              </span>
              <span className="text-xs text-slate-400">Telemetri Cuaca Real-Time</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Riwayat & Analisis Rute Komuter
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Kelola data rute yang pernah Anda analisis, pantau peringatan cuaca titik tengah, dan ulangi pencarian dengan satu klik.
            </p>
          </div>

          <Link
            href="/home"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md shadow-sky-600/20 transition flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Rencana Rute Baru</span>
          </Link>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Stat 1: Total */}
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
                Tersimpan
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500 block mb-0.5">Total Pencarian Rute</span>
            <div className="text-2xl font-extrabold text-slate-900">{histories.length} Rute</div>
            <div className="text-[11px] text-slate-400 mt-1">
              🏍️ {motorCount} Motor • 🚗 {mobilCount} Mobil
            </div>
          </div>

          {/* Stat 2: Destinasi Terakhir */}
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                Terakhir Diakses
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500 block mb-0.5">Destinasi Terakhir</span>
            <div className="text-base font-bold text-slate-900 truncate">
              {histories[0]?.destination || "-"}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              Rute asal: {histories[0]?.origin || "-"}
            </div>
          </div>

          {/* Stat 3: Total Jarak */}
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Gauge className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                OSRM Metric
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500 block mb-0.5">Total Jarak Teranalisis</span>
            <div className="text-2xl font-extrabold text-slate-900">{totalKm.toFixed(1)} km</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Rerata tempuh: <strong>{avgMin} menit</strong> / trip
            </div>
          </div>

          {/* Stat 4: AI Safety Status */}
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
                <Activity className="w-3 h-3" /> Siaga
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-500 block mb-0.5">Decision Engine AI</span>
            <div className="text-base font-bold text-slate-900">Aktif & Memantau</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              ✓ Deteksi aspal basah & jas hujan
            </div>
          </div>
        </div>

        {/* Filter and Table Card */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden mb-8">
          
          {/* Filter Bar */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="searchHistoryInput"
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Cari rute, asal, tujuan, atau tanggal (tekan '/' untuk cari)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-slate-50/50 hover:bg-white focus:bg-white transition"
              />
            </div>

            {/* Vehicle Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setVehicleFilter("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 ${
                  vehicleFilter === "all"
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>Semua Rute</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {histories.length}
                </span>
              </button>
              <button
                onClick={() => setVehicleFilter("motor")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 ${
                  vehicleFilter === "motor"
                    ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Sepeda Motor</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800">
                  {motorCount}
                </span>
              </button>
              <button
                onClick={() => setVehicleFilter("mobil")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition flex items-center gap-1.5 ${
                  vehicleFilter === "mobil"
                    ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Mobil</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                  {mobilCount}
                </span>
              </button>
            </div>
          </div>

          {/* Table */}
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-500 mx-auto flex items-center justify-center mb-3">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-800 mb-1">Tidak Ada Riwayat yang Sesuai</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Coba ubah kata kunci pencarian atau filter kendaraan untuk menampilkan catatan rute.
              </p>
              <button
                onClick={() => {
                  setSearchFilter("");
                  setVehicleFilter("all");
                }}
                className="text-xs text-sky-600 font-semibold hover:underline"
              >
                Reset Semua Filter
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-xs uppercase tracking-wider font-bold">
                      <th className="py-3.5 px-5">Waktu</th>
                      <th className="py-3.5 px-5">Rute & Cuaca 3-Titik</th>
                      <th className="py-3.5 px-5">Moda</th>
                      <th className="py-3.5 px-5">Jarak & Durasi</th>
                      <th className="py-3.5 px-5">Saran Keselamatan AI</th>
                      <th className="py-3.5 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => {
                      const isCar = (item.vehicle || "").toLowerCase().includes("mobil") || (item.vehicle || "").toLowerCase().includes("car");
                      const dateStr = item.created_at ? item.created_at.split(" ")[0] : "Hari ini";
                      const timeStr = item.created_at?.split(" ")[1] ? item.created_at.split(" ")[1].slice(0, 5) : "";
                      const queryEncoded = encodeURIComponent(item.raw_query || `${item.origin} ke ${item.destination}`);

                      return (
                        <tr key={item.id} className="hover:bg-sky-50/40 transition-colors">
                          {/* Waktu */}
                          <td className="py-4 px-5 whitespace-nowrap">
                            <div className="font-bold text-slate-800 text-xs">{dateStr}</div>
                            <div className="text-[11px] text-slate-400">{timeStr} WIB</div>
                          </td>

                          {/* Rute & Telemetri Cuaca */}
                          <td className="py-4 px-5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                                <span className="font-bold text-slate-800 text-sm">{item.origin}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
                                <span className="font-bold text-slate-800 text-sm">{item.destination}</span>
                              </div>
                            </div>

                            {/* 3-Point Weather Preview */}
                            {item.weather_data && (
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 inline-flex items-center gap-1">
                                  <span className="text-emerald-600 font-bold">Awal:</span> {item.weather_data.origin?.temp || "-"}°C
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-300" />
                                <span className="text-[11px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200 inline-flex items-center gap-1">
                                  <span className="text-amber-600 font-bold">Tengah:</span> {item.weather_data.midpoint?.temp || "-"}°C ({item.weather_data.midpoint?.description || "Cerah"})
                                </span>
                                <ArrowRight className="w-3 h-3 text-slate-300" />
                                <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 inline-flex items-center gap-1">
                                  <span className="text-rose-600 font-bold">Akhir:</span> {item.weather_data.destination?.temp || "-"}°C
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Moda */}
                          <td className="py-4 px-5 whitespace-nowrap">
                            {isCar ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                <Car className="w-3.5 h-3.5" />
                                Mobil
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                                <Bike className="w-3.5 h-3.5" />
                                Sepeda Motor
                              </span>
                            )}
                          </td>

                          {/* Jarak & Durasi */}
                          <td className="py-4 px-5 whitespace-nowrap">
                            <div className="font-bold text-slate-800 text-xs">
                              {item.route_data?.distance_km ? `${item.route_data.distance_km} km` : "-"}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {item.route_data?.duration_min ? `${item.route_data.duration_min} menit` : "-"}
                            </div>
                          </td>

                          {/* Saran Keselamatan AI */}
                          <td className="py-4 px-5 max-w-xs">
                            <p className="text-xs text-slate-600 truncate mb-1" title={item.ai_advice}>
                              {item.ai_advice || "Patuhi rambu lalu lintas dan perhatikan batas kecepatan."}
                            </p>
                            <button
                              onClick={() => setSelectedDetail(item)}
                              className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 hover:underline"
                            >
                              <Eye className="w-3 h-3" />
                              Detail Lengkap
                            </button>
                          </td>

                          {/* Tombol Aksi */}
                          <td className="py-4 px-5 whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-2">
                              <Link
                                href={`/home?q=${queryEncoded}&vehicle=${isCar ? "mobil" : "motor"}&auto=1`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-sm transition"
                                title="Ulangi rute ini sekarang"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                                <span>Ulangi</span>
                              </Link>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
                                title="Hapus riwayat"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Responsive Cards View */}
              <div className="block md:hidden divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isCar = (item.vehicle || "").toLowerCase().includes("mobil") || (item.vehicle || "").toLowerCase().includes("car");
                  const dateStr = item.created_at ? item.created_at.split(" ")[0] : "Hari ini";
                  const timeStr = item.created_at?.split(" ")[1] ? item.created_at.split(" ")[1].slice(0, 5) : "";
                  const queryEncoded = encodeURIComponent(item.raw_query || `${item.origin} ke ${item.destination}`);

                  return (
                    <div key={item.id} className="p-4 space-y-3 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-400 font-medium">{dateStr} • {timeStr} WIB</div>
                        {isCar ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <Car className="w-3 h-3" /> Mobil
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                            <Bike className="w-3 h-3" /> Motor
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 flex-shrink-0" />
                          <span className="font-bold text-slate-800 text-sm">{item.origin}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200 flex-shrink-0" />
                          <span className="font-bold text-slate-800 text-sm">{item.destination}</span>
                        </div>
                      </div>

                      {item.weather_data && (
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] pt-1">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            <strong className="text-emerald-600">Awal:</strong> {item.weather_data.origin?.temp || "-"}°C
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                          <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                            <strong className="text-amber-600">Tengah:</strong> {item.weather_data.midpoint?.temp || "-"}°C
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            <strong className="text-rose-600">Akhir:</strong> {item.weather_data.destination?.temp || "-"}°C
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                        <span>Jarak: <strong className="text-slate-800">{item.route_data?.distance_km ? `${item.route_data.distance_km} km` : "-"}</strong></span>
                        <span>Durasi: <strong className="text-slate-800">{item.route_data?.duration_min ? `${item.route_data.duration_min} min` : "-"}</strong></span>
                        <button onClick={() => setSelectedDetail(item)} className="text-sky-600 font-semibold hover:underline">
                          Detail
                        </button>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <Link
                          href={`/home?q=${queryEncoded}&vehicle=${isCar ? "mobil" : "motor"}&auto=1`}
                          className="flex-1 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-1.5 shadow-sm transition"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Ulangi Rute</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
                          title="Hapus riwayat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600" />
                Detail Riwayat Perjalanan
              </h3>
              <button
                onClick={() => setSelectedDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 my-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <span className="font-semibold text-slate-500 block mb-1">Perintah Asli Pengguna:</span>
                <p className="italic text-slate-800 font-medium">"{selectedDetail.raw_query || "-"}"</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                  <span className="text-[11px] text-emerald-700 font-semibold block mb-0.5">Titik Awal (Origin)</span>
                  <div className="font-bold text-xs text-slate-800">{selectedDetail.origin}</div>
                </div>
                <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl">
                  <span className="text-[11px] text-rose-700 font-semibold block mb-0.5">Titik Tujuan (Destination)</span>
                  <div className="font-bold text-xs text-slate-800">{selectedDetail.destination}</div>
                </div>
              </div>

              {selectedDetail.weather_data && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 block">Telemetri Cuaca (3 Titik):</span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-bold">AWAL</div>
                      <div className="font-extrabold text-slate-800">{selectedDetail.weather_data.origin?.temp}°C</div>
                      <div className="text-[10px] text-slate-400 truncate">{selectedDetail.weather_data.origin?.description}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="text-[10px] text-amber-700 font-bold">TENGAH</div>
                      <div className="font-extrabold text-amber-900">{selectedDetail.weather_data.midpoint?.temp}°C</div>
                      <div className="text-[10px] text-amber-700 truncate">{selectedDetail.weather_data.midpoint?.description}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-500 font-bold">AKHIR</div>
                      <div className="font-extrabold text-slate-800">{selectedDetail.weather_data.destination?.temp}°C</div>
                      <div className="text-[10px] text-slate-400 truncate">{selectedDetail.weather_data.destination?.description}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl text-xs space-y-1">
                <span className="font-bold text-sky-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  Rekomendasi Keselamatan AI:
                </span>
                <p className="text-slate-700 leading-relaxed">{selectedDetail.ai_advice || "-"}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400">{selectedDetail.created_at}</span>
              <div className="flex gap-2">
                <Link
                  href={`/home?q=${encodeURIComponent(selectedDetail.raw_query || "")}&vehicle=${
                    (selectedDetail.vehicle || "").includes("mobil") ? "mobil" : "motor"
                  }&auto=1`}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Ulangi Rute
                </Link>
                <button
                  onClick={() => setSelectedDetail(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-slate-200 py-4 text-xs text-slate-500 z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 SmartRoute AI — Asisten Navigasi & Telemetri Cuaca Real-Time.</span>
          <span>OSRM Routing Engine • OpenWeatherMap API • Groq AI Advisor</span>
        </div>
      </footer>
    </div>
  );
}
