import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionUser();
    const url = new URL(req.url);
    const queryUserId = url.searchParams.get("userId");

    let userId = session?.userId || (queryUserId ? parseInt(queryUserId, 10) : null);

    let query = supabase
      .from("search_histories")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("[HistoryAPI] Supabase error:", error);
      return NextResponse.json([], { status: 200 });
    }

    const results = (rows || []).map((row) => {
      let routeData = {};
      let weatherData = {};

      if (typeof row.route_summary === "string") {
        try {
          routeData = JSON.parse(row.route_summary);
        } catch {}
      } else {
        routeData = row.route_summary || {};
      }

      if (typeof row.weather_summary === "string") {
        try {
          weatherData = JSON.parse(row.weather_summary);
        } catch {}
      } else {
        weatherData = row.weather_summary || {};
      }

      return {
        ...row,
        route_data: routeData,
        weather_data: weatherData,
      };
    });

    return NextResponse.json(results, { status: 200 });
  } catch (err: any) {
    console.error("[HistoryAPI] Exception:", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getSessionUser();
    const userId = session?.userId || 1;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Parameter id riwayat diperlukan." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("search_histories")
      .delete()
      .eq("id", parseInt(id))
      .eq("user_id", userId);

    if (error) {
      return NextResponse.json(
        { success: false, message: "Gagal menghapus riwayat." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Riwayat berhasil dihapus." },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[HistoryAPI] Delete error:", err);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat menghapus data." },
      { status: 500 }
    );
  }
}

