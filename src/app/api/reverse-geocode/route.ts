import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/map";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json(
      { error: "Koordinat lokasi tidak valid." },
      { status: 400 }
    );
  }

  try {
    const locationName = await reverseGeocode(lat, lon);
    return NextResponse.json({ locationName });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat mendeteksi nama lokasi.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}