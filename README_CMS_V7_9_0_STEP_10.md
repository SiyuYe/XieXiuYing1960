# CMS V7.9.0 STEP 10 — GitHub Actions 每日同步

本階段新增 `.github/workflows/sync-site-data.yml`，用途是從 Apps Script 的 `?action=siteData` API 取得完整資料，驗證成功後更新 `data/site-data.json`。

## 排程

- 每天台灣時間凌晨 03:00 執行。
- GitHub Actions cron 為 `0 19 * * *`（UTC 19:00）。
- 同時支援 GitHub Actions 頁面的 `Run workflow` 手動執行。

## 必要 Secret

在 GitHub Repository：

`Settings → Secrets and variables → Actions → New repository secret`

新增：

- Name：`APPS_SCRIPT_SITE_DATA_URL`
- Value：Apps Script Web App 完整網址，必須包含 `?action=siteData`

範例格式：

`https://script.google.com/macros/s/部署ID/exec?action=siteData`

## 安全驗證

下載完成後會檢查：

- `ok === true`
- `schemaVersion === 1`
- `generatedAt` 存在
- `settings.showNotice` 是真正布林值
- `artworks`、`gallery`、`exhibitions`、`history`、`notices` 等是陣列
- `pages` 與 `imageManifest` 是物件
- `validation.valid === true`（若 API 有提供）
- 不接受 `completeFieldMapping === false` 的骨架資料

任何一項失敗都會停止，不會覆蓋目前正常的 `data/site-data.json`。

## 只有資料實質變更才 Commit

Apps Script 每次請求都會更新 `generatedAt` 和 `dataVersion`。同步程式比較資料時會忽略這兩個時間欄位；只有其他公開內容真的改變時，才會覆蓋檔案並 Commit。

## 本階段沒有進行

- 尚未增加試算表「⑤ 發布網站資料」按鈕。
- 尚未在 Apps Script 儲存 GitHub Token。
- 尚未由試算表觸發 `workflow_dispatch`。

以上屬於 STEP 11。
