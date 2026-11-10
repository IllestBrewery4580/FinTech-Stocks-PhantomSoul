
"""PhantomSoul Nexus: connected personal and business risk screening."""

from dataclasses import asdict, dataclass
from math import isfinite
from typing import Any


@dataclass(frozen=True)
class NexusThresholds:
    minimum_liquidity_months: float = 6.0
    minimum_cash_flow_margin: float = 0.05
    high_debt_to_cash_flow: float = 3.0
    concentrated_industry_share: float = 0.50


@dataclass(frozen=True)
class OwnerBusinessProfile:
    personal_liquid_assets: float
    personal_annual_expenses: float
    personal_investable_assets: float
    personal_industry_exposure: float
    business_revenue: float
    business_operating_cash_flow: float
    business_debt: float
    business_owner_equity: float


def _validate_profile(profile: OwnerBusinessProfile) -> None:
    for name, value in asdict(profile).items():
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"{name} must be numeric.")
        if not isfinite(value) or value < 0:
            raise ValueError(f"{name} must be finite and non-negative.")

    if profile.personal_annual_expenses <= 0:
        raise ValueError("Personal annual expenses must be greater than zero.")
    if profile.business_revenue <= 0:
        raise ValueError("Business revenue must be greater than zero.")
    if profile.personal_liquid_assets > profile.personal_investable_assets:
        raise ValueError("Liquid assets cannot exceed investable assets.")
    if profile.personal_industry_exposure > profile.personal_investable_assets:
        raise ValueError("Industry exposure cannot exceed investable assets.")


def analyze_exposure(
    profile: OwnerBusinessProfile,
    thresholds: NexusThresholds = NexusThresholds(),
) -> dict[str, Any]:
    """Calculate metrics and return explainable risk flags."""
    _validate_profile(profile)

    for name, value in asdict(thresholds).items():
        if not isfinite(value) or value < 0:
            raise ValueError(f"Threshold {name} must be finite and non-negative.")

    liquidity_months = (
        profile.personal_liquid_assets / profile.personal_annual_expenses * 12
    )
    cash_flow_margin = (
        profile.business_operating_cash_flow / profile.business_revenue
    )
    debt_to_cash_flow = (
        profile.business_debt / profile.business_operating_cash_flow
        if profile.business_operating_cash_flow > 0
        else None
    )
    industry_share = (
        profile.personal_industry_exposure / profile.personal_investable_assets
        if profile.personal_investable_assets > 0
        else None
    )

    flags: list[dict[str, Any]] = []

    def add_flag(code, severity, evidence, review_action):
        flags.append({
            "code": code,
            "severity": severity,
            "evidence": evidence,
            "review_action": review_action,
        })

    if liquidity_months < thresholds.minimum_liquidity_months:
        add_flag(
            "LOW_PERSONAL_LIQUIDITY",
            "HIGH",
            {"liquidity_months": round(liquidity_months, 2)},
            "Review upcoming obligations and personal liquidity needs.",
        )

    if cash_flow_margin < thresholds.minimum_cash_flow_margin:
        add_flag(
            "LOW_BUSINESS_CASH_FLOW_MARGIN",
            "HIGH" if cash_flow_margin < 0 else "REVIEW",
            {"cash_flow_margin_pct": round(cash_flow_margin * 100, 2)},
            "Review operating costs, collections, and forecast assumptions.",
        )

    if debt_to_cash_flow is None:
        if profile.business_debt > 0:
            add_flag(
                "DEBT_CAPACITY_UNCLEAR",
                "HIGH",
                {"business_debt": profile.business_debt,
                 "operating_cash_flow": profile.business_operating_cash_flow},
                "Review debt obligations because cash flow is not positive.",
            )
    elif debt_to_cash_flow > thresholds.high_debt_to_cash_flow:
        add_flag(
            "BUSINESS_DEBT_PRESSURE",
            "HIGH",
            {"debt_to_cash_flow": round(debt_to_cash_flow, 2)},
            "Review debt maturities, interest costs, and repayment capacity.",
        )

    if (
        industry_share is not None
        and industry_share > thresholds.concentrated_industry_share
    ):
        add_flag(
            "CONNECTED_INDUSTRY_EXPOSURE",
            "REVIEW",
            {"industry_exposure_pct": round(industry_share * 100, 2)},
            "Review whether personal investments and business income "
            "depend on the same industry.",
        )

    return {
        "engine": "PhantomSoul Nexus",
        "model_version": "0.1.0",
        "metrics": {
            "personal_liquidity_months": round(liquidity_months, 2),
            "business_cash_flow_margin_pct": round(cash_flow_margin * 100, 2),
            "business_debt_to_cash_flow": (
                round(debt_to_cash_flow, 2)
                if debt_to_cash_flow is not None else None
            ),
            "personal_industry_exposure_pct": (
                round(industry_share * 100, 2)
                if industry_share is not None else None
            ),
        },
        "risk_flags": flags,
        "requires_human_review": bool(flags),
        "disclaimer": (
            "Screening output only. Findings require context and human review; "
            "they are not individualized financial advice."
        ),
    }