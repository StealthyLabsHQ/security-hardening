from __future__ import annotations

import ipaddress
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
REFERENCES_DIR = ROOT / "references"
SKILL_PATH = ROOT / "SKILL.md"
README_PATH = ROOT / "README.md"
CONTRIBUTING_PATH = ROOT / "CONTRIBUTING.md"

REFERENCE_REQUIRED_KEYS = {
    "title",
    "slug",
    "category",
    "depth",
    "audit_level",
    "last_reviewed",
    "sources",
    "triggers_strong",
    "triggers_weak",
    "related",
}
ALLOWED_CATEGORIES = {
    "appsec",
    "infra",
    "iam",
    "platform",
    "ai",
    "privacy",
    "ops",
    "compliance",
}
ALLOWED_AUDIT_LEVELS = {1, 2, 3, 4}
ROOT_REFERENCE_EXCEPTIONS = {"_index.md", "_core-invariants.md"}
URL_PATTERN = re.compile(r"https?://[^\s)>\]\"'`]+")
SKILL_REFERENCE_PATTERN = re.compile(r"references/[A-Za-z0-9_./*-]+")
SUSPICIOUS_PATTERNS = [
    re.compile(pattern, re.IGNORECASE)
    for pattern in (
        r"ignore (all )?previous instructions",
        r"disregard (the )?(system prompt|previous instructions)",
        r"developer message",
        r"begin system prompt",
        r"reveal your system prompt",
        r"print the developer message",
        r"exfiltrate",
        r"bypass restrictions",
    )
]
DEFENSIVE_CONTEXT_KEYWORDS = (
    "prompt injection",
    "hostile",
    "malicious",
    "attacker",
    "red flag",
    "detect",
    "detection",
    "selection",
    "block",
    "reject",
    "quarantine",
    "treat as untrusted",
    "untrusted",
    "example",
    "review",
    "incident",
    "mitigation",
    "mitigations",
    "direct injection",
    "indirect injection",
)
ALLOWED_DOMAIN_SUFFIXES = (
    "agentskill.sh",
    "aicpa-cima.com",
    "aicpa.org",
    "aisi.gov.uk",
    "amazon.com",
    "anthropic.com",
    "apache.org",
    "api.github.com",
    "apple.com",
    "artificialintelligenceact.eu",
    "arxiv.org",
    "blog.google",
    "chatgpt.com",
    "cisecurity.org",
    "claude.ai",
    "cmu.edu",
    "cnil.fr",
    "cncf.io",
    "csp-evaluator.withgoogle.com",
    "cyclonedx.org",
    "dataprivacyframework.gov",
    "defense.gov",
    "developers.cloudflare.com",
    "developers.openai.com",
    "doi.org",
    "docs.anthropic.com",
    "docs.cursor.com",
    "docs.sigstore.dev",
    "dora.dev",
    "edpb.europa.eu",
    "electronjs.org",
    "enisa.europa.eu",
    "envoyproxy.io",
    "eur-lex.europa.eu",
    "europa.eu",
    "falco.org",
    "fidoalliance.org",
    "first.org",
    "github.io",
    "github.com",
    "google",
    "google.com",
    "graphql.org",
    "hashicorp.com",
    "hhs.gov",
    "iec.ch",
    "ietf.org",
    "in-toto.io",
    "incidentdatabase.ai",
    "iso.org",
    "kubernetes.io",
    "llvm.org",
    "mandiant.com",
    "microsoft.com",
    "mitre.org",
    "modelcontextprotocol.io",
    "netflix.com",
    "nextjs.org",
    "nist.gov",
    "nginx.com",
    "observatory.mozilla.org",
    "openai.com",
    "openid.net",
    "openpolicyagent.org",
    "opentofu.org",
    "owasp.org",
    "owaspsamm.org",
    "pcisecuritystandards.org",
    "postgresql.org",
    "promptarmor.com",
    "raw.githubusercontent.com",
    "redhat.com",
    "rfc-editor.org",
    "scorecard.dev",
    "securityheaders.com",
    "securityscorecards.dev",
    "sigmahq.io",
    "slsa.dev",
    "spdx.dev",
    "spiffe.io",
    "sqlalchemy.org",
    "stepsecurity.io",
    "stripe.com",
    "token.actions.githubusercontent.com",
    "usenix.org",
    "vault.azure.net",
    "verizon.com",
    "vuejs.org",
    "w3.org",
    "xml.org",
    "www.anthropic.com",
    "www.cisa.gov",
    "www.cisecurity.org",
    "www.first.org",
)
ALLOWED_EXAMPLE_HOSTS = {
    "app.com",
    "attacker",
    "attacker.com",
}


@dataclass
class Failure:
    path: str
    message: str


def parse_frontmatter(path: Path) -> tuple[dict[str, object], str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError("missing YAML frontmatter opening delimiter")

    data: dict[str, object] = {}
    body_start = None
    i = 1
    while i < len(lines):
        line = lines[i]
        if line.strip() == "---":
            body_start = i + 1
            break

        if not line.strip():
            i += 1
            continue

        if ":" not in line:
            raise ValueError(f"unsupported frontmatter line: {line}")

        key, raw_value = line.split(":", 1)
        key = key.strip()
        raw_value = raw_value.strip()

        if raw_value == "":
            items: list[str] = []
            i += 1
            while i < len(lines):
                nested = lines[i]
                if nested.strip() == "---":
                    i -= 1
                    break
                if not nested.startswith("  - "):
                    i -= 1
                    break
                item = nested[4:].strip()
                if item.startswith('"') and item.endswith('"'):
                    item = json.loads(item)
                items.append(item)
                i += 1
            data[key] = items
        elif raw_value == "null":
            data[key] = None
        elif raw_value.startswith("["):
            data[key] = json.loads(raw_value)
        elif raw_value.startswith('"') and raw_value.endswith('"'):
            data[key] = json.loads(raw_value)
        elif raw_value.isdigit():
            data[key] = int(raw_value)
        else:
            data[key] = raw_value

        i += 1

    if body_start is None:
        raise ValueError("missing YAML frontmatter closing delimiter")

    return data, "\n".join(lines[body_start:])


def validate_reference_frontmatter(path: Path, meta: dict[str, object]) -> list[str]:
    errors: list[str] = []
    missing = REFERENCE_REQUIRED_KEYS - meta.keys()
    if missing:
        errors.append(f"missing frontmatter keys: {', '.join(sorted(missing))}")

    extra = set(meta.keys()) - REFERENCE_REQUIRED_KEYS
    if extra:
        errors.append(f"unexpected frontmatter keys: {', '.join(sorted(extra))}")

    title = meta.get("title")
    if not isinstance(title, str) or not title.strip():
        errors.append("title must be a non-empty string")

    slug = meta.get("slug")
    if not isinstance(slug, str) or not re.fullmatch(r"[a-z0-9-]+", slug):
        errors.append("slug must match [a-z0-9-]+")

    category = meta.get("category")
    if category not in ALLOWED_CATEGORIES:
        errors.append(f"category must be one of {sorted(ALLOWED_CATEGORIES)}")

    depth = meta.get("depth")
    if not isinstance(depth, int) or depth not in {1, 2, 3}:
        errors.append("depth must be one of 1, 2, 3")

    audit_level = meta.get("audit_level")
    if not isinstance(audit_level, list) or not audit_level:
        errors.append("audit_level must be a non-empty list")
    elif any(not isinstance(level, int) or level not in ALLOWED_AUDIT_LEVELS for level in audit_level):
        errors.append("audit_level must only contain integers from 1 to 4")

    last_reviewed = meta.get("last_reviewed")
    if last_reviewed is not None and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(last_reviewed)):
        errors.append("last_reviewed must be null or YYYY-MM-DD")

    for key in ("sources", "triggers_strong", "triggers_weak", "related"):
        value = meta.get(key)
        if not isinstance(value, list):
            errors.append(f"{key} must be a list")
            continue
        if key == "sources" and not value:
            errors.append("sources must not be empty")
        if any(not isinstance(item, str) or not item.strip() for item in value):
            errors.append(f"{key} must only contain non-empty strings")

    expected_slug = path.stem.lstrip("_")
    if isinstance(slug, str) and slug != expected_slug:
        errors.append(f"slug `{slug}` does not match file stem `{expected_slug}`")

    if path.parent == REFERENCES_DIR and path.name not in ROOT_REFERENCE_EXCEPTIONS:
        errors.append("only `_index.md` and `_core-invariants.md` may live at the references root")

    return errors


def domain_is_allowed(host: str) -> bool:
    if not host:
        return True

    if host in ALLOWED_EXAMPLE_HOSTS:
        return True

    host = host.lower()

    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        pass

    if "." not in host:
        return True

    if host.endswith(".example") or ".example." in host or host.startswith("example."):
        return True

    if any(token in host for token in ("yourapp", "yourdomain", "mycompany", "myapp", ".internal", ".corp")):
        return True

    return any(host == suffix or host.endswith(f".{suffix}") for suffix in ALLOWED_DOMAIN_SUFFIXES)


def lint_urls(path: Path, text: str) -> list[str]:
    errors: list[str] = []
    for raw_url in URL_PATTERN.findall(text):
        parsed = urlparse(raw_url)
        netloc = parsed.netloc.split("@")[-1].rstrip(".,;:)]}>")
        host = netloc.split(":")[0].strip().lower()
        if not domain_is_allowed(host):
            errors.append(f"external domain not allowlisted: {host}")
    return errors


def lint_hidden_instructions(path: Path, text: str) -> list[str]:
    errors: list[str] = []
    lines = text.splitlines()
    in_fence = False
    in_comment = False

    for idx, line in enumerate(lines, start=1):
        stripped = line.strip()
        if stripped.startswith("```"):
            in_fence = not in_fence

        if "<!--" in line:
            in_comment = True

        lowered = line.lower()
        if any(pattern.search(lowered) for pattern in SUSPICIOUS_PATTERNS):
            if in_fence or in_comment or "<!--" in line or "-->" in line:
                start = max(0, idx - 6)
                end = min(len(lines), idx + 5)
                context = " ".join(lines[start:end]).lower()
                if not any(keyword in context for keyword in DEFENSIVE_CONTEXT_KEYWORDS):
                    errors.append(
                        f"line {idx}: suspicious hidden instruction pattern without defensive framing"
                    )

        if "-->" in line:
            in_comment = False

    return errors


def validate_skill_routes(skill_text: str, references_by_path: dict[str, dict[str, object]]) -> list[str]:
    errors: list[str] = []
    seen = set(SKILL_REFERENCE_PATTERN.findall(skill_text))

    for token in sorted(seen):
        if token.endswith("/*"):
            category = token.removeprefix("references/").removesuffix("/*")
            category_dir = REFERENCES_DIR / category
            if not category_dir.is_dir():
                errors.append(f"SKILL.md references missing category directory: {token}")
            continue

        ref_path = ROOT / token
        if not ref_path.exists():
            errors.append(f"SKILL.md references missing file: {token}")
            continue

        if token.endswith("_index.md"):
            continue

        rel = ref_path.relative_to(ROOT).as_posix()
        meta = references_by_path.get(rel)
        if meta is None:
            errors.append(f"SKILL.md references file without registered frontmatter: {token}")
            continue

        expected_slug = ref_path.stem.lstrip("_")
        if meta.get("slug") != expected_slug:
            errors.append(
                f"SKILL.md route `{token}` points to slug `{meta.get('slug')}` but expected `{expected_slug}`"
            )

    return errors


def collect_markdown_targets(reference_paths: list[Path]) -> list[Path]:
    targets = [SKILL_PATH, README_PATH]
    if CONTRIBUTING_PATH.exists():
        targets.append(CONTRIBUTING_PATH)
    targets.extend(path for path in reference_paths if path.name != "_index.md")
    return targets


def main() -> int:
    failures: list[Failure] = []
    references_by_path: dict[str, dict[str, object]] = {}
    slugs: dict[str, str] = {}

    reference_paths = sorted(REFERENCES_DIR.rglob("*.md"))
    for path in reference_paths:
        if path.name == "_index.md":
            continue
        rel = path.relative_to(ROOT).as_posix()
        try:
            meta, body = parse_frontmatter(path)
        except ValueError as exc:
            failures.append(Failure(rel, str(exc)))
            continue

        for error in validate_reference_frontmatter(path, meta):
            failures.append(Failure(rel, error))

        slug = meta.get("slug")
        if isinstance(slug, str):
            if slug in slugs and slugs[slug] != rel:
                failures.append(Failure(rel, f"duplicate slug `{slug}` also used in `{slugs[slug]}`"))
            else:
                slugs[slug] = rel

        references_by_path[rel] = meta

    skill_text = SKILL_PATH.read_text(encoding="utf-8")
    for error in validate_skill_routes(skill_text, references_by_path):
        failures.append(Failure("SKILL.md", error))

    for path in collect_markdown_targets(reference_paths):
        rel = path.relative_to(ROOT).as_posix()
        text = path.read_text(encoding="utf-8")
        for error in lint_urls(path, text):
            failures.append(Failure(rel, error))
        for error in lint_hidden_instructions(path, text):
            failures.append(Failure(rel, error))

    if failures:
        print("skill lint failed", file=sys.stderr)
        for failure in failures:
            print(f"- {failure.path}: {failure.message}", file=sys.stderr)
        return 1

    print("skill lint passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
