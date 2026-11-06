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
        missing_weather = []
        primary_weather_icon = "01d"

        for key, w in weather_3points.items():
            label = w.get('label', key)
            if not w.get('is_available', True):
                missing_weather.append(label)
                continue

            cond = str(w.get('condition', '')).lower()
            desc = str(w.get('description', '')).lower()
            
            # Cek potensi hujan atau badai
            if any(term in cond or term in desc for term in ['rain', 'hujan', 'drizzle', 'thunderstorm', 'badai']):
                rain_detected = True
                rain_locations.append(label)
                primary_weather_icon = w.get('icon', '10d')

            # Cek kecepatan angin di atas 8 m/s (~29 km/jam)
            if w.get('wind_speed_ms', 0) > 8:
                high_wind = True

            if not rain_detected and w.get('icon'):
                primary_weather_icon = w.get('icon')

        risk_level = "Rendah"
        if rain_detected:
            risk_level = "Tinggi" if vehicle == "motor" else "Sedang"
        elif high_wind or missing_weather:
            risk_level = "Sedang"

        return {
            "risk_level": risk_level,
            "rain_detected": rain_detected,
            "rain_locations": rain_locations,
            "high_wind": high_wind,
            "missing_weather": missing_weather,
            "primary_weather_icon": primary_weather_icon,
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
                    f"⚠️ Terdeteksi potensi hujan/gerimis di area ({loc_str}). Pengendara sepeda motor sangat disarankan menyiapkan jas hujan setelan sebelum berangkat dan memeriksa cengkeraman ban serta kampas rem."
                )
                advice_points.append(
                    "Kurangi kecepatan hingga maksimal 40 km/jam saat aspal basah, hindari pengereman mendadak di atas marka jalan yang licin, dan jangan berteduh di bawah flyover yang mengganggu lalu lintas."
                )
            else:
                advice_points.append(
                    f"⚠️ Jalanan basah terdeteksi di ({loc_str}). Nyalakan lampu utama mobil, pastikan wiper berfungsi optimal, dan tingkatkan jarak aman antar kendaraan."
                )
        else:
            advice_points.append("☀️ Kondisi cuaca di sepanjang rute relatif cerah dan kondusif.")
            if vehicle == "motor":
                advice_points.append("Gunakan perlengkapan berkendara standar: helm SNI tertutup, jaket pelindung angin, dan sarung tangan.")
            else:
                advice_points.append("Gunakan sabuk keselamatan dan jaga kewaspadaan terhadap pengendara lain.")

        if risk_analysis.get("high_wind"):
            advice_points.append("Waspadai hembusan angin samping kencang saat melintasi jembatan layang atau area terbuka.")

        if risk_analysis.get("missing_weather"):
            missing_str = ", ".join(risk_analysis["missing_weather"])
            advice_points.append(
                f"(Catatan Keterbatasan Data: Sensor cuaca di area {missing_str} sedang tidak dapat diakses, harap tetap waspada terhadap perubahan awan lokal)."
            )

        if distance_km > 25:
            advice_points.append(f"Perjalanan tergolong cukup jauh ({distance_km} km). Luangkan waktu untuk istirahat jika merasa lelah.")

        advice_points.append("Patuhi selalu rambu lalu lintas demi keselamatan bersama.")
        return " ".join(advice_points)
