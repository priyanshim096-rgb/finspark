import sys
import os
import unittest
from fastapi.testclient import TestClient

# Ensure backend folder is in path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.main import app
from backend.app.database import init_db

class TestSentinelXBackend(unittest.TestCase):
    def setUp(self):
        init_db()
        self.client = TestClient(app)
        self.client.post("/api/simulator/reset")

    def test_root_endpoint(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("Welcome", res.json()["message"])

    def test_simulator_reset(self):
        res = self.client.post("/api/simulator/reset")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["current_step"], 0)

    def test_simulator_advance(self):
        # Advance 1 step
        res = self.client.post("/api/simulator/advance")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["current_step"], 1)
        
        # Verify status endpoint returns the advanced step
        res_status = self.client.get("/api/simulator/status")
        self.assertEqual(res_status.status_code, 200)
        self.assertEqual(res_status.json()["step"], 1)

    def test_risk_scores_query(self):
        res = self.client.get("/api/risk-scores")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreater(len(data), 0)
        
    def test_graph_endpoints(self):
        res = self.client.get("/api/graph")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("nodes", data)
        self.assertIn("edges", data)

    def test_copilot_matching(self):
        res = self.client.post("/api/copilot", json={"query": "Show all transactions influenced by compromised devices."})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("scanning graph", data["answer"].lower())

if __name__ == "__main__":
    unittest.main()
