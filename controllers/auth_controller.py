from flask import Blueprint, request, jsonify, session, redirect
from models.user_model import UserModel

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login')
def login_redirect():
    """Mengalihkan akses login web ke halaman Next.js."""
    return redirect('http://localhost:3000/login')

@auth_bp.route('/register')
def register_redirect():
    """Mengalihkan akses register web ke halaman Next.js."""
    return redirect('http://localhost:3000/register')

@auth_bp.route('/reset-password')
def reset_password_redirect():
    """Mengalihkan akses reset password web ke halaman Next.js."""
    return redirect('http://localhost:3000/reset-password')

@auth_bp.route('/api/register', methods=['POST'])
def api_register():
    """API endpoint untuk registrasi pengguna baru dari Next.js."""
    data = request.get_json() or request.form.to_dict() or {}
    nama = data.get('nama', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not nama or not email or not password:
        return jsonify({"success": False, "message": "Semua kolom nama, email, dan kata sandi wajib diisi!"}), 400

    if UserModel.find_by_email(email):
        return jsonify({"success": False, "message": "Email sudah terdaftar. Silakan gunakan email lain atau login."}), 409

    try:
        user_id = UserModel.register(nama, email, password)
        session['user_id'] = user_id
        session['user_name'] = nama
        session['user_email'] = email
        return jsonify({
            "success": True,
            "message": "Registrasi akun berhasil!",
            "user": {"id": user_id, "nama": nama, "email": email}
        }), 201
    except Exception as e:
        return jsonify({"success": False, "message": f"Terjadi kesalahan: {e}"}), 500

@auth_bp.route('/api/login', methods=['POST'])
def api_login():
    """API endpoint untuk login pengguna dari Next.js."""
    data = request.get_json() or request.form.to_dict() or {}
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"success": False, "message": "Email dan kata sandi wajib diisi."}), 400

    user = UserModel.find_by_email(email)
    if user and UserModel.verify_password(user['password_hash'], password):
        session['user_id'] = user['id']
        session['user_name'] = user['nama']
        session['user_email'] = user['email']
        return jsonify({
            "success": True,
            "message": f"Selamat datang kembali, {user['nama']}!",
            "user": {
                "id": user['id'],
                "nama": user['nama'],
                "email": user['email']
            }
        }), 200
    else:
        return jsonify({"success": False, "message": "Email atau kata sandi tidak valid."}), 401

@auth_bp.route('/api/reset-password', methods=['POST'])
def api_reset_password():
    """API endpoint untuk reset kata sandi dari Next.js."""
    data = request.get_json() or request.form.to_dict() or {}
    email = data.get('email', '').strip()
    new_password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')

    if not email or not new_password:
        return jsonify({"success": False, "message": "Email dan kata sandi baru wajib diisi."}), 400

    if confirm_password and new_password != confirm_password:
        return jsonify({"success": False, "message": "Konfirmasi kata sandi tidak cocok."}), 400

    user = UserModel.find_by_email(email)
    if not user:
        return jsonify({"success": False, "message": "Alamat email tidak terdaftar dalam sistem."}), 404

    try:
        UserModel.update_password(email, new_password)
        return jsonify({"success": True, "message": "Kata sandi berhasil diperbarui. Silakan login kembali."}), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Gagal memperbarui kata sandi: {e}"}), 500

@auth_bp.route('/api/me', methods=['GET'])
def api_me():
    """API untuk memeriksa status login pengguna saat ini."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"authenticated": False}), 200
    
    return jsonify({
        "authenticated": True,
        "user": {
            "id": user_id,
            "nama": session.get('user_name'),
            "email": session.get('user_email')
        }
    }), 200

@auth_bp.route('/api/profile', methods=['GET', 'POST'])
def api_profile():
    """API untuk melihat dan memperbarui profil pengguna."""
    if request.method == 'GET':
        user_id = session.get('user_id')
        nama = session.get('user_name', 'Hikmal Ramadhan')
        email = session.get('user_email', 'hikmal.commuter@gmail.com')
        return jsonify({
            "success": True,
            "profile": {
                "id": user_id,
                "nama": nama,
                "email": email,
                "phone": session.get('user_phone', '0812-9876-5432'),
                "vehicle": session.get('vehicle_pref', 'motor'),
                "default_origin": session.get('default_origin', 'Margonda, Depok'),
                "avoid_heavy_rain": session.get('avoid_heavy_rain', True),
                "raincoat_alert": session.get('raincoat_alert', True),
                "speed_caution": session.get('speed_caution', True)
            }
        }), 200

    data = request.get_json() or {}
    nama = data.get('nama', '').strip()
    email = data.get('email', '').strip()

    if nama:
        session['user_name'] = nama
    if email:
        session['user_email'] = email
    if 'phone' in data:
        session['user_phone'] = data.get('phone')
    if 'vehicle' in data:
        session['vehicle_pref'] = data.get('vehicle')
    if 'default_origin' in data:
        session['default_origin'] = data.get('default_origin')

    return jsonify({
        "success": True,
        "message": "Profil berhasil diperbarui!",
        "profile": {
            "nama": session.get('user_name'),
            "email": session.get('user_email')
        }
    }), 200

@auth_bp.route('/api/logout', methods=['GET', 'POST'])
@auth_bp.route('/logout')
def logout():
    """Mengakhiri sesi pengguna."""
    session.clear()
    if request.is_json or request.path.startswith('/api/'):
        return jsonify({"success": True, "message": "Berhasil keluar."}), 200
    return redirect('http://localhost:3000/login')
