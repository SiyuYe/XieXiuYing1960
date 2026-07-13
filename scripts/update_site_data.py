#!/usr/bin/env python3
"""Validate Apps Script siteData and publish versioned static JSON files.

Step 12-1 responsibilities:
- Validate the downloaded Apps Script siteData payload.
- Generate a fresh dataVersion for every successful workflow run.
- Update data/site-data.json.
- Generate data/site-version.json for the later two-stage frontend loader.
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

TAIPEI = ZoneInfo("Asia/Taipei")


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def load_json(path: Path) -> Any:
    try:
        with path.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError:
        fail(f"找不到檔案：{path}")
    except json.JSONDecodeError as exc:
        fail(f"JSON 格式錯誤：{path}（第 {exc.lineno} 行，第 {exc.colno} 欄）")


def validate_site_data(data: Any) -> None:
    if not isinstance(data, dict):
        fail("API 回傳最外層必須是 JSON 物件")
    if data.get("ok") is not True:
        fail(f"API 回傳 ok 不是 true：{data.get('error') or data.get('ok')}")
    if data.get("schemaVersion") != 1:
        fail(f"schemaVersion 必須為 1，目前為：{data.get('schemaVersion')}")
    if not isinstance(data.get("generatedAt"), str) or not data["generatedAt"].strip():
        fail("缺少 generatedAt")
    if not isinstance(data.get("settings"), dict):
        fail("settings 必須是物件")
    if not isinstance(data["settings"].get("showNotice"), bool):
        fail("settings.showNotice 必須是真正的布林值 true/false")

    array_keys = [
        "artworks", "gallery", "exhibitions", "history", "notices",
        "announcements", "books"
    ]
    for key in array_keys:
        if not isinstance(data.get(key), list):
            fail(f"{key} 必須是陣列")

    if not isinstance(data.get("pages"), dict):
        fail("pages 必須是物件")
    if not isinstance(data.get("imageManifest"), dict):
        fail("imageManifest 必須是物件")

    validation = data.get("validation")
    if isinstance(validation, dict) and validation.get("valid") is not True:
        errors = validation.get("errors") or []
        fail("Apps Script validation.valid 不是 true：" + "；".join(map(str, errors)))

    meta = data.get("meta")
    if isinstance(meta, dict) and meta.get("completeFieldMapping") is False:
        fail("API 仍是未完成的 siteData 骨架，拒絕覆蓋正式資料")


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def make_data_version() -> tuple[str, str]:
    now = datetime.now(TAIPEI).replace(microsecond=0)
    return now.strftime("%Y%m%d%H%M%S"), now.isoformat()


def append_github_output(**values: str) -> None:
    output_env = os.environ.get("GITHUB_OUTPUT")
    if not output_env:
        return
    with Path(output_env).open("a", encoding="utf-8") as handle:
        for key, value in values.items():
            handle.write(f"{key}={value}\n")


def main() -> None:
    if len(sys.argv) != 4:
        fail("用法：update_site_data.py <下載檔> <site-data.json> <site-version.json>")

    incoming_path = Path(sys.argv[1])
    site_data_path = Path(sys.argv[2])
    version_path = Path(sys.argv[3])

    incoming = load_json(incoming_path)
    validate_site_data(incoming)

    data_version, published_at = make_data_version()
    incoming["dataVersion"] = data_version

    version_payload = {
        "schemaVersion": 1,
        "dataVersion": data_version,
        "generatedAt": incoming["generatedAt"],
        "publishedAt": published_at,
    }

    # Every successful manual or scheduled publish gets a fresh version.
    # This intentionally updates both files on every workflow run.
    write_json(site_data_path, incoming)
    write_json(version_path, version_payload)

    print(f"site-data 已發布：{len(incoming['artworks'])} 件公開作品")
    print(f"dataVersion：{data_version}")
    print(f"site-version：{version_path}")

    append_github_output(
        changed="true",
        status="published",
        artwork_count=str(len(incoming["artworks"])),
        generated_at=incoming["generatedAt"],
        data_version=data_version,
        published_at=published_at,
    )


if __name__ == "__main__":
    main()
