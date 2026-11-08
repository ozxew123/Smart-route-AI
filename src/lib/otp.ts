import { Resend } from "resend";

interface OtpEntry {
  code: string;
  expiresAt: number;
}

// In-memory store untuk OTP (10 menit TTL)
const otpStore = new Map<string, OtpEntry>();

const resendApiKey = process.env.RESEND_API_KEY || "";
let resendClient: Resend | null = null;
if (resendApiKey && !resendApiKey.startsWith("your_")) {
  try {
    resendClient = new Resend(resendApiKey);
  } catch (err) {
    console.warn("[Resend] Gagal menginisialisasi Resend client:", err);
  }
}

export function generateOtp(email: string): string {
  const cleanEmail = email.toLowerCase().trim();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 menit

  otpStore.set(cleanEmail, { code, expiresAt });
  return code;
}

export function verifyOtp(email: string, code: string): { valid: boolean; message: string } {
  const cleanEmail = email.toLowerCase().trim();
  const entry = otpStore.get(cleanEmail);

  if (!entry) {
    return { valid: false, message: "Kode OTP belum diminta atau sudah kedaluwarsa." };
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(cleanEmail);
    return { valid: false, message: "Kode OTP sudah kedaluwarsa. Silakan minta kode baru." };
  }

  if (entry.code !== code.trim()) {
    return { valid: false, message: "Kode OTP yang Anda masukkan salah." };
  }

  // Hapus setelah berhasil diverifikasi (one-time use)
  otpStore.delete(cleanEmail);
  return { valid: true, message: "Kode OTP valid." };
}

export async function sendOtpEmail(toEmail: string, otpCode: string): Promise<{ success: boolean; message: string }> {
  const cleanEmail = toEmail.toLowerCase().trim();

  if (!resendClient) {
    // Mode simulasi informatif jika RESEND_API_KEY belum diisi
    console.log(`[SIMULASI OTP] Kode OTP untuk ${cleanEmail} adalah: ${otpCode}`);
    return {
      success: true,
      message: `Kode OTP terkirim (Mode Simulasi Dev): ${otpCode}. Masukkan RESEND_API_KEY di .env untuk pengiriman asli ke Gmail.`,
    };
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || "SmartRoute AI <onboarding@resend.dev>";

    const { error } = await resendClient.emails.send({
      from: fromAddress,
      to: [cleanEmail],
      subject: `[${otpCode}] Kode OTP Reset Kata Sandi - SmartRoute AI`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #0284c7; margin: 0; font-size: 24px; font-weight: 800;">SmartRoute AI</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Asisten Navigasi & Telemetri Cuaca Real-Time</p>
          </div>
          
          <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
            <p style="color: #0369a1; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">Kode Verifikasi Atur Ulang Kata Sandi</p>
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #0284c7; margin: 8px 0;">${otpCode}</div>
            <p style="color: #64748b; font-size: 12px; margin: 8px 0 0 0;">Kode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapa pun.</p>
          </div>

          <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0;">
            Halo, kami menerima permintaan untuk mengatur ulang kata sandi akun SmartRoute AI Anda. Jika Anda tidak merasa melakukan permintaan ini, abaikan email ini dengan aman.
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
            &copy; 2026 SmartRoute AI. Didesain untuk keselamatan komuter jalan raya.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[Resend] Error response:", error);
      return { success: false, message: `Gagal mengirim email: ${error.message}` };
    }

    return { success: true, message: `Kode OTP berhasil dikirim ke ${cleanEmail}. Silakan cek kotak masuk atau folder spam Anda.` };
  } catch (err: any) {
    console.error("[Resend] Exception sending email:", err);
    return { success: false, message: `Gagal menghubungi server email: ${err?.message || "Unknown error"}` };
  }
}

