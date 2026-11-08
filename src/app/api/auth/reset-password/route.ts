import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";
import { verifyOtp } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").toLowerCase().trim();
    const newPassword = body.password || "";
    const confirmPassword = body.confirm_password || "";
    const otp = (body.otp || "").trim();

    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Email dan kata sandi baru wajib diisi." },
        { status: 400 }
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "Konfirmasi kata sandi tidak cocok." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Kata sandi baru minimal 6 karakter." },
        { status: 400 }
      );
    }

    // Jika OTP disertakan, lakukan verifikasi
    if (otp) {
      const otpCheck = verifyOtp(email, otp);
      if (!otpCheck.valid) {
        return NextResponse.json({ success: false, message: otpCheck.message }, { status: 400 });
      }
    }

    // Cek apakah user ada di database
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Alamat email tidak terdaftar dalam sistem." },
        { status: 404 }
      );
    }

    // Hash kata sandi baru
    const passwordHash = hashPassword(newPassword);

    // Update di Supabase
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("email", email);

    if (updateError) {
      console.error("[ResetPassword] Supabase update error:", updateError);
      return NextResponse.json(
        { success: false, message: "Gagal memperbarui kata sandi di database." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru Anda.",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[ResetPassword] Exception:", err);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan pada server saat reset kata sandi." },
      { status: 500 }
    );
  }
}

