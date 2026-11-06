import json
import re
from config import Config

class GeminiService:
    """Service untuk Natural Language Processing menggunakan Gemini API (Class Diagram: Gemini_Service)"""

    def __init__(self):
        self.api_key = Config.GEMINI_API_KEY
        self.client = None
        if self.api_key and self.api_key != 'your_gemini_api_key_here':
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[GeminiService] Warning: Gagal menginisialisasi Google GenAI client: {e}")

    def extract_entities(self, user_query: str) -> dict:
        """
        Mengekstrak lokasi asal (origin), tujuan (destination), jenis kendaraan (vehicle),
        dan preferensi perjalanan dari bahasa alami pengguna.
        """
        if not user_query:
            return {"complete": False, "message": "Pesan kosong."}

        # Jika API Gemini tersedia
        if self.client:
            prompt = f"""
Ekstraksi informasi rute perjalanan dari teks pengguna berikut.
Format keluaran HARUS berupa JSON valid murni tanpa markdown/backticks:
{{
    "origin": string atau null jika tidak disebutkan,
    "destination": string atau null jika tidak disebutkan,
    "vehicle": "motor" atau "mobil" (default "motor"),
    "preferences": list of string atau [],
    "complete": boolean (true jika origin dan destination ada, false jika salah satu hilang)
}}

Aturan Ekstraksi Lokasi:
- "origin" dan "destination" HANYA berisi nama tempat/gedung/stasiun/taman murni.
- BERSIHKAN dan JANGAN sertakan kata sambung/pengantar seperti 'mau', 'ke', 'dari', 'hendak', 'arah', 'titik awal', 'titik keberangkatan'.
- Contoh: "titik awal dari stasiun kalibata mau ke ragunan zoo" -> origin: "stasiun kalibata", destination: "ragunan zoo".

Teks Pengguna: "{user_query}"
"""
            try:
                response = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt
                )
                text = response.text.strip()
                # Bersihkan backtick jika ada
                text = re.sub(r'^```(json)?', '', text, flags=re.MULTILINE)
                text = re.sub(r'```$', '', text, flags=re.MULTILINE).strip()
                data = json.loads(text)

                if data.get('origin'):
                    data['origin'] = self._clean_location_name(data['origin'])
                if data.get('destination'):
                    data['destination'] = self._clean_location_name(data['destination'])
                data['complete'] = bool(data.get('origin') and data.get('destination'))
                return data
            except Exception as e:
                print(f"[GeminiService] Error calling Gemini API: {e}")
                # Fallback ke heuristic extraction di bawah

        # Heuristic Rule-Based Fallback jika API key belum diset atau ada error
        return self._heuristic_extract(user_query)

    def _clean_location_name(self, name: str) -> str:
        """Membersihkan nama lokasi dari kata sambung moda, kata penghubung, dan kata pengantar."""
        if not name:
            return ""
        cleaned = name.strip()

        # 1. Bersihkan kata pengantar di awal (titik awal dari, start dari, posisi di, dll)
        cleaned = re.sub(
            r'^(?:titik\s+awal|titik\s+berangkat|titik\s+keberangkatan|titik\s+jemput|posisi|start|lokasi\s+awal|lokasi\s+tujuan|tujuan|tempat\s+asal)\s+(?:dari\s+|di\s+|ke\s+)?',
            '', cleaned, flags=re.IGNORECASE
        )
        cleaned = re.sub(r'^(?:dari|ke|menuju|di|arah)\s+', '', cleaned, flags=re.IGNORECASE)

        # 2. Bersihkan kata sambung transisi tujuan di akhir (mau, ingin, hendak, tujuannya, dll)
        cleaned = re.sub(
            r'\s+\b(?:mau|ingin|hendak|tujuan|tujuannya|otw|rencana|pengen|arah|terus|lalu|sampai)\b.*$',
            '', cleaned, flags=re.IGNORECASE
        )

        # 3. Bersihkan kata moda transportasi dan preferensi
        cleaned = re.sub(
            r'\b(?:naik|pake|pakai|menggunakan|bawa|dengan)\s+(?:sepeda\s+motor|motor|mobil|kendaraan)\b.*',
            '', cleaned, flags=re.IGNORECASE
        )
        cleaned = re.sub(
            r'\b(?:jangan\s+lewat|hindari|lewat|santai|cepat|buru-buru)\b.*',
            '', cleaned, flags=re.IGNORECASE
        )

        # 4. Bersihkan kata pelengkap percakapan ("deket rumah", "dekat rumah")
        cleaned = re.sub(
            r'\s+\b(?:deket\s+rumah|dekat\s+rumah|sebelah\s+rumah|depan\s+rumah)\b',
            '', cleaned, flags=re.IGNORECASE
        )

        # 5. Bersihkan tanda baca dan spasi di ujung
        cleaned = re.sub(r'[,.\-_]+$', '', cleaned).strip()
        return cleaned

    def _heuristic_extract(self, query: str) -> dict:
        """Fallback ekstraksi pola kalimat berbahasa Indonesia komprehensif."""
        text = query.lower().strip()
        origin = None
        destination = None
        vehicle = "motor"  # default fokus komuter

        if "mobil" in text:
            vehicle = "mobil"
        elif "motor" in text or "sepeda motor" in text:
            vehicle = "motor"

        # Pemisah tujuan yang sering diucapkan orang Indonesia
        separator_pattern = r'\s+(?:mau\s+ke|ingin\s+ke|hendak\s+ke|tujuan\s+ke|otw\s+ke|rencana\s+ke|pengen\s+ke|tujuannya\s+ke|menuju\s+ke|arah\s+ke|ke|menuju|sampai|arah)\s+'

        # Pola 1: Ada kata penanda awal (titik awal dari / dari / start / posisi)
        match_dari = re.search(
            r'(?:titik\s+awal\s+(?:dari\s+)?|start\s+(?:dari\s+)?|posisi\s+(?:di\s+)?|dari\s+)(.+?)' + separator_pattern + r'(.+)',
            text, re.IGNORECASE
        )
        if match_dari:
            origin = self._clean_location_name(match_dari.group(1))
            destination = self._clean_location_name(match_dari.group(2))
        else:
            # Pola 2: [origin] [separator] [destination] (misal: "stasiun kalibata ke ragunan zoo")
            match_general = re.search(r'(.+?)' + separator_pattern + r'(.+)', text, re.IGNORECASE)
            if match_general:
                origin = self._clean_location_name(match_general.group(1))
                destination = self._clean_location_name(match_general.group(2))
            else:
                # Pola 3: Hanya tujuan ("ke/menuju [destination]")
                match_dest = re.search(r'(?:ke|menuju|sampai)\s+([a-zA-Z0-9\s,\.]+)', text, re.IGNORECASE)
                if match_dest:
                    destination = self._clean_location_name(match_dest.group(1))

        complete = bool(origin and destination)
        return {
            "origin": origin,
            "destination": destination,
            "vehicle": vehicle,
            "preferences": [],
            "complete": complete,
            "clarification_needed": not complete
        }

    def generate_safety_advice(self, origin, destination, vehicle, weather_data, base_advice):
        """Menyempurnakan kalimat saran keselamatan menggunakan gaya bahasa ramah asisten perjalanan."""
        if not self.client:
            return base_advice

        prompt = f"""
Anda adalah asisten SmartRoute AI. Buat 2-3 kalimat saran perjalanan yang ringkas, bersahabat, dan edukatif berdasarkan data berikut:
- Rute: Dari {origin} ke {destination}
- Kendaraan: {vehicle}
- Status Cuaca Titik Awal, Tengah, dan Akhir: {json.dumps(weather_data)}
- Peringatan Utama: {base_advice}

Saran harus realistis, tidak menjamin keselamatan mutlak, dan mengingatkan kepatuhan lalu lintas.
"""
        try:
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            return response.text.strip()
        except Exception:
            return base_advice

