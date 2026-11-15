"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Route,
  CloudSun,
  Mic,
  ShieldCheck,
  Zap,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCw,
  Search,
  Bike,
  Car,
  Menu,
  X,
  Compass,
  Clock,
  Layers,
  HelpCircle,
  Check,
  MapPin
} from "lucide-react";

const demoData = [
  {
    query: "Dari Margonda Depok ke Tebet Eco Park naik motor jangan lewat jalan licin",
    origin: { name: "Margonda, Depok", detail: "Kelembapan 62% • Angin 8 km/j", temp: "32°C", cond: "☀️ Cerah Berawan" },
    mid: { name: "Pasar Minggu (Km 9.2)", detail: "Curah Hujan 4.2 mm/j • Aspal Basah", temp: "27°C", cond: "🌧️ Hujan Ringan" },
    dest: { name: "Tebet Eco Park", detail: "Visibilitas 3.5 km • Curah Hujan 12 mm/j", temp: "25°C", cond: "⛈️ Hujan Sedang" },
    advTitle: "Waspada: Potensi Hujan di Titik Tengah Jalur",
    advDesc: "Gunakan jas hujan setelan sebelum Pasar Minggu & batasi laju ke 40 km/jam pada aspal basah.",
    advMeta: "18.4 km • 42 mnt",
    isSafe: false
  },
  {
    query: "Depok ke Bundaran HI Jakarta Pusat naik motor santai",
    origin: { name: "Margonda Depok", detail: "Kelembapan 58% • Cuaca Baik", temp: "31°C", cond: "🌤️ Berawan Sejuk" },
    mid: { name: "Pancoran (Km 14)", detail: "Awan Tebal • Angin 14 km/j", temp: "29°C", cond: "☁️ Mendung Tebal" },
    dest: { name: "Bundaran HI", detail: "Curah Hujan Ringan 2.1 mm/j", temp: "26°C", cond: "🌦️ Gerimis Ringan" },
    advTitle: "Siaga: Gerimis Terpantau di Titik Tujuan",
    advDesc: "Siapkan jas hujan di bagasi motor. Waspadai genangan air di Underpass Mampang & Kuningan.",
    advMeta: "23.1 km • 54 mnt",
    isSafe: false
  },
  {
    query: "Dari Cibubur ke Monas Jakarta Pusat bawa mobil keluarga",
    origin: { name: "Cibubur Junction", detail: "Kelembapan 70% • Suhu Nyaman", temp: "29°C", cond: "⛅ Berawan" },
    mid: { name: "Cawang interchange", detail: "Lalu Lintas Padat • Jalan Kering", temp: "30°C", cond: "⛅ Berawan" },
    dest: { name: "Gambir / Monas", detail: "Cerah Berawan • Visibilitas 8 km", temp: "31°C", cond: "🌤️ Cerah Berawan" },
    advTitle: "Kondisi Aman: Cuaca Sangat Kondusif",
    advDesc: "Tidak terdeteksi potensi hujan berbahaya. Patuhi batas kecepatan normal jalan tol 60-80 km/jam.",
    advMeta: "25.8 km • 38 mnt (Tol)",
    isSafe: true
  }
];

export default function LandingPage() {
  const router = useRouter();
  const [activeScenario, setActiveScenario] = useState(0);
  const [isMicActive, setIsMicActive] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentDemo = demoData[activeScenario];

  // Jika pengguna sudah login, langsung alihkan ke Navigator (/home)
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated) {
          router.replace("/home");
        }
      })
      .catch(() => {});
  }, [router]);

  const handleVoiceSimulation = () => {
    setIsMicActive(true);
    setTimeout(() => {
      setIsMicActive(false);
      setActiveScenario(0);
    }, 1200);
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col font-sans overflow-x-hidden pb-[max(1rem,env(safe-area-inset-bottom))]">
      
      {/* Navbar with Safe Area Support */}
      <header className="sticky top-0 z-[100] bg-white border-b border-slate-200 pt-[env(safe-area-inset-top)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-lg text-slate-900 tracking-tight">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
              <Image src="/images/logo.png" alt="SmartRoute AI Logo" fill className="object-cover" />
            </div>
            <span>SmartRoute AI</span>
            <span className="text-[10px] font-bold bg-sky-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
              PRO
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#fitur" className="hover:text-sky-600 transition-colors">Fitur Utama</a>
            <a href="#cara-kerja" className="hover:text-sky-600 transition-colors">Cara Kerja</a>
            <a href="#simulasi" className="hover:text-sky-600 transition-colors">Simulasi Rute</a>
          </nav>

          {/* Desktop Auth CTA */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-sky-600 px-3.5 py-2 transition"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-full shadow-md shadow-sky-600/20 transition-all hover:-translate-y-0.5"
            >
              <span>Daftar Akun</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-sky-600 rounded-lg"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-3 shadow-lg animate-fadeIn">
            <a
              href="#fitur"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-sky-600"
            >
              Fitur Utama
            </a>
            <a
              href="#cara-kerja"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-sky-600"
            >
              Cara Kerja
            </a>
            <a
              href="#simulasi"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-sky-600"
            >
              Simulasi Rute
            </a>
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Masuk ke Akun
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-sky-600 text-white text-sm font-semibold shadow-md shadow-sky-600/20"
              >
                Daftar Akun Pengendara
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-16 pb-10 sm:pb-14 overflow-hidden text-center">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-sky-400/20 to-transparent blur-3xl pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 bg-white border border-sky-200/60 shadow-sm text-sky-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Asisten Navigasi & Telemetri Cuaca Real-Time</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.2] mb-4 sm:mb-5">
            Perjalanan Aman, <br />
            <span className="bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent">
              Tanpa Kejutan Cuaca.
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8 px-2">
            Navigasi biasa hanya mencari rute terpendek. SmartRoute AI memadukan{" "}
            <strong className="text-slate-800">pemrosesan bahasa alami (NLP)</strong> dan{" "}
            <strong className="text-slate-800">pemantauan cuaca 3 titik</strong> agar Anda siap sebelum hujan menghadang di jalan.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xs sm:max-w-none mx-auto mb-10 sm:mb-12">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3.5 rounded-full shadow-lg shadow-sky-600/25 transition-all text-sm sm:text-base"
            >
              <Route className="w-5 h-5" />
              <span>Mulai Rencana Rute — Daftar Gratis</span>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-5 py-3.5 rounded-full border border-slate-200 transition-colors text-sm sm:text-base"
            >
              <span>Masuk ke Akun</span>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 max-w-4xl mx-auto pt-4 border-t border-slate-200/80 mb-10 text-xs text-slate-600 font-medium">
            <div className="inline-flex items-center gap-2">
              <CloudSun className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <span>Analisis Cuaca 3 Titik (Awal, Tengah, Akhir)</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Mic className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <span>Input Suara & Teks Bebas (NLP)</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <span>AI Safety Advisor Deterministik</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <Zap className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <span>Respon Rute Cepat (&lt; 1 Detik)</span>
            </div>
          </div>

          {/* Interactive Preview Simulator Card */}
          <div id="simulasi" className="scroll-mt-24 max-w-3xl mx-auto text-left bg-white border border-slate-200 rounded-3xl p-4 sm:p-7 shadow-xl shadow-slate-200/50 relative">
            
            {/* Topbar: Presets & Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline flex-shrink-0">
                  Skenario:
                </span>
                {demoData.map((d, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveScenario(idx)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex-shrink-0 whitespace-nowrap ${
                      activeScenario === idx
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {idx === 0 && <Bike className="w-3.5 h-3.5 inline mr-1" />}
                    {idx === 1 && <Bike className="w-3.5 h-3.5 inline mr-1" />}
                    {idx === 2 && <Car className="w-3.5 h-3.5 inline mr-1" />}
                    {idx === 0 ? "Margonda ➔ Tebet (Motor)" : idx === 1 ? "Depok ➔ Bundaran HI (Motor)" : "Cibubur ➔ Monas (Mobil)"}
                  </button>
                ))}
              </div>

              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                Live Preview
              </span>
            </div>

            {/* Input Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 mb-5">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0 ml-1" />
              <input
                type="text"
                readOnly
                value={currentDemo.query}
                className="bg-transparent text-xs sm:text-sm font-medium text-slate-800 w-full outline-none truncate"
              />
              <button
                onClick={handleVoiceSimulation}
                title="Simulasi Web Speech API"
                className={`p-2 rounded-xl transition-all flex-shrink-0 ${
                  isMicActive
                    ? "bg-rose-500 text-white animate-pulse"
                    : "bg-white text-slate-600 hover:text-sky-600 border border-slate-200 shadow-sm"
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            {/* 3-Point Weather Telemetry Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {/* Origin */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                  <Play className="w-3 h-3 text-emerald-600" />
                  <span>Titik Awal</span>
                </div>
                <div className="font-bold text-slate-900 text-sm truncate">{currentDemo.origin.name}</div>
                <div className="text-[11px] text-slate-400 truncate mb-2">{currentDemo.origin.detail}</div>
                <div className="flex items-baseline justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-xl font-black text-slate-900">{currentDemo.origin.temp}</span>
                  <span className="text-xs font-semibold text-slate-600">{currentDemo.origin.cond}</span>
                </div>
              </div>

              {/* Midpoint */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>Titik Tengah</span>
                </div>
                <div className="font-bold text-slate-900 text-sm truncate">{currentDemo.mid.name}</div>
                <div className="text-[11px] text-amber-700 truncate mb-2">{currentDemo.mid.detail}</div>
                <div className="flex items-baseline justify-between pt-2 border-t border-amber-200/60">
                  <span className="text-xl font-black text-amber-900">{currentDemo.mid.temp}</span>
                  <span className="text-xs font-semibold text-amber-800">{currentDemo.mid.cond}</span>
                </div>
              </div>

              {/* Destination */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1">
                  <Route className="w-3 h-3 text-rose-600" />
                  <span>Titik Akhir</span>
                </div>
                <div className="font-bold text-slate-900 text-sm truncate">{currentDemo.dest.name}</div>
                <div className="text-[11px] text-slate-400 truncate mb-2">{currentDemo.dest.detail}</div>
                <div className="flex items-baseline justify-between pt-2 border-t border-slate-200/60">
                  <span className="text-xl font-black text-slate-900">{currentDemo.dest.temp}</span>
                  <span className="text-xs font-semibold text-slate-600">{currentDemo.dest.cond}</span>
                </div>
              </div>
            </div>

            {/* AI Advisor Banner */}
            <div className="bg-gradient-to-r from-sky-50 to-indigo-50/60 border border-sky-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-sky-600/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 mb-0.5">{currentDemo.advTitle}</div>
                  <p className="text-xs text-slate-600 leading-relaxed">{currentDemo.advDesc}</p>
                </div>
              </div>
              <div className="text-xs font-bold text-sky-700 bg-white/80 px-3 py-1 rounded-full border border-sky-200 flex-shrink-0 self-start sm:self-auto">
                {currentDemo.advMeta}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Comparison Section: SmartRoute AI vs Google Maps */}
      <section className="py-14 sm:py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/40 via-slate-900 to-slate-900 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-2 block">
              Diferensiasi Produk
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Mengapa Bukan Google Maps Biasa?
            </h2>
            <p className="text-sm sm:text-base text-slate-400 mt-3 leading-relaxed">
              Google Maps mencari rute tercepat, tetapi sering mengabaikan realitas keselamatan pengendara motor dan komuter kota.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Navigasi Biasa */}
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider mb-4">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Navigasi Konvensional
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-5">Hanya Tercepat, Bukan Teraman</h3>
              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-400">
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Tidak mempedulikan Anda kehujanan di jalan layang tanpa tempat berteduh.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Sering mengarahkan motor ke JLNT Casablanca atau Antasari yang dilarang & kena tilang.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Hanya tahu cuaca di lokasi awal, buta kondisi hujan di kilometer tengah jalur.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Instruksi suara kaku ("200m belok ke barat daya") yang membingungkan pengendara.</span>
                </li>
              </ul>
            </div>

            {/* SmartRoute AI */}
            <div className="bg-gradient-to-b from-sky-950/80 to-slate-900 border-2 border-sky-500/80 rounded-3xl p-6 sm:p-8 relative shadow-2xl shadow-sky-950/50 backdrop-blur">
              <div className="absolute -top-3 right-6 bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-md">
                SmartRoute AI PRO
              </div>
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider mb-4">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                Didesain untuk Komuter Nyata
              </div>
              <h3 className="text-lg font-bold text-white mb-5">Proaktif Melindungi Sebelum Basah & Kena Tilang</h3>
              <ul className="space-y-3.5 text-xs sm:text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Jas Hujan Pitstop:</strong> Rekomendasi SPBU & shelter 1.5 km sebelum titik hujan lebat.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Zero-Tilang Guard:</strong> Menghindari JLNT Casablanca/Antasari & kalkulasi Ganjil-Genap otomatis.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Telemetri 3 Titik:</strong> Radar cuaca awal, tengah, dan akhir perjalanan secara simultan.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>TomTom Live Traffic:</strong> Estimasi kemacetan real-time & evaluasi jam tiba target komuter.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="fitur" className="scroll-mt-20 py-14 sm:py-20 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-2 block">
              Fitur Lengkap Sesuai PRD
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Kecerdasan Buatan untuk Setiap Kilometer
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Didesain khusus untuk pengendara motor dan mobil komuter perkotaan Jabodetabek.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center mb-4 text-2xl">
                  🧥
                </div>
                <div className="text-[10px] font-bold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full w-fit mb-2">
                  Khusus Pemotor
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-2">Jas Hujan Pitstop</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Deteksi radar hujan di depan rute dan sarankan SPBU Pertamina / shelter kanopi 1.5 km sebelum titik basah agar Anda siap sedia.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full w-fit mb-2">
                  Bebas Tilang ETLE
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-2">Zero-Tilang Guard</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Proteksi motor dari JLNT Casablanca, Antasari, dan Flyover Pesing. Untuk mobil, kalkulasi otomatis aturan Ganjil-Genap Jakarta.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center mb-4">
                  <CloudSun className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full w-fit mb-2">
                  OpenWeather Radar
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-2">Cuaca 3-Titik Simultan</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Menghilangkan titik buta cuaca dengan memantau suhu, curah hujan, dan kelembapan di titik awal, tengah jalur, dan tujuan akhir.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
                  <Mic className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full w-fit mb-2">
                  Groq AI LPU &lt; 1s
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-2">Input Suara & Teks Bebas</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cukup ketik atau ucapkan rute bahasa sehari-hari. Asisten AI langsung mengekstrak asal, tujuan, target jam tiba, dan preferensi rute.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack & Architecture Badges */}
      <section className="py-10 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-5">
            Ditenagai oleh Arsitektur Modern Berkinerja Tinggi
          </span>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-semibold text-slate-600">
            <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900" />
              Next.js 14 App Router
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Supabase Cloud PostgreSQL
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Groq AI LPU (Ultra-Fast)
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              OpenWeather Radar Telemetry
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              TomTom Live Traffic Engine
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Resend OTP Verification
            </span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="cara-kerja" className="scroll-mt-20 py-14 sm:py-20 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-2 block">
              Alur Kerja Sistem
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Hanya Tiga Langkah Cepat
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Dari kalimat instruksi Anda hingga rute teraman tersaji jelas di layar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Step 1 */}
            <div className="bg-slate-50/70 rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full w-fit mb-4 border border-sky-100">
                Langkah 01
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Ketik atau Sebutkan Rute</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Gunakan bahasa santai sehari-hari melalui ketikan teks atau tekan tombol mikrofon untuk menyebutkan asal, tujuan, dan kendaraan Anda.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50/70 rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full w-fit mb-4 border border-cyan-100">
                Langkah 02
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Analisis Jalur & Cuaca Multi-Titik</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mesin routing TomTom & OSRM menghitung rute, lalu OpenWeatherMap menyuplai kondisi cuaca riil di titik awal, tengah, dan akhir.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50/70 rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit mb-4 border border-emerald-100">
                Langkah 03
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Panduan Keselamatan & Mulai Jalan</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dapatkan estimasi waktu tempuh, titik pitstop jas hujan, status zero-tilang, dan rekomendasi AI sebelum hujan menghadang.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-14 sm:py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-2 block">
              Pertanyaan Umum
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tanya Jawab Seputar SmartRoute AI
            </h2>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-600 flex-shrink-0" />
                <span>Kenapa SmartRoute AI memantau 3 titik cuaca sekaligus?</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Di kota tropis seperti Jabodetabek, cuaca di titik keberangkatan sering kali cerah, tetapi di tengah jalan (misal Pasar Minggu atau Cawang) sudah turun hujan deras. Pemantauan 3 titik (Awal, Tengah, Akhir) memastikan Anda tidak terjebak badai mendadak tanpa persiapan.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-600 flex-shrink-0" />
                <span>Bagaimana cara kerja fitur Pitstop Jas Hujan?</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ketika sistem mendeteksi potensi hujan di titik tengah atau destinasi, algoritma kami secara otomatis menandai lokasi singgah aman (seperti SPBU Pertamina atau flyover berkanopi) sekitar 1.5 km sebelum zona hujan, sehingga Anda bisa berhenti memakai jas hujan sebelum basah kuyup.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-600 flex-shrink-0" />
                <span>Apa itu proteksi Zero-Tilang untuk motor?</span>
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Di Jakarta, jalan layang non-tol seperti JLNT Casablanca dan JLNT Antasari sangat berbahaya bagi motor dan dijaga tilang kamera ETLE. SmartRoute AI memproteksi rute Anda agar tetap berada di jalur arteri bawah yang aman dan legal bagi pengendara motor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 sm:py-16 bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Siap Hadapi Cuaca di Jalan dengan Lebih Percaya Diri?
          </h2>
          <p className="text-sm sm:text-base text-sky-100 max-w-2xl mx-auto leading-relaxed mb-8">
            Hindari terjebak hujan badai tanpa persiapan. Gunakan SmartRoute AI sekarang untuk perjalanan harian yang lebih aman dan terencana.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-sky-700 hover:bg-sky-50 font-bold px-7 py-3.5 rounded-full shadow-lg transition-transform hover:-translate-y-0.5 text-sm sm:text-base"
            >
              <span>Daftar Akun Gratis Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span>&copy; 2026 SmartRoute AI — Asisten Navigasi & Telemetri Cuaca Real-Time.</span>
          <div className="flex items-center gap-4">
            <Link href="/home" className="hover:text-sky-600">Perencana Rute</Link>
            <Link href="/history" className="hover:text-sky-600">Riwayat</Link>
            <Link href="/login" className="hover:text-sky-600">Masuk</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
