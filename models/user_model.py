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

from database.db import get_db_connection, get_supabase_client

class UserModel:
    """Model Pengguna (Class Diagram: User_Model) dengan integrasi Supabase & SQLite fallback"""

    @staticmethod
    def register(nama, email, password):
        """Mendaftarkan pengguna baru dengan password hashing."""
        password_hash = generate_password_hash(password)
        clean_email = email.lower().strip()

        # Prioritas 1: Supabase Cloud Database
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table('users').insert({
                    'nama': nama,
                    'email': clean_email,
                    'password_hash': password_hash
                }).execute()
                if res.data and len(res.data) > 0:
                    created = res.data[0]
                    return {"id": created['id'], "nama": created['nama'], "email": created['email']}
            except Exception as e:
                print(f"[UserModel] Supabase register error: {e}, mencoba fallback SQLite")

        # Prioritas 2: Fallback SQLite Lokal
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "INSERT INTO users (nama, email, password_hash) VALUES (?, ?, ?)",
                (nama, clean_email, password_hash)
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
        clean_email = email.lower().strip()

        # Prioritas 1: Supabase Cloud Database
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table('users').select('*').eq('email', clean_email).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
                return None
            except Exception as e:
                print(f"[UserModel] Supabase find_by_email error: {e}, mencoba fallback SQLite")

        # Prioritas 2: Fallback SQLite Lokal
        conn = get_db_connection()
        user = conn.execute(
            "SELECT * FROM users WHERE email = ?",
            (clean_email,)
        ).fetchone()
        conn.close()
        return dict(user) if user else None

    @staticmethod
    def find_by_id(user_id):
        """Mencari data pengguna berdasarkan ID."""
        # Prioritas 1: Supabase Cloud Database
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table('users').select('id, nama, email, created_at').eq('id', user_id).execute()
                if res.data and len(res.data) > 0:
                    return res.data[0]
                return None
            except Exception as e:
                print(f"[UserModel] Supabase find_by_id error: {e}, mencoba fallback SQLite")

        # Prioritas 2: Fallback SQLite Lokal
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
        clean_email = email.lower().strip()

        # Prioritas 1: Supabase Cloud Database
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table('users').update({
                    'password_hash': password_hash
                }).eq('email', clean_email).execute()
                return len(res.data) > 0 if res.data else False
            except Exception as e:
                print(f"[UserModel] Supabase update_password error: {e}, mencoba fallback SQLite")

        # Prioritas 2: Fallback SQLite Lokal
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                "UPDATE users SET password_hash = ? WHERE email = ?",
                (password_hash, clean_email)
            )
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
