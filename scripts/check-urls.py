"""Extract all URLs from references/ frontmatter sources[] and check HTTP status."""
from __future__ import annotations

import re
import sys
import urllib.request
import urllib.error
import urllib.parse
import ssl
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REFS = ROOT / "references"

URL_RE = re.compile(r"https?://[^\s\)\]\"']+")

# Hosts known to block HEAD/bot UAs but URLs are valid (verified out-of-band).
# Check manually via browser if in doubt.
BOT_BLOCKED_HOSTS = {
    "openai.com",
    "www.openai.com",
    "media.defense.gov",
    "www.hhs.gov",
    "www.verizon.com",
    "www.mandiant.com",
}


def extract_urls() -> dict[str, list[str]]:
    found: dict[str, list[str]] = {}
    for md in REFS.rglob("*.md"):
        text = md.read_text(encoding="utf-8")
        # Only check frontmatter
        if not text.startswith("---"):
            continue
        end = text.find("\n---", 3)
        if end == -1:
            continue
        front = text[:end]
        urls = URL_RE.findall(front)
        if urls:
            clean = []
            for u in urls:
                u = u.rstrip(",.)];\"'")
                if u not in clean:
                    clean.append(u)
            found[str(md.relative_to(ROOT))] = clean
    return found


def check_one(url: str) -> tuple[str, int | str]:
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        return url, "unsupported-url"
    host = parsed.hostname.lower()
    if host in BOT_BLOCKED_HOSTS:
        return url, "skipped-bot-blocked"
    ctx = ssl.create_default_context()
    try:
        import certifi  # type: ignore
        ctx = ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        pass
    req = urllib.request.Request(
        url,
        method="HEAD",
        headers={"User-Agent": "Mozilla/5.0 security-hardening-linkcheck"},
    )
    try:
        # The scheme and hostname are allowlisted above; local file URLs cannot reach this call.
        with urllib.request.urlopen(req, timeout=12, context=ctx) as resp:  # nosemgrep: dynamic-urllib-use-detected
            return url, resp.status
    except urllib.error.HTTPError as e:
        # Retry with GET — some servers block HEAD or return 404/405 to HEAD
        if e.code in (403, 404, 405, 501):
            req2 = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 security-hardening-linkcheck"},
            )
            try:
                # The retry uses the same validated HTTP(S) URL as the HEAD request.
                with urllib.request.urlopen(req2, timeout=12, context=ctx) as resp:  # nosemgrep: dynamic-urllib-use-detected
                    return url, resp.status
            except Exception as ee:
                return url, f"{type(ee).__name__}: {ee}"
        return url, e.code
    except Exception as e:
        return url, f"{type(e).__name__}: {e}"


def main() -> int:
    files = extract_urls()
    all_urls = sorted({u for urls in files.values() for u in urls})
    print(f"Extracted {len(all_urls)} unique URLs from {len(files)} files")

    results: dict[str, int | str] = {}
    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = {ex.submit(check_one, u): u for u in all_urls}
        for f in as_completed(futs):
            url, status = f.result()
            results[url] = status

    bad: list[tuple[str, int | str]] = []
    skipped: list[str] = []
    for u in all_urls:
        s = results[u]
        if isinstance(s, int) and 200 <= s < 400:
            continue
        if s == "skipped-bot-blocked":
            skipped.append(u)
            continue
        bad.append((u, s))
    if skipped:
        print(f"Skipped bot-blocked ({len(skipped)}): {', '.join(sorted(set(h.split('/')[2] for h in skipped)))}")

    print(f"\nOK: {len(all_urls) - len(bad)}/{len(all_urls)}")
    if bad:
        print(f"\nBROKEN ({len(bad)}):")
        for u, s in bad:
            print(f"  [{s}] {u}")
            # Show which files reference this URL
            for path, urls in files.items():
                if u in urls:
                    print(f"      in {path}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
