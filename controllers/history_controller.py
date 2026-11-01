from flask import Blueprint, render_template, request, jsonify, session, redirect, url_for, flash
from models.history_model import HistoryModel

history_bp = Blueprint('history', __name__)

@history_bp.route('/history')
def dashboard():
    """Halaman Dashboard Riwayat Perjalanan."""
    user_id = session.get('user_id')
    if not user_id:
        flash('Silakan masuk terlebih dahulu untuk melihat riwayat.', 'info')
        return redirect(url_for('auth.login'))

    histories = HistoryModel.get_history_by_user(user_id)
    return render_template('dashboard.html', histories=histories, user_name=session.get('user_name'))

@history_bp.route('/api/history', methods=['GET'])
def get_histories_api():
    """API untuk mengambil daftar riwayat pengguna aktif."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    histories = HistoryModel.get_history_by_user(user_id)
    return jsonify({"success": True, "data": histories})

@history_bp.route('/api/history/<int:history_id>', methods=['DELETE', 'POST'])
def delete_history(history_id):
    """Menghapus item riwayat tertentu."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "Unauthorized"}), 401

    success = HistoryModel.delete_history(history_id, user_id)
    if request.is_json or request.method == 'DELETE':
        return jsonify({"success": success})
    
    flash('Riwayat berhasil dihapus.', 'success')
    return redirect(url_for('history.dashboard'))

