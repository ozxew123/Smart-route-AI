/**
 * SmartRoute AI - Special Safety & Mobility Rules Engine
 * 1. Jas Hujan Pitstop Predictor (Raincoat pitstop calculation)
 * 2. Zero-Tilang Motor & Ganjil-Genap Guard
 */

import { ThreePointsWeather } from "./weather";

export interface PitstopRecommendation {
  needed: boolean;
  shelter_name: string;
  distance_before_km: number;
  reason: string;
  advice: string;
  coords: { lat: number; lon: number } | null;
}

export interface ZeroTilangAnalysis {
  status: "aman" | "waspada" | "perhatian";
  rule_type: "motor_guard" | "ganjil_genap" | "bebas";
  title: string;
  message: string;
  restricted_zones: string[];
  safe_alternative_note: string;
  today_date_number: number;
  today_rule: "Ganjil" | "Genap";
  user_plate: "Ganjil" | "Genap";
  is_rush_hour: boolean;
}

// Titik rawan jalan layang non-tol & tol yang dilarang motor di Jabodetabek
const MOTOR_RESTRICTED_CORRIDORS = [
  {
    name: "JLNT Casablanca / Prof. Dr. Satrio",
    keywords: ["casablanca", "satrio", "karet", "tanah abang", "tebet", "kampung melayu"],
    warning: "Dilarang keras untuk motor! Berbahaya karena hembusan angin samping kuat di ketinggian 18m dan razia tilang rutin.",
    safe_alternative: "Gunakan jalur bawah (Jalan Prof. Dr. Satrio / Jalan Casablanca bawah)."
  },
  {
    name: "JLNT Antasari (Blok M - TB Simatupang)",
    keywords: ["antasari", "blok m", "cipete", "cilandak", "tb simatupang"],
    warning: "Dilarang untuk motor! Rawan tilang elektronik ETLE dan razia kepolisian di kedua ujung jalan layang.",
    safe_alternative: "Lewat jalan arteri bawah Jalan Pangeran Antasari."
  },
  {
    name: "Flyover Pesing (Daan Mogot)",
    keywords: ["pesing", "daan mogot", "grogol", "cengkareng", "kalideres"],
    warning: "Dilarang untuk motor karena tikungan tajam dan aspal licin saat hujan.",
    safe_alternative: "Lewat perlintasan bawah Pesing / Daan Mogot bawah."
  },
  {
    name: "Jalur Tol Jabodetabek",
    keywords: ["tol", "jagorawi", "jorr", "dalam kota", "desari", "ciyago", "becakayu"],
    warning: "Motor roda dua dilarang memasuki gerbang tol.",
    safe_alternative: "Pastikan menggunakan jalur non-tol (arteri utama)."
  }
];

export function calculatePitstop(
  vehicle: "motor" | "mobil",
  coordinates: [number, number][],
  weather: ThreePointsWeather,
  originName: string,
  destName: string
): PitstopRecommendation {
  if (vehicle !== "motor") {
    return {
      needed: false,
      shelter_name: "-",
      distance_before_km: 0,
      reason: "Kendaraan mobil terlindung dari hujan.",
      advice: "Nyalakan lampu utama dan kurangi kecepatan saat hujan lebat.",
      coords: null
    };
  }

  const midRain = String(weather.midpoint.condition || "").toLowerCase().includes("rain") ||
    String(weather.midpoint.description || "").toLowerCase().includes("hujan");
  const destRain = String(weather.destination.condition || "").toLowerCase().includes("rain") ||
    String(weather.destination.description || "").toLowerCase().includes("hujan");

  if (!midRain && !destRain) {
    return {
      needed: false,
      shelter_name: "Tidak Perlu Pitstop",
      distance_before_km: 0,
      reason: "Tidak terdeteksi potensi hujan lebat di sepanjang rute perjalanan.",
      advice: "Kondisi jalan relatif kering dan kondusif untuk perjalanan motor.",
      coords: null
    };
  }

  let shelterName = "SPBU Pertamina & Kanopi Istirahat";
  let targetFraction = 0.35; // Default ~35% dari total rute
  let distanceBefore = 1.8;
  let rainZone = "titik tengah rute";

  if (midRain) {
    targetFraction = 0.35;
    rainZone = weather.midpoint.label || "Jalur Tengah (Midpoint)";
    shelterName = `SPBU Pertamina & Shelter Flyover sebelum ${rainZone}`;
  } else if (destRain) {
    targetFraction = 0.75;
    rainZone = weather.destination.label || destName;
    shelterName = `Minimarket & SPBU Rest Area sebelum masuk ${rainZone}`;
    distanceBefore = 1.5;
  }

  let coords: { lat: number; lon: number } | null = null;
  if (coordinates && coordinates.length > 5) {
    const idx = Math.floor(coordinates.length * targetFraction);
    const point = coordinates[idx];
    if (point) {
      coords = { lat: point[0], lon: point[1] };
    }
  }

  return {
    needed: true,
    shelter_name: shelterName,
    distance_before_km: distanceBefore,
    reason: `Hujan terdeteksi di sekitar ${rainZone}.`,
    advice: `AI menyarankan Anda berhenti di ${shelterName} sekitar ${distanceBefore} km sebelum titik hujan untuk mengenakan jas hujan setelan sebelum pakaian Anda basah.`,
    coords
  };
}

export function evaluateZeroTilang(
  vehicle: "motor" | "mobil",
  origin: string,
  destination: string,
  userPlate: "Ganjil" | "Genap" = "Genap"
): ZeroTilangAnalysis {
  const combinedText = `${origin} ${destination}`.toLowerCase();

  // Waktu WIB Sekarang
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const wib = new Date(utc + 3600000 * 7);

  const dayOfWeek = wib.getDay(); // 0 = Minggu, 6 = Sabtu
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dateNumber = wib.getDate();
  const todayRule: "Ganjil" | "Genap" = dateNumber % 2 === 0 ? "Genap" : "Ganjil";

  const hour = wib.getHours();
  const minute = wib.getMinutes();
  const timeVal = hour * 60 + minute;

  // Aturan Jam Ganjil-Genap Jakarta: 06:00 - 10:00 & 16:00 - 21:00 (Senin - Jumat)
  const morningRush = timeVal >= 6 * 60 && timeVal <= 10 * 60;
  const eveningRush = timeVal >= 16 * 60 && timeVal <= 21 * 60;
  const isRushHour = !isWeekend && (morningRush || eveningRush);

  // 1. Kasus Pengendara Motor: Zero-Tilang & Jalur Terlarang (JLNT)
  if (vehicle === "motor") {
    const detectedZones: { name: string; warning: string; safe_alternative: string }[] = [];

    for (const corridor of MOTOR_RESTRICTED_CORRIDORS) {
      if (corridor.keywords.some((kw) => combinedText.includes(kw))) {
        detectedZones.push(corridor);
      }
    }

    if (detectedZones.length > 0) {
      const firstZone = detectedZones[0];
      return {
        status: "waspada",
        rule_type: "motor_guard",
        title: `Zero-Tilang Motor: Jalur ${firstZone.name} Dihindari`,
        message: firstZone.warning,
        restricted_zones: detectedZones.map((z) => z.name),
        safe_alternative_note: firstZone.safe_alternative,
        today_date_number: dateNumber,
        today_rule: todayRule,
        user_plate: userPlate,
        is_rush_hour: isRushHour,
      };
    }

    return {
      status: "aman",
      rule_type: "motor_guard",
      title: "Zero-Tilang Motor: Jalur Aman Terverifikasi",
      message: "Rute perjalanan Anda tidak melintasi JLNT berbahaya (Casablanca / Antasari). Bebas tilang ETLE jalur motor.",
      restricted_zones: [],
      safe_alternative_note: "Tetap gunakan lajur kiri dan nyalakan lampu utama kendaraan.",
      today_date_number: dateNumber,
      today_rule: todayRule,
      user_plate: userPlate,
      is_rush_hour: isRushHour,
    };
  }

  // 2. Kasus Mobil: Info Aturan Ganjil-Genap Jakarta Otomatis Hari Ini
  const oppositeRule: "Ganjil" | "Genap" = todayRule === "Genap" ? "Ganjil" : "Genap";

  if (isWeekend) {
    return {
      status: "aman",
      rule_type: "ganjil_genap",
      title: "Ganjil-Genap: Bebas Aturan (Akhir Pekan)",
      message: "Hari Sabtu & Minggu aturan Ganjil-Genap TIDAK BERLAKU di seluruh ruas jalan DKI Jakarta. Semua kendaraan mobil bebas melintas.",
      restricted_zones: [],
      safe_alternative_note: "Bebas melintas di seluruh jalan protokol tanpa batasan plat nomor.",
      today_date_number: dateNumber,
      today_rule: todayRule,
      user_plate: todayRule,
      is_rush_hour: false,
    };
  }

  if (isRushHour) {
    return {
      status: "waspada",
      rule_type: "ganjil_genap",
      title: `Ganjil-Genap Hari Ini: Khusus Plat ${todayRule.toUpperCase()} (Jam Sibuk Aktif)`,
      message: `Hari ini tanggal ${dateNumber} (${todayRule}). Sesi jam sibuk ganjil-genap sedang aktif (06:00-10:00 & 16:00-21:00 WIB). Hanya mobil ber-plat ${todayRule} yang boleh melintas di 25 jalan protokol. Mobil ber-plat ${oppositeRule} dilarang melintas.`,
      restricted_zones: ["Jl. Sudirman - Thamrin", "Jl. Gatot Subroto", "Jl. HR Rasuna Said", "Jl. MT Haryono"],
      safe_alternative_note: `Jika mobil Anda ber-plat ${oppositeRule}, gunakan jalur jalan tol lingkar dalam/luar atau jalan alternatif non-protokol untuk menghindari tilang kamera ETLE.`,
      today_date_number: dateNumber,
      today_rule: todayRule,
      user_plate: todayRule,
      is_rush_hour: true,
    };
  }

  // Di luar jam ganjil-genap
  return {
    status: "aman",
    rule_type: "ganjil_genap",
    title: `Ganjil-Genap Hari Ini: Tanggal ${dateNumber} (Jadwal Plat ${todayRule.toUpperCase()})`,
    message: `Hari ini tanggal ${dateNumber} (${todayRule}). Saat ini berada di luar jam pembatasan ganjil-genap, sehingga semua plat mobil bebas melintas di jalan protokol hingga jam pembatasan berikutnya (06:00-10:00 atau 16:00-21:00 WIB).`,
    restricted_zones: [],
    safe_alternative_note: `Perhatikan waktu kepulangan Anda: jika melintas pada jam sibuk sore (16:00-21:00 WIB), hanya mobil plat ${todayRule} yang diizinkan melintas di jalur protokol.`,
    today_date_number: dateNumber,
    today_rule: todayRule,
    user_plate: todayRule,
    is_rush_hour: false,
  };
}

