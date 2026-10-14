
import unittest

from engines.scenario_engine import (
    BusinessScenario,
    simulate_business_scenario,
)


class TestScenarioEngine(unittest.TestCase):
    def setUp(self):
        self.baseline = {
            "revenue": 1_000_000,
            "operating_cash_flow": 100_000,
            "business_debt": 200_000,
            "investment_value": 300_000,
        }

    def run_scenario(self, scenario):
        return simulate_business_scenario(
            **self.baseline,
            scenario=scenario,
        )

    def test_downturn_calculates_stressed_values(self):
        result = self.run_scenario(
            BusinessScenario(
                name="Business downturn",
                revenue_change_pct=-20,
                cash_flow_change_pct=-50,
                investment_value_change_pct=-15,
            )
        )

        self.assertEqual(result["stressed"]["revenue"], 800_000)
        self.assertEqual(
            result["stressed"]["operating_cash_flow"], 50_000
        )
        self.assertEqual(result["stressed"]["investment_value"], 255_000)
        self.assertEqual(result["stressed"]["debt_to_cash_flow"], 4.0)

    def test_high_stressed_debt_ratio_is_flagged(self):
        result = self.run_scenario(
            BusinessScenario(
                name="Business downturn",
                revenue_change_pct=-20,
                cash_flow_change_pct=-50,
                investment_value_change_pct=-15,
            )
        )

        self.assertIn(
            "HIGH_STRESSED_DEBT_TO_CASH_FLOW",
            result["risk_flags"],
        )

    def test_negative_cash_flow_is_flagged(self):
        result = self.run_scenario(
            BusinessScenario(
                name="Severe downturn",
                cash_flow_change_pct=-100,
            )
        )

        self.assertIn(
            "DEBT_CAPACITY_UNCLEAR",
            result["risk_flags"],
        )

    def test_invalid_shock_is_rejected(self):
        with self.assertRaises(ValueError):
            self.run_scenario(
                BusinessScenario(
                    name="Invalid scenario",
                    revenue_change_pct=-101,
                )
            )


if __name__ == "__main__":
    unittest.main()
