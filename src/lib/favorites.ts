import { supabase } from "./supabase";

export interface FavoriteLocation {
  id: number;
  user_id: number;
  label: string;        // "Rumah", "Kantor", "Kampus", dll.
  address: string;      // Nama lokasi lengkap untuk geocoding
  icon: string;         // Emoji ikon: "🏠", "💼", "🏫", dsb.
  created_at: string;
}

export interface SaveFavoriteInput {
  userId: number;
  label: string;
  address: string;
  icon: string;
}

/**
 * Ambil semua lokasi favorit milik user
 */
export async function getFavorites(userId: number): Promise<FavoriteLocation[]> {
  try {
    const { data, error } = await supabase
      .from("favorite_locations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[Favorites] Supabase select error:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("[Favorites] Exception fetching favorites:", err);
    return [];
  }
}

/**
 * Simpan lokasi favorit baru (maks 10 per user)
 */
export async function saveFavorite(input: SaveFavoriteInput): Promise<FavoriteLocation | null> {
  try {
    // Cek duplikat label
    const { data: existing } = await supabase
      .from("favorite_locations")
      .select("id")
      .eq("user_id", input.userId)
      .ilike("label", input.label.trim())
      .maybeSingle();

    if (existing) {
      throw new Error(`Lokasi dengan label "${input.label}" sudah ada.`);
    }

    // Cek batas maksimal 10 lokasi
    const { count } = await supabase
      .from("favorite_locations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", input.userId);

    if ((count ?? 0) >= 10) {
      throw new Error("Maksimal 10 lokasi favorit. Hapus salah satu terlebih dahulu.");
    }

    const { data, error } = await supabase
      .from("favorite_locations")
      .insert({
        user_id: input.userId,
        label: input.label.trim(),
        address: input.address.trim(),
        icon: input.icon,
      })
      .select()
      .single();

    if (error) {
      console.error("[Favorites] Supabase insert error:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("[Favorites] Exception saving favorite:", err);
    throw err;
  }
}

/**
 * Hapus lokasi favorit berdasarkan id (proteksi: hanya milik user sendiri)
 */
export async function deleteFavorite(id: number, userId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("favorite_locations")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("[Favorites] Supabase delete error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Favorites] Exception deleting favorite:", err);
    return false;
  }
}

/**
 * Update label/address/icon lokasi favorit
 */
export async function updateFavorite(
  id: number,
  userId: number,
  patch: Partial<Pick<FavoriteLocation, "label" | "address" | "icon">>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("favorite_locations")
      .update(patch)
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("[Favorites] Supabase update error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Favorites] Exception updating favorite:", err);
    return false;
  }
}
