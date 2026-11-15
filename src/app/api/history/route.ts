import { NextRequest, NextResponse } from "next/server";
import { getSearchHistories, deleteSearchHistory } from "@/lib/history";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionUser();
    const url = new URL(req.url);
    const queryUserId = url.searchParams.get("userId");

    const userId = session?.userId || (queryUserId ? parseInt(queryUserId, 10) : null);
    const results = await getSearchHistories(userId, 30);

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

    const success = await deleteSearchHistory(parseInt(id, 10), userId);
    if (!success) {
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
