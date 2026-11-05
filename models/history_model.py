import json
from database.db import get_db_connection

class HistoryModel:
    """Model Riwayat Pencarian (Class Diagram: History_Model)"""

    @staticmethod
    def save_history(user_id, raw_query, origin, destination, vehicle, route_summary, weather_summary, ai_advice):
        """Menyimpan riwayat rute yang dicari pengguna."""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Konversi struktur dict/list ke JSON string bila diperlukan
        route_str = json.dumps(route_summary) if isinstance(route_summary, (dict, list)) else route_summary
        weather_str = json.dumps(weather_summary) if isinstance(weather_summary, (dict, list)) else weather_summary
        
        cursor.execute(
            """
            INSERT INTO search_histories 
            (user_id, raw_query, origin, destination, vehicle, route_summary, weather_summary, ai_advice)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, raw_query, origin, destination, vehicle, route_str, weather_str, ai_advice)
        )
        conn.commit()
        history_id = cursor.lastrowid
        conn.close()
        return history_id

    @staticmethod
    def get_history_by_user(user_id, limit=30):
        """Mengambil daftar riwayat pencarian milik user tertentu dengan data terurai."""
        conn = get_db_connection()
        rows = conn.execute(
            """
            SELECT * FROM search_histories 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
            """,
            (user_id, limit)
        ).fetchall()
        conn.close()

        results = []
        for row in rows:
            d = dict(row)
            if isinstance(d.get('route_summary'), str):
                try:
                    d['route_data'] = json.loads(d['route_summary'])
                except Exception:
                    d['route_data'] = {}
            else:
                d['route_data'] = d.get('route_summary') or {}

            if isinstance(d.get('weather_summary'), str):
                try:
                    d['weather_data'] = json.loads(d['weather_summary'])
                except Exception:
                    d['weather_data'] = {}
            else:
                d['weather_data'] = d.get('weather_summary') or {}

            results.append(d)
        return results

    @staticmethod
    def delete_history(history_id, user_id):
        """Menghapus riwayat milik user tertentu (proteksi akses)."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM search_histories WHERE id = ? AND user_id = ?",
            (history_id, user_id)
        )
        conn.commit()
        deleted = cursor.rowcount > 0
        conn.close()
        return deleted

