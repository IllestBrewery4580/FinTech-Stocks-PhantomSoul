
"""PhantomSoul scenario analysis for business and owner financial exposure."""

from dataclasses import asdict, dataclass
from math import isfinite
from typing import Any


@dataclass(frozen=True)
class BusinessScenario:
    name: str
    revenue_change_pct: float = 0.0
    cash_flow_change_pct: float = 0.0
    investment_value_change_pct: float = 0.0
    debt_change_pct: float = 0.0


def _validate_amount(name: str, value: float) -> None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{name} must be numeric.")
    if not isfinite(value) or value < 0:
        raise ValueError(f"{name} must be finite and non-negative.")


def _validate_shock(name: str, value: float) -> None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{name} must be numeric.")
    if not isfinite(value) or value < -100:
        raise ValueError(f"{name} must be finite and at least -100%.")


def simulate_business_scenario(
    *,
    revenue: float,
    operating_cash_flow: float,
    business_debt: float,
    investment_value: float,
    scenario: BusinessScenario,
) -> dict[str, Any]:
    """Compare baseline metrics with a single deterministic shock scenario."""
    for name, value in {
        "revenue": revenue,
        "operating_cash_flow": operating_cash_flow,
        "business_debt": business_debt,
        "investment_value": investment_value,
    }.items():
        _validate_amount(name, value)

    if not isinstance(scenario.name, str) or not scenario.name.strip():
        raise ValueError("Scenario name cannot be empty.")

    shocks = asdict(scenario)
    for key in (
        "revenue_change_pct",
        "cash_flow_change_pct",
        "investment_value_change_pct",
        "debt_change_pct",
    ):
        _validate_shock(key, shocks[key])

    stressed_revenue = revenue * (1 + scenario.revenue_change_pct / 100)
    stressed_cash_flow = (
        operating_cash_flow * (1 + scenario.cash_flow_change_pct / 100)
    )
    stressed_investment_value = (
        investment_value * (1 + scenario.investment_value_change_pct / 100)
    )
    stressed_debt = business_debt * (1 + scenario.debt_change_pct / 100)

    baseline_margin = operating_cash_flow / revenue if revenue > 0 else None
    stressed_margin = (
        stressed_cash_flow / stressed_revenue
        if stressed_revenue > 0 else None
    )

    baseline_debt_ratio = (
        business_debt / operating_cash_flow
        if operating_cash_flow > 0 else None
    )
    stressed_debt_ratio = (
        stressed_debt / stressed_cash_flow
        if stressed_cash_flow > 0 else None
    )
    
    flags = []
    
    if stressed_revenue == 0:
        flags.append("REVENUE_ELIMINATED")
        
    if stressed_cash_flow < 0:
        flags.append("NEGATIVE_OPERATING_CASH_FLOW")
        
    if stressed_cash_flow <= 0 and stressed_debt > 0:
        flags.append("DEBT_CAPACITY_UNCLEAR")
    
    if (
        stressed_debt_ratio is not None
        and stressed_debt_ratio > 3.0
    ):
        flags.append("HIGH_STRESSED_DEBT_TO_CASH_FLOW")

    if (
        stressed_margin is not None
        and stressed_margin < 0.05
    ):
        flags.append("LOW_STRESSED_CASH_FLOW_MARGIN")


    return {
        "engine": "PhantomSoul Scenario Engine",
        "scenario": scenario.name,
        "assumptions": shocks,
        "baseline": {
            "revenue": round(revenue, 2),
            "operating_cash_flow": round(operating_cash_flow, 2),
            "business_debt": round(business_debt, 2),
            "investment_value": round(investment_value, 2),
            "cash_flow_margin_pct": (
                round(baseline_margin * 100, 2)
                if baseline_margin is not None else None
            ),
            "debt_to_cash_flow": (
                round(baseline_debt_ratio, 2)
                if baseline_debt_ratio is not None else None
            ),
        },
        "stressed": {
            "revenue": round(stressed_revenue, 2),
            "operating_cash_flow": round(stressed_cash_flow, 2),
            "business_debt": round(stressed_debt, 2),
            "investment_value": round(stressed_investment_value, 2),
            "cash_flow_margin_pct": (
                round(stressed_margin * 100, 2)
                if stressed_margin is not None else None
            ),
            "debt_to_cash_flow": (
                round(stressed_debt_ratio, 2)
                if stressed_debt_ratio is not None else None
            ),
        },
        "changes": {
            "revenue": round(stressed_revenue - revenue, 2),
            "operating_cash_flow": round(
                stressed_cash_flow - operating_cash_flow, 2
            ),
            "business_debt": round(stressed_debt - business_debt, 2),
            "investment_value": round(
                stressed_investment_value - investment_value, 2
            ),
        },
        "risk_flags": flags,
        "requires_human_review": bool(flags),
        "disclaimer": (
            "Deterministic what-if analysis, not a forecast or "
            "individualized financial recommendation."
        ),
    }
