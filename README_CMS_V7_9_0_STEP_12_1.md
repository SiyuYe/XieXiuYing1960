# 謝秀英官網 V7.9.0 — STEP 12-1

本次只修改發布流程，不修改前端讀取方式。

## 已完成

1. 新增 `data/site-version.json`。
2. GitHub Actions 每次成功執行時，同步更新：
   - `data/site-data.json`
   - `data/site-version.json`
3. 每次手動發布或排程發布，都會產生新的 `dataVersion`，格式為台灣時間 `YYYYMMDDHHMMSS`。
4. GitHub Actions 自動排程由每天凌晨 03:00 改為每週一凌晨 03:00（台灣時間）。
5. Commit 會同時包含兩份 JSON，訊息會帶入本次 `dataVersion`。
6. 保留 `workflow_dispatch`，試算表的「④ 發布網站資料」仍可立即手動發布。

## 本次未做

- 前端尚未讀取 `site-version.json`。
- 尚未移除 `cache: force-cache`。
- 尚未改造 localStorage。
- 尚未執行 STEP 12-2 與 STEP 12-3。

## 上傳後測試

1. 將完整專案上傳 GitHub。
2. 在試算表按「④ 發布網站資料」。
3. 確認 GitHub Actions 顯示綠色成功。
4. Repository 內應同時更新：
   - `data/site-data.json`
   - `data/site-version.json`
5. 兩份檔案的 `dataVersion` 必須相同。

## GitHub 額外設定

不需要新增 Secret，也不需要重設 Token。沿用既有：

- `APPS_SCRIPT_SITE_DATA_URL`
- Apps Script Script Property：`GITHUB_TOKEN`
