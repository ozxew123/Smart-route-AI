import unittest
from services.groq_service import GroqService

class TestNLP(unittest.TestCase):
    def test_heuristic_nlp_extraction(self):
        service = GroqService()
        query = "Saya mau berangkat dari Depok ke Monas naik motor"
        result = service._heuristic_extract(query)
        self.assertEqual(result["origin"], "depok")
        self.assertIn("monas", result["destination"])
        self.assertEqual(result["vehicle"], "motor")
        self.assertTrue(result["complete"])

    def test_incomplete_query(self):
        service = GroqService()
        query = "Mau ke Monas"
        result = service._heuristic_extract(query)
        self.assertIsNone(result["origin"])
        self.assertEqual(result["destination"], "monas")
        self.assertFalse(result["complete"])

if __name__ == '__main__':
    unittest.main()

