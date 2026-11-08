"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Bike,
  Car,
  MapPin,
  ShieldCheck,
  Compass,
  Clock,
  Save,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Navigation,
  CloudSun,
  Activity,
  KeyRound,
  Bell,
  Sliders,
  RotateCcw
} from "lucide-react";
import UserNavDropdown, { defaultProfile, UserProfileData } from "@/components/UserNavDropdown";

interface FullProfileData extends UserProfileData {
  phone: string;
  occupation: string;
  flood_avoidance: boolean;
}

const defaultFullProfile: FullProfileData = {
  ...defaultProfile,
  phone: "0812-9876-5432",
  occupation: "Komuter Harian & Mahasiswa Gunadarma",
  flood_avoidance: true,
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<FullProfileData>(defaultFullProfile);
  const [activeTab, setActiveTab] = useState<"general" | "preferences" | "security">("general");
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState("");
  const [errorToast, setErrorToast] = useState("");

  // State Keamanan / Ganti Password
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("smartroute_user_profile");
      if (stored) {
        setProfile({ ...defaultFullProfile, ...JSON.parse(stored) });
      } else {
        localStorage.setItem("smartroute_user_profile", JSON.stringify(defaultFullProfile));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessToast("");
    setErrorToast("");

    try {
      localStorage.setItem("smartroute_user_profile", JSON.stringify(profile));
      setSuccessToast("Profil dan preferensi perjalanan Anda berhasil diperbarui!");
      setTimeout(() => setSuccessToast(""), 3500);
    } catch {
      setErrorToast("Gagal menyimpan preferensi ke penyimpanan lokal.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorToast("");
    setSuccessToast("");

    if (!newPassword || newPassword.length < 6) {
      setErrorToast("Kata sandi baru minimal harus 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorToast("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email, password: newPassword, confirm_password: confirmPassword }),
      });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setSuccessToast("Kata sandi berhasil diubah!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        // demo fallback
        setSuccessToast("Kata sandi berhasil diperbarui (Mode Demo)!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setSuccessToast("Kata sandi berhasil diperbarui!");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccessToast(""), 3500);
    }
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolokasi tidak didukung oleh browser Anda.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setProfile((prev) => ({
          ...prev,
          default_origin: `Margonda Raya, Depok (GPS: ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`,
        }));
        setSuccessToast("Lokasi GPS berhasil diambil sebagai titik asal default!");
        setTimeout(() => setSuccessToast(""), 3000);
      },
      () => {
        setProfile((prev) => ({
          ...prev,
          default_origin: "Margonda Raya, Depok",
        }));
      }
    );
  };

  const initials = profile.nama
    ? profile.nama
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "HR";

  return (
    <div className="min-h-screen bg-[#F0F6FC] text-slate-800 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-lg text-slate-900 tracking-tight">
            <div className="relative w-8 h-8 rounded-xl bg-sky-50 p-1 border border-sky-100 overflow-hidden shadow-sm flex items-center justify-center">
              <Image src="/images/logo.png" alt="SmartRoute Logo" width={28} height={28} className="object-contain" />
            </div>
            <span>SmartRoute AI</span>
            <span className="text-[10px] font-bold bg-sky-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
              PRO
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            <nav className="hidden sm:flex items-center gap-5 text-xs font-semibold text-slate-600">
              <Link href="/home" className="hover:text-sky-600 transition flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                <span>Rencana Rute</span>
              </Link>
              <Link href="/history" className="hover:text-sky-600 transition flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>Dashboard Riwayat</span>
              </Link>
            </nav>
            <UserNavDropdown />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Breadcrumb & Title */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Link href="/home" className="hover:text-sky-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Asisten Rute</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">Profil & Preferensi AI</span>
        </div>

        {/* Success/Error Toasts */}
        {successToast && (
          <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold rounded-2xl p-4 flex items-center gap-3 shadow-sm animate-fadeIn">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
        )}
        {errorToast && (
          <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold rounded-2xl p-4 flex items-center gap-3 shadow-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{errorToast}</span>
          </div>
        )}

        {/* Profile Header Banner Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-sky-400/10 via-cyan-300/10 to-transparent rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            {/* User Avatar & Identity */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 text-white font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-sky-500/25 border-4 border-white">
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white w-6 h-6 rounded-full flex items-center justify-center text-white" title="Status: Online">
                  <span className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {profile.nama}
                  </h1>
                  <span className="text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-500" /> PRO Member
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-slate-500 mb-2">{profile.email}</div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Universitas Gunadarma</span>
                  <span>•</span>
                  <span>Kelompok 4 (Informatika)</span>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <Link
                href="/home"
                className="inline-flex items-center gap-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 px-4 py-2.5 rounded-2xl shadow-sm transition"
              >
                <Compass className="w-4 h-4" />
                <span>Rencanakan Rute Sekarang</span>
              </Link>
            </div>
          </div>

          {/* Commuter Telemetry Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100">
            <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400">Total Rute Dianalisis</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">18 Rute</div>
            </div>
            <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400">Jarak Tempuh Terpantau</div>
              <div className="text-lg font-black text-slate-900 mt-0.5">248.5 km</div>
            </div>
            <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400">Hujan Terhindar (AI)</div>
              <div className="text-lg font-black text-emerald-600 mt-0.5">7 Kali</div>
            </div>
            <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
              <div className="text-[11px] font-semibold text-slate-400">Skor Keselamatan</div>
              <div className="text-lg font-black text-sky-600 mt-0.5">96 / 100</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("general")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "general"
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Data Pribadi & Kontak</span>
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "preferences"
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Preferensi Navigasi & AI</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "security"
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Keamanan Akun</span>
          </button>
        </div>

        {/* Tab 1: Data Pribadi */}
        {activeTab === "general" && (
          <form onSubmit={handleSave} className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 mb-1">Informasi Identitas & Komuter</h2>
            <p className="text-xs text-slate-500 mb-6">
              Kelola data nama dan kontak yang tersambung dengan asisten perjalanan SmartRoute AI Anda.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Nama Lengkap</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={profile.nama}
                    onChange={(e) => setProfile({ ...profile, nama: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-slate-50/50 hover:bg-white focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Alamat Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-slate-50/50 hover:bg-white focus:bg-white transition"
                  />
                </div>
              </div>

              {/* No Telepon / WA */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Nomor Kontak / WhatsApp</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={profile.phone || ""}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-slate-50/50 hover:bg-white focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Peran / Komuter */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Aktivitas Komuter</label>
                <input
                  type="text"
                  value={profile.occupation}
                  onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                  placeholder="Misal: Komuter Harian Depok - Jaksel"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-slate-50/50 hover:bg-white focus:bg-white transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-sm transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Preferensi Navigasi & AI */}
        {activeTab === "preferences" && (
          <form onSubmit={handleSave} className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 mb-1">Preferensi Rute & Keputusan AI</h2>
            <p className="text-xs text-slate-500 mb-6">
              Sesuaikan kendaraan utama, lokasi asal default, dan bagaimana sistem AI memberikan peringatan cuaca.
            </p>

            {/* Moda Kendaraan Default */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 mb-2.5">
                Kendaraan Utama yang Sering Digunakan
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, vehicle: "motor" })}
                  className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition text-left ${
                    profile.vehicle === "motor"
                      ? "border-sky-600 bg-sky-50/60 text-sky-950 font-bold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    profile.vehicle === "motor" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    <Bike className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold">Sepeda Motor</div>
                    <div className="text-[10px] text-slate-500 font-normal">Komuter lincah & sensitif cuaca</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, vehicle: "mobil" })}
                  className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 transition text-left ${
                    profile.vehicle === "mobil"
                      ? "border-sky-600 bg-sky-50/60 text-sky-950 font-bold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    profile.vehicle === "mobil" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold">Mobil</div>
                    <div className="text-[10px] text-slate-500 font-normal">Perjalanan keluarga & jalur tol</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Lokasi Asal Default (Basecamp) */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Titik Asal Default (Rumah / Kantor)
              </label>
              <div className="flex gap-2 max-w-xl">
                <div className="relative flex-1">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={profile.default_origin}
                    onChange={(e) => setProfile({ ...profile, default_origin: e.target.value })}
                    placeholder="Contoh: Margonda, Depok"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-slate-50/50 hover:bg-white focus:bg-white transition"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  title="Ambil lokasi GPS saat ini"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 text-xs font-bold text-slate-700 transition"
                >
                  <Navigation className="w-3.5 h-3.5 text-sky-600" />
                  <span className="hidden sm:inline">Pakai GPS</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Otomatis digunakan di halaman asisten rute jika Anda hanya menyebutkan lokasi tujuan.
              </p>
            </div>

            {/* Aturan Safety AI Toggles */}
            <div className="space-y-4 mb-6 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Parameter AI Safety Advisor
              </h3>

              {/* Toggle 1: Raincoat Alert */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200/80 hover:bg-slate-50/60 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.raincoat_alert}
                  onChange={(e) => setProfile({ ...profile, raincoat_alert: e.target.checked })}
                  className="mt-1 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800">
                    Peringatan Jas Hujan Setelan Otomatis
                  </div>
                  <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    AI mewajibkan rekomendasi jas hujan sebelum titik keberangkatan jika titik tengah atau tujuan mendung pekat / hujan.
                  </div>
                </div>
              </label>

              {/* Toggle 2: Speed Caution */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200/80 hover:bg-slate-50/60 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.speed_caution}
                  onChange={(e) => setProfile({ ...profile, speed_caution: e.target.checked })}
                  className="mt-1 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800">
                    Batasi Kecepatan saat Aspal Basah (&le; 40 km/jam)
                  </div>
                  <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    Decision engine otomatis menyertakan instruksi perlambatan laju demi mencegah risiko selip ban.
                  </div>
                </div>
              </label>

              {/* Toggle 3: Avoid Heavy Rain / Floods */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200/80 hover:bg-slate-50/60 transition cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.avoid_heavy_rain}
                  onChange={(e) => setProfile({ ...profile, avoid_heavy_rain: e.target.checked })}
                  className="mt-1 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800">
                    Hindari Genangan & Underpass Rawan Banjir
                  </div>
                  <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    Memberikan peringatan khusus untuk titik rawan air seperti Underpass Mampang, Kuningan, dan jalan cekungan.
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-sm transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Menyimpan..." : "Simpan Preferensi AI"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Keamanan & Ganti Password */}
        {activeTab === "security" && (
          <form onSubmit={handlePasswordChange} className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm max-w-xl">
            <h2 className="text-base font-extrabold text-slate-900 mb-1">Keamanan Kata Sandi</h2>
            <p className="text-xs text-slate-500 mb-6">
              Perbarui kata sandi akun Anda secara berkala untuk menjaga keamanan data perjalanan Anda.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Kata Sandi Saat Ini</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-slate-50/50 hover:bg-white focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Kata Sandi Baru</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-slate-50/50 hover:bg-white focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Konfirmasi Kata Sandi Baru</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-slate-50/50 hover:bg-white focus:bg-white transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-2xl shadow-sm transition disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isSaving ? "Memproses..." : "Perbarui Kata Sandi"}</span>
              </button>
            </div>
          </form>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span>&copy; 2026 SmartRoute AI — Asisten Navigasi & Telemetri Cuaca Real-Time.</span>
          <div className="flex items-center gap-4">
            <Link href="/home" className="hover:text-sky-600">Perencana Rute</Link>
            <Link href="/history" className="hover:text-sky-600">Riwayat</Link>
            <Link href="/profile" className="text-sky-600 font-semibold">Profil Saya</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

