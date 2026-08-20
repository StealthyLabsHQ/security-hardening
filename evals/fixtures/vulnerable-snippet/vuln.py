"""Intentionally vulnerable snippets for secure-review smoke tests.

These patterns are for scanner verification only. Do not copy into production.
"""

from __future__ import annotations

import hashlib
import os
import pickle
import subprocess

import requests
import yaml


def run_user_command(cmd: str) -> None:
    # AI often generates shell=True "to make it work"
    subprocess.run(cmd, shell=True)


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def fetch_insecure(url: str) -> bytes:
    return requests.get(url, verify=False).content


def load_blob(data: bytes):
    return pickle.loads(data)


def load_yaml(raw: str):
    return yaml.load(raw)


def eval_input(expr: str):
    return eval(expr)


def system_call(cmd: str) -> int:
    return os.system(cmd)
