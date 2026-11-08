-- ==============================================================
-- SMARTROUTE AI: DATABASE SCHEMA & QUERIES (SUPABASE / POSTGRESQL)
-- ==============================================================

-- 1. Tabel Users
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Search Histories (Riwayat Perjalanan & Telemetri Cuaca)
CREATE TABLE IF NOT EXISTS public.search_histories (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  raw_query TEXT NOT NULL,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  vehicle VARCHAR(50) DEFAULT 'motor',
  route_summary JSONB DEFAULT '{}'::jsonb,
  weather_summary JSONB DEFAULT '{}'::jsonb,
  ai_advice TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing untuk mempercepat query riwayat berdasarkan user_id dan waktu
CREATE INDEX IF NOT EXISTS idx_search_histories_user_id ON public.search_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_search_histories_created_at ON public.search_histories(created_at DESC);

-- ==============================================================
-- CONTOH QUERY CRUD RIWAYAT PERJALANAN
-- ==============================================================

-- A. Menyimpan Riwayat Baru (INSERT)
INSERT INTO public.search_histories (
  user_id,
  raw_query,
  origin,
  destination,
  vehicle,
  route_summary,
  weather_summary,
  ai_advice,
  created_at
) 
VALUES (
  3,
  'Dari Margonda Depok ke Tebet Eco Park naik motor jangan lewat jalan licin',
  'Margonda, Depok',
  'Tebet Eco Park, Jakarta Selatan',
  'motor',
  '{"distance_km": 18.4, "duration_min": 42}'::jsonb,
  '{"origin": {"temp": 32, "condition": "Cerah"}, "midpoint": {"temp": 27, "condition": "Hujan Ringan"}, "destination": {"temp": 25, "condition": "Hujan Sedang"}}'::jsonb,
  'Waspada potensi hujan di titik tengah (Pasar Minggu). Gunakan jas hujan sebelum titik tengah dan jaga kecepatan 40 km/jam.',
  NOW()
);

-- B. Mengambil Riwayat Pengguna Tertentu (SELECT)
SELECT 
  id,
  origin,
  destination,
  vehicle,
  raw_query,
  route_summary,
  weather_summary,
  ai_advice,
  created_at
FROM public.search_histories
WHERE user_id = 3
ORDER BY created_at DESC
LIMIT 30;

-- C. Menghapus 1 Riwayat (DELETE)
DELETE FROM public.search_histories
WHERE id = 8 AND user_id = 3;
