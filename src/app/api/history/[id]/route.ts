import { NextRequest, NextResponse } from "next/server";
import { deleteSearchHistory } from "@/lib/history";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionUser();
    const userId = session?.userId || 1;
    const historyId = parseInt(params.id, 10);

    if (isNaN(historyId)) {
      return NextResponse.json(
        { success: false, message: "ID riwayat tidak valid." },
        { status: 400 }
      );
    }

    const success = await deleteSearchHistory(historyId, userId);
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
    console.error("[HistoryAPI] Exception:", err);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat menghapus data." },
      { status: 500 }
    );
  }
}
