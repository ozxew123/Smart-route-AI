import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSessionUser();
    const userId = session?.userId || 1;
    const historyId = parseInt(params.id);

    if (isNaN(historyId)) {
      return NextResponse.json(
        { success: false, message: "ID riwayat tidak valid." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("search_histories")
      .delete()
      .eq("id", historyId)
      .eq("user_id", userId);

    if (error) {
      console.error("[HistoryAPI] Delete error:", error);
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

