import { NextRequest, NextResponse } from "next/server";
import { extractEntitiesWithGroq, generateSafetyAdviceWithGroq } from "@/lib/groq";
import { geocode, getRoute } from "@/lib/map";
import { sampleThreePoints, analyzeWeatherRisk, buildSafetyAdvice } from "@/lib/weather";
import { supabase } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userQuery = (body.query || "").trim();
    const overrideVehicle = body.vehicle;

    if (!userQuery) {
      return NextResponse.json(
        { success: false, message: "Permintaan rute tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (userQuery.length > 300) {
      return NextResponse.json(
        { success: false, message: "Teks instruksi perjalanan maksimal 300 karakter." },
        { status: 400 }
      );
    }

    // 1. Ekstraksi NLP dengan Groq AI LPU
    const nlpResult = await extractEntitiesWithGroq(userQuery);
    const originName = nlpResult.origin;
    const destName = nlpResult.destination;
    const vehicle = overrideVehicle || nlpResult.vehicle || "motor";

    if (!originName || !destName) {
      const missing: string[] = [];
      if (!originName) missing.push("lokasi asal");
      if (!destName) missing.push("lokasi tujuan");
      return NextResponse.json(
        {
          success: false,
          clarification_needed: true,
          message: `Mohon lengkapi ${missing.join(" dan ")} perjalanan Anda.`,
          extracted: nlpResult,
        },
        { status: 200 }
      );
    }

    // 2. Geocoding Cerdas (Nominatim + Fallback)
    const originGeo = await geocode(originName);
    if (!originGeo) {
      return NextResponse.json(
        { success: false, message: `Lokasi asal '${originName}' tidak ditemukan pada peta.` },
        { status: 404 }
      );
    }

    const destGeo = await geocode(destName);
    if (!destGeo) {
      return NextResponse.json(
        { success: false, message: `Lokasi tujuan '${destName}' tidak ditemukan pada peta.` },
        { status: 404 }
      );
    }

    // 3. Routing OSRM
    const routeData = await getRoute(originGeo, destGeo, vehicle);
    if (!routeData) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak dapat menemukan rute perjalanan antara kedua titik tersebut.",
        },
        { status: 404 }
      );
    }

    // 4. Sampling Cuaca 3 Titik
    const weather3Points = await sampleThreePoints(
      routeData.origin,
      routeData.midpoint,
      routeData.destination
    );

    // 5. Decision Engine & Groq AI Safety Advice
    const riskAnalysis = analyzeWeatherRisk(weather3Points, vehicle);
    const baseAdvice = buildSafetyAdvice(riskAnalysis, vehicle, routeData.distance_km);
    const finalAdvice = await generateSafetyAdviceWithGroq(
      originName,
      destName,
      vehicle,
      weather3Points,
      baseAdvice
    );

    // 6. Simpan ke Riwayat di Supabase
    let historyId: number | null = null;
    const session = getSessionUser();
    let targetUserId = session?.userId || body.userId;

    // Jika tidak ada session userId, ambil user ID terakhir dari database Supabase
    if (!targetUserId) {
      try {
        const { data: latestUser } = await supabase
          .from("users")
          .select("id")
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestUser?.id) {
          targetUserId = latestUser.id;
        }
      } catch {}
    }

    if (targetUserId) {
      try {
        const { data: insertedHistory, error: insErr } = await supabase
          .from("search_histories")
          .insert({
            user_id: targetUserId,
            raw_query: userQuery,
            origin: originName,
            destination: destName,
            vehicle: vehicle,
            route_summary: JSON.stringify({
              distance_km: routeData.distance_km,
              duration_min: routeData.duration_min,
            }),
            weather_summary: JSON.stringify(weather3Points),
            ai_advice: finalAdvice,
          })
          .select("id")
          .maybeSingle();

        if (insErr) {
          console.error("[RouteAPI] Supabase insert error:", insErr);
        } else if (insertedHistory) {
          historyId = insertedHistory.id;
          console.log("[RouteAPI] Riwayat berhasil disimpan ke Supabase dengan ID:", historyId);
        }
      } catch (err) {
        console.warn("[RouteAPI] Gagal menyimpan riwayat:", err);
      }
    }

    return NextResponse.json(
      {
        success: true,
        query: userQuery,
        entities: {
          origin: originName,
          destination: destName,
          vehicle,
        },
        route: routeData,
        weather: weather3Points,
        risk: riskAnalysis,
        advice: finalAdvice,
        history_id: historyId,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[ProcessRouteAPI] Error:", err);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server saat memproses rute." },
      { status: 500 }
    );
  }
}

