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
                return data
            except Exception as e:
                print(f"[GeminiService] Error calling Gemini API: {e}")
                # Fallback ke heuristic extraction di bawah

        # Heuristic Rule-Based Fallback jika API key belum diset
        return self._heuristic_extract(user_query)

    def _heuristic_extract(self, query: str) -> dict:
        """Fallback ekstraksi pola kalimat berbahasa Indonesia sederhana."""
        text = query.lower()
        origin = None
        destination = None
        vehicle = "motor"  # default fokus komuter

        if "mobil" in text:
            vehicle = "mobil"
        elif "motor" in text or "sepeda motor" in text:
            vehicle = "motor"

        # Pola "dari [origin] ke/menuju [destination]"
        match = re.search(r'dari\s+([a-zA-Z0-9\s,\.]+?)\s+(?:ke|menuju|sampai)\s+([a-zA-Z0-9\s,\.]+)', text)
        if match:
            origin = match.group(1).strip()
            destination = match.group(2).strip()
        else:
            # Pola "ke/menuju [destination]"
            match_dest = re.search(r'(?:ke|menuju|sampai)\s+([a-zA-Z0-9\s,\.]+)', text)
            if match_dest:
                destination = match_dest.group(1).strip()

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

