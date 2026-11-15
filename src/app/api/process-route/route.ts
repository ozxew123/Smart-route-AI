import { NextRequest, NextResponse } from "next/server";
import { processRouteRequestSchema } from "@/lib/schemas";
import { extractEntitiesWithGroq, generateSafetyAdviceWithGroq } from "@/lib/groq";
import { geocode, getRoute } from "@/lib/map";
import { sampleThreePoints, analyzeWeatherRisk, buildSafetyAdvice } from "@/lib/weather";
import { calculatePitstop, evaluateZeroTilang, evaluateArrivalTime } from "@/lib/safety-rules";
import { saveSearchHistory } from "@/lib/history";
import { supabase } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    // Validasi Zod untuk request body
    const parseResult = processRouteRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues[0]?.message || "Permintaan rute tidak valid.";
      return NextResponse.json({ success: false, message: errorMsg }, { status: 400 });
    }

    const { query: userQuery, vehicle: overrideVehicle, plate, userId: bodyUserId } = parseResult.data;
    const userPlate = plate === "Ganjil" ? "Ganjil" : "Genap";

    // 1. Ekstraksi NLP dengan Groq AI LPU (Termasuk Target Jam Tiba)
    const nlpResult = await extractEntitiesWithGroq(userQuery);
    const originName = nlpResult.origin;
    const destName = nlpResult.destination;
    const vehicle = overrideVehicle || nlpResult.vehicle || "motor";
    const targetArrivalTime = nlpResult.target_arrival_time || null;

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

    // 3. Routing Engine (TomTom Live Traffic dengan OSRM Fallback)
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

    // 4. Kalkulasi ETA & Evaluasi Ketepatan Waktu Tiba
    const arrivalEval = evaluateArrivalTime(routeData.duration_min, targetArrivalTime);
    routeData.departure_time = arrivalEval.departure_time;
    routeData.eta = arrivalEval.eta;
    routeData.target_arrival_time = arrivalEval.target_arrival_time;
    routeData.arrival_status = arrivalEval.arrival_status;
    routeData.delay_risk_min = arrivalEval.delay_risk_min;
    routeData.latest_departure_time = arrivalEval.latest_departure_time;

    // 5. Sampling Cuaca 3 Titik dengan Timeline Lintasan Dinamis
    const weather3Points = await sampleThreePoints(
      routeData.origin,
      routeData.midpoint,
      routeData.destination,
      routeData.duration_min
    );

    // 6. Decision Engine & Groq AI Safety Advice
    const riskAnalysis = analyzeWeatherRisk(weather3Points, vehicle);
    const baseAdvice = buildSafetyAdvice(riskAnalysis, vehicle, routeData.distance_km);
    const finalAdvice = await generateSafetyAdviceWithGroq(
      originName,
      destName,
      vehicle,
      weather3Points,
      baseAdvice,
      {
        duration_min: routeData.duration_min,
        normal_duration_min: routeData.normal_duration_min,
        traffic_delay_min: routeData.traffic_delay_min,
        departure_time: routeData.departure_time,
        eta: routeData.eta,
        target_arrival_time: routeData.target_arrival_time,
        arrival_status: routeData.arrival_status,
        delay_risk_min: routeData.delay_risk_min,
        latest_departure_time: routeData.latest_departure_time,
        routing_engine: routeData.routing_engine,
      }
    );

    // 7. Pitstop Jas Hujan Predictor & Zero-Tilang Guard
    const pitstopRecommendation = calculatePitstop(
      vehicle,
      routeData.coordinates,
      weather3Points,
      originName,
      destName
    );

    const zeroTilangAnalysis = evaluateZeroTilang(
      vehicle,
      originName,
      destName,
      userPlate
    );

    // 8. Simpan ke Riwayat di Supabase (Kompatibel dengan data lama)
    let historyId: number | null = null;
    const session = getSessionUser();
    let targetUserId = session?.userId || bodyUserId;

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
      historyId = await saveSearchHistory({
        userId: targetUserId,
        rawQuery: userQuery,
        origin: originName,
        destination: destName,
        vehicle,
        routeSummary: {
          distance_km: routeData.distance_km,
          duration_min: routeData.duration_min,
          normal_duration_min: routeData.normal_duration_min,
          traffic_delay_min: routeData.traffic_delay_min,
          departure_time: routeData.departure_time,
          eta: routeData.eta,
          target_arrival_time: routeData.target_arrival_time,
          arrival_status: routeData.arrival_status,
          delay_risk_min: routeData.delay_risk_min,
          latest_departure_time: routeData.latest_departure_time,
          routing_engine: routeData.routing_engine,
        },
        weatherSummary: weather3Points,
        aiAdvice: finalAdvice,
      });
    }

    return NextResponse.json(
      {
        success: true,
        query: userQuery,
        entities: {
          origin: originName,
          destination: destName,
          vehicle,
          plate: userPlate,
          target_arrival_time: targetArrivalTime,
        },
        route: routeData,
        arrival_evaluation: arrivalEval,
        weather: weather3Points,
        risk: riskAnalysis,
        advice: finalAdvice,
        pitstop: pitstopRecommendation,
        zero_tilang: zeroTilangAnalysis,
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
