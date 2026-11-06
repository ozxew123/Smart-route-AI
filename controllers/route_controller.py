from flask import Blueprint, request, jsonify, session, redirect
from services.gemini_service import GeminiService
from services.map_service import MapService
from services.weather_service import WeatherService
from services.decision_engine import DecisionEngine
from models.history_model import HistoryModel

route_bp = Blueprint('route', __name__)

gemini_service = GeminiService()
map_service = MapService()
weather_service = WeatherService()

@route_bp.route('/')
def index():
    """Mengalihkan akses root Flask ke antarmuka Next.js di port 3000."""
    return redirect('http://localhost:3000')

@route_bp.route('/home')
def home():
    """Mengalihkan akses rute home Flask ke antarmuka Next.js."""
    return redirect('http://localhost:3000/home')

@route_bp.route('/api/status', methods=['GET'])
def api_status():
    """Health check endpoint untuk SmartRoute AI Backend API."""
    return jsonify({
        "status": "online",
        "service": "SmartRoute AI Flask Backend",
        "frontend": "http://localhost:3000",
        "version": "2.0.0"
    })

@route_bp.route('/api/process-route', methods=['POST'])
def process_route():
    """
    Endpoint utama integrasi (API Chaining):
    1. NLP Gemini (ekstraksi asal, tujuan, kendaraan)
    2. Nominatim Geocoding
    3. OSRM Routing & Midpoint
    4. OpenWeatherMap 3-Point Weather Sampling
    5. Decision Engine Safety Advice
    6. Simpan Riwayat
    """
    data = request.get_json() or {}
    user_query = data.get('query', '').strip()
    override_vehicle = data.get('vehicle')

    if not user_query:
        return jsonify({"success": False, "message": "Permintaan tidak boleh kosong."}), 400

    # 1. NLP Ekstraksi
    nlp_result = gemini_service.extract_entities(user_query)
    origin_name = nlp_result.get('origin')
    dest_name = nlp_result.get('destination')
    vehicle = override_vehicle or nlp_result.get('vehicle', 'motor')

    # Validasi kelengkapan informasi (FR-06: Minta klarifikasi jika kurang)
    if not origin_name or not dest_name:
        missing = []
        if not origin_name: missing.append("lokasi asal")
        if not dest_name: missing.append("lokasi tujuan")
        return jsonify({
            "success": False,
            "clarification_needed": True,
            "message": f"Mohon lengkapi { ' dan '.join(missing) } perjalanan Anda.",
            "extracted": nlp_result
        })

    # 2. Geocoding
    origin_geo = map_service.geocode(origin_name)
    if not origin_geo:
        return jsonify({
            "success": False,
            "message": f"Lokasi asal '{origin_name}' tidak ditemukan pada peta."
        }), 404

    dest_geo = map_service.geocode(dest_name)
    if not dest_geo:
        return jsonify({
            "success": False,
            "message": f"Lokasi tujuan '{dest_name}' tidak ditemukan pada peta."
        }), 404

    # 3. Routing OSRM
    route_data = map_service.get_route(origin_geo, dest_geo, vehicle=vehicle)
    if not route_data:
        return jsonify({
            "success": False,
            "message": "Tidak dapat menemukan rute perjalanan antara kedua titik tersebut."
        }), 404

    # 4. Sampling Cuaca 3 Titik (FR-04)
    weather_3pts = weather_service.sample_three_points(
        origin_coords=route_data['origin'],
        midpoint_coords=route_data['midpoint'],
        dest_coords=route_data['destination']
    )

    # 5. Decision Engine
    risk_analysis = DecisionEngine.analyze_weather_risk(weather_3pts, vehicle=vehicle)
    base_advice = DecisionEngine.build_safety_advice(
        risk_analysis, vehicle=vehicle, distance_km=route_data['distance_km']
    )
    final_advice = gemini_service.generate_safety_advice(
        origin_name, dest_name, vehicle, weather_3pts, base_advice
    )

    # 6. Simpan ke Riwayat jika user sedang login
    user_id = session.get('user_id')
    history_id = None
    if user_id:
        try:
            history_id = HistoryModel.save_history(
                user_id=user_id,
                raw_query=user_query,
                origin=origin_name,
                destination=dest_name,
                vehicle=vehicle,
                route_summary={
                    "distance_km": route_data['distance_km'],
                    "duration_min": route_data['duration_min']
                },
                weather_summary=weather_3pts,
                ai_advice=final_advice
            )
        except Exception as e:
            print(f"[RouteController] Gagal menyimpan riwayat: {e}")

    return jsonify({
        "success": True,
        "query": user_query,
        "entities": {
            "origin": origin_name,
            "destination": dest_name,
            "vehicle": vehicle
        },
        "route": route_data,
        "weather": weather_3pts,
        "risk": risk_analysis,
        "advice": final_advice,
        "history_id": history_id
    })
