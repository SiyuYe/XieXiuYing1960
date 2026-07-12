# CMS V7.9.0 — STEP 4 + STEP 5

## STEP 4
- 新增全域 JavaScript 與 Promise 錯誤記錄。
- JSON 載入失敗顯示正常提示，不再只留下空白。
- 作品／老師圖片失敗時改用 `art-placeholder-clean.svg`。
- 一次性清理舊 `xxy.static.*`、`xxy.siteBundle.*`、舊 CMS 快取與 Service Worker。
- 保留 `xxy.cms.apiUrl` 與 `xxy.cms.adminToken`，不會清掉後台 API 與管理 Token。
- CSS、app.js、api/cms.js 版本更新為 `79045`。

## STEP 5
- Apps Script 新增 `?action=siteData`。
- 建立 `schemaVersion`、`generatedAt`、`settings`、`home`、`pages`、`artworks`、`gallery`、`exhibitions`、`history`、`notices` 外層骨架。
- 新增 `readSiteDataSheetsOnce_()`，每張指定工作表只批次讀取一次。
- 本階段尚未切換官網前端，仍使用原有 JSON 與 `siteBundle`。
- 完整作品庫、多作品庫、欄位型別與 showNotice 布林校正留待 STEP 6。
