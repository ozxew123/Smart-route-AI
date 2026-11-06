import os
from flask import Flask, render_template
from config import Config
from database.db import init_db

def create_app():
    """Application Factory untuk SmartRoute AI."""
    app = Flask(__name__)
    app.config.from_object(Config)

    # Keamanan Cookie Sesi (security-and-hardening skill)
    app.config.update(
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE='Lax',
        PERMANENT_SESSION_LIFETIME=86400 * 7 # 7 hari
    )

    # Inisialisasi basis data jika belum ada
    with app.app_context():
        try:
            init_db()
        except Exception as e:
            print(f"Database initialization note: {e}")

    # Registrasi Blueprints (MVC Architecture)
    from controllers.auth_controller import auth_bp
    from controllers.route_controller import route_bp
    from controllers.history_controller import history_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(route_bp)
    app.register_blueprint(history_bp)

    # HTTP Security Headers (security-and-hardening skill)
    @app.after_request
    def set_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        return response

    # Penanganan Halaman Error API & Redirect
    @app.errorhandler(404)
    def page_not_found(e):
        return {"success": False, "message": "Endpoint tidak ditemukan."}, 404

    @app.errorhandler(500)
    def internal_server_error(e):
        return {"success": False, "message": "Terjadi kesalahan internal pada server."}, 500

    return app

app = create_app()

if __name__ == '__main__':
    # Mode development
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

