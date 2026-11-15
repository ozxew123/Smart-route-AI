import { RouteResult } from "./schemas";

export interface GeoLocation {
  lat: number;
  lon: number;
  display_name: string;
}

export type { RouteResult };

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const TOMTOM_BASE_URL = "https://api.tomtom.com/routing/1/calculateRoute";
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

// Fallback routing engine OSRM jika TomTom mengalami error / kuota habis
async function getRouteOSRM(
  originCoords: { lat: number; lon: number },
  destCoords: { lat: number; lon: number }
): Promise<RouteResult | null> {
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

        const durationMin = Math.max(1, Math.round(route.duration / 60));

        return {
          distance_km: Math.round((route.distance / 1000) * 100) / 100,
          duration_min: durationMin,
          normal_duration_min: durationMin,
          traffic_delay_min: 0,
          coordinates: leafletCoords,
          origin: { lat: originCoords.lat, lon: originCoords.lon },
          midpoint,
          destination: { lat: destCoords.lat, lon: destCoords.lon },
          departure_time: "",
          eta: "",
          routing_engine: "osrm",
        };
      }
    }
  } catch (err) {
    console.warn("[Map] OSRM routing fallback error:", err);
  }

  return null;
}

export async function getRoute(
  originCoords: { lat: number; lon: number },
  destCoords: { lat: number; lon: number },
  vehicle: "motor" | "mobil" = "motor"
): Promise<RouteResult | null> {
  const cacheKey = `${vehicle}-${originCoords.lat.toFixed(4)},${originCoords.lon.toFixed(4)}-${destCoords.lat.toFixed(4)},${destCoords.lon.toFixed(4)}`;
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  const tomtomApiKey = process.env.TOMTOM_API_KEY || "";
  const travelMode = vehicle === "motor" ? "motorcycle" : "car";

  if (tomtomApiKey && !tomtomApiKey.startsWith("your_")) {
    try {
      // TomTom Routing API with traffic and dynamic travelMode
      const locations = `${originCoords.lat},${originCoords.lon}:${destCoords.lat},${destCoords.lon}`;
      const url = `${TOMTOM_BASE_URL}/${locations}/json?key=${tomtomApiKey}&traffic=true&departAt=now&travelMode=${travelMode}`;

      const resp = await fetch(url, { next: { revalidate: 300 } });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.routes) && data.routes.length > 0) {
          const route = data.routes[0];
          const summary = route.summary;
          const points = route.legs?.[0]?.points || [];

          if (points.length > 0) {
            // Petakan format { latitude, longitude } TomTom menjadi tuple [latitude, longitude] untuk Leaflet
            const leafletCoords: [number, number][] = points.map((p: { latitude: number; longitude: number }) => [
              p.latitude,
              p.longitude,
            ]);

            const midIdx = Math.floor(leafletCoords.length / 2);
            const midpoint = leafletCoords[midIdx]
              ? { lat: leafletCoords[midIdx][0], lon: leafletCoords[midIdx][1] }
              : null;

            const travelTimeSec = summary.travelTimeInSeconds || 0;
            const noTrafficSec = summary.noTrafficTravelTimeInSeconds ?? travelTimeSec;
            const trafficDelaySec = summary.trafficDelayInSeconds ?? Math.max(0, travelTimeSec - noTrafficSec);

            const distanceKm = Math.round((summary.lengthInMeters / 1000) * 100) / 100;
            const durationMin = Math.max(1, Math.round(travelTimeSec / 60));
            const normalDurationMin = Math.max(1, Math.round(noTrafficSec / 60));
            const trafficDelayMin = Math.max(0, Math.round(trafficDelaySec / 60));

            const result: RouteResult = {
              distance_km: distanceKm,
              duration_min: durationMin,
              normal_duration_min: normalDurationMin,
              traffic_delay_min: trafficDelayMin,
              coordinates: leafletCoords,
              origin: { lat: originCoords.lat, lon: originCoords.lon },
              midpoint,
              destination: { lat: destCoords.lat, lon: destCoords.lon },
              departure_time: "",
              eta: "",
              routing_engine: "tomtom",
            };

            routeCache.set(cacheKey, result);
            return result;
          }
        }
      } else {
        const errorText = await resp.text();
        console.warn(`[Map] TomTom API error (${resp.status}):`, errorText);
      }
    } catch (err) {
      console.warn("[Map] TomTom routing error, beralih ke OSRM fallback:", err);
    }
  }

  // Fallback ke OSRM jika TomTom gagal atau tidak ada API Key
  const fallbackResult = await getRouteOSRM(originCoords, destCoords);
  if (fallbackResult) {
    routeCache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }

  return null;
}
