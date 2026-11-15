import { Groq } from "groq-sdk";
import { ExtractedRouteEntities } from "./schemas";

const groqApiKey = process.env.GROQ_API_KEY || "";
const groqModel = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

let groqClient: Groq | null = null;
if (groqApiKey && !groqApiKey.startsWith("your_")) {
  try {
    groqClient = new Groq({ apiKey: groqApiKey });
  } catch (err) {
    console.warn("[Groq] Gagal menginisialisasi client:", err);
  }
}

export type { ExtractedRouteEntities };

export function cleanLocationName(name: string): string {
  if (!name) return "";
  let cleaned = name.trim();

  // 1. Bersihkan kata pengantar di awal (titik awal dari, start dari, posisi di, dll)
  cleaned = cleaned.replace(
    /^(?:titik\s+awal|titik\s+berangkat|titik\s+keberangkatan|titik\s+jemput|posisi|start|lokasi\s+awal|lokasi\s+tujuan|tujuan|tempat\s+asal)\s+(?:dari\s+|di\s+|ke\s+)?/gi,
    ""
  );
  cleaned = cleaned.replace(/^(?:dari|ke|menuju|di|arah)\s+/gi, "");

  // 2. Bersihkan target waktu atau jam yang menempel di ujung nama tempat
  cleaned = cleaned.replace(
    /\s+\b(?:harus\s+sampai|sebelum|paling\s+lambat|sampai\s+jam|target\s+jam|jam|pukul)\b.*$/gi,
    ""
  );

  // 3. Bersihkan kata sambung transisi tujuan di akhir (mau, ingin, hendak, tujuannya, dll)
  cleaned = cleaned.replace(
    /\s+\b(?:mau|ingin|hendak|tujuan|tujuannya|otw|rencana|pengen|arah|terus|lalu|sampai)\b.*$/gi,
    ""
  );

  // 4. Bersihkan kata moda transportasi dan preferensi
  cleaned = cleaned.replace(
    /\b(?:naik|pake|pakai|menggunakan|bawa|dengan)\s+(?:sepeda\s+motor|motor|mobil|kendaraan)\b.*/gi,
    ""
  );
  cleaned = cleaned.replace(/\b(?:jangan\s+lewat|hindari|lewat|santai|cepat|buru-buru)\b.*/gi, "");

  // 5. Bersihkan kata pelengkap percakapan ("deket rumah", "dekat rumah")
  cleaned = cleaned.replace(
    /\s+\b(?:deket\s+rumah|dekat\s+rumah|sebelah\s+rumah|depan\s+rumah)\b/gi,
    ""
  );

  // 6. Jika setelah dibersihkan hanya menyisakan kata intent/sambung tanpa nama tempat nyata
  if (/^(?:mau|ingin|hendak|tujuan|otw|rencana|pengen|start|posisi|arah|dari|ke)$/i.test(cleaned)) {
    return "";
  }

  // 7. Bersihkan tanda baca dan spasi di ujung
  cleaned = cleaned.replace(/[,.\-_]+$/, "").trim();
  return cleaned;
}

export function extractTargetTimeHeuristic(query: string): string | null {
  const text = query.toLowerCase();

  // Pola "setengah [jam] [siang/sore/malam/pagi]"
  const matchSetengah = text.match(/setengah\s+(\d{1,2})(?:\s+(pagi|siang|sore|malam))?/i);
  if (matchSetengah) {
    let hour = parseInt(matchSetengah[1], 10);
    const period = matchSetengah[2]?.toLowerCase();
    // "setengah 2 siang" = 13:30, "setengah 8 pagi" = 07:30
    hour = hour - 1;
    if (period === "siang" && hour < 12) hour += 12;
    if (period === "sore" && hour < 12) hour += 12;
    if (period === "malam" && hour < 12) hour += 12;
    if (hour < 0) hour = 23;
    return `${String(hour).padStart(2, "0")}:30`;
  }

  // Pola "jam/pukul HH:mm" atau "HH.mm"
  const matchTimeCol = text.match(/(?:jam|pukul|sebelum|sampai)?\s*(\d{1,2})[:.](\d{2})(?:\s*(pagi|siang|sore|malam|wib))?/i);
  if (matchTimeCol) {
    let hour = parseInt(matchTimeCol[1], 10);
    const minute = matchTimeCol[2];
    const period = matchTimeCol[3]?.toLowerCase();

    if ((period === "siang" || period === "sore" || period === "malam") && hour < 12) {
      hour += 12;
    }
    if (hour >= 0 && hour <= 23 && parseInt(minute, 10) <= 59) {
      return `${String(hour).padStart(2, "0")}:${minute}`;
    }
  }

  // Pola "jam HH [pagi/siang/sore/malam]"
  const matchJam = text.match(/(?:jam|pukul)\s+(\d{1,2})(?:\s+(pagi|siang|sore|malam))?/i);
  if (matchJam) {
    let hour = parseInt(matchJam[1], 10);
    const period = matchJam[2]?.toLowerCase();
    if ((period === "siang" || period === "sore" || period === "malam") && hour < 12) {
      hour += 12;
    }
    if (hour >= 0 && hour <= 23) {
      return `${String(hour).padStart(2, "0")}:00`;
    }
  }

  return null;
}

export function heuristicExtract(query: string): ExtractedRouteEntities {
  const text = query.toLowerCase().trim();
  let origin: string | null = null;
  let destination: string | null = null;
  let vehicle: "motor" | "mobil" = "motor";

  if (text.includes("mobil")) {
    vehicle = "mobil";
  } else if (text.includes("motor") || text.includes("sepeda motor")) {
    vehicle = "motor";
  }

  const targetArrivalTime = extractTargetTimeHeuristic(query);

  const separatorPattern =
    /\s+(?:mau\s+ke|ingin\s+ke|hendak\s+ke|tujuan\s+ke|otw\s+ke|rencana\s+ke|pengen\s+ke|tujuannya\s+ke|menuju\s+ke|arah\s+ke|ke|menuju|sampai|arah)\s+/i;

  // Pola 1: Ada kata penanda awal (titik awal dari / dari / start / posisi)
  const patternDari =
    /(?:titik\s+awal\s+(?:dari\s+)?|start\s+(?:dari\s+)?|posisi\s+(?:di\s+)?|dari\s+)(.+?)\s+(?:mau\s+ke|ingin\s+ke|hendak\s+ke|tujuan\s+ke|otw\s+ke|rencana\s+ke|pengen\s+ke|tujuannya\s+ke|menuju\s+ke|arah\s+ke|ke|menuju|sampai|arah)\s+(.+)/i;
  const matchDari = text.match(patternDari);

  if (matchDari) {
    origin = cleanLocationName(matchDari[1]);
    destination = cleanLocationName(matchDari[2]);
  } else {
    // Pola 2: [origin] [separator] [destination]
    const parts = text.split(separatorPattern);
    if (parts.length >= 2) {
      origin = cleanLocationName(parts[0]);
      destination = cleanLocationName(parts.slice(1).join(" "));
    } else {
      // Pola 3: Hanya tujuan ("ke/menuju [destination]")
      const matchDest = text.match(/(?:ke|menuju|sampai)\s+([a-zA-Z0-9\s,\.]+)/i);
      if (matchDest) {
        destination = cleanLocationName(matchDest[1]);
      }
    }
  }

  origin = origin ? origin : null;
  destination = destination ? destination : null;
  const complete = Boolean(origin && destination);

  return {
    origin,
    destination,
    vehicle,
    preferences: [],
    complete,
    target_arrival_time: targetArrivalTime,
    clarification_needed: !complete,
  };
}

export async function extractEntitiesWithGroq(query: string): Promise<ExtractedRouteEntities> {
  if (!query) {
    return {
      origin: null,
      destination: null,
      vehicle: "motor",
      preferences: [],
      complete: false,
      target_arrival_time: null,
      clarification_needed: true,
    };
  }

  if (groqClient) {
    const prompt = `
Ekstraksi informasi rute perjalanan dan target jam tiba dari teks pengguna berikut.
Format keluaran HARUS berupa JSON murni dengan format persis:
{
    "origin": string atau null jika tidak disebutkan,
    "destination": string atau null jika tidak disebutkan,
    "vehicle": "motor" atau "mobil" (default "motor"),
    "preferences": list of string atau [],
    "target_arrival_time": string format "HH:mm" (24-jam, contoh "08:00", "13:30", "17:00") atau null jika tidak disebutkan,
    "complete": boolean (true jika origin dan destination ada, false jika salah satu hilang)
}

Aturan Ekstraksi:
1. "origin" dan "destination" HANYA berisi nama tempat/gedung/stasiun/taman murni.
2. BERSIHKAN dan JANGAN sertakan kata sambung/pengantar seperti 'mau', 'ke', 'dari', 'hendak', 'arah', 'titik awal', 'titik keberangkatan', 'deket rumah'.
3. JANGAN masukkan kata target jam tiba ke dalam nama tempat ("origin" atau "destination").
4. "target_arrival_time" adalah waktu target tiba jika pengguna menyebutkannya:
   - "harus sampai jam 8 pagi" -> "08:00"
   - "sebelum jam 9 malam" -> "21:00"
   - "sebelum setengah 2 siang" -> "13:30"
   - "paling lambat 08.45" -> "08:45"
   - jika tidak menyebutkan jam sampai/tiba -> null

Teks Pengguna: "${query}"
`;

    try {
      const completion = await groqClient.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "Anda adalah asisten AI ekstraksi rute navigasi dan estimasi waktu komuter. Selalu jawab dalam format JSON murni.",
          },
          { role: "user", content: prompt },
        ],
        model: groqModel,
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const content = completion.choices[0]?.message?.content?.trim() || "{}";
      const data = JSON.parse(content);

      if (data.origin) data.origin = cleanLocationName(data.origin);
      if (data.destination) data.destination = cleanLocationName(data.destination);

      // Validasi format target_arrival_time HH:mm
      let targetTime: string | null = null;
      if (typeof data.target_arrival_time === "string") {
        const timeMatch = data.target_arrival_time.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
        if (timeMatch) {
          targetTime = `${timeMatch[1]}:${timeMatch[2]}`;
        }
      }
      if (!targetTime) {
        // Fallback heuristik waktu jika LLM mengabaikannya
        targetTime = extractTargetTimeHeuristic(query);
      }

      data.target_arrival_time = targetTime;
      data.complete = Boolean(data.origin && data.destination);
      return data as ExtractedRouteEntities;
    } catch (err) {
      console.warn("[Groq] Ekstraksi AI gagal, menggunakan heuristic fallback:", err);
    }
  }

  return heuristicExtract(query);
}

export interface TrafficAdviceContext {
  duration_min: number;
  normal_duration_min: number;
  traffic_delay_min: number;
  departure_time?: string;
  eta?: string;
  target_arrival_time?: string | null;
  arrival_status?: "tepat_waktu" | "berisiko_terlambat" | null;
  delay_risk_min?: number;
  latest_departure_time?: string | null;
  routing_engine?: "tomtom" | "osrm";
}

export async function generateSafetyAdviceWithGroq(
  origin: string,
  destination: string,
  vehicle: string,
  weatherData: any,
  baseAdvice: string,
  trafficInfo?: TrafficAdviceContext
): Promise<string> {
  if (!groqClient) return baseAdvice;

  let trafficContext = "";
  if (trafficInfo) {
    const trafficParts: string[] = [];
    trafficParts.push(`- Durasi Perjalanan Aktual: ~${trafficInfo.duration_min} menit`);
    if (trafficInfo.traffic_delay_min > 0) {
      trafficParts.push(
        `- Keterlambatan Macet: Ada perlambatan macet +${trafficInfo.traffic_delay_min} menit (waktu normal: ${trafficInfo.normal_duration_min} menit).`
      );
    } else {
      trafficParts.push("- Lalu Lintas: Arus lalu lintas relatif lancar tanpa tundaan berarti.");
    }

    if (trafficInfo.departure_time && trafficInfo.eta) {
      trafficParts.push(
        `- Estimasi Waktu: Berangkat ${trafficInfo.departure_time}, perkiraan sampai ${trafficInfo.eta}.`
      );
    }

    if (trafficInfo.target_arrival_time) {
      if (trafficInfo.arrival_status === "berisiko_terlambat") {
        trafficParts.push(
          `- Target Tiba: User ingin sampai pukul ${trafficInfo.target_arrival_time}, namun berisiko terlambat ±${trafficInfo.delay_risk_min || 0} menit. Saran berangkat: ${trafficInfo.latest_departure_time || "segera"}.`
        );
      } else if (trafficInfo.arrival_status === "tepat_waktu") {
        trafficParts.push(
          `- Target Tiba: Target pukul ${trafficInfo.target_arrival_time} diprediksi TEPAT WAKTU.`
        );
      }
    }
    trafficContext = `\nInformasi Kemacetan & Waktu Tempuh:\n${trafficParts.join("\n")}`;
  }

  const prompt = `
Anda adalah asisten SmartRoute AI. Buat 2-3 kalimat saran perjalanan yang ringkas, bersahabat, dan edukatif berdasarkan data berikut:
- Rute: Dari ${origin} ke ${destination}
- Kendaraan: ${vehicle}
- Status Cuaca Titik Awal, Tengah, dan Akhir: ${JSON.stringify(weatherData)}
- Peringatan Utama: ${baseAdvice}
${trafficContext}

Aturan Penulisan Saran:
1. Hubungkan kondisi cuaca dengan kondisi lalu lintas dan estimasi waktu jika ada kemacetan atau hujan.
2. Jika ada risiko terlambat dari target jam tiba, ingatkan pengguna secara sopan untuk segera berangkat atau berhati-hati agar tidak terburu-buru.
3. Tetap prioritaskan keselamatan berkendara (patuhi rambu, gunakan jas hujan jika hujan, jangan berteduh sembarangan).
4. JANGAN mengarang data angka waktu atau rute yang tidak ada dalam konteks di atas.
`;

  try {
    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Anda adalah asisten SmartRoute AI yang ramah, ringkas, dan fokus pada keselamatan berkendara di jalan raya serta manajemen waktu komuter.",
        },
        { role: "user", content: prompt },
      ],
      model: groqModel,
      temperature: 0.3,
    });

    return completion.choices[0]?.message?.content?.trim() || baseAdvice;
  } catch {
    return baseAdvice;
  }
}
