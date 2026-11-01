import requests
from config import Config

class MapService:
    """Service untuk Geocoding & Routing (Class Diagram: Map_Service)"""

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
        params = {
            'q': location_name,
            'format': 'json',
            'limit': 1
        }
        try:
            response = requests.get(self.nominatim_url, params=params, headers=self.headers, timeout=8)
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return {
                        "lat": float(data[0]['lat']),
                        "lon": float(data[0]['lon']),
                        "display_name": data[0].get('display_name', location_name)
                    }
        except Exception as e:
            print(f"[MapService] Geocoding error for '{location_name}': {e}")
        return None

    def get_route(self, origin_coords: dict, dest_coords: dict, vehicle: str = "motor"):
        """
        Mengambil rute jalan dari OSRM.
        origin_coords: {"lat": ..., "lon": ...}
        dest_coords: {"lat": ..., "lon": ...}
        """
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
                    
                    return {
                        "distance_km": round(route['distance'] / 1000, 2),
                        "duration_min": round(route['duration'] / 60, 1),
                        "coordinates": leaflet_coords,
                        "origin": {"lat": origin_coords['lat'], "lon": origin_coords['lon']},
                        "midpoint": midpoint,
                        "destination": {"lat": dest_coords['lat'], "lon": dest_coords['lon']}
                    }
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

