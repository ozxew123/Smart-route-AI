export interface WeatherPoint {
  label: string;
  lat: number;
  lon: number;
  condition: string;
  description: string;
  temp_c: number | null;
  humidity: number;
  wind_speed_ms: number;
  rain_prob?: number;
  rain_1h_mm?: number;
  icon: string;
  reference_time: string;
  is_available: boolean;
  is_simulated: boolean;
}

export interface ThreePointsWeather {
  origin: WeatherPoint;
  midpoint: WeatherPoint;
  destination: WeatherPoint;
}

export interface RiskAnalysis {
  risk_level: "Rendah" | "Sedang" | "Tinggi";
  rain_detected: boolean;
  rain_locations: string[];
  high_wind: boolean;
  missing_weather: string[];
  primary_weather_icon: string;
  vehicle: "motor" | "mobil";
}

const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather";
const weatherApiKey = process.env.OPENWEATHER_API_KEY || "";

function getCurrentTimeWIB(): string {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 3600000 * 7);
  const hours = String(wib.getHours()).padStart(2, "0");
  const mins = String(wib.getMinutes()).padStart(2, "0");
  return `${hours}:${mins} WIB`;
}

export async function getWeatherAtPoint(
  lat: number,
  lon: number,
  label: string = "Titik"
): Promise<WeatherPoint> {
  const refTime = getCurrentTimeWIB();

  if (!weatherApiKey || weatherApiKey === "your_openweather_api_key_here") {
    return {
      label,
      lat,
      lon,
      condition: "Berawan Ringan",
      description: "cuaca berawan normal",
      temp_c: 29.5,
      humidity: 75,
      wind_speed_ms: 3.2,
      rain_prob: 15,
      icon: "03d",
      reference_time: refTime,
      is_available: true,
      is_simulated: true,
    };
  }

  const url = `${OPENWEATHER_BASE_URL}?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric&lang=id`;

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (res.ok) {
      const data = await res.json();
      const weatherInfo = data.weather?.[0] || {};
      const mainInfo = data.main || {};
      const windInfo = data.wind || {};
      const rainInfo = data.rain || {};

      return {
        label,
        lat,
        lon,
        condition: weatherInfo.main || "Unknown",
        description: weatherInfo.description || "Tidak ada data",
        temp_c: Math.round((mainInfo.temp || 0) * 10) / 10,
        humidity: mainInfo.humidity || 0,
        wind_speed_ms: Math.round((windInfo.speed || 0) * 10) / 10,
        rain_1h_mm: rainInfo["1h"] || 0,
        icon: weatherInfo.icon || "01d",
        reference_time: refTime,
        is_available: true,
        is_simulated: false,
      };
    }
  } catch (err) {
    console.warn(`[Weather] Error fetching weather for ${label}:`, err);
  }

  return {
    label,
    lat,
    lon,
    condition: "Tidak Tersedia",
    description: "Data cuaca titik ini sedang tidak dapat diakses",
    temp_c: null,
    humidity: 0,
    wind_speed_ms: 0,
    icon: "50d",
    reference_time: refTime,
    is_available: false,
    is_simulated: false,
  };
}

export async function sampleThreePoints(
  originCoords: { lat: number; lon: number },
  midpointCoords: { lat: number; lon: number } | null,
  destCoords: { lat: number; lon: number }
): Promise<ThreePointsWeather> {
  const origin = await getWeatherAtPoint(originCoords.lat, originCoords.lon, "Titik Asal");

  let midpoint: WeatherPoint;
  if (midpointCoords) {
    midpoint = await getWeatherAtPoint(
      midpointCoords.lat,
      midpointCoords.lon,
      "Tengah Rute (Midpoint)"
    );
  } else {
    // Estimasi matematis jika OSRM midpoint tidak tersedia
    const avgLat = (originCoords.lat + destCoords.lat) / 2;
    const avgLon = (originCoords.lon + destCoords.lon) / 2;
    midpoint = await getWeatherAtPoint(avgLat, avgLon, "Tengah Rute (Midpoint)");
  }

  const destination = await getWeatherAtPoint(destCoords.lat, destCoords.lon, "Titik Tujuan");

  return { origin, midpoint, destination };
}

export function analyzeWeatherRisk(
  weather3Points: ThreePointsWeather,
  vehicle: "motor" | "mobil" = "motor"
): RiskAnalysis {
  let rainDetected = false;
  const rainLocations: string[] = [];
  let highWind = false;
  const missingWeather: string[] = [];
  let primaryWeatherIcon = "01d";

  for (const [key, w] of Object.entries(weather3Points)) {
    const label = w.label || key;
    if (!w.is_available) {
      missingWeather.push(label);
      continue;
    }

    const cond = String(w.condition || "").toLowerCase();
    const desc = String(w.description || "").toLowerCase();

    if (
      ["rain", "hujan", "drizzle", "thunderstorm", "badai"].some(
        (term) => cond.includes(term) || desc.includes(term)
      )
    ) {
      rainDetected = true;
      rainLocations.push(label);
      primaryWeatherIcon = w.icon || "10d";
    }

    if (w.wind_speed_ms > 8) {
      highWind = true;
    }

    if (!rainDetected && w.icon) {
      primaryWeatherIcon = w.icon;
    }
  }

  let riskLevel: "Rendah" | "Sedang" | "Tinggi" = "Rendah";
  if (rainDetected) {
    riskLevel = vehicle === "motor" ? "Tinggi" : "Sedang";
  } else if (highWind || missingWeather.length > 0) {
    riskLevel = "Sedang";
  }

  return {
    risk_level: riskLevel,
    rain_detected: rainDetected,
    rain_locations: rainLocations,
    high_wind: highWind,
    missing_weather: missingWeather,
    primary_weather_icon: primaryWeatherIcon,
    vehicle,
  };
}

export function buildSafetyAdvice(
  riskAnalysis: RiskAnalysis,
  vehicle: "motor" | "mobil" = "motor",
  distanceKm: number = 0.0
): string {
  const advicePoints: string[] = [];

  if (riskAnalysis.rain_detected) {
    const locStr = riskAnalysis.rain_locations.join(", ");
    if (vehicle === "motor") {
      advicePoints.push(
        `⚠️ Terdeteksi potensi hujan/gerimis di area (${locStr}). Pengendara sepeda motor sangat disarankan menyiapkan jas hujan setelan sebelum berangkat dan memeriksa cengkeraman ban serta kampas rem.`
      );
      advicePoints.push(
        "Kurangi kecepatan hingga maksimal 40 km/jam saat aspal basah, hindari pengereman mendadak di atas marka jalan yang licin, dan jangan berteduh di bawah flyover yang mengganggu lalu lintas."
      );
    } else {
      advicePoints.push(
        `⚠️ Jalanan basah terdeteksi di (${locStr}). Nyalakan lampu utama mobil, pastikan wiper berfungsi optimal, dan tingkatkan jarak aman antar kendaraan.`
      );
    }
  } else {
    advicePoints.push("☀️ Kondisi cuaca di sepanjang rute relatif cerah dan kondusif.");
    if (vehicle === "motor") {
      advicePoints.push(
        "Gunakan perlengkapan berkendara standar: helm SNI tertutup, jaket pelindung angin, dan sarung tangan."
      );
    } else {
      advicePoints.push("Gunakan sabuk keselamatan dan jaga kewaspadaan terhadap pengendara lain.");
    }
  }

  if (riskAnalysis.high_wind) {
    advicePoints.push(
      "Waspadai hembusan angin samping kencang saat melintasi jembatan layang atau area terbuka."
    );
  }

  if (riskAnalysis.missing_weather.length > 0) {
    const missingStr = riskAnalysis.missing_weather.join(", ");
    advicePoints.push(
      `(Catatan Keterbatasan Data: Sensor cuaca di area ${missingStr} sedang tidak dapat diakses, harap tetap waspada terhadap perubahan awan lokal).`
    );
  }

  if (distanceKm > 25) {
    advicePoints.push(
      `Perjalanan tergolong cukup jauh (${distanceKm} km). Luangkan waktu untuk istirahat jika merasa lelah.`
    );
  }

  advicePoints.push("Patuhi selalu rambu lalu lintas demi keselamatan bersama.");
  return advicePoints.join(" ");
}

