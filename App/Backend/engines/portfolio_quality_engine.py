"""Transparent, rules-based portfolio concentration analysis."""

from math import isfinite
from typing import Any


def _number(value: Any, field: str, index: int) -> float:
    if isinstance(value, bool):
        raise ValueError(f"Holding {index}: {field} must be numeric.")

    try:
        number = float(value)
    except (TypeError, ValueError):
        raise ValueError(
            f"Holding {index}: {field} must be numeric."
        ) from None

    if not isfinite(number) or number < 0:
        raise ValueError(
            f"Holding {index}: {field} must be finite and non-negative."
        )

    return number


def analyze_portfolio(
    holdings: list[dict[str, Any]],
    concentration_threshold: float = 0.25,
) -> dict[str, Any]:
    """Calculate position weights, asset allocation, and review flags.

    Each holding requires symbol and market_value. Optional asset_type
    defaults to UNKNOWN. All market values must use the same currency.
    """
    if not isinstance(holdings, list) or not holdings:
        raise ValueError("Provide at least one portfolio holding.")

    if (
        isinstance(concentration_threshold, bool)
        or not isinstance(concentration_threshold, (int, float))
        or not isfinite(concentration_threshold)
        or not 0 < concentration_threshold <= 1
    ):
        raise ValueError("Threshold must be greater than 0 and at most 1.")

    positions: dict[str, dict[str, Any]] = {}
    allocation: dict[str, float] = {}
    total = 0.0

    for index, holding in enumerate(holdings):
        if not isinstance(holding, dict):
            raise ValueError(f"Holding {index} must be an object.")

        symbol = holding.get("symbol")
        if not isinstance(symbol, str) or not symbol.strip():
            raise ValueError(f"Holding {index}: symbol is required.")

        symbol = symbol.strip().upper()
        value = _number(holding.get("market_value"), "market_value", index)

        asset_type = holding.get("asset_type", "UNKNOWN")
        if not isinstance(asset_type, str) or not asset_type.strip():
            asset_type = "UNKNOWN"
        asset_type = asset_type.strip().upper()

        position = positions.setdefault(
            symbol,
            {"symbol": symbol, "market_value": 0.0, "asset_types": set()},
        )
        position["market_value"] += value
        position["asset_types"].add(asset_type)
        allocation[asset_type] = allocation.get(asset_type, 0.0) + value
        total += value

    if not isfinite(total):
        raise ValueError("Total market value exceeds the supported range.")
    if total <= 0:
        raise ValueError("Total portfolio market value must be positive.")

    result_positions = []
    concentration_index = 0.0

    for item in positions.values():
        weight = item["market_value"] / total
        concentration_index += weight**2
        result_positions.append({
            "symbol": item["symbol"],
            "market_value": round(item["market_value"], 2),
            "weight": round(weight, 6),
            "asset_types": sorted(item["asset_types"]),
            "concentrated": weight >= concentration_threshold,
        })

    result_positions.sort(key=lambda p: p["weight"], reverse=True)

    flags = []
    for position in result_positions:
        if position["concentrated"]:
            flags.append({
                "code": "POSITION_CONCENTRATION",
                "severity": "REVIEW",
                "symbol": position["symbol"],
                "weight": position["weight"],
                "message": (
                    f"{position['symbol']} represents "
                    f"{position['weight']:.1%} of the portfolio."
                ),
            })

    if len(result_positions) < 3:
        flags.append({
            "code": "FEW_POSITIONS",
            "severity": "INFO",
            "message": "Fewer than three distinct positions; review diversification in context.",
        })

    return {
        "engine": "phantomsoul_portfolio_quality",
        "version": "1.0.0",
        "total_market_value": round(total, 2),
        "position_count": len(result_positions),
        "largest_position_weight": result_positions[0]["weight"],
        "concentration_index": round(concentration_index, 6),
        "positions": result_positions,
        "asset_allocation": {
            kind: {
                "market_value": round(value, 2),
                "weight": round(value / total, 6),
            }
            for kind, value in sorted(allocation.items())
        },
        "flags": flags,
        "limitations": [
            "Concentration does not measure correlation or volatility.",
            "Asset categories depend on the supplied classifications.",
            "Flags are review prompts, not investment recommendations.",
        ],
    }
