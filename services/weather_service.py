import requests
from datetime import datetime, timezone, timedelta
from config import Config

class WeatherService:
    """Service untuk Mengambil Data Cuaca (Class Diagram: Weather_Service)"""

    _weather_cache = {}

    def __init__(self):
        self.api_key = Config.OPENWEATHER_API_KEY
        self.base_url = Config.OPENWEATHER_BASE_URL

    def _get_current_time_str(self):
        # Format WIB (UTC+7)
        wib_time = datetime.now(timezone(timedelta(hours=7)))
        return wib_time.strftime("%H:%M WIB")

    def get_weather_at_point(self, lat: float, lon: float, label: str = "Titik"):
        """Mengambil data cuaca titik spesifik dari OpenWeatherMap API."""
        ref_time = self._get_current_time_str()

        # Cache check (5 menit TTL)
        cache_key = f"{round(lat, 2)},{round(lon, 2)}"
        now_ts = datetime.now().timestamp()
        if cache_key in self._weather_cache:
            cached_data, cached_ts = self._weather_cache[cache_key]
            if now_ts - cached_ts < 300:
                res = dict(cached_data)
                res["label"] = label
                res["reference_time"] = ref_time
                return res

        if not self.api_key or self.api_key == 'your_openweather_api_key_here':
            # Data simulasi informatif jika API key belum dikonfigurasi
            return {
                "label": label,
                "lat": lat,
                "lon": lon,
                "condition": "Berawan Ringan",
                "description": "cuaca berawan normal",
                "temp_c": 29.5,
                "humidity": 75,
                "wind_speed_ms": 3.2,
                "rain_prob": 15,
                "icon": "03d",
                "reference_time": ref_time,
                "is_available": True,
                "is_simulated": True
            }

        params = {
            'lat': lat,
            'lon': lon,
            'appid': self.api_key,
            'units': 'metric',
            'lang': 'id'
        }

        try:
            res = requests.get(self.base_url, params=params, timeout=8)
            if res.status_code == 200:
                data = res.json()
                weather_info = data.get('weather', [{}])[0]
                main_info = data.get('main', {})
                wind_info = data.get('wind', {})
                rain_info = data.get('rain', {})

                # Jika ada dt dari API
                if 'dt' in data:
                    api_dt = datetime.fromtimestamp(data['dt'], tz=timezone(timedelta(hours=7)))
                    ref_time = api_dt.strftime("%H:%M WIB")

                weather_result = {
                    "label": label,
                    "lat": lat,
                    "lon": lon,
                    "condition": weather_info.get('main', 'Unknown'),
                    "description": weather_info.get('description', 'Tidak ada data'),
                    "temp_c": round(main_info.get('temp', 0), 1),
                    "humidity": main_info.get('humidity', 0),
                    "wind_speed_ms": round(wind_info.get('speed', 0), 1),
                    "rain_1h_mm": rain_info.get('1h', 0),
                    "icon": weather_info.get('icon', '01d'),
                    "reference_time": ref_time,
                    "is_available": True,
                    "is_simulated": False
                }
                self._weather_cache[cache_key] = (weather_result, now_ts)
                return weather_result
        except Exception as e:
            print(f"[WeatherService] Error fetching weather for {label} ({lat}, {lon}): {e}")

        return {
            "label": label,
            "lat": lat,
            "lon": lon,
            "condition": "Tidak Tersedia",
            "description": "Data cuaca titik ini sedang tidak dapat diakses",
            "temp_c": None,
            "humidity": None,
            "icon": "50d",
            "reference_time": ref_time,
            "is_available": False,
            "is_simulated": False
        }

    def sample_three_points(self, origin_coords: dict, midpoint_coords: dict, dest_coords: dict):
        """
        Mengambil sampel cuaca pada 3 titik rute: awal, tengah, dan akhir
        (Sesuai Kebutuhan Fungsional FR-04).
        """
        origin_weather = self.get_weather_at_point(
            origin_coords['lat'], origin_coords['lon'], label="Titik Awal"
        )
        mid_weather = self.get_weather_at_point(
            midpoint_coords['lat'], midpoint_coords['lon'], label="Titik Tengah"
        )
        dest_weather = self.get_weather_at_point(
            dest_coords['lat'], dest_coords['lon'], label="Titik Akhir"
        )

        return {
            "origin": origin_weather,
            "midpoint": mid_weather,
            "destination": dest_weather
        }
