-- Migration: Tabel Lokasi Favorit untuk SmartRoute AI
-- Jalankan di Supabase SQL Editor: https://supabase.com/dashboard

CREATE TABLE IF NOT EXISTS favorite_locations (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label       VARCHAR(30)  NOT NULL,          -- "Rumah", "Kantor", dll.
    address     VARCHAR(150) NOT NULL,          -- Nama lokasi untuk geocoding
    icon        VARCHAR(10)  NOT NULL DEFAULT '📍',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, label)                     -- Satu user tidak bisa punya 2 label sama
);

-- Index untuk query cepat per user
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorite_locations(user_id);
