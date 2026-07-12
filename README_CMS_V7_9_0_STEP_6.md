# CMS V7.9.0｜STEP 6：siteData 完整欄位對接

本版本以前一版 `V7.9.0_STEP4_5` 為基礎，只完成施工順序第 6 次。

## 已完成

- `?action=siteData` 從骨架升級為完整公開資料 API。
- 每次 siteData 請求中，每張工作表最多只執行一次 `getDataRange().getValues()`。
- 支援「作品庫管理」內所有啟用且公開的作品庫。
- 若作品庫管理不存在或沒有有效資料，安全回退讀取「謝秀英作品庫／作品庫」。
- 完整輸出網站設定、首頁內容、頁面內容、作品、線上藝廊、展覽經歷、歷史回顧、最新消息。
- 同時輸出書籍、聯絡設定、作品類型、題材、媒材、材質、幣別、收藏狀態、作者及首頁隨機作品。
- `settings.showNotice` 一律輸出真正布林值 `true` 或 `false`；空白或遺失時安全預設為 `false`。
- 作品只輸出公開資料，並沿用既有私密欄位清除規則，不公開後台收藏價、收藏者及收藏日期。
- `pages` 整理為以 `pageId` 為鍵的物件，分段依排序欄位排列。
- 所有公開表格資料依 `isPublic` 過濾並依 `sort` 排序。
- 加入 `schemaVersion`、`dataVersion`、`generatedAt`、`validation` 與工作表讀取摘要。
- 加入可在 Apps Script 編輯器手動執行的 `testSiteDataStep6()`。

## siteData 主要結構

```json
{
  "ok": true,
  "schemaVersion": 1,
  "dataVersion": "20260712123000",
  "generatedAt": "2026-07-12T12:30:00+08:00",
  "settings": { "showNotice": false },
  "home": {},
  "pages": {},
  "artworks": [],
  "gallery": [],
  "exhibitions": [],
  "history": [],
  "notices": [],
  "validation": { "valid": true, "errors": [], "warnings": [] }
}
```

## 手動測試

1. 將 `admin/apps-script/Code.gs` 更新到試算表 Apps Script。
2. 儲存後重新部署 Web App 新版本。
3. 在 Apps Script 編輯器執行 `testSiteDataStep6()`。
4. API 測試：在 Web App 網址後加上 `?action=siteData`。
5. 確認 `validation.valid` 為 `true`，並確認 `settings.showNotice` 是布林值。

## 本次沒有進行

- 沒有新增 `data/site-data.json`。
- 沒有讓官網前端切換讀取 siteData。
- 沒有停止舊版多 JSON 或 siteBundle 流程。
- 沒有進行作品分批載入。
- 沒有切換 jsDelivr CDN。
- 沒有建立 GitHub Actions。

上述項目保留給後續 STEP 7 以後施工。
