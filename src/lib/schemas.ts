import { z } from "zod";

// 1. Schema Request Body /api/process-route
export const processRouteRequestSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Permintaan rute tidak boleh kosong.")
    .max(300, "Teks instruksi perjalanan maksimal 300 karakter."),
  vehicle: z.enum(["motor", "mobil"]).optional(),
  plate: z.enum(["Ganjil", "Genap"]).optional(),
  userId: z.number().optional(),
});

export type ProcessRouteRequest = z.infer<typeof processRouteRequestSchema>;

// 2. Schema Hasil Ekstraksi NLP Groq
export const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const extractedRouteEntitiesSchema = z.object({
  origin: z.string().nullable(),
  destination: z.string().nullable(),
  vehicle: z.enum(["motor", "mobil"]).default("motor"),
  preferences: z.array(z.string()).default([]),
  complete: z.boolean(),
  target_arrival_time: z
    .string()
    .regex(timeRegex, "Format target jam tiba harus HH:mm")
    .nullable()
    .optional(),
  clarification_needed: z.boolean().optional(),
});

export type ExtractedRouteEntities = z.infer<typeof extractedRouteEntitiesSchema>;

// 3. Schema Respons TomTom Routing API
export const tomtomPointSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const tomtomSummarySchema = z.object({
  lengthInMeters: z.number(),
  travelTimeInSeconds: z.number(),
  noTrafficTravelTimeInSeconds: z.number().optional(),
  trafficDelayInSeconds: z.number().optional(),
  departureTime: z.string().optional(),
  arrivalTime: z.string().optional(),
});

export const tomtomLegSchema = z.object({
  summary: tomtomSummarySchema.optional(),
  points: z.array(tomtomPointSchema),
});

export const tomtomRouteSchema = z.object({
  summary: tomtomSummarySchema,
  legs: z.array(tomtomLegSchema),
});

export const tomtomRoutingResponseSchema = z.object({
  formatVersion: z.string().optional(),
  routes: z.array(tomtomRouteSchema),
});

export type TomTomRoutingResponse = z.infer<typeof tomtomRoutingResponseSchema>;

// 4. Schema Objek RouteData Final
export const arrivalStatusSchema = z.enum(["tepat_waktu", "berisiko_terlambat"]).nullable();
export type ArrivalStatus = z.infer<typeof arrivalStatusSchema>;

export const routeResultSchema = z.object({
  distance_km: z.number(),
  duration_min: z.number(), // Durasi aktual dengan macet
  normal_duration_min: z.number(), // Durasi tanpa macet
  traffic_delay_min: z.number(), // Selisih macet
  coordinates: z.array(z.tuple([z.number(), z.number()])), // [lat, lon] untuk Leaflet
  origin: z.object({ lat: z.number(), lon: z.number() }),
  midpoint: z.object({ lat: z.number(), lon: z.number() }).nullable(),
  destination: z.object({ lat: z.number(), lon: z.number() }),
  departure_time: z.string(), // "HH:mm WIB"
  eta: z.string(), // "HH:mm WIB"
  target_arrival_time: z.string().nullable().optional(), // "HH:mm WIB" atau null
  arrival_status: arrivalStatusSchema.optional(),
  delay_risk_min: z.number().optional(),
  latest_departure_time: z.string().nullable().optional(), // Saran jam berangkat paling lambat
  routing_engine: z.enum(["tomtom", "osrm"]),
});

export type RouteResult = z.infer<typeof routeResultSchema>;
