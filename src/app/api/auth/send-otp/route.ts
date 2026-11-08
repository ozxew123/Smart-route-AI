import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateOtp, sendOtpEmail } from "@/lib/otp";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").toLowerCase().trim();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Alamat email wajib diisi." },
        { status: 400 }
      );
    }

    // Cek apakah email terdaftar di database Supabase
    const { data: user } = await supabase
      .from("users")
      .select("id, nama")
      .eq("email", email)
      .maybeSingle();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Alamat email tidak terdaftar dalam sistem." },
        { status: 404 }
      );
    }

    // Buat kode OTP 6-digit
    const otpCode = generateOtp(email);

    // Kirim email via Resend
    const sendResult = await sendOtpEmail(email, otpCode);

    return NextResponse.json(
      {
        success: sendResult.success,
        message: sendResult.message,
      },
      { status: sendResult.success ? 200 : 500 }
    );
  } catch (err: any) {
    console.error("[SendOTP] Error:", err);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat memproses pengiriman OTP." },
      { status: 500 }
    );
  }
}

