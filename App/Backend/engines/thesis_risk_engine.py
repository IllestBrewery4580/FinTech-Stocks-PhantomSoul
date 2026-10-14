"""PhantomSoul deterministic investment-thesis risk engine."""

from __future__ import annotations

from typing import Any
import json
import math


SEVERITY = {"INFO": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 3}


def _number(value: Any) -> float | None:
    """Return a finite number, or None when input is invalid."""
    if isinstance(value, bool) or value is None:
        return None

    try:
        result = float(value)
    except (TypeError, ValueError):
        return None

    return result if math.isfinite(result) else None


def assess_thesis(
    holding: dict[str, Any],
    near_floor_pct: float = 5.0,
) -> dict[str, Any]:
    """Assess one holding using only its supplied data."""

    raw_symbol = holding.get("symbol")
    symbol = (
        raw_symbol.strip().upper()
        if isinstance(raw_symbol, str) and raw_symbol.strip()
        else "UNKNOWN"
    )

    findings: list[dict[str, str]] = []

    def flag(code: str, severity: str, message: str) -> None:
        findings.append({
            "code": code,
            "severity": severity,
            "message": message,
        })

    if symbol == "UNKNOWN":
        flag("MISSING_SYMBOL", "HIGH", "A valid asset symbol is required.")

    thesis = holding.get("thesis")
    if not isinstance(thesis, str) or not thesis.strip():
        flag(
            "MISSING_THESIS",
            "HIGH",
            "Document the investment rationale and what would invalidate it.",
        )

    price = _number(holding.get("current_price"))
    floor = _number(holding.get("valuation_floor"))

    if price is None or price <= 0:
        flag(
            "INVALID_CURRENT_PRICE",
            "HIGH",
            "A positive, valid current price is required.",
        )

    if floor is None or floor <= 0:
        flag(
            "INVALID_VALUATION_FLOOR",
            "MEDIUM",
            "A positive valuation floor is required for comparison.",
        )

    gap_pct = None

    if price is not None and price > 0 and floor is not None and floor > 0:
        gap_pct = ((price - floor) / floor) * 100

        if gap_pct < 0:
            flag(
                "BELOW_VALUATION_FLOOR",
                "HIGH",
                f"Price is {abs(gap_pct):.2f}% below the supplied floor. "
                "Review assumptions and thesis validity; this is not an "
                "automatic sell instruction.",
            )
        elif gap_pct <= near_floor_pct:
            flag(
                "NEAR_VALUATION_FLOOR",
                "MEDIUM",
                f"Price is only {gap_pct:.2f}% above the supplied floor. "
                "Review the margin of safety.",
            )

    if not findings:
        flag(
            "NO_RULE_TRIGGERED",
            "INFO",
            "No configured rule was triggered. This does not establish "
            "that the investment is safe or suitable.",
        )

    highest = max(
        (f["severity"] for f in findings),
        key=lambda severity: SEVERITY[severity],
    )

    return {
        "symbol": symbol,
        "status": (
            "REVIEW_REQUIRED"
            if highest in ("HIGH", "MEDIUM")
            else "NO_RULE_TRIGGERED"
        ),
        "highest_severity": highest,
        "current_price": price,
        "valuation_floor": floor,
        "price_vs_floor_pct": (
            round(gap_pct, 2) if gap_pct is not None else None
        ),
        "findings": findings,
    }


def assess_portfolio(
    holdings: list[dict[str, Any]],
    concentration_limit_pct: float = 25.0,
) -> dict[str, Any]:
    """Review holdings and flag excessive concentration by market value."""

    if not math.isfinite(concentration_limit_pct) or not (
        0 < concentration_limit_pct <= 100
    ):
        raise ValueError("Concentration limit must be greater than 0 and at most 100.")

    reports = [assess_thesis(holding) for holding in holdings]
    values: list[tuple[str, float]] = []

    for holding in holdings:
        symbol = holding.get("symbol")
        value = _number(holding.get("market_value"))

        if (
            isinstance(symbol, str)
            and symbol.strip()
            and value is not None
            and value >= 0
        ):
            values.append((symbol.strip().upper(), value))

    total = sum(value for _, value in values)
    concentration_findings = []

    if total > 0:
        for symbol, value in values:
            weight = value / total * 100

            if weight >= concentration_limit_pct:
                concentration_findings.append({
                    "code": "HIGH_CONCENTRATION",
                    "severity": "MEDIUM",
                    "symbol": symbol,
                    "weight_pct": round(weight, 2),
                    "message": (
                        f"{symbol} represents {weight:.2f}% of the supplied "
                        "portfolio market value."
                    ),
                })

    return {
        "engine": "PhantomSoul Risk Engine",
        "version": "1.0.0",
        "holding_count": len(holdings),
        "portfolio_market_value": round(total, 2) if total > 0 else None,
        "summary": {
            "holdings_requiring_review": sum(
                report["status"] == "REVIEW_REQUIRED"
                for report in reports
            ),
            "high_severity_holdings": sum(
                report["highest_severity"] == "HIGH"
                for report in reports
            ),
            "concentration_flags": len(concentration_findings),
        },
        "holdings": reports,
        "concentration_findings": concentration_findings,
        "disclaimer": (
            "Rule-based analysis of supplied data, not a price prediction, "
            "personalized financial advice, or an automatic trade instruction."
        ),
    }


if __name__ == "__main__":
    # Demonstration data only — not live market quotes or recommendations.
    sample_holdings = [
        {
            "symbol": "AAPL",
            "current_price": 210,
            "valuation_floor": 200,
            "thesis": "Example: durable ecosystem and recurring services revenue.",
            "market_value": 6000,
        },
        {
            "symbol": "NVDA",
            "current_price": 95,
            "valuation_floor": 110,
            "thesis": "Example: demand for accelerated computing.",
            "market_value": 3000,
        },
        {
            "symbol": "KO",
            "current_price": 70,
            "valuation_floor": 65,
            "thesis": "",
            "market_value": 1000,
        },
    ]

    print(json.dumps(assess_portfolio(sample_holdings), indent=2))
