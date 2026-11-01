from flask import Blueprint, request, render_template, redirect, url_for, session, flash, jsonify
from models.user_model import UserModel

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['GET', 'POST'])
@auth_bp.route('/register.html', methods=['GET', 'POST'])
def register():
    """Halaman dan proses registrasi pengguna."""
    if request.method == 'POST':
        nama = request.form.get('nama', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')

        if not nama or not email or not password:
            flash('Semua kolom wajib diisi!', 'danger')
            return render_template('register.html')

        if UserModel.find_by_email(email):
            flash('Email sudah terdaftar. Silakan gunakan email lain atau login.', 'warning')
            return render_template('register.html')

        try:
            UserModel.register(nama, email, password)
            flash('Registrasi berhasil! Silakan masuk.', 'success')
            return redirect(url_for('auth.login'))
        except Exception as e:
            flash(f'Terjadi kesalahan saat pendaftaran: {e}', 'danger')

    return render_template('register.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
@auth_bp.route('/login.html', methods=['GET', 'POST'])
def login():
    """Halaman dan proses login pengguna."""
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')

        user = UserModel.find_by_email(email)
        if user and UserModel.verify_password(user['password_hash'], password):
            session['user_id'] = user['id']
            session['user_name'] = user['nama']
            session['user_email'] = user['email']
            flash(f'Selamat datang kembali, {user["nama"]}!', 'success')
            return redirect(url_for('route.home'))
        else:
            flash('Email atau kata sandi tidak valid.', 'danger')

    return render_template('login.html')

@auth_bp.route('/logout')
def logout():
    """Mengakhiri sesi pengguna."""
    session.clear()
    flash('Anda telah berhasil keluar.', 'info')
    return redirect(url_for('auth.login'))

