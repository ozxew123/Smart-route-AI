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



export default function HistoryPage() {
  const router = useRouter();
  const [histories, setHistories] = useState<HistoryItem[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState<"all" | "motor" | "mobil">("all");
  const [selectedDetail, setSelectedDetail] = useState<HistoryItem | null>(null);
  const [historyError, setHistoryError] = useState("");

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
      const res = await fetch("/api/history");
      if (!res.ok) throw new Error("Riwayat gagal dimuat.");
      const data = await res.json();
      const items = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setHistories(items);
      setHistoryError("");
    } catch {
      setHistories([]);
      setHistoryError("Riwayat belum dapat dimuat. Coba muat ulang halaman.");
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
    <div className="min-h-[100dvh] bg-slate-50 text-slate-800 flex flex-col pb-[max(1rem,env(safe-area-inset-bottom))]">

      {/* ==============================================================
           NAVBAR (Mobile-Native Safe-Area Support)
           ============================================================== */}
      <header className="sticky top-0 z-[100] bg-white border-b border-slate-200/80 shadow-sm pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-50 flex items-center justify-center p-1 border border-sky-100 shadow-sm">
              <Image src="/images/logo.png" alt="SmartRoute Logo" width={32} height={32} className="object-contain" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg text-slate-900 tracking-tight">SmartRoute</span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-5">
            <nav className="flex items-center gap-2.5 sm:gap-5 text-xs sm:text-sm font-semibold">
              <Link href="/home" className="text-slate-600 hover:text-sky-600 flex items-center gap-1 sm:gap-1.5 transition">
                <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Rencana Rute</span>
                <span className="sm:hidden">Rute</span>
              </Link>
              <Link href="/history" className="text-sky-600 flex items-center gap-1 sm:gap-1.5 transition">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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

        {/* Dashboard Header Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Riwayat perjalanan
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Lihat, cari, dan ulangi rute yang pernah Anda cari.
            </p>
          </div>

          <Link
            href="/home"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md shadow-sky-600/20 transition flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buat rute</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-500">Rute tersimpan</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{histories.length}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-500">Tujuan terakhir</p>
            <p className="mt-1 font-semibold text-slate-900 truncate">{histories[0]?.destination || "Belum ada rute"}</p>
            {histories[0]?.origin && <p className="mt-1 text-xs text-slate-500 truncate">Dari {histories[0].origin}</p>}
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-500">Total jarak</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{totalKm.toFixed(1)} km</p>
            <p className="mt-1 text-xs text-slate-500">Rata-rata {avgMin} menit per rute</p>
          </div>
        </div>
        {/* Filter and Table Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">

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
                placeholder="Cari asal, tujuan, atau tanggal"
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
              <h3 className="font-semibold text-slate-800 mb-1">
                {historyError ? "Riwayat tidak dapat dimuat" : histories.length === 0 ? "Belum ada rute tersimpan" : "Rute tidak ditemukan"}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
                {historyError || (histories.length === 0 ? "Buat rute pertama Anda dan hasilnya akan muncul di sini." : "Coba ubah pencarian atau filter kendaraan.")}
              </p>
              {histories.length === 0 ? (
                <Link href="/home" className="text-sm text-sky-700 font-semibold hover:underline">Buat rute</Link>
              ) : (
                <button onClick={() => { setSearchFilter(""); setVehicleFilter("all"); }} className="text-sm text-sky-700 font-semibold hover:underline">Hapus filter</button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 text-xs uppercase tracking-wider font-bold">
                      <th className="py-3.5 px-5">Waktu</th>
                      <th className="py-3.5 px-5">Rute</th>
                      <th className="py-3.5 px-5">Moda</th>
                      <th className="py-3.5 px-5">Jarak</th>
                      <th className="py-3.5 px-5">Saran</th>
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

                          {/* Jarak */}
                          <td className="py-4 px-5 whitespace-nowrap">
                            <div className="font-bold text-slate-800 text-xs">
                              {item.route_data?.distance_km ? `${item.route_data.distance_km} km` : "-"}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {item.route_data?.duration_min ? `${item.route_data.duration_min} menit` : "-"}
                            </div>
                          </td>

                          {/* Saran */}
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
          <span>&copy; 2026 SmartRoute AI — Asisten Navigasi & .</span>
          <span>Rencanakan perjalanan dengan SmartRoute</span>
        </div>
      </footer>
    </div>
  );
}
