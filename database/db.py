import sqlite3
import os
from config import Config

_supabase_client = None

def get_supabase_client():
    """Mengembalikan instance Supabase client jika kredensial tersedia."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client
    
    if Config.SUPABASE_URL and Config.SUPABASE_KEY and not Config.SUPABASE_KEY.startswith('your_'):
        try:
            from supabase import create_client
            _supabase_client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
            return _supabase_client
        except Exception as e:
            print(f"[Supabase] Gagal menginisialisasi client: {e}")
            return None
    return None

def get_db_connection():
    """Membuka koneksi ke database SQLite lokal dengan row_factory dictionary."""
    os.makedirs(os.path.dirname(Config.DATABASE_PATH), exist_ok=True)
    conn = sqlite3.connect(Config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Inisialisasi tabel basis data dari schema.sql."""
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.executescript(schema_sql)
    conn.commit()
    conn.close()
    print("Database initialized successfully.")

if __name__ == '__main__':
    init_db()

