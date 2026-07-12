#!/usr/bin/env python3
"""Validate Apps Script siteData JSON and update data/site-data.json only on semantic changes."""

from __future__ import annotations

import json
import sys
from copy import deepcopy
from pathlib import Path
from typing import Any

VOLATILE_TOP_LEVEL_KEYS = {"generatedAt", "dataVersion"}


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
    if isinstance(validation, dict):
        if validation.get("valid") is not True:
            errors = validation.get("errors") or []
            fail("Apps Script validation.valid 不是 true：" + "；".join(map(str, errors)))

    meta = data.get("meta")
    if isinstance(meta, dict) and meta.get("completeFieldMapping") is False:
        fail("API 仍是未完成的 siteData 骨架，拒絕覆蓋正式資料")


def semantic_copy(data: Any) -> Any:
    """Remove values that change every request but do not represent content changes."""
    result = deepcopy(data)
    if isinstance(result, dict):
        for key in VOLATILE_TOP_LEVEL_KEYS:
            result.pop(key, None)
    return result


def stable_dump(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def main() -> None:
    if len(sys.argv) != 3:
        fail("用法：update_site_data.py <下載檔> <正式檔>")

    incoming_path = Path(sys.argv[1])
    target_path = Path(sys.argv[2])
    incoming = load_json(incoming_path)
    validate_site_data(incoming)

    current = None
    if target_path.exists():
        current = load_json(target_path)

    changed = current is None or stable_dump(semantic_copy(current)) != stable_dump(semantic_copy(incoming))

    github_output = Path(str(Path.cwd() / ".github-output-placeholder"))
    output_env = __import__("os").environ.get("GITHUB_OUTPUT")
    if output_env:
        github_output = Path(output_env)

    target_path.parent.mkdir(parents=True, exist_ok=True)
    if changed:
        with target_path.open("w", encoding="utf-8", newline="\n") as handle:
            json.dump(incoming, handle, ensure_ascii=False, indent=2)
            handle.write("\n")
        status = "updated"
        print(f"site-data 已更新：{len(incoming['artworks'])} 件公開作品")
    else:
        status = "unchanged"
        print("site-data 實質內容沒有變更，不覆蓋檔案、不建立 Commit")

    if output_env:
        with github_output.open("a", encoding="utf-8") as handle:
            handle.write(f"changed={'true' if changed else 'false'}\n")
            handle.write(f"status={status}\n")
            handle.write(f"artwork_count={len(incoming['artworks'])}\n")
            handle.write(f"generated_at={incoming['generatedAt']}\n")


if __name__ == "__main__":
    main()
