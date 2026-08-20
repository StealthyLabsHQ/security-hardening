#!/usr/bin/env python3
"""Generate a labeled corpus and measure secure-review precision/recall.

Designed for local and CI use. Default variants=5 keeps CI fast; use higher
values for large-scale local runs.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "scripts"


PY_TEMPLATES = [
    ("shell", "import subprocess\n\ndef run(cmd):\n    subprocess.run(cmd, shell=True)\n", ["ai.python.shell-true"]),
    ("os_system", "import os\n\ndef run(cmd):\n    return os.system(cmd)\n", ["ai.python.os-system"]),
    ("eval", "def calc(expr):\n    return eval(expr)\n", ["ai.python.eval-exec"]),
    ("weak_hash", "import hashlib\n\ndef hash_password(password):\n    return hashlib.sha256(password.encode()).hexdigest()\n", ["ai.python.weak-password-hash"]),
    ("verify_false", "import requests\n\ndef fetch(url):\n    return requests.get(url, verify=False).text\n", ["ai.python.verify-false"]),
    ("pickle", "import pickle\n\ndef load_blob(data):\n    return pickle.loads(data)\n", ["ai.python.unsafe-deserialize"]),
    ("sql_fstring", "def get_user(user_id):\n    return f\"SELECT * FROM users WHERE id = '{user_id}'\"\n", ["ai.python.sql-fstring"]),
    ("sql_format", "def get_user(email):\n    return \"SELECT * FROM users WHERE email = '{}'\".format(email)\n", ["ai.python.sql-format"]),
    ("sql_execute", "def get_user(cur, name):\n    cur.execute(\"SELECT * FROM accounts WHERE name = '\" + name + \"'\")\n", ["ai.python.sql-execute-concat"]),
]

JS_TEMPLATES = [
    ("eval", "function run(code) {\n  return eval(code);\n}\nmodule.exports = { run };\n", ["ai.javascript.eval"]),
    ("exec", "const { exec } = require('child_process');\nfunction run(cmd) {\n  exec('ls ' + cmd);\n}\nmodule.exports = { run };\n", ["ai.javascript.child-process-shell"]),
    ("innerhtml", "function render(name) {\n  document.getElementById('out').innerHTML = name;\n}\nmodule.exports = { render };\n", ["ai.javascript.innerhtml"]),
    ("sql_concat", "function q(id) {\n  const sql = \"SELECT * FROM users WHERE id = \" + id;\n  return db.query(sql);\n}\nmodule.exports = { q };\n", ["ai.javascript.sql-concat"]),
    ("sql_template", "function q(id) {\n  return db.execute(`UPDATE users SET active=1 WHERE id = ${id}`);\n}\nmodule.exports = { q };\n", ["ai.javascript.sql-template"]),
]

PHP_TEMPLATES = [
    ("sql_concat", "<?php\nfunction getUser($db, $id) {\n    $sql = \"SELECT * FROM users WHERE id = \" . $id;\n    return mysqli_query($db, $sql);\n}\n", ["ai.php.sql-concat"]),
    ("sql_interp", "<?php\nfunction getUser($db, $id) {\n    return $db->query(\"SELECT * FROM users WHERE id = $id\");\n}\n", ["ai.php.sql-interpolation"]),
]

CLEAN_PY = [
    "def add(a, b):\n    return a + b\n",
    "def get_user(cur, user_id):\n    cur.execute('SELECT * FROM users WHERE id = %s', (user_id,))\n",
    "import subprocess\ndef run(cmd):\n    subprocess.run(['echo', cmd], check=True)\n",
]

CLEAN_JS = [
    "function add(a, b) { return a + b; }\nmodule.exports = { add };\n",
    "function q(id) { return db.query('SELECT * FROM users WHERE id = $1', [id]); }\nmodule.exports = { q };\n",
    "const { execFile } = require('child_process');\nfunction run(bin) { execFile(bin, ['--version']); }\nmodule.exports = { run };\n",
]

CLEAN_PHP = [
    "<?php\nfunction getUser($pdo, $id) {\n    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');\n    $stmt->execute([$id]);\n    return $stmt->fetch();\n}\n",
]


def normalize(cid: str) -> str:
    return cid[len("semgrep.") :] if cid.startswith("semgrep.") else cid


def write_corpus(out: Path, variants: int) -> dict[str, dict]:
    expected: dict[str, dict] = {}
    vuln_py = out / "vulnerable" / "python"
    vuln_js = out / "vulnerable" / "javascript"
    vuln_php = out / "vulnerable" / "php"
    clean_py = out / "clean" / "python"
    clean_js = out / "clean" / "javascript"
    clean_php = out / "clean" / "php"
    for d in (vuln_py, vuln_js, vuln_php, clean_py, clean_js, clean_php):
        d.mkdir(parents=True, exist_ok=True)

    for i in range(variants):
        for name, body, rules in PY_TEMPLATES:
            path = vuln_py / f"{name}_{i:03d}.py"
            path.write_text(f"# variant {i}\n{body}", encoding="utf-8")
            expected[str(path.resolve())] = {
                "label": "vulnerable",
                "expect_any": rules,
            }
        for name, body, rules in JS_TEMPLATES:
            path = vuln_js / f"{name}_{i:03d}.js"
            path.write_text(f"// variant {i}\n{body}", encoding="utf-8")
            expected[str(path.resolve())] = {
                "label": "vulnerable",
                "expect_any": rules,
            }
        for name, body, rules in PHP_TEMPLATES:
            path = vuln_php / f"{name}_{i:03d}.php"
            path.write_text(f"<?php /* variant {i} */\n" + body.lstrip("<?php\n"), encoding="utf-8")
            expected[str(path.resolve())] = {
                "label": "vulnerable",
                "expect_any": rules,
            }
        for j, body in enumerate(CLEAN_PY):
            path = clean_py / f"clean_{j}_{i:03d}.py"
            path.write_text(f"# clean {i}\n{body}", encoding="utf-8")
            expected[str(path.resolve())] = {"label": "clean", "expect_any": []}
        for j, body in enumerate(CLEAN_JS):
            path = clean_js / f"clean_{j}_{i:03d}.js"
            path.write_text(f"// clean {i}\n{body}", encoding="utf-8")
            expected[str(path.resolve())] = {"label": "clean", "expect_any": []}
        for j, body in enumerate(CLEAN_PHP):
            path = clean_php / f"clean_{j}_{i:03d}.php"
            path.write_text(body, encoding="utf-8")
            expected[str(path.resolve())] = {"label": "clean", "expect_any": []}
    return expected


def run_review(target: Path, out_json: Path) -> dict:
    cmd = [
        sys.executable,
        str(SCRIPTS / "secure-review.py"),
        str(target),
        "--mode",
        "detect",
        "--skip-gitleaks",
        "-o",
        str(out_json),
    ]
    t0 = time.perf_counter()
    proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    report = json.loads(out_json.read_text(encoding="utf-8"))
    report["_meta"] = {
        "exit_code": proc.returncode,
        "elapsed_ms": round(elapsed_ms, 1),
        "stderr": (proc.stderr or "")[:300],
    }
    return report


def score(gt: dict[str, dict], vuln_report: dict, clean_report: dict) -> dict:
    tp = fp = fn = tn = 0
    fn_examples = []
    fp_examples = []

    for path, meta in gt.items():
        p = Path(path)
        if meta["label"] == "vulnerable":
            found = {
                normalize(f.get("check_id") or "")
                for f in vuln_report.get("findings", [])
                if Path(f.get("path") or "").resolve() == p
            }
            if found & set(meta["expect_any"]):
                tp += 1
            else:
                fn += 1
                if len(fn_examples) < 10:
                    fn_examples.append(
                        {"path": str(p), "expect": meta["expect_any"], "found": sorted(found)}
                    )
        else:
            found = {
                normalize(f.get("check_id") or "")
                for f in clean_report.get("findings", [])
                if Path(f.get("path") or "").resolve() == p
            }
            if found:
                fp += 1
                if len(fp_examples) < 10:
                    fp_examples.append({"path": str(p), "found": sorted(found)})
            else:
                tn += 1

    prec = tp / (tp + fp) if (tp + fp) else 0.0
    rec = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * prec * rec / (prec + rec) if (prec + rec) else 0.0
    return {
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "tn": tn,
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "fn_examples": fn_examples,
        "fp_examples": fp_examples,
    }


def assert_db_not_autofix(report: dict) -> None:
    for finding in report.get("findings", []):
        if finding.get("blast_radius") in {"db", "secrets"} and finding.get("safe_to_autofix"):
            raise SystemExit(
                f"db/secrets must not be safe_to_autofix: {finding.get('check_id')}"
            )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--variants", type=int, default=5, help="Variants per template")
    parser.add_argument(
        "--workdir",
        default=str(ROOT / "evals" / "scale" / ".corpus"),
        help="Corpus output directory (gitignored)",
    )
    parser.add_argument(
        "--min-f1",
        type=float,
        default=0.95,
        help="Fail if F1 drops below this threshold",
    )
    args = parser.parse_args(argv)

    workdir = Path(args.workdir)
    if workdir.exists():
        for path in sorted(workdir.rglob("*"), reverse=True):
            if path.is_file():
                path.unlink()
            elif path.is_dir():
                path.rmdir()
    workdir.mkdir(parents=True, exist_ok=True)
    results = workdir / "results"
    results.mkdir(parents=True, exist_ok=True)

    gt = write_corpus(workdir, args.variants)
    vuln_report = run_review(workdir / "vulnerable", results / "vulnerable.json")
    clean_report = run_review(workdir / "clean", results / "clean.json")
    assert_db_not_autofix(vuln_report)

    metrics = score(gt, vuln_report, clean_report)
    summary = {
        "variants": args.variants,
        "files": len(gt),
        "metrics": metrics,
        "vulnerable_meta": vuln_report.get("_meta"),
        "clean_meta": clean_report.get("_meta"),
        "vulnerable_blast": vuln_report.get("blast_summary"),
        "agent_policy": vuln_report.get("agent_policy"),
    }
    (results / "scale_metrics.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))

    if metrics["f1"] < args.min_f1:
        print(f"F1 {metrics['f1']} < min {args.min_f1}", file=sys.stderr)
        return 1
    if metrics["fp"] > 0:
        print(f"unexpected false positives: {metrics['fp']}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
