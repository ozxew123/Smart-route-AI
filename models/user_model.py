import hashlib

try:
    from werkzeug.security import generate_password_hash, check_password_hash
except ImportError:
    def generate_password_hash(password: str) -> str:
        # Fallback SHA256 jika werkzeug belum terpasang
        return "sha256$" + hashlib.sha256(password.encode('utf-8')).hexdigest()

    def check_password_hash(stored_hash: str, password: str) -> bool:
        if stored_hash.startswith("sha256$"):
            return stored_hash == ("sha256$" + hashlib.sha256(password.encode('utf-8')).hexdigest())
        return False

from database.db import get_db_connection

class UserModel:
    """Model Pengguna (Class Diagram: User_Model)"""

    @staticmethod
    def register(nama, email, password):
        """Mendaftarkan pengguna baru dengan password hashing."""
        password_hash = generate_password_hash(password)
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO users (nama, email, password_hash) VALUES (?, ?, ?)",
                (nama, email.lower().strip(), password_hash)
            )
            conn.commit()
            user_id = cursor.lastrowid
            return {"id": user_id, "nama": nama, "email": email}
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    @staticmethod
    def find_by_email(email):
        """Mencari data pengguna berdasarkan email."""
        conn = get_db_connection()
        user = conn.execute(
            "SELECT * FROM users WHERE email = ?",
            (email.lower().strip(),)
        ).fetchone()
        conn.close()
        return dict(user) if user else None

    @staticmethod
    def find_by_id(user_id):
        """Mencari data pengguna berdasarkan ID."""
        conn = get_db_connection()
        user = conn.execute(
            "SELECT id, nama, email, created_at FROM users WHERE id = ?",
            (user_id,)
        ).fetchone()
        conn.close()
        return dict(user) if user else None

    @staticmethod
    def verify_password(stored_hash, password):
        """Verifikasi hash password pengguna."""
        return check_password_hash(stored_hash, password)

    @staticmethod
    def update_password(email, new_password):
        """Memperbarui kata sandi pengguna berdasarkan email."""
        password_hash = generate_password_hash(new_password)
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "UPDATE users SET password_hash = ? WHERE email = ?",
                (password_hash, email.lower().strip())
            )
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
