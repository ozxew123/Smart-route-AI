import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyPassword, createSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").toLowerCase().trim();
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    // Ambil data user dari Supabase
    const { data: user, error } = await supabase
      .from("users")
      .select("id, nama, email, password_hash")
      .eq("email", email)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json(
        { success: false, message: "Email atau kata sandi tidak valid." },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(user.password_hash, password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Email atau kata sandi tidak valid." },
        { status: 401 }
      );
    }

    createSessionCookie({
      userId: user.id,
      name: user.nama,
      email: user.email,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Login berhasil!",
        user: {
          id: user.id,
          nama: user.nama,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[Login] Exception:", err);
    return NextResponse.json(
      { success: false, message: "Gagal memproses autentikasi masuk." },
      { status: 500 }
    );
  }
}

