import unittest

from engines.financial_intelligence_engine import (
    build_financial_intelligence_report,
)
from engines.nexus_engine import OwnerBusinessProfile
from engines.scenario_engine import BusinessScenario


class TestFinancialIntelligenceEngine(unittest.TestCase):
    def setUp(self):
        self.profile = OwnerBusinessProfile(
            personal_liquid_assets=10_000,
            personal_annual_expenses=60_000,
            personal_investable_assets=150_000,
            personal_industry_exposure=90_000,
            business_revenue=500_000,
            business_operating_cash_flow=50_000,
            business_debt=200_000,
            business_owner_equity=200_000,
        )

        self.holdings = [
            {
                "symbol": "ABC",
                "current_price": 80,
                "valuation_floor": 100,
                "thesis": "Example test thesis",
                "market_value": 30_000,
            },
            {
                "symbol": "XYZ",
                "current_price": 50,
                "valuation_floor": 40,
                "thesis": "Example second thesis",
                "market_value": 20_000,
            },
        ]

    def test_combines_thesis_and_nexus_findings(self):
        report = build_financial_intelligence_report(
            profile=self.profile,
            holdings=self.holdings,
        )

        sources = {finding["source"] for finding in report["findings"]}

        self.assertIn("thesis_risk", sources)
        self.assertIn("nexus", sources)
        self.assertTrue(report["summary"]["requires_human_review"])
        self.assertEqual(report["summary"]["holdings_assessed"], 2)

    def test_scenario_findings_are_included(self):
        report = build_financial_intelligence_report(
            profile=self.profile,
            holdings=self.holdings,
            scenario=BusinessScenario(
                name="Severe downturn",
                revenue_change_pct=-20,
                cash_flow_change_pct=-80,
            ),
        )

        self.assertIsNotNone(report["components"]["scenario"])
        self.assertIn(
            "scenario",
            {finding["source"] for finding in report["findings"]},
        )

    def test_scenario_can_be_omitted(self):
        report = build_financial_intelligence_report(
            profile=self.profile,
            holdings=self.holdings,
        )

        self.assertIsNone(report["components"]["scenario"])

    def test_invalid_holding_entry_is_rejected(self):
        with self.assertRaises(ValueError):
            build_financial_intelligence_report(
                profile=self.profile,
                holdings=["not a holding"],
            )


if __name__ == "__main__":
    unittest.main()
