import unittest
from models.user_model import UserModel
from models.history_model import HistoryModel
from database.db import init_db

class TestHistory(unittest.TestCase):
    def test_user_and_history_crud(self):
        # Setup test DB
        init_db()
        
        # Register test user
        email = "tester@gunadarma.ac.id"
        user = UserModel.find_by_email(email)
        if not user:
            user = UserModel.register("Tester PWEB", email, "secret123")
        
        self.assertEqual(user["email"], email)
        
        # Save history
        hist_id = HistoryModel.save_history(
            user_id=user["id"],
            raw_query="Depok ke Monas motor",
            origin="Depok",
            destination="Monas",
            vehicle="motor",
            route_summary={"distance_km": 30.5},
            weather_summary={"status": "Berawan"},
            ai_advice="Hati-hati berkendara."
        )
        self.assertGreater(hist_id, 0)
        
        # Read history
        histories = HistoryModel.get_history_by_user(user["id"])
        self.assertGreater(len(histories), 0)
        self.assertEqual(histories[0]["origin"], "Depok")
        
        # Delete history
        deleted = HistoryModel.delete_history(hist_id, user["id"])
        self.assertTrue(deleted)

if __name__ == '__main__':
    unittest.main()

