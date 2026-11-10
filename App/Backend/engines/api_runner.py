"""JSON bridge between the Express API and PhantomSoul's Python engines."""

import json
import sys
from pathlib import Path

# Make the Backend directory importable when this file runs as a script.
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from engines.financial_intelligence_engine import (
    build_financial_intelligence_report,
)
from engines.nexus_engine import OwnerBusinessProfile, NexusThresholds
from engines.scenario_engine import BusinessScenario


def main():
    request = json.load(sys.stdin)

    if not isinstance(request, dict):
        raise ValueError("Request body must be a JSON object.")

    profile_data = request.get("profile")
    holdings = request.get("holdings")

    if not isinstance(profile_data, dict):
        raise ValueError("'profile' must be a JSON object.")

    if not isinstance(holdings, list):
        raise ValueError("'holdings' must be a JSON array.")

    profile = OwnerBusinessProfile(**profile_data)

    scenario_data = request.get("scenario")
    scenario = None

    if scenario_data is not None:
        if not isinstance(scenario_data, dict):
            raise ValueError("'scenario' must be a JSON object or null.")
        scenario = BusinessScenario(**scenario_data)

    thresholds_data = request.get("thresholds")
    thresholds = (
        NexusThresholds(**thresholds_data)
        if thresholds_data is not None
        else NexusThresholds()
    )

    report = build_financial_intelligence_report(
        profile=profile,
        holdings=holdings,
        scenario=scenario,
        investment_value=request.get("investment_value"),
        thresholds=thresholds,
        concentration_limit_pct=request.get(
            "concentration_limit_pct", 25.0
        ),
    )

    print(json.dumps(report, allow_nan=False))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, TypeError, KeyError) as exc:
        print(json.dumps({
            "error": str(exc),
            "error_type": type(exc).__name__,
        }))
        sys.exit(2)
    except Exception:
        # Do not expose internal tracebacks or implementation details to API callers.
        print(json.dumps({
            "error": "The financial intelligence assessment failed.",
            "error_type": "InternalError",
        }))
        sys.exit(1)
