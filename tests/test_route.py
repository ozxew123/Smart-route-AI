import unittest
from services.map_service import MapService

class TestRoute(unittest.TestCase):
    def test_map_midpoint_calculation(self):
        service = MapService()
        coords = [
            [-6.368, 106.833],
            [-6.250, 106.820],
            [-6.175, 106.827]
        ]
        midpoint = service.get_route_midpoint(coords)
        self.assertIsNotNone(midpoint)
        self.assertEqual(midpoint["lat"], -6.250)
        self.assertEqual(midpoint["lon"], 106.820)

if __name__ == '__main__':
    unittest.main()

