import unittest

from engines.thesis_risk_engine import assess_thesis, assess_portfolio


class TestThesisRiskEngine(unittest.TestCase):

    def setUp(self):
        self.valid_holding = {
            "symbol": "TEST",
            "current_price": 110,
            "valuation_floor": 100,
            "thesis": "Example investment rationale for testing.",
            "market_value": 1000,
        }

    def test_price_above_floor_has_no_floor_warning(self):
        holding = {**self.valid_holding, "current_price": 120}
        report = assess_thesis(holding)

        codes = {f["code"] for f in report["findings"]}
        self.assertNotIn("BELOW_VALUATION_FLOOR", codes)
        self.assertNotIn("NEAR_VALUATION_FLOOR", codes)
        self.assertEqual(report["price_vs_floor_pct"], 20.0)

    def test_exactly_five_percent_above_floor_is_flagged(self):
        holding = {**self.valid_holding, "current_price": 105}
        report = assess_thesis(holding)

        codes = {f["code"] for f in report["findings"]}
        self.assertIn("NEAR_VALUATION_FLOOR", codes)

    def test_price_below_floor_is_high_severity(self):
        holding = {**self.valid_holding, "current_price": 90}
        report = assess_thesis(holding)

        self.assertEqual(report["highest_severity"], "HIGH")
        self.assertIn(
            "BELOW_VALUATION_FLOOR",
            {f["code"] for f in report["findings"]},
        )

    def test_missing_thesis_is_flagged(self):
        holding = {**self.valid_holding, "thesis": ""}
        report = assess_thesis(holding)

        self.assertIn(
            "MISSING_THESIS",
            {f["code"] for f in report["findings"]},
        )

    def test_invalid_price_does_not_crash(self):
        holding = {**self.valid_holding, "current_price": "unknown"}
        report = assess_thesis(holding)

        self.assertIsNone(report["current_price"])
        self.assertIn(
            "INVALID_CURRENT_PRICE",
            {f["code"] for f in report["findings"]},
        )

    def test_portfolio_concentration(self):
        holdings = [
            {**self.valid_holding, "symbol": "AAA", "market_value": 600},
            {**self.valid_holding, "symbol": "BBB", "market_value": 400},
        ]
        report = assess_portfolio(holdings)

        self.assertEqual(report["portfolio_market_value"], 1000.0)
        flags = report["concentration_findings"]
        self.assertEqual(len(flags), 2)

        weights = {flag["symbol"]: flag["weight_pct"] for flag in flags}
        self.assertEqual(weights["AAA"], 60.0)
        self.assertEqual(weights["BBB"], 40.0)

    def test_invalid_concentration_threshold_is_rejected(self):
        with self.assertRaises(ValueError):
            assess_portfolio([self.valid_holding], concentration_limit_pct=0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
