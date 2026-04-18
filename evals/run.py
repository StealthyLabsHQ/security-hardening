from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EVALS_DIR = ROOT / "evals"
CASES_DIR = EVALS_DIR / "cases"
NEGATIVE_DIR = EVALS_DIR / "negative"
RESULTS_DIR = EVALS_DIR / "results"
SKILL_PATH = ROOT / "SKILL.md"
CORE_PATH = "references/_core-invariants.md"
REQUIRED_KEYS = {
    "id",
    "input",
    "should_trigger",
    "should_load",
    "must_not_load",
    "must_mention",
    "must_not_mention",
}


@dataclass
class EvalResult:
    path: str
    fixture_id: str
    kind: str
    status: str
    notes: list[str]
    manual_checks: list[str]


def parse_value(raw: str):
    if raw == "true":
        return True
    if raw == "false":
        return False
    if raw == "null":
        return None
    if raw.startswith("[") or raw.startswith("{") or (raw.startswith('"') and raw.endswith('"')):
        return json.loads(raw)
    return raw


def load_fixture(path: Path) -> dict:
    data: dict[str, object] = {}
    for lineno, raw_line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            raise ValueError(f"{path}:{lineno}: expected 'key: value'")
        key, raw_value = line.split(":", 1)
        data[key.strip()] = parse_value(raw_value.strip())
    return data


def reference_paths_in_skill() -> set[str]:
    text = SKILL_PATH.read_text(encoding="utf-8")
    return set(re.findall(r"references/[A-Za-z0-9_./-]+\.md", text))


def validate_fixture(path: Path, fixture: dict, skill_refs: set[str]) -> EvalResult:
    missing = REQUIRED_KEYS - fixture.keys()
    notes: list[str] = []
    manual_checks: list[str] = []

    fixture_id = str(fixture.get("id", path.stem))
    kind = "positive" if path.parent == CASES_DIR else "negative"

    if missing:
        notes.append(f"missing keys: {', '.join(sorted(missing))}")

    for key in ("should_load", "must_not_load", "must_mention", "must_not_mention"):
        value = fixture.get(key)
        if not isinstance(value, list):
            notes.append(f"{key} must be a list")

    if not isinstance(fixture.get("input"), str):
        notes.append("input must be a string")
    if not isinstance(fixture.get("should_trigger"), bool):
        notes.append("should_trigger must be a boolean")

    should_load = fixture.get("should_load") if isinstance(fixture.get("should_load"), list) else []
    must_not_load = fixture.get("must_not_load") if isinstance(fixture.get("must_not_load"), list) else []
    must_mention = fixture.get("must_mention") if isinstance(fixture.get("must_mention"), list) else []
    must_not_mention = fixture.get("must_not_mention") if isinstance(fixture.get("must_not_mention"), list) else []
    should_trigger = fixture.get("should_trigger")

    overlap = sorted(set(should_load) & set(must_not_load))
    if overlap:
        notes.append(f"overlap between should_load and must_not_load: {', '.join(overlap)}")

    for ref_path in sorted(set(should_load + must_not_load)):
        if not isinstance(ref_path, str):
            notes.append(f"non-string reference path: {ref_path!r}")
            continue
        if "*" in ref_path:
            continue
        if not (ROOT / ref_path).exists():
            notes.append(f"missing reference path: {ref_path}")

    if kind == "positive":
        if should_trigger is not True:
            notes.append("positive fixture must set should_trigger: true")
        if CORE_PATH not in should_load:
            notes.append(f"positive fixture must include {CORE_PATH}")
        if not should_load:
            notes.append("positive fixture should_load must not be empty")
        for ref_path in should_load:
            if isinstance(ref_path, str) and "*" not in ref_path and ref_path not in skill_refs:
                notes.append(f"should_load path not referenced in SKILL.md: {ref_path}")
    else:
        if should_trigger is not False:
            notes.append("negative fixture must set should_trigger: false")
        if should_load:
            notes.append("negative fixture should_load must be empty")

    if must_mention:
        manual_checks.append(f"must mention: {', '.join(str(item) for item in must_mention)}")
    if must_not_mention:
        manual_checks.append(f"must not mention: {', '.join(str(item) for item in must_not_mention)}")

    status = "PASS" if not notes else "FAIL"
    return EvalResult(
        path=path.relative_to(ROOT).as_posix(),
        fixture_id=fixture_id,
        kind=kind,
        status=status,
        notes=notes,
        manual_checks=manual_checks,
    )


def collect_paths(directory: Path) -> list[Path]:
    return sorted(directory.glob("*.yaml"))


def domain_coverage(results: list[EvalResult], fixtures: dict[str, dict]) -> dict[str, int]:
    coverage: dict[str, int] = {}
    for result in results:
        if result.kind != "positive" or result.status != "PASS":
            continue
        fixture = fixtures[result.path]
        for ref_path in fixture["should_load"]:
            if ref_path == CORE_PATH or "*" in ref_path:
                continue
            parts = ref_path.split("/")
            domain = parts[1] if len(parts) > 2 else "root"
            coverage[domain] = coverage.get(domain, 0) + 1
    return dict(sorted(coverage.items()))


def write_report(results: list[EvalResult], fixtures: dict[str, dict]) -> Path:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    report_path = RESULTS_DIR / f"{datetime.now().date().isoformat()}.md"

    total = len(results)
    passed = sum(1 for result in results if result.status == "PASS")
    failed = total - passed
    manual = sum(1 for result in results if result.manual_checks)
    positive = sum(1 for result in results if result.kind == "positive")
    negative = sum(1 for result in results if result.kind == "negative")
    coverage = domain_coverage(results, fixtures)

    lines: list[str] = []
    lines.append("# Eval Results")
    lines.append("")
    lines.append(f"- Generated: `{datetime.now().isoformat(timespec='seconds')}`")
    lines.append(f"- Total fixtures: `{total}`")
    lines.append(f"- Positive fixtures: `{positive}`")
    lines.append(f"- Negative fixtures: `{negative}`")
    lines.append(f"- Preflight pass: `{passed}`")
    lines.append(f"- Preflight fail: `{failed}`")
    lines.append(f"- Fixtures with manual semantic checks: `{manual}`")
    lines.append("")
    lines.append("## Domain Coverage")
    lines.append("")
    if coverage:
        for domain, count in coverage.items():
            lines.append(f"- `{domain}`: {count}")
    else:
        lines.append("- none")
    lines.append("")
    lines.append("## Fixture Summary")
    lines.append("")
    lines.append("| ID | Kind | Status | File |")
    lines.append("|---|---|---|---|")
    for result in results:
        lines.append(
            f"| `{result.fixture_id}` | {result.kind} | {result.status} | `{result.path}` |"
        )
    lines.append("")
    lines.append("## Failures")
    lines.append("")
    failures = [result for result in results if result.status == "FAIL"]
    if not failures:
        lines.append("- none")
    else:
        for result in failures:
            lines.append(f"### {result.fixture_id}")
            lines.append("")
            for note in result.notes:
                lines.append(f"- {note}")
            lines.append("")
    lines.append("## Manual Checks")
    lines.append("")
    manual_results = [result for result in results if result.manual_checks]
    if not manual_results:
        lines.append("- none")
    else:
        for result in manual_results:
            lines.append(f"### {result.fixture_id}")
            lines.append("")
            for check in result.manual_checks:
                lines.append(f"- {check}")
            lines.append("")

    report_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")
    return report_path


def main() -> None:
    skill_refs = reference_paths_in_skill()
    fixtures: dict[str, dict] = {}
    results: list[EvalResult] = []

    for path in collect_paths(CASES_DIR) + collect_paths(NEGATIVE_DIR):
        fixture = load_fixture(path)
        fixture_key = path.relative_to(ROOT).as_posix()
        fixtures[fixture_key] = fixture
        results.append(validate_fixture(path, fixture, skill_refs))

    report = write_report(results, fixtures)
    print(report.relative_to(ROOT).as_posix())


if __name__ == "__main__":
    main()
