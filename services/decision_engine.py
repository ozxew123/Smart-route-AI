class DecisionEngine:
    """Decision Engine & Aturan Keselamatan (Class Diagram: DecisionEngine)"""

    @staticmethod
    def analyze_weather_risk(weather_3points: dict, vehicle: str = "motor") -> dict:
        """
        Menganalisis tingkat risiko cuaca di sepanjang rute untuk jenis kendaraan tertentu.
        Tingkat risiko: Rendah (Hijau), Sedang (Kuning), Tinggi (Merah).
        """
        rain_detected = False
        rain_locations = []
        high_wind = False

        for key, w in weather_3points.items():
            cond = str(w.get('condition', '')).lower()
            desc = str(w.get('description', '')).lower()
            label = w.get('label', key)
            
            # Cek potensi hujan atau badai
            if any(term in cond or term in desc for term in ['rain', 'hujan', 'drizzle', 'thunderstorm', 'badai']):
                rain_detected = True
                rain_locations.append(label)

            # Cek kecepatan angin di atas 8 m/s (~29 km/jam)
            if w.get('wind_speed_ms', 0) > 8:
                high_wind = True

        risk_level = "Rendah"
        if rain_detected:
            risk_level = "Tinggi" if vehicle == "motor" else "Sedang"
        elif high_wind:
            risk_level = "Sedang"

        return {
            "risk_level": risk_level,
            "rain_detected": rain_detected,
            "rain_locations": rain_locations,
            "high_wind": high_wind,
            "vehicle": vehicle
        }

    @staticmethod
    def build_safety_advice(risk_analysis: dict, vehicle: str = "motor", distance_km: float = 0.0) -> str:
        """Menghasilkan saran keselamatan berdasarkan data cuaca dan jenis kendaraan."""
        advice_points = []

        if risk_analysis["rain_detected"]:
            loc_str = ", ".join(risk_analysis["rain_locations"])
            if vehicle == "motor":
                advice_points.append(
                    f"⚠️ Terdeteksi hujan/gerimis di area ({loc_str}). Siapkan jas hujan sebelum berangkat dan periksa ban serta rem motor."
                )
                advice_points.append(
                    "Kurangi kecepatan, jaga jarak pengereman lebih jauh dari kendaraan di depan, dan hindari berteduh di bawah pohon rindang/flyover."
                )
            else:
                advice_points.append(
                    f"⚠️ Jalanan basah terdeteksi di ({loc_str}). Nyalakan lampu utama, pastikan wiper berfungsi baik, dan jaga jarak aman."
                )
        else:
            advice_points.append("☀️ Kondisi rute diprakirakan relatif bersahabat.")
            if vehicle == "motor":
                advice_points.append("Gunakan helm berstandar SNI, jaket, dan periksa tekanan angin ban sebelum berkendara.")
            else:
                advice_points.append("Gunakan sabuk keselamatan dan patuhi rambu batas kecepatan.")

        if risk_analysis.get("high_wind"):
            advice_points.append("Waspadai hembusan angin kencang di jalan terbuka atau jembatan layang.")

        if distance_km > 30:
            advice_points.append(f"Perjalanan cukup jauh ({distance_km} km). Luangkan waktu beristirahat jika merasa lelah.")

        advice_points.append("Perhatian: Saran ini bersifat informatif. Pengendara tetap wajib mematuhi aturan lalu lintas dan kondisi faktual di jalan.")

        return " ".join(advice_points)

