"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  LogOut,
  Compass,
  Clock,
  ShieldCheck,
  ChevronDown,
  Bike,
  Sparkles
} from "lucide-react";

export interface UserProfileData {
  nama: string;
  email: string;
  phone?: string;
  vehicle: "motor" | "mobil";
  default_origin?: string;
  avoid_heavy_rain?: boolean;
  raincoat_alert?: boolean;
  speed_caution?: boolean;
}

export const defaultProfile: UserProfileData = {
  nama: "Pengendara Komuter",
  email: "komuter@smartroute.id",
  phone: "0812-9876-5432",
  vehicle: "motor",
  default_origin: "Margonda, Depok",
  avoid_heavy_rain: true,
  raincoat_alert: true,
  speed_caution: true,
};

export default function UserNavDropdown() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number; nama: string; email: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ambil data user autentikasi dari sesi backend
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setUser(data.user);
        } else {
          // Cek fallback localStorage jika ada
          const stored = localStorage.getItem("smartroute_user_profile");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed.email) setUser(parsed);
            } catch {}
          }
        }
      })
      .catch(() => {});

    // Klik di luar dropdown untuk menutup
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    localStorage.removeItem("smartroute_user_profile");
    setUser(null);
    setIsOpen(false);
    router.replace("/");
  };

  if (!user) {
    return null;
  }

  // Dapatkan inisial nama
  const initials = user.nama
    ? user.nama
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "SR";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1 pl-2 pr-3 rounded-full border border-slate-200/80 bg-white/90 hover:bg-slate-50 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
        title="Menu Profil Pengguna"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-cyan-500 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
          {initials}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
            {user.nama}
          </div>
          <div className="text-[10px] text-slate-400 font-medium leading-none flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>PRO</span>
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
            isOpen ? "rotate-180 text-sky-600" : ""
          }`}
        />
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div
          style={{ backgroundColor: "#ffffff" }}
          className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-900/15 py-2 z-[9999] animate-fadeIn text-left"
        >
          {/* Header Info */}
          <div
            style={{ backgroundColor: "#f8fafc" }}
            className="px-5 py-4 border-b border-slate-100 bg-slate-50 rounded-t-3xl"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-sky-500/20">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-sm text-slate-900 truncate">
                  {user.nama}
                </div>
                <div className="text-xs text-slate-400 truncate">{user.email}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
              <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 font-bold px-2 py-0.5 rounded-full border border-sky-200">
                <Sparkles className="w-3 h-3" /> Akun Terverifikasi
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <div className="px-2 py-2 space-y-1 text-xs font-semibold text-slate-700">
            <Link
              href="/home"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sky-50 hover:text-sky-700 transition"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100/60 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold">Asisten Rute & Navigasi</div>
                <div className="text-[10px] text-slate-400 font-normal">
                  Peta navigasi rute & telemetri cuaca
                </div>
              </div>
            </Link>

            <Link
              href="/history"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sky-50 hover:text-sky-700 transition"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-100/60 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold">Riwayat Perjalanan</div>
                <div className="text-[10px] text-slate-400 font-normal">
                  Daftar rute komuter yang pernah dicari
                </div>
              </div>
            </Link>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100 my-1 px-2" />

          {/* Logout */}
          <div className="px-2 pb-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition"
            >
              <div className="w-7 h-7 rounded-lg bg-rose-100/60 text-rose-600 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-4 h-4" />
              </div>
              <span>Keluar dari Akun</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
