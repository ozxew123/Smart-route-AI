-- Skema Basis Data SmartRoute AI (Bab V Laporan)

-- 1. Tabel Users
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Search Histories
CREATE TABLE IF NOT EXISTS search_histories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    raw_query TEXT NOT NULL,
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    vehicle VARCHAR(50) DEFAULT 'motor',
    route_summary TEXT,      -- JSON/ringkasan data rute & geometri
    weather_summary TEXT,    -- JSON ringkasan cuaca 3 titik
    ai_advice TEXT,          -- Saran keselamatan dari decision engine/Groq AI
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_histories_user_id ON search_histories(user_id);

