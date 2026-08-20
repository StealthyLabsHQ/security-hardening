#!/usr/bin/env python3
"""Map scanner check IDs / CWE hints to security-hardening reference paths."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


DEFAULT_REFS = [
    "references/appsec/ai-code-secure-remediation.md",
    "references/appsec/security-diff-review.md",
]

CHECK_ID_MAP: dict[str, list[str]] = {
    "ai.python.shell-true": [
        "references/ai/vibecoder-traps.md",
        "references/appsec/language-patterns.md",
        "references/appsec/ssrf-deserialization-command-injection.md",
    ],
    "ai.python.os-system": [
        "references/ai/vibecoder-traps.md",
        "references/appsec/language-patterns.md",
    ],
    "ai.python.eval-exec": [
        "references/ai/vibecoder-traps.md",
        "references/appsec/language-patterns.md",
    ],
    "ai.python.weak-password-hash": [
        "references/appsec/applied-cryptography.md",
        "references/ai/vibecoder-traps.md",
    ],
    "ai.python.verify-false": [
        "references/ai/vibecoder-traps.md",
        "references/appsec/language-patterns.md",
    ],
    "ai.python.unsafe-deserialize": [
        "references/appsec/ssrf-deserialization-command-injection.md",
        "references/appsec/language-patterns.md",
    ],
    "ai.javascript.eval": [
        "references/ai/vibecoder-traps.md",
        "references/appsec/language-patterns.md",
    ],
    "ai.javascript.child-process-shell": [
        "references/ai/vibecoder-traps.md",
        "references/appsec/language-patterns.md",
        "references/appsec/ssrf-deserialization-command-injection.md",
    ],
    "ai.javascript.innerhtml": [
        "references/appsec/browser-security-modern.md",
        "references/appsec/frontend-frameworks-security.md",
    ],
    "ai.javascript.dangerously-set-inner-html": [
        "references/appsec/frontend-frameworks-security.md",
        "references/appsec/browser-security-modern.md",
    ],
    "ai.javascript.sql-concat": [
        "references/appsec/language-patterns.md",
        "references/appsec/database-security.md",
        "references/ai/vibecoder-traps.md",
    ],
}

PREFIX_MAP: list[tuple[str, list[str]]] = [
    (
        "gitleaks.",
        [
            "references/ops/secret-leak-prevention.md",
            "references/ops/pre-push-checklist.md",
        ],
    ),
    (
        "ai.python.",
        [
            "references/ai/vibecoder-traps.md",
            "references/appsec/language-patterns.md",
        ],
    ),
    (
        "ai.javascript.",
        [
            "references/ai/vibecoder-traps.md",
            "references/appsec/language-patterns.md",
        ],
    ),
]

CWE_MAP: dict[str, list[str]] = {
    "CWE-78": [
        "references/appsec/ssrf-deserialization-command-injection.md",
        "references/appsec/language-patterns.md",
    ],
    "CWE-79": [
        "references/appsec/browser-security-modern.md",
        "references/appsec/frontend-frameworks-security.md",
    ],
    "CWE-89": [
        "references/appsec/database-security.md",
        "references/appsec/language-patterns.md",
    ],
    "CWE-95": [
        "references/appsec/language-patterns.md",
        "references/ai/vibecoder-traps.md",
    ],
    "CWE-295": [
        "references/appsec/language-patterns.md",
        "references/ai/vibecoder-traps.md",
    ],
    "CWE-328": [
        "references/appsec/applied-cryptography.md",
    ],
    "CWE-502": [
        "references/appsec/ssrf-deserialization-command-injection.md",
    ],
}


def unique(paths: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for path in paths:
        if path not in seen:
            seen.add(path)
            out.append(path)
    return out


def normalize_check_id(check_id: str) -> str:
    value = check_id.strip()
    if value.startswith("semgrep."):
        value = value[len("semgrep.") :]
    return value


def refs_for_check_id(check_id: str, cwe: str | None = None) -> list[str]:
    refs = list(DEFAULT_REFS)
    key = normalize_check_id(check_id)
    if key in CHECK_ID_MAP:
        refs.extend(CHECK_ID_MAP[key])
    else:
        for prefix, mapped in PREFIX_MAP:
            if key.startswith(prefix):
                refs.extend(mapped)
                break
    if cwe:
        cwe_key = cwe.upper()
        if not cwe_key.startswith("CWE-"):
            cwe_key = f"CWE-{cwe_key}"
        refs.extend(CWE_MAP.get(cwe_key, []))
    return unique(refs)


def annotate_report(report: dict[str, Any]) -> dict[str, Any]:
    findings = []
    all_refs: list[str] = []
    for finding in report.get("findings", []):
        check_id = str(finding.get("check_id") or "")
        cwe = None
        metadata = finding.get("metadata") or {}
        if isinstance(metadata, dict):
            cwe = metadata.get("cwe")
        suggested = refs_for_check_id(check_id, cwe=cwe)
        updated = dict(finding)
        updated["suggested_refs"] = suggested
        findings.append(updated)
        all_refs.extend(suggested)
    annotated = dict(report)
    annotated["findings"] = findings
    annotated["references_to_load"] = unique(["references/_core-invariants.md"] + all_refs)
    return annotated


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "check_id",
        nargs="?",
        help="Single check ID to map (prints JSON list of refs)",
    )
    parser.add_argument(
        "--cwe",
        help="Optional CWE id (e.g. CWE-78)",
    )
    parser.add_argument(
        "--report",
        help="Path to secure-review JSON report to annotate",
    )
    parser.add_argument(
        "-o",
        "--output",
        help="Write annotated report to this path",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    if args.report:
        path = Path(args.report)
        report = json.loads(path.read_text(encoding="utf-8"))
        annotated = annotate_report(report)
        text = json.dumps(annotated, indent=2) + "\n"
        if args.output:
            Path(args.output).write_text(text, encoding="utf-8")
        else:
            sys.stdout.write(text)
        return 0

    if not args.check_id:
        print("error: provide check_id or --report", file=sys.stderr)
        return 2

    refs = refs_for_check_id(args.check_id, cwe=args.cwe)
    sys.stdout.write(json.dumps(refs, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
