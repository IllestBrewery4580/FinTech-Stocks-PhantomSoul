"""Unified PhantomSoul financial intelligence and risk report."""

from typing import Any

from engines.nexus_engine import (
    NexusThresholds,
    OwnerBusinessProfile,
    analyze_exposure,
)
from engines.scenario_engine import (
    BusinessScenario,
    simulate_business_scenario,
)
from engines.thesis_risk_engine import assess_portfolio


SEVERITY_RANK = {
    "INFO": 0,
    "LOW": 1,
    "REVIEW": 2,
    "MEDIUM": 2,
    "HIGH": 3,
}


def build_financial_intelligence_report(
    *,
    profile: OwnerBusinessProfile,
    holdings: list[dict[str, Any]],
    scenario: BusinessScenario | None = None,
    investment_value: float | None = None,
    thresholds: NexusThresholds = NexusThresholds(),
    concentration_limit_pct: float = 25.0,
) -> dict[str, Any]:
    """Run existing engines and combine their findings without duplicating calculations."""

    if not isinstance(profile, OwnerBusinessProfile):
        raise ValueError("profile must be an OwnerBusinessProfile.")

    if not isinstance(holdings, list):
        raise ValueError("holdings must be a list of dictionaries.")

    if any(not isinstance(holding, dict) for holding in holdings):
        raise ValueError("Each holding must be a dictionary.")

    if scenario is not None and not isinstance(scenario, BusinessScenario):
        raise ValueError("scenario must be a BusinessScenario or None.")

    # Each engine remains responsible for its own calculations and validation.
    thesis_report = assess_portfolio(
        holdings,
        concentration_limit_pct=concentration_limit_pct,
    )
    nexus_report = analyze_exposure(profile, thresholds=thresholds)

    scenario_report = None

    if scenario is not None:
        scenario_investment_value = (
            profile.personal_investable_assets
            if investment_value is None
            else investment_value
        )

        scenario_report = simulate_business_scenario(
            revenue=profile.business_revenue,
            operating_cash_flow=profile.business_operating_cash_flow,
            business_debt=profile.business_debt,
            investment_value=scenario_investment_value,
            scenario=scenario,
        )

    findings: list[dict[str, Any]] = []

    # Preserve the source engine and original evidence for each finding.
    for holding_report in thesis_report["holdings"]:
        for finding in holding_report["findings"]:
            findings.append({
                "source": "thesis_risk",
                "symbol": holding_report["symbol"],
                **finding,
            })

    for finding in thesis_report["concentration_findings"]:
        findings.append({
            "source": "thesis_risk",
            **finding,
        })

    for finding in nexus_report["risk_flags"]:
        findings.append({
            "source": "nexus",
            **finding,
        })

    if scenario_report is not None:
        scenario_severity = {
            "REVENUE_ELIMINATED": "HIGH",
            "NEGATIVE_OPERATING_CASH_FLOW": "HIGH",
            "DEBT_CAPACITY_UNCLEAR": "HIGH",
            "HIGH_STRESSED_DEBT_TO_CASH_FLOW": "HIGH",
            "LOW_STRESSED_CASH_FLOW_MARGIN": "REVIEW",
        }

        for code in scenario_report["risk_flags"]:
            findings.append({
                "source": "scenario",
                "code": code,
                "severity": scenario_severity.get(code, "REVIEW"),
                "scenario": scenario_report["scenario"],
                "message": (
                    f"The scenario triggered {code}. Review the stressed "
                    "financial metrics and underlying assumptions."
                ),
            })

    highest_severity = max(
        (finding.get("severity", "INFO") for finding in findings),
        key=lambda severity: SEVERITY_RANK.get(severity, 0),
        default="INFO",
    )

    return {
        "engine": "PhantomSoul Financial Intelligence",
        "version": "0.1.0",
        "summary": {
            "holdings_assessed": thesis_report["holding_count"],
            "finding_count": len(findings),
            "highest_severity": highest_severity,
            "requires_human_review": (
                thesis_report["summary"]["holdings_requiring_review"] > 0
                or thesis_report["summary"]["concentration_flags"] > 0
                or nexus_report["requires_human_review"]
                or (
                    scenario_report is not None
                    and scenario_report["requires_human_review"]
                )
            ),
        },
        "findings": findings,
        "components": {
            "thesis_risk": thesis_report,
            "nexus": nexus_report,
            "scenario": scenario_report,
        },
        "disclaimer": (
            "This report combines deterministic screening and what-if "
            "calculations using supplied data. It is not a forecast, "
            "individualized financial advice, or an automatic trade "
            "instruction. Findings require contextual human review."
        ),
    }
