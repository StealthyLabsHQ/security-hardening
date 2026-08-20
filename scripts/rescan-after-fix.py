#!/usr/bin/env python3
"""Compare two secure-review JSON reports (before/after remediation)."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


def finding_key(finding: dict[str, Any]) -> tuple[str, str, str]:
    return (
        str(finding.get("tool") or ""),
        str(finding.get("check_id") or ""),
        str(finding.get("path") or ""),
    )


def load_report(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("before", help="JSON report from first scan")
    parser.add_argument("after", help="JSON report from re-scan")
    args = parser.parse_args(argv)

    before = load_report(Path(args.before))
    after = load_report(Path(args.after))

    before_keys = {finding_key(f) for f in before.get("findings", [])}
    after_keys = {finding_key(f) for f in after.get("findings", [])}

    resolved = sorted(before_keys - after_keys)
    remaining = sorted(after_keys & before_keys)
    introduced = sorted(after_keys - before_keys)

    result = {
        "resolved_count": len(resolved),
        "remaining_count": len(remaining),
        "introduced_count": len(introduced),
        "resolved": [
            {"tool": t, "check_id": c, "path": p} for t, c, p in resolved
        ],
        "remaining": [
            {"tool": t, "check_id": c, "path": p} for t, c, p in remaining
        ],
        "introduced": [
            {"tool": t, "check_id": c, "path": p} for t, c, p in introduced
        ],
        "before_summary": before.get("summary"),
        "after_summary": after.get("summary"),
    }
    sys.stdout.write(json.dumps(result, indent=2) + "\n")
    return 1 if result["remaining_count"] or result["introduced_count"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
