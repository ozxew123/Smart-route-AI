"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Star, Plus, Trash2, X, MapPin, Pencil, Check } from "lucide-react";

export interface FavoriteLocation {
  id: number;
  label: string;
  address: string;
  icon: string;
}

interface FavoriteLocationsProps {
  /** Dipanggil saat chip diklik → isi query input */
  onSelect: (address: string) => void;
}

const ICON_OPTIONS = ["🏠", "💼", "🏫", "🏥", "🏪", "⛽", "🏋️", "🕌", "🏖️", "📍"];

export default function FavoriteLocations({ onSelect }: FavoriteLocationsProps) {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [icon, setIcon] = useState("📍");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    try {
      const res = await fetch("/api/favorites");
      if (!res.ok) return;
      const data = await res.json();
      setFavorites(data.favorites || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const resetForm = () => {
    setLabel("");
    setAddress("");
    setIcon("📍");
    setError(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !address.trim()) return;
    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        // PATCH — update
        const res = await fetch(`/api/favorites/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label, address, icon }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setFavorites((prev) =>
          prev.map((f) => (f.id === editingId ? { ...f, label, address, icon } : f))
        );
      } else {
        // POST — baru
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label, address, icon }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setFavorites((prev) => [...prev, data.favorite]);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus lokasi favorit ini?")) return;
    try {
      await fetch(`/api/favorites/${id}`, { method: "DELETE" });
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    } catch {
      // silent
    }
  };

  const handleEdit = (fav: FavoriteLocation) => {
    setLabel(fav.label);
    setAddress(fav.address);
    setIcon(fav.icon);
    setEditingId(fav.id);
    setShowForm(true);
    setError(null);
  };

  if (loading) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h5 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          Lokasi Favorit
        </h5>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-1 rounded-xl transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah
          </button>
        )}
      </div>

      {/* Chip list */}
      {favorites.length === 0 && !showForm && (
        <p className="text-xs text-slate-400 text-center py-3">
          Belum ada lokasi favorit. Tambahkan rumah, kantor, atau kampus!
        </p>
      )}

      {favorites.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {favorites.map((fav) => (
            <div key={fav.id} className="group flex items-center gap-1">
              <button
                onClick={() => onSelect(`${fav.address}`)}
                title={fav.address}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition max-w-[160px]"
              >
                <span>{fav.icon}</span>
                <span className="truncate">{fav.label}</span>
              </button>
              {/* Edit & Delete actions */}
              <button
                onClick={() => handleEdit(fav)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition"
                title="Edit"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleDelete(fav.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Hapus"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Form tambah/edit */}
      {showForm && (
        <form onSubmit={handleSave} className="space-y-3 mt-2 animate-fadeIn">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-700">
              {editingId ? "Edit lokasi favorit" : "Tambah lokasi favorit"}
            </span>
            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Pilih ikon */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 mb-1 block">Ikon</label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map((em) => (
                <button
                  type="button"
                  key={em}
                  onClick={() => setIcon(em)}
                  className={`w-8 h-8 rounded-xl text-base flex items-center justify-center border transition ${
                    icon === em
                      ? "border-sky-400 bg-sky-50 shadow-sm"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
              Nama / Label <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={30}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="cth: Rumah, Kantor, Kampus"
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400"
            />
          </div>

          {/* Alamat */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
              Alamat / Nama Lokasi <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                required
                maxLength={150}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="cth: Margonda Raya, Depok"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Nama lokasi ini yang akan digunakan saat mencari rute.
            </p>
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan Favorit"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
            >
              Batal
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
