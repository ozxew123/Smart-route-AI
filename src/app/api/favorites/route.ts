import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getFavorites, saveFavorite } from "@/lib/favorites";

// GET /api/favorites — ambil semua lokasi favorit user
export async function GET() {
  const user = getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await getFavorites(user.userId);
  return NextResponse.json({ success: true, favorites });
}

// POST /api/favorites — simpan lokasi favorit baru
export async function POST(req: NextRequest) {
  const user = getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { label, address, icon } = body;

    if (!label?.trim() || !address?.trim()) {
      return NextResponse.json(
        { error: "Label dan alamat lokasi wajib diisi." },
        { status: 400 }
      );
    }

    const favorite = await saveFavorite({
      userId: user.userId,
      label: label.trim(),
      address: address.trim(),
      icon: icon || "📍",
    });

    if (!favorite) {
      return NextResponse.json(
        { error: "Gagal menyimpan lokasi favorit." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, favorite }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
