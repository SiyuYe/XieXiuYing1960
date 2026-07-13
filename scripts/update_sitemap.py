#!/usr/bin/env python3
"""Update sitemap.xml <lastmod> values after a successful site-data publish."""
from __future__ import annotations

import re
import sys
from datetime import datetime
from pathlib import Path


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    if len(sys.argv) != 3:
        fail("用法：update_sitemap.py <sitemap.xml> <published-at>")

    sitemap_path = Path(sys.argv[1])
    published_at = sys.argv[2].strip()
    if not sitemap_path.exists():
        fail(f"找不到 Sitemap：{sitemap_path}")

    try:
        date_value = datetime.fromisoformat(published_at).date().isoformat()
    except ValueError:
        fail(f"published-at 不是有效 ISO 日期時間：{published_at}")

    text = sitemap_path.read_text(encoding="utf-8")
    updated, count = re.subn(r"<lastmod>[^<]+</lastmod>", f"<lastmod>{date_value}</lastmod>", text)
    if count == 0:
        fail("Sitemap 內找不到任何 <lastmod> 欄位")

    sitemap_path.write_text(updated, encoding="utf-8", newline="\n")
    print(f"Sitemap 已更新：{count} 個網址，lastmod={date_value}")


if __name__ == "__main__":
    main()
