#!/usr/bin/env python3
"""Regenerate sitemap.xml and sitemap.txt after a successful site-data publish.

Usage (backward compatible):
  update_sitemap.py <sitemap.xml> <published-at> [artworks.json]

When artworks.json is omitted, the script reads data/artworks.json next to the
repository root. Public artwork pages and all detected type/subject/material/
medium collection URLs are added automatically.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import quote
from xml.sax.saxutils import escape

BASE_URL = "https://siyuye.github.io/XieXiuYing1960/"
STATIC_PATHS = ["", "about.html", "gallery.html", "works.html", "exhibitions.html", "history.html", "contact.html"]
FILTER_FIELDS = {
    "type": ("artworkTypeName", "categoryZh", "artworkType", "typeName"),
    "subject": ("subjectNames", "subjectName", "subject"),
    "material": ("materialNames", "materialName", "material"),
    "medium": ("mediumNames", "mediumName", "medium"),
}


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def truthy_public(row: dict) -> bool:
    for key in ("isPublic", "public"):
        if key in row:
            value = row.get(key)
            if value is False or str(value).strip().lower() in {"false", "0", "no", "off"}:
                return False
    return True


def split_terms(value) -> list[str]:
    if isinstance(value, list):
        raw = value
    else:
        text = str(value or "")
        for sep in ("，", ",", "；", ";", "|", "｜", "/"):
            text = text.replace(sep, "、")
        raw = text.split("、")
    result: list[str] = []
    for item in raw:
        term = str(item or "").strip()
        if term and term not in result:
            result.append(term)
    return result


def first_value(row: dict, fields: tuple[str, ...]):
    for field in fields:
        value = row.get(field)
        if value not in (None, "", []):
            return value
    return ""


def load_artworks(path: Path) -> list[dict]:
    if not path.exists():
        print(f"WARNING: 找不到作品資料，僅建立固定頁面 Sitemap：{path}", file=sys.stderr)
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        data = data.get("artworks", data.get("items", []))
    if not isinstance(data, list):
        fail(f"作品資料格式錯誤：{path}")
    return [row for row in data if isinstance(row, dict) and truthy_public(row)]


def build_urls(artworks: list[dict]) -> list[str]:
    urls = [BASE_URL + path for path in STATIC_PATHS]
    seen = set(urls)

    for row in artworks:
        artwork_id = str(row.get("artworkId") or row.get("id") or "").strip()
        if artwork_id:
            url = BASE_URL + "works.html?id=" + quote(artwork_id, safe="")
            if url not in seen:
                seen.add(url)
                urls.append(url)

    for query_key, fields in FILTER_FIELDS.items():
        terms: list[str] = []
        for row in artworks:
            for term in split_terms(first_value(row, fields)):
                if term not in terms:
                    terms.append(term)
        for term in sorted(terms):
            url = BASE_URL + "works.html?" + query_key + "=" + quote(term, safe="")
            if url not in seen:
                seen.add(url)
                urls.append(url)
    return urls


def main() -> None:
    if len(sys.argv) not in (3, 4):
        fail("用法：update_sitemap.py <sitemap.xml> <published-at> [artworks.json]")

    sitemap_path = Path(sys.argv[1])
    published_at = sys.argv[2].strip()
    artworks_path = Path(sys.argv[3]) if len(sys.argv) == 4 else sitemap_path.parent / "data" / "artworks.json"

    try:
        date_value = datetime.fromisoformat(published_at.replace("Z", "+00:00")).date().isoformat()
    except ValueError:
        fail(f"published-at 不是有效 ISO 日期時間：{published_at}")

    artworks = load_artworks(artworks_path)
    urls = build_urls(artworks)

    lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url in urls:
        lines.extend(["  <url>", f"    <loc>{escape(url)}</loc>", f"    <lastmod>{date_value}</lastmod>", "  </url>"])
    lines.append("</urlset>")
    sitemap_path.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")

    text_path = sitemap_path.with_suffix(".txt")
    text_path.write_text("\n".join(urls) + "\n", encoding="utf-8", newline="\n")
    print(f"Sitemap 已重新建立：{len(urls)} 個網址（作品 {sum(1 for u in urls if 'works.html?id=' in u)} 件），lastmod={date_value}")


if __name__ == "__main__":
    main()
