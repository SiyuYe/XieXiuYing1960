#!/usr/bin/env python3
"""Apply the current dataVersion to social-preview and header image URLs.

This prevents mobile browsers and Facebook's scraper from reusing an older image
stored under the same URL after the banner or artwork data is republished.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def version_url(value: str, version: str) -> str:
    parsed = urlparse(value)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query["v"] = version
    return urlunparse(parsed._replace(query=urlencode(query)))


def main() -> None:
    if len(sys.argv) < 3:
        fail("用法：update_social_meta.py <site-data.json> <html...>")
    data_path = Path(sys.argv[1])
    try:
        payload = json.loads(data_path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError) as exc:
        fail(f"無法讀取 {data_path}：{exc}")
    version = str(payload.get("dataVersion") or "").strip()
    if not version:
        fail("site-data.json 缺少 dataVersion")

    changed = 0
    pattern = re.compile(r"(?P<url>(?:https://siyuye\.github\.io/XieXiuYing1960/|\.\./|)(?:assets/images/header-banner\.webp))(?:\?[^\"'<>\s]*)?")
    for raw in sys.argv[2:]:
        path = Path(raw)
        if not path.exists():
            continue
        original = path.read_text(encoding="utf-8")
        updated = pattern.sub(lambda m: version_url(m.group("url"), version), original)
        if updated != original:
            path.write_text(updated, encoding="utf-8", newline="\n")
            changed += 1
    print(f"社群與橫幅圖片版本：{version}；更新 HTML：{changed} 個")


if __name__ == "__main__":
    main()
