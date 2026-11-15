import { supabase } from "./supabase";

export interface SaveHistoryInput {
  userId: number;
  rawQuery: string;
  origin: string;
  destination: string;
  vehicle: string;
  routeSummary: Record<string, any>;
  weatherSummary: Record<string, any>;
  aiAdvice: string;
}

export interface SearchHistoryRecord {
  id: number;
  user_id: number;
  raw_query: string;
  origin: string;
  destination: string;
  vehicle: string;
  route_summary: any;
  weather_summary: any;
  route_data?: any;
  weather_data?: any;
  ai_advice: string;
  created_at: string;
}

/**
 * Menyimpan riwayat pencarian rute ke Supabase
 */
export async function saveSearchHistory(input: SaveHistoryInput): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from("search_histories")
      .insert({
        user_id: input.userId,
        raw_query: input.rawQuery,
        origin: input.origin,
        destination: input.destination,
        vehicle: input.vehicle,
        route_summary: JSON.stringify(input.routeSummary),
        weather_summary: JSON.stringify(input.weatherSummary),
        ai_advice: input.aiAdvice,
      })
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[HistoryService] Supabase insert error:", error);
      return null;
    }

    return data?.id || null;
  } catch (err) {
    console.warn("[HistoryService] Gagal menyimpan riwayat:", err);
    return null;
  }
}

/**
 * Mengambil riwayat pencarian untuk pengguna tertentu
 */
export async function getSearchHistories(
  userId?: number | null,
  limit: number = 30
): Promise<SearchHistoryRecord[]> {
  try {
    let query = supabase
      .from("search_histories")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: rows, error } = await query;
    if (error) {
      console.error("[HistoryService] Supabase select error:", error);
      return [];
    }

    return (rows || []).map((row) => {
      let routeData: any = {};
      let weatherData: any = {};

      if (typeof row.route_summary === "string") {
        try {
          routeData = JSON.parse(row.route_summary);
        } catch {
          routeData = {};
        }
      } else {
        routeData = row.route_summary || {};
      }

      if (typeof row.weather_summary === "string") {
        try {
          weatherData = JSON.parse(row.weather_summary);
        } catch {
          weatherData = {};
        }
      } else {
        weatherData = row.weather_summary || {};
      }

      return {
        ...row,
        route_data: routeData,
        weather_data: weatherData,
      };
    });
  } catch (err) {
    console.error("[HistoryService] Exception fetching histories:", err);
    return [];
  }
}

/**
 * Menghapus satu catatan riwayat milik user
 */
export async function deleteSearchHistory(id: number, userId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("search_histories")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("[HistoryService] Supabase delete error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[HistoryService] Exception deleting history:", err);
    return false;
  }
}
