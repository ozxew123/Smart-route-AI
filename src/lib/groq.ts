import { Groq } from "groq-sdk";

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

export interface ExtractedRouteEntities {
  origin: string | null;
  destination: string | null;
  vehicle: "motor" | "mobil";
  preferences: string[];
  complete: boolean;
  clarification_needed?: boolean;
}

export function cleanLocationName(name: string): string {
  if (!name) return "";
  let cleaned = name.trim();

  // 1. Bersihkan kata pengantar di awal (titik awal dari, start dari, posisi di, dll)
  cleaned = cleaned.replace(
    /^(?:titik\s+awal|titik\s+berangkat|titik\s+keberangkatan|titik\s+jemput|posisi|start|lokasi\s+awal|lokasi\s+tujuan|tujuan|tempat\s+asal)\s+(?:dari\s+|di\s+|ke\s+)?/gi,
    ""
  );
  cleaned = cleaned.replace(/^(?:dari|ke|menuju|di|arah)\s+/gi, "");

  // 2. Bersihkan kata sambung transisi tujuan di akhir (mau, ingin, hendak, tujuannya, dll)
  cleaned = cleaned.replace(
    /\s+\b(?:mau|ingin|hendak|tujuan|tujuannya|otw|rencana|pengen|arah|terus|lalu|sampai)\b.*$/gi,
    ""
  );

  // 3. Bersihkan kata moda transportasi dan preferensi
  cleaned = cleaned.replace(
    /\b(?:naik|pake|pakai|menggunakan|bawa|dengan)\s+(?:sepeda\s+motor|motor|mobil|kendaraan)\b.*/gi,
    ""
  );
  cleaned = cleaned.replace(/\b(?:jangan\s+lewat|hindari|lewat|santai|cepat|buru-buru)\b.*/gi, "");

  // 4. Bersihkan kata pelengkap percakapan ("deket rumah", "dekat rumah")
  cleaned = cleaned.replace(
    /\s+\b(?:deket\s+rumah|dekat\s+rumah|sebelah\s+rumah|depan\s+rumah)\b/gi,
    ""
  );

  // 5. Jika setelah dibersihkan hanya menyisakan kata intent/sambung tanpa nama tempat nyata
  if (/^(?:mau|ingin|hendak|tujuan|otw|rencana|pengen|start|posisi|arah|dari|ke)$/i.test(cleaned)) {
    return "";
  }

  // 6. Bersihkan tanda baca dan spasi di ujung
  cleaned = cleaned.replace(/[,.\-_]+$/, "").trim();
  return cleaned;
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
      clarification_needed: true,
    };
  }

  if (groqClient) {
    const prompt = `
Ekstraksi informasi rute perjalanan dari teks pengguna berikut.
Format keluaran HARUS berupa JSON murni dengan format persis:
{
    "origin": string atau null jika tidak disebutkan,
    "destination": string atau null jika tidak disebutkan,
    "vehicle": "motor" atau "mobil" (default "motor"),
    "preferences": list of string atau [],
    "complete": boolean (true jika origin dan destination ada, false jika salah satu hilang)
}

Aturan Ekstraksi Lokasi:
- "origin" dan "destination" HANYA berisi nama tempat/gedung/stasiun/taman murni.
- BERSIHKAN dan JANGAN sertakan kata sambung/pengantar seperti 'mau', 'ke', 'dari', 'hendak', 'arah', 'titik awal', 'titik keberangkatan', 'deket rumah'.
- Contoh: "titik awal dari stasiun kalibata mau ke ragunan zoo" -> origin: "stasiun kalibata", destination: "ragunan zoo".

Teks Pengguna: "${query}"
`;

    try {
      const completion = await groqClient.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "Anda adalah asisten AI ekstraksi rute perjalanan dan navigasi komuter. Selalu jawab dalam format JSON murni.",
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
      data.complete = Boolean(data.origin && data.destination);
      return data as ExtractedRouteEntities;
    } catch (err) {
      console.warn("[Groq] Ekstraksi AI gagal, menggunakan heuristic fallback:", err);
    }
  }

  return heuristicExtract(query);
}

export async function generateSafetyAdviceWithGroq(
  origin: string,
  destination: string,
  vehicle: string,
  weatherData: any,
  baseAdvice: string
): Promise<string> {
  if (!groqClient) return baseAdvice;

  const prompt = `
Anda adalah asisten SmartRoute AI. Buat 2-3 kalimat saran perjalanan yang ringkas, bersahabat, dan edukatif berdasarkan data berikut:
- Rute: Dari ${origin} ke ${destination}
- Kendaraan: ${vehicle}
- Status Cuaca Titik Awal, Tengah, dan Akhir: ${JSON.stringify(weatherData)}
- Peringatan Utama: ${baseAdvice}

Saran harus realistis, tidak menjamin keselamatan mutlak, dan mengingatkan kepatuhan lalu lintas.
`;

  try {
    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Anda adalah asisten SmartRoute AI yang ramah, ringkas, dan fokus pada keselamatan berkendara di jalan raya.",
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

