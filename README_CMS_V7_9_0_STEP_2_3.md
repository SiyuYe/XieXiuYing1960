# CMS V7.9.0｜第 2、3 次施工

本版只完成施工順序中的第 2 與第 3 次，不提前進行單一 site-data.json、CDN、作品分批載入、GitHub Actions 或試算表發布按鈕。

## 第 2 次：核心載入相容性

- `AbortController` 改為功能偵測：瀏覽器支援才使用，不支援時仍可正常 `fetch`。
- JSON 逾時由 2.2 秒改為 12 秒。
- 逾時或網路失敗時，優先使用既有 `localStorage` JSON 快取。
- 單一 JSON 載入失敗不再阻斷其他資料。
- 初始化發生錯誤時仍嘗試呈現可用頁面。
- 作品、藝廊或精選區沒有可用資料時，顯示「作品資料暫時載入失敗，請重新整理頁面」，不再只留下空白區域。
- 目前仍保留原有多份 JSON 架構與 Apps Script 背景更新流程。

## 第 3 次：JavaScript 相容語法

- 新增可維護原始碼：
  - `src/app.source.js`
  - `src/cms.source.js`
- 正式載入檔已轉譯為較舊瀏覽器可解析的 JavaScript：
  - `app.js`
  - `api/cms.js`
- 已處理 optional chaining、object spread、arrow function、解構等語法。
- `Set` 加入陣列式備援。
- CMS 查詢參數在沒有 `URLSearchParams` 時有備援解析。
- CMS 記憶體快取在沒有 `Map` 時有物件式備援。
- CMS 網址參數組合不再依賴 `Object.entries`。
- 集合轉陣列在沒有 `Array.from` 時有備援。

## 快取版本

公開頁面的 `app.js` 與 `api/cms.js` 查詢版本已更新為 `v=79023`，避免瀏覽器繼續使用 V7.8.5 舊 JavaScript。

## 尚未施工

- 第 4 次：完整全域錯誤紀錄、圖片三層備援、Service Worker 與舊快取全面清理。
- 第 5～7 次：Apps Script `siteData`、單一靜態 JSON 與前端切換。
- 第 8～9 次：作品分批載入與 jsDelivr CDN。
- 第 10～11 次：GitHub Actions 與試算表發布按鈕。
