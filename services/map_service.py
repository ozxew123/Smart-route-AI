import requests
import re
from config import Config

class MapService:
    """Service untuk Geocoding & Routing (Class Diagram: Map_Service)"""

    _geocode_cache = {}
    _route_cache = {}

    def __init__(self):
        self.nominatim_url = Config.NOMINATIM_BASE_URL
        self.osrm_url = Config.OSRM_BASE_URL
        self.headers = {
            'User-Agent': 'SmartRouteAI-PWEB/1.0 (kelompok4@gunadarma.ac.id)'
        }

    def geocode(self, location_name: str):
        """
        Mengonversi nama tempat menjadi latitude dan longitude menggunakan Nominatim API.
        Return: {"lat": float, "lon": float, "display_name": str} atau None
        """
        key = location_name.strip().lower()
        if key in self._geocode_cache:
            return self._geocode_cache[key]

        params = {
            'q': location_name,
            'format': 'json',
            'limit': 1
        }
        try:
            response = requests.get(self.nominatim_url, params=params, headers=self.headers, timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    res = {
                        "lat": float(data[0]['lat']),
                        "lon": float(data[0]['lon']),
                        "display_name": data[0].get('display_name', location_name)
                    }
                    self._geocode_cache[key] = res
                    return res
        except Exception as e:
            print(f"[MapService] Geocoding error for '{location_name}': {e}")

        # Fallback pencarian cerdas jika pencarian eksak pertama gagal
        fallback_queries = []

        # 1. Bersihkan frasa percakapan (deket rumah, dekat sini, sebelah, depan)
        cleaned_no_filler = re.sub(r'\b(?:deket\s+rumah|dekat\s+rumah|deket|dekat|sebelah|depan|seberang)\b', '', location_name, flags=re.IGNORECASE).strip()
        if cleaned_no_filler and cleaned_no_filler.lower() != key:
            fallback_queries.append(cleaned_no_filler)

        # 2. Tangani prefix gedung/apartemen/tower/menara/komplek/kantor (OSM sering menyimpan tanpa kata 'gedung')
        cleaned_no_prefix = re.sub(r'^(?:gedung|apartemen|apt|tower|menara|komplek|perumahan|perum|kantor|kawasan)\s+', '', cleaned_no_filler or location_name, flags=re.IGNORECASE).strip()
        if cleaned_no_prefix and cleaned_no_prefix.lower() != key and cleaned_no_prefix not in fallback_queries:
            fallback_queries.append(cleaned_no_prefix)

        # 3. Tambahkan konteks kota Jabodetabek / Indonesia jika belum ada
        base_name = cleaned_no_prefix or cleaned_no_filler or location_name
        if not any(city in key for city in ['jakarta', 'depok', 'bogor', 'tangerang', 'bekasi', 'indonesia']):
            fallback_queries.append(f"{base_name}, DKI Jakarta")
            fallback_queries.append(f"{base_name}, Indonesia")

        for fq in fallback_queries:
            try:
                fb_resp = requests.get(self.nominatim_url, params={'q': fq, 'format': 'json', 'limit': 1}, headers=self.headers, timeout=5)
                if fb_resp.status_code == 200:
                    fb_data = fb_resp.json()
                    if fb_data and len(fb_data) > 0:
                        res = {
                            "lat": float(fb_data[0]['lat']),
                            "lon": float(fb_data[0]['lon']),
                            "display_name": fb_data[0].get('display_name', location_name)
                        }
                        self._geocode_cache[key] = res
                        return res
            except Exception:
                pass

        return None

    def get_route(self, origin_coords: dict, dest_coords: dict, vehicle: str = "motor"):
        """
        Mengambil rute jalan dari OSRM.
        origin_coords: {"lat": ..., "lon": ...}
        dest_coords: {"lat": ..., "lon": ...}
        """
        cache_key = f"{round(origin_coords['lat'], 4)},{round(origin_coords['lon'], 4)}-{round(dest_coords['lat'], 4)},{round(dest_coords['lon'], 4)}"
        if cache_key in self._route_cache:
            return self._route_cache[cache_key]

        # Profil OSRM publik default: car / driving
        profile = "driving"
        coordinates_str = f"{origin_coords['lon']},{origin_coords['lat']};{dest_coords['lon']},{dest_coords['lat']}"
        url = f"{self.osrm_url}/{profile}/{coordinates_str}"
        
        params = {
            'overview': 'full',
            'geometries': 'geojson',
            'steps': 'true'
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('code') == 'Ok' and len(data.get('routes', [])) > 0:
                    route = data['routes'][0]
                    coords = route['geometry']['coordinates'] # list of [lon, lat]
                    
                    # Konversi ke format [lat, lon] untuk Leaflet
                    leaflet_coords = [[pt[1], pt[0]] for pt in coords]
                    
                    midpoint = self.get_route_midpoint(leaflet_coords)
                    
                    result = {
                        "distance_km": round(route['distance'] / 1000, 2),
                        "duration_min": round(route['duration'] / 60, 1),
                        "coordinates": leaflet_coords,
                        "origin": {"lat": origin_coords['lat'], "lon": origin_coords['lon']},
                        "midpoint": midpoint,
                        "destination": {"lat": dest_coords['lat'], "lon": dest_coords['lon']}
                    }
                    self._route_cache[cache_key] = result
                    return result
        except Exception as e:
            print(f"[MapService] OSRM routing error: {e}")
        return None

    def get_route_midpoint(self, coordinates: list):
        """Menentukan koordinat titik tengah dari rute untuk sampling cuaca."""
        if not coordinates:
            return None
        mid_idx = len(coordinates) // 2
        pt = coordinates[mid_idx]
        return {"lat": pt[0], "lon": pt[1]}

