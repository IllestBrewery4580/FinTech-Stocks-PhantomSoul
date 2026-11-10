import unittest

from engines.portfolio_quality_engine import analyze_portfolio


class PortfolioQualityTests(unittest.TestCase):
    def test_calculates_weights_and_concentration(self):
        result = analyze_portfolio([
            {"symbol": "AAPL", "market_value": 600, "asset_type": "EQUITY"},
            {"symbol": "MSFT", "market_value": 400, "asset_type": "EQUITY"},
        ])
        self.assertEqual(result["total_market_value"], 1000)
        self.assertEqual(result["position_count"], 2)
        self.assertAlmostEqual(result["largest_position_weight"], 0.6)
        self.assertAlmostEqual(result["concentration_index"], 0.52)

    def test_aggregates_duplicate_symbols(self):
        result = analyze_portfolio([
            {"symbol": "aapl", "market_value": 200},
            {"symbol": "AAPL", "market_value": 300},
            {"symbol": "MSFT", "market_value": 500},
        ])
        self.assertEqual(result["position_count"], 2)
        self.assertEqual(result["positions"][0]["symbol"], "AAPL")
        self.assertEqual(result["positions"][0]["market_value"], 500)

    def test_flags_concentrated_position(self):
        result = analyze_portfolio([
            {"symbol": "AAPL", "market_value": 800},
            {"symbol": "MSFT", "market_value": 200},
        ])
        codes = [flag["code"] for flag in result["flags"]]
        self.assertIn("POSITION_CONCENTRATION", codes)

    def test_rejects_negative_market_value(self):
        with self.assertRaises(ValueError):
            analyze_portfolio([{"symbol": "AAPL", "market_value": -100}])

    def test_rejects_zero_total(self):
        with self.assertRaises(ValueError):
            analyze_portfolio([{"symbol": "AAPL", "market_value": 0}])

    def test_rejects_missing_symbol(self):
        with self.assertRaises(ValueError):
            analyze_portfolio([{"market_value": 100}])

    def test_rejects_invalid_threshold(self):
        with self.assertRaises(ValueError):
            analyze_portfolio(
                [{"symbol": "AAPL", "market_value": 100}],
                concentration_threshold=0,
            )

    def test_rejects_boolean_market_value(self):
        with self.assertRaises(ValueError):
            analyze_portfolio([{"symbol": "AAPL", "market_value": True}])


if __name__ == "__main__":
    unittest.main()
