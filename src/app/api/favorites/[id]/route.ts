import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { deleteFavorite, updateFavorite } from "@/lib/favorites";

// DELETE /api/favorites/[id] — hapus lokasi favorit
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  const deleted = await deleteFavorite(id, user.userId);
  if (!deleted) {
    return NextResponse.json({ error: "Gagal menghapus favorit." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// PATCH /api/favorites/[id] — edit label/address/icon
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID tidak valid." }, { status: 400 });
  }

  try {
    const body = await req.json();
    const patch: Record<string, string> = {};
    if (body.label) patch.label = body.label.trim();
    if (body.address) patch.address = body.address.trim();
    if (body.icon) patch.icon = body.icon;

    const updated = await updateFavorite(id, user.userId, patch);
    if (!updated) {
      return NextResponse.json({ error: "Gagal memperbarui favorit." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }
}
