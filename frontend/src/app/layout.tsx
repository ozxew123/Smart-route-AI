import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0284C7",
};

export const metadata: Metadata = {
  title: "SmartRoute AI — Asisten Perjalanan Pintar & Analisis Cuaca Real-Time",
  description: "Aplikasi navigasi komuter cerdas berbasis NLP dan analisis cuaca multi-titik real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
