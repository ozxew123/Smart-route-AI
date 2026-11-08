import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPassword, createSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const nama = (body.nama || "").trim();
    const email = (body.email || "").toLowerCase().trim();
    const password = body.password || "";

    if (!nama || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Semua kolom (nama, email, password) wajib diisi." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Kata sandi minimal 6 karakter." },
        { status: 400 }
      );
    }

    // Cek apakah email sudah terdaftar di Supabase
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email sudah terdaftar. Silakan gunakan email lain atau masuk." },
        { status: 409 }
      );
    }

    // Hash kata sandi
    const passwordHash = hashPassword(password);

    // Insert user baru ke Supabase
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        nama,
        email,
        password_hash: passwordHash,
      })
      .select("id, nama, email")
      .single();

    if (insertError || !newUser) {
      console.error("[Register] Supabase error:", insertError);
      return NextResponse.json(
        { success: false, message: "Terjadi kesalahan saat mendaftarkan akun." },
        { status: 500 }
      );
    }

    // Buat session cookie
    createSessionCookie({
      userId: newUser.id,
      name: newUser.nama,
      email: newUser.email,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Akun pengendara berhasil didaftarkan!",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[Register] Exception:", err);
    return NextResponse.json(
      { success: false, message: "Gagal memproses pendaftaran akun." },
      { status: 500 }
    );
  }
}

