import unittest

from engines.nexus_engine import OwnerBusinessProfile, analyze_exposure


class TestNexusEngine(unittest.TestCase):
    def make_profile(self, **overrides):
        values = {
            "personal_liquid_assets": 30_000,
            "personal_annual_expenses": 60_000,
            "personal_investable_assets": 150_000,
            "personal_industry_exposure": 45_000,
            "business_revenue": 500_000,
            "business_operating_cash_flow": 75_000,
            "business_debt": 100_000,
            "business_owner_equity": 200_000,
        }
        values.update(overrides)
        return OwnerBusinessProfile(**values)

    def test_healthy_profile_returns_metrics(self):
        profile = self.make_profile(
            personal_liquid_assets=60_000,
            personal_annual_expenses=60_000,
            business_operating_cash_flow=100_000,
            business_debt=100_000,
        )

        result = analyze_exposure(profile)

        self.assertEqual(
            result["metrics"]["personal_liquidity_months"], 12.0
        )
        self.assertEqual(
            result["metrics"]["business_cash_flow_margin_pct"], 20.0
        )
        self.assertIn("risk_flags", result)

    def test_low_personal_liquidity_is_flagged(self):
        result = analyze_exposure(
            self.make_profile(personal_liquid_assets=10_000)
        )

        codes = {flag["code"] for flag in result["risk_flags"]}
        self.assertIn("LOW_PERSONAL_LIQUIDITY", codes)

    def test_debt_with_nonpositive_cash_flow_is_flagged(self):
        result = analyze_exposure(
            self.make_profile(business_operating_cash_flow=0)
        )

        codes = {flag["code"] for flag in result["risk_flags"]}
        self.assertIn("DEBT_CAPACITY_UNCLEAR", codes)

    def test_negative_profile_values_are_rejected(self):
        with self.assertRaises(ValueError):
            analyze_exposure(
                self.make_profile(personal_liquid_assets=-1)
            )


if __name__ == "__main__":
    unittest.main()
