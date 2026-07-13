# 謝秀英官網 V7.9.0｜STEP 12-2

本次範圍：前端兩段式讀取與 Chrome JSON 快取修復。

## 完成項目

1. 前端先讀取 `data/site-version.json`。
2. `site-version.json` 使用 `cache: no-store`，並附加時間參數，避免 Chrome 保存舊版本檔。
3. 取得 `dataVersion` 後，再讀取 `data/site-data.json?v=<dataVersion>`。
4. 移除原本 `cache: force-cache` 的 JSON 載入方式。
5. `site-data.json` 使用版本化網址，資料未變時可正常快取；版本更新時會被視為新網址。
6. localStorage 改為版本化鍵值：`xxy.siteData.<dataVersion>`。
7. 新資料成功下載後，自動清除其他舊版 `xxy.siteData.*` 及舊的 `xxy.static.data/site-data.json`。
8. 網路或版本檔暫時失敗時，優先使用最後一次成功保存的完整資料作為備援。
9. 公開頁面 `app.js` 引用版本更新為 `v=79012-2`，確保 Chrome 取得本次新程式。

## 正式載入流程

```
網站開啟
→ no-store 讀取 data/site-version.json
→ 取得最新 dataVersion
→ 讀取 data/site-data.json?v=dataVersion
→ 成功後儲存為 xxy.siteData.<dataVersion>
→ 清除舊版本資料快取
```

## 本次未做

保留給 STEP 12-3：

- 正式更新 `DATA_VERSION`。
- 正式更新 `CACHE_CLEANUP_VERSION`。
- V7.9.0 封版時的一次性完整舊快取清理。
- 左下角 Version／Data 顯示。
- 最終跨瀏覽器驗收與封版。

## GitHub 設定

本次不需要新增 Secret、不需要更新 Token，也不需要修改 Repository Settings。
上傳完整專案後，按一次試算表「④ 發布網站資料」，確認兩份檔案的 `dataVersion` 一致，再進行 Chrome／Edge／Samsung Internet 測試。
