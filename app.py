import os
from flask import Flask, render_template
from config import Config
from database.db import init_db

def create_app():
    """Application Factory untuk SmartRoute AI."""
    app = Flask(__name__)
    app.config.from_object(Config)

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

    # Penanganan Halaman Error
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('base.html'), 404

    @app.errorhandler(500)
    def internal_server_error(e):
        return render_template('base.html'), 500

    return app

app = create_app()

if __name__ == '__main__':
    # Mode development
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

