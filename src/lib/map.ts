export interface GeoLocation {
  lat: number;
  lon: number;
  display_name: string;
}

export interface RouteResult {
  distance_km: number;
  duration_min: number;
  coordinates: [number, number][]; // [lat, lon]
  origin: { lat: number; lon: number };
  midpoint: { lat: number; lon: number } | null;
  destination: { lat: number; lon: number };
}

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1";

const geocodeCache = new Map<string, GeoLocation>();
const routeCache = new Map<string, RouteResult>();

export async function geocode(locationName: string): Promise<GeoLocation | null> {
  const key = locationName.trim().toLowerCase();
  if (geocodeCache.has(key)) {
    return geocodeCache.get(key)!;
  }

  const headers = {
    "User-Agent": "SmartRouteAI-NextJS/2.0 (kelompok4@gunadarma.ac.id)",
  };

  try {
    const url = `${NOMINATIM_BASE_URL}?q=${encodeURIComponent(locationName)}&format=json&limit=1`;
    const resp = await fetch(url, { headers, next: { revalidate: 3600 } });
    if (resp.ok) {
      const data = await resp.json();
      if (Array.isArray(data) && data.length > 0) {
        const res: GeoLocation = {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          display_name: data[0].display_name || locationName,
        };
        geocodeCache.set(key, res);
        return res;
      }
    }
  } catch (err) {
    console.warn(`[Map] Geocoding initial error for '${locationName}':`, err);
  }

  // Fallback pencarian cerdas jika pencarian eksak pertama gagal
  const fallbackQueries: string[] = [];

  // 1. Bersihkan frasa percakapan (deket rumah, dekat sini, sebelah, depan)
  const cleanedNoFiller = locationName
    .replace(/\b(?:deket\s+rumah|dekat\s+rumah|deket|dekat|sebelah|depan|seberang)\b/gi, "")
    .trim();
  if (cleanedNoFiller && cleanedNoFiller.toLowerCase() !== key) {
    fallbackQueries.push(cleanedNoFiller);
  }

  // 2. Tangani prefix gedung/apartemen/tower/menara/komplek/kantor
  const cleanedNoPrefix = (cleanedNoFiller || locationName)
    .replace(/^(?:gedung|apartemen|apt|tower|menara|komplek|perumahan|perum|kantor|kawasan)\s+/gi, "")
    .trim();
  if (cleanedNoPrefix && cleanedNoPrefix.toLowerCase() !== key && !fallbackQueries.includes(cleanedNoPrefix)) {
    fallbackQueries.push(cleanedNoPrefix);
  }

  // 3. Tambahkan konteks kota Jabodetabek / Indonesia jika belum ada
  const baseName = cleanedNoPrefix || cleanedNoFiller || locationName;
  const hasCity = ["jakarta", "depok", "bogor", "tangerang", "bekasi", "indonesia"].some((c) =>
    key.includes(c)
  );
  if (!hasCity) {
    fallbackQueries.push(`${baseName}, DKI Jakarta`);
    fallbackQueries.push(`${baseName}, Indonesia`);
  }

  for (const fq of fallbackQueries) {
    try {
      const fbUrl = `${NOMINATIM_BASE_URL}?q=${encodeURIComponent(fq)}&format=json&limit=1`;
      const fbResp = await fetch(fbUrl, { headers, next: { revalidate: 3600 } });
      if (fbResp.ok) {
        const fbData = await fbResp.json();
        if (Array.isArray(fbData) && fbData.length > 0) {
          const res: GeoLocation = {
            lat: parseFloat(fbData[0].lat),
            lon: parseFloat(fbData[0].lon),
            display_name: fbData[0].display_name || locationName,
          };
          geocodeCache.set(key, res);
          return res;
        }
      }
    } catch {
      // lanjut fallback berikutnya
    }
  }

  return null;
}

export async function getRoute(
  originCoords: { lat: number; lon: number },
  destCoords: { lat: number; lon: number },
  vehicle: "motor" | "mobil" = "motor"
): Promise<RouteResult | null> {
  const cacheKey = `${originCoords.lat.toFixed(4)},${originCoords.lon.toFixed(4)}-${destCoords.lat.toFixed(4)},${destCoords.lon.toFixed(4)}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  const profile = "driving";
  const coordinatesStr = `${originCoords.lon},${originCoords.lat};${destCoords.lon},${destCoords.lat}`;
  const url = `${OSRM_BASE_URL}/${profile}/${coordinatesStr}?overview=full&geometries=geojson&steps=true`;

  try {
    const resp = await fetch(url, { next: { revalidate: 1800 } });
    if (resp.ok) {
      const data = await resp.json();
      if (data.code === "Ok" && Array.isArray(data.routes) && data.routes.length > 0) {
        const route = data.routes[0];
        const rawCoords: [number, number][] = route.geometry.coordinates; // [lon, lat]
        const leafletCoords: [number, number][] = rawCoords.map(([lon, lat]) => [lat, lon]);

        const midIdx = Math.floor(leafletCoords.length / 2);
        const midpoint = leafletCoords[midIdx]
          ? { lat: leafletCoords[midIdx][0], lon: leafletCoords[midIdx][1] }
          : null;

        const result: RouteResult = {
          distance_km: Math.round((route.distance / 1000) * 100) / 100,
          duration_min: Math.round((route.duration / 60) * 10) / 10,
          coordinates: leafletCoords,
          origin: { lat: originCoords.lat, lon: originCoords.lon },
          midpoint,
          destination: { lat: destCoords.lat, lon: destCoords.lon },
        };

        routeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch (err) {
    console.warn("[Map] OSRM routing error:", err);
  }

  return null;
}

