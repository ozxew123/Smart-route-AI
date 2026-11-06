from flask import Blueprint, request, jsonify, session, redirect
from models.history_model import HistoryModel

history_bp = Blueprint('history', __name__)

@history_bp.route('/history')
@history_bp.route('/dashboard')
def dashboard_redirect():
    """Mengalihkan akses history / dashboard web ke halaman Next.js."""
    return redirect('http://localhost:3000/history')

@history_bp.route('/api/history', methods=['GET'])
def get_histories_api():
    """API untuk mengambil daftar riwayat pengguna aktif."""
    user_id = session.get('user_id')
    if not user_id:
        # Jika belum login, kembalikan daftar kosong (Next.js akan menggunakan demo fallback)
        return jsonify([])

    histories = HistoryModel.get_history_by_user(user_id)
    return jsonify(histories)

@history_bp.route('/api/history/<int:history_id>', methods=['DELETE', 'POST'])
def delete_history(history_id):
    """Menghapus item riwayat tertentu."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    success = HistoryModel.delete_history(history_id, user_id)
    return jsonify({"success": success})
