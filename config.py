import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    """Konfigurasi aplikasi SmartRoute AI"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-dev-secret-key-12345')
    GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
    GROQ_MODEL = os.getenv('GROQ_MODEL', 'openai/gpt-oss-120b')
    OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', '')
    
    # Supabase Cloud Database Configuration
    SUPABASE_URL = os.getenv('SUPABASE_URL', '')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')

    # Path default SQLite database
    DATABASE_PATH = os.path.join(BASE_DIR, os.getenv('DATABASE_PATH', 'database/smartroute.db'))
    
    # External API endpoints
    NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search"
    OSRM_BASE_URL = "https://router.project-osrm.org/route/v1"
    OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5/weather"
