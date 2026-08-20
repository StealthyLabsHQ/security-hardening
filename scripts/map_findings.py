#!/usr/bin/env python3
"""Map scanner check IDs / CWE hints to security-hardening reference paths.

Also classifies blast_radius and safe_to_autofix for non-destructive remediation.
"""

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

# check_id -> (refs, blast_radius, safe_to_autofix)
CHECK_META: dict[str, tuple[list[str], str, bool]] = {
    "ai.python.shell-true": (
        [
            "references/ai/vibecoder-traps.md",
            "references/appsec/language-patterns.md",
            "references/appsec/ssrf-deserialization-command-injection.md",
        ],
        "rce",
        True,
    ),
    "ai.python.os-system": (
        [
            "references/ai/vibecoder-traps.md",
            "references/appsec/language-patterns.md",
        ],
        "rce",
        True,
    ),
    "ai.python.eval-exec": (
        [
            "references/ai/vibecoder-traps.md",
            "references/appsec/language-patterns.md",
        ],
        "rce",
        True,
    ),
    "ai.python.weak-password-hash": (
        [
            "references/appsec/applied-cryptography.md",
            "references/ai/vibecoder-traps.md",
        ],
        "api",
        True,
    ),
    "ai.python.verify-false": (
        [
            "references/ai/vibecoder-traps.md",
            "references/appsec/language-patterns.md",
        ],
        "api",
        True,
    ),
    "ai.python.unsafe-deserialize": (
        [
            "references/appsec/ssrf-deserialization-command-injection.md",
            "references/appsec/language-patterns.md",
        ],
        "rce",
        True,
    ),
    "ai.python.sql-fstring": (
        [
            "references/appsec/database-security.md",
            "references/appsec/language-patterns.md",
            "references/ai/vibecoder-traps.md",
        ],
        "db",
        True,
    ),
    "ai.python.sql-format": (
        [
            "references/appsec/database-security.md",
            "references/appsec/language-patterns.md",
            "references/ai/vibecoder-traps.md",
        ],
        "db",
        True,
    ),
    "ai.python.sql-percent": (
        [
            "references/appsec/database-security.md",
            "references/appsec/language-patterns.md",
            "references/ai/vibecoder-traps.md",
        ],
        "db",
        True,
    ),
    "ai.python.sql-execute-concat": (
        [
            "references/appsec/database-security.md",
            "references/appsec/language-patterns.md",
            "references/ai/vibecoder-traps.md",
        ],
        "db",
        True,
    ),
    "ai.javascript.eval": (
        [
            "references/ai/vibecoder-traps.md",
            "references/appsec/language-patterns.md",
        ],
        "rce",
        True,
    ),
    "ai.javascript.child-process-shell": (
        [
            "references/ai/vibecoder-traps.md",
            "references/appsec/language-patterns.md",
            "references/appsec/ssrf-deserialization-command-injection.md",
        ],
        "rce",
        True,
    ),
    "ai.javascript.innerhtml": (
        [
            "references/appsec/browser-security-modern.md",
            "references/appsec/frontend-frameworks-security.md",
        ],
        "frontend",
        True,
    ),
    "ai.javascript.dangerously-set-inner-html": (
        [
            "references/appsec/frontend-frameworks-security.md",
            "references/appsec/browser-security-modern.md",
        ],
        "frontend",
        True,
    ),
    "ai.javascript.sql-concat": (
        [
            "references/appsec/language-patterns.md",
            "references/appsec/database-security.md",
            "references/ai/vibecoder-traps.md",
        ],
        "db",
        True,
    ),
    "ai.javascript.sql-template": (
        [
            "references/appsec/database-security.md",
            "references/appsec/language-patterns.md",
            "references/ai/vibecoder-traps.md",
        ],
        "db",
        True,
    ),
}

# Backward-compatible alias used by older call sites.
CHECK_ID_MAP: dict[str, list[str]] = {
    key: meta[0] for key, meta in CHECK_META.items()
}

PREFIX_MAP: list[tuple[str, list[str], str, bool]] = [
    (
        "gitleaks.",
        [
            "references/ops/secret-leak-prevention.md",
            "references/ops/pre-push-checklist.md",
        ],
        "secrets",
        False,
    ),
    (
        "ai.python.sql-",
        [
            "references/appsec/database-security.md",
            "references/appsec/language-patterns.md",
            "references/ai/vibecoder-traps.md",
        ],
        "db",
        True,
    ),
    (
        "ai.javascript.sql-",
        [
            "references/appsec/database-security.md",
            "references/appsec/language-patterns.md",
            "references/ai/vibecoder-traps.md",
        ],
        "db",
        True,
    ),
    (
        "ai.python.",
        [
            "references/ai/vibecoder-traps.md",
            "references/appsec/language-patterns.md",
        ],
        "api",
        True,
    ),
    (
        "ai.javascript.",
        [
            "references/ai/vibecoder-traps.md",
            "references/appsec/language-patterns.md",
        ],
        "frontend",
        True,
    ),
]

CWE_MAP: dict[str, tuple[list[str], str]] = {
    "CWE-78": (
        [
            "references/appsec/ssrf-deserialization-command-injection.md",
            "references/appsec/language-patterns.md",
        ],
        "rce",
    ),
    "CWE-79": (
        [
            "references/appsec/browser-security-modern.md",
            "references/appsec/frontend-frameworks-security.md",
        ],
        "frontend",
    ),
    "CWE-89": (
        [
            "references/appsec/database-security.md",
            "references/appsec/language-patterns.md",
        ],
        "db",
    ),
    "CWE-95": (
        [
            "references/appsec/language-patterns.md",
            "references/ai/vibecoder-traps.md",
        ],
        "rce",
    ),
    "CWE-295": (
        [
            "references/appsec/language-patterns.md",
            "references/ai/vibecoder-traps.md",
        ],
        "api",
    ),
    "CWE-328": (
        [
            "references/appsec/applied-cryptography.md",
        ],
        "api",
    ),
    "CWE-502": (
        [
            "references/appsec/ssrf-deserialization-command-injection.md",
        ],
        "rce",
    ),
}

BLAST_PRIORITY = {"secrets": 0, "db": 1, "rce": 2, "api": 3, "frontend": 4, "other": 5}


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


def classify_check_id(
    check_id: str, cwe: str | None = None
) -> tuple[list[str], str, bool]:
    refs = list(DEFAULT_REFS)
    blast = "other"
    safe = True
    key = normalize_check_id(check_id)

    if key in CHECK_META:
        mapped_refs, blast, safe = CHECK_META[key]
        refs.extend(mapped_refs)
    else:
        for prefix, mapped_refs, mapped_blast, mapped_safe in PREFIX_MAP:
            if key.startswith(prefix):
                refs.extend(mapped_refs)
                blast = mapped_blast
                safe = mapped_safe
                break

    if cwe:
        cwe_key = cwe.upper()
        if not cwe_key.startswith("CWE-"):
            cwe_key = f"CWE-{cwe_key}"
        if cwe_key in CWE_MAP:
            cwe_refs, cwe_blast = CWE_MAP[cwe_key]
            refs.extend(cwe_refs)
            if BLAST_PRIORITY.get(cwe_blast, 99) < BLAST_PRIORITY.get(blast, 99):
                blast = cwe_blast

    return unique(refs), blast, safe


def refs_for_check_id(check_id: str, cwe: str | None = None) -> list[str]:
    refs, _, _ = classify_check_id(check_id, cwe=cwe)
    return refs


def enrich_finding(finding: dict[str, Any]) -> dict[str, Any]:
    check_id = str(finding.get("check_id") or "")
    cwe = None
    metadata = finding.get("metadata") or {}
    if isinstance(metadata, dict):
        cwe = metadata.get("cwe")
    refs, blast, safe = classify_check_id(check_id, cwe=cwe)
    updated = dict(finding)
    updated["suggested_refs"] = refs
    updated["blast_radius"] = blast
    updated["safe_to_autofix"] = safe
    return updated


def annotate_report(report: dict[str, Any]) -> dict[str, Any]:
    findings = []
    all_refs: list[str] = []
    by_blast: dict[str, int] = {}
    for finding in report.get("findings", []):
        updated = enrich_finding(finding)
        findings.append(updated)
        all_refs.extend(updated.get("suggested_refs") or [])
        blast = str(updated.get("blast_radius") or "other")
        by_blast[blast] = by_blast.get(blast, 0) + 1
    annotated = dict(report)
    annotated["findings"] = findings
    annotated["references_to_load"] = unique(["references/_core-invariants.md"] + all_refs)
    annotated["blast_summary"] = by_blast
    annotated["safety"] = {
        "touches_production_db": False,
        "mode_default": "detect-only",
        "note": "Static detection only. Do not probe real databases or apply destructive migrations.",
    }
    return annotated


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "check_id",
        nargs="?",
        help="Single check ID to map (prints JSON classification)",
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

    refs, blast, safe = classify_check_id(args.check_id, cwe=args.cwe)
    sys.stdout.write(
        json.dumps(
            {
                "check_id": normalize_check_id(args.check_id),
                "suggested_refs": refs,
                "blast_radius": blast,
                "safe_to_autofix": safe,
            },
            indent=2,
        )
        + "\n"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
