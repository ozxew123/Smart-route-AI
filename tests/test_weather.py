import unittest
from services.weather_service import WeatherService
from services.decision_engine import DecisionEngine

class TestWeatherAndSafety(unittest.TestCase):
    def test_weather_simulated_sampling(self):
        service = WeatherService()
        coords = {"lat": -6.3686, "lon": 106.8331}
        weather = service.get_weather_at_point(coords["lat"], coords["lon"], label="Depok")
        self.assertIn("label", weather)
        self.assertEqual(weather["label"], "Depok")

    def test_decision_engine_rain_risk(self):
        weather_sample = {
            "origin": {"condition": "Clear", "description": "cerah", "wind_speed_ms": 3},
            "midpoint": {"condition": "Rain", "description": "hujan sedang", "wind_speed_ms": 4},
            "destination": {"condition": "Clouds", "description": "berawan", "wind_speed_ms": 2}
        }
        risk = DecisionEngine.analyze_weather_risk(weather_sample, vehicle="motor")
        self.assertEqual(risk["risk_level"], "Tinggi")
        self.assertTrue(risk["rain_detected"])
        
        advice = DecisionEngine.build_safety_advice(risk, vehicle="motor", distance_km=25)
        self.assertIn("jas hujan", advice.lower())

if __name__ == '__main__':
    unittest.main()

