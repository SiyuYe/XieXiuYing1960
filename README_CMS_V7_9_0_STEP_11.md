# CMS V7.9.0 STEP 11｜試算表發布按鈕

本次完成施工順序第 11 次：由 Google 試算表直接觸發 GitHub Actions 的 `workflow_dispatch`。

## 試算表選單

- ① 開啟作品預覽
- ② 將作品圖片欄位改為 GitHub WebP
- ③ 將 CDN 網址增加到欄位內
- ④ 發布網站資料

## 發布流程

1. 點選「④ 發布網站資料」。
2. Apps Script 從 Script Properties 讀取 GitHub 設定與 Token。
3. 呼叫 `siyuye/XieXiuYing1960` 的 `sync-site-data.yml`。
4. GitHub 回傳 HTTP 204 時顯示成功視窗。
5. 視窗提供「查看發布進度」與「開啟正式網站」。

## Script Properties

必須設定：

- `GITHUB_TOKEN`

可選；未設定時程式使用內建安全預設：

- `GITHUB_OWNER=siyuye`
- `GITHUB_REPO=XieXiuYing1960`
- `GITHUB_WORKFLOW_FILE=sync-site-data.yml`
- `GITHUB_BRANCH=main`

也可在 Apps Script 編輯器手動執行 `initializeGithubPublishSettings()`，寫入上述四個非機密值；此函式不會建立或覆蓋 Token。

## 新增檔案

- `admin/apps-script/PublishResult.html`

## 修改檔案

- `admin/apps-script/Code.gs`

## 成功判斷

GitHub API 回傳 HTTP 204 才視為「GitHub 已接受 Workflow」。

## 錯誤處理

401、403、404、422 等錯誤會顯示 HTTP 狀態、GitHub 訊息與常見原因，不會顯示假成功。
