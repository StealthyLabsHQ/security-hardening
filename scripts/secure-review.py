#!/usr/bin/env python3
"""Scan a target scope with Semgrep + Gitleaks and emit unified JSON findings.

Soft-fails when a tool is missing: continues with available scanners and records
tool status. Intended for agent-driven secure review loops.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SEMGREP_CONFIG = ROOT / "semgrep"
SEVERITY_RANK = {"ERROR": 3, "WARNING": 2, "INFO": 1, "CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}


def which(name: str) -> str | None:
    return shutil.which(name)


def run_cmd(argv: list[str], cwd: Path | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        argv,
        cwd=str(cwd) if cwd else None,
        text=True,
        capture_output=True,
        check=False,
    )


def normalize_severity(raw: str | None) -> str:
    if not raw:
        return "WARNING"
    value = raw.upper()
    if value in {"ERROR", "CRITICAL", "HIGH"}:
        return "ERROR" if value != "CRITICAL" else "ERROR"
    if value in {"WARNING", "MEDIUM"}:
        return "WARNING"
    return "INFO"


def map_check_id(check_id: str) -> list[str]:
    """Load map-findings helpers from the scripts directory."""
    scripts_dir = Path(__file__).resolve().parent
    if str(scripts_dir) not in sys.path:
        sys.path.insert(0, str(scripts_dir))
    from map_findings import refs_for_check_id  # type: ignore

    return refs_for_check_id(check_id)


def parse_semgrep(payload: dict[str, Any]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    for item in payload.get("results", []):
        check_id = item.get("check_id") or item.get("rule_id") or "semgrep.unknown"
        extra = item.get("extra") or {}
        severity = normalize_severity(extra.get("severity") or item.get("severity"))
        path = item.get("path") or ""
        start = (item.get("start") or {})
        message = extra.get("message") or item.get("message") or check_id
        finding = {
            "tool": "semgrep",
            "check_id": check_id,
            "severity": severity,
            "path": path,
            "start_line": start.get("line"),
            "message": message,
            "suggested_refs": map_check_id(check_id),
        }
        findings.append(finding)
    return findings


def parse_gitleaks(payload: Any) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    rows = payload if isinstance(payload, list) else payload.get("findings", [])
    for item in rows:
        rule_id = item.get("RuleID") or item.get("rule_id") or "gitleaks.secret"
        finding = {
            "tool": "gitleaks",
            "check_id": f"gitleaks.{rule_id}",
            "severity": "ERROR",
            "path": item.get("File") or item.get("file") or "",
            "start_line": item.get("StartLine") or item.get("start_line"),
            "message": item.get("Description") or item.get("description") or "Potential secret detected",
            "suggested_refs": map_check_id(f"gitleaks.{rule_id}"),
        }
        findings.append(finding)
    return findings


def run_semgrep(target: Path, config: Path) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    binary = which("semgrep")
    status: dict[str, Any] = {"available": bool(binary), "exit_code": None, "error": None}
    if not binary:
        status["error"] = "semgrep not found on PATH"
        return [], status

    argv = [
        binary,
        "scan",
        "--config",
        str(config),
        "--json",
        "--quiet",
        "--metrics=off",
        "--no-git-ignore",
        str(target),
    ]
    proc = run_cmd(argv)
    status["exit_code"] = proc.returncode
    if proc.returncode not in (0, 1):
        status["error"] = (proc.stderr or proc.stdout or "semgrep failed").strip()[:500]
        return [], status
    try:
        payload = json.loads(proc.stdout or "{}")
    except json.JSONDecodeError as exc:
        status["error"] = f"invalid semgrep JSON: {exc}"
        return [], status
    return parse_semgrep(payload), status


def run_gitleaks(target: Path) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    binary = which("gitleaks")
    status: dict[str, Any] = {"available": bool(binary), "exit_code": None, "error": None}
    if not binary:
        status["error"] = "gitleaks not found on PATH"
        return [], status

    report = target / ".secure-review-gitleaks.json" if target.is_dir() else target.parent / ".secure-review-gitleaks.json"
    argv = [
        binary,
        "detect",
        "--source",
        str(target),
        "--report-format",
        "json",
        "--report-path",
        str(report),
        "--no-git",
        "--exit-code",
        "0",
    ]
    proc = run_cmd(argv)
    status["exit_code"] = proc.returncode
    if proc.returncode != 0:
        status["error"] = (proc.stderr or proc.stdout or "gitleaks failed").strip()[:500]
        if report.exists():
            report.unlink(missing_ok=True)
        return [], status

    findings: list[dict[str, Any]] = []
    if report.exists():
        try:
            raw = report.read_text(encoding="utf-8").strip()
            payload: Any = json.loads(raw) if raw else []
            findings = parse_gitleaks(payload)
        except json.JSONDecodeError as exc:
            status["error"] = f"invalid gitleaks JSON: {exc}"
        finally:
            report.unlink(missing_ok=True)
    return findings, status


def summarize(findings: list[dict[str, Any]]) -> dict[str, int]:
    summary = {"error": 0, "warning": 0, "info": 0}
    for finding in findings:
        key = finding.get("severity", "WARNING").lower()
        if key not in summary:
            key = "warning"
        summary[key] += 1
    return summary


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "target",
        nargs="?",
        default=".",
        help="File or directory to scan (default: current directory)",
    )
    parser.add_argument(
        "--config",
        default=str(DEFAULT_SEMGREP_CONFIG),
        help="Semgrep config path (default: repo semgrep/)",
    )
    parser.add_argument(
        "--skip-gitleaks",
        action="store_true",
        help="Skip secret scanning",
    )
    parser.add_argument(
        "--skip-semgrep",
        action="store_true",
        help="Skip Semgrep SAST",
    )
    parser.add_argument(
        "-o",
        "--output",
        help="Write JSON report to this path (default: stdout)",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    target = Path(args.target).resolve()
    config = Path(args.config).resolve()

    if not target.exists():
        print(json.dumps({"error": f"target not found: {target}"}), file=sys.stderr)
        return 2

    findings: list[dict[str, Any]] = []
    tools: dict[str, Any] = {}

    if not args.skip_semgrep:
        semgrep_findings, semgrep_status = run_semgrep(target, config)
        findings.extend(semgrep_findings)
        tools["semgrep"] = semgrep_status
    else:
        tools["semgrep"] = {"available": False, "skipped": True}

    if not args.skip_gitleaks:
        gitleaks_findings, gitleaks_status = run_gitleaks(target)
        findings.extend(gitleaks_findings)
        tools["gitleaks"] = gitleaks_status
    else:
        tools["gitleaks"] = {"available": False, "skipped": True}

    findings.sort(
        key=lambda f: (
            -SEVERITY_RANK.get(str(f.get("severity", "WARNING")).upper(), 0),
            f.get("path") or "",
            f.get("check_id") or "",
        )
    )

    report = {
        "target": str(target),
        "findings": findings,
        "summary": summarize(findings),
        "tools": tools,
        "remediation_hint": "Load suggested_refs, apply defensive fixes for ERROR findings, then re-run this script.",
    }

    text = json.dumps(report, indent=2, sort_keys=False) + "\n"
    if args.output:
        Path(args.output).write_text(text, encoding="utf-8")
    else:
        sys.stdout.write(text)

    # Exit 1 when ERROR findings exist so CI/agents can gate; 0 otherwise.
    # Missing tools alone do not fail the process (soft-fail).
    return 1 if report["summary"]["error"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
