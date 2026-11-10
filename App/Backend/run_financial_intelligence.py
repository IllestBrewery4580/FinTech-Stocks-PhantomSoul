import json

from engines.financial_intelligence_engine import (
    build_financial_intelligence_report,
)
from engines.nexus_engine import OwnerBusinessProfile
from engines.scenario_engine import BusinessScenario


profile = OwnerBusinessProfile(
    personal_liquid_assets=30_000,
    personal_annual_expenses=60_000,
    personal_investable_assets=150_000,
    personal_industry_exposure=90_000,
    business_revenue=1_000_000,
    business_operating_cash_flow=100_000,
    business_debt=200_000,
    business_owner_equity=400_000,
)

holdings = [
    {
        "symbol": "AAPL",
        "current_price": 210,
        "valuation_floor": 200,
        "thesis": "Example: recurring services revenue and ecosystem strength.",
        "market_value": 60_000,
    },
    {
        "symbol": "NVDA",
        "current_price": 95,
        "valuation_floor": 110,
        "thesis": "Example: demand for accelerated computing.",
        "market_value": 30_000,
    },
    {
        "symbol": "KO",
        "current_price": 70,
        "valuation_floor": 65,
        "thesis": "Example: established beverage brands and distribution.",
        "market_value": 10_000,
    },
]

scenario = BusinessScenario(
    name="Business downturn",
    revenue_change_pct=-20,
    cash_flow_change_pct=-50,
    investment_value_change_pct=-15,
    debt_change_pct=0,
)

report = build_financial_intelligence_report(
    profile=profile,
    holdings=holdings,
    scenario=scenario,
)

print(json.dumps(report, indent=2))
