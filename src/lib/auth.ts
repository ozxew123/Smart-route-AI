import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "smartroute_session";
const SECRET_KEY = process.env.SECRET_KEY || "smartroute-ai-secret-key-change-in-production";

export function hashPassword(password: string): string {
  const hash = crypto.createHash("sha256").update(password, "utf8").digest("hex");
  return `sha256$${hash}`;
}

export function verifyPassword(storedHash: string, password: string): boolean {
  if (!storedHash) return false;
  if (storedHash.startsWith("sha256$")) {
    const hash = crypto.createHash("sha256").update(password, "utf8").digest("hex");
    return storedHash === `sha256$${hash}`;
  }
  return false;
}

export interface SessionData {
  userId: number;
  name: string;
  email: string;
}

// Simple signed session cookie
export function createSessionCookie(data: SessionData) {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64");
  const signature = crypto.createHmac("sha256", SECRET_KEY).update(payload).digest("hex");
  const value = `${payload}.${signature}`;

  cookies().set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function getSessionUser(): SessionData | null {
  try {
    const cookie = cookies().get(SESSION_COOKIE_NAME);
    if (!cookie?.value) return null;

    const [payload, signature] = cookie.value.split(".");
    if (!payload || !signature) return null;

    const expected = crypto.createHmac("sha256", SECRET_KEY).update(payload).digest("hex");
    if (expected !== signature) return null;

    const json = Buffer.from(payload, "base64").toString("utf-8");
    return JSON.parse(json) as SessionData;
  } catch {
    return null;
  }
}

export function clearSessionCookie() {
  cookies().delete(SESSION_COOKIE_NAME);
}

