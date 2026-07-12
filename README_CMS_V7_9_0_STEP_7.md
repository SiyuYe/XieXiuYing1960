# CMS V7.9.0 STEP 7

## 完成項目
- 新增 `data/site-data.json`。
- 公開官網只讀 `data/site-data.json`，不再同時讀取多份 JSON。
- 公開官網停止訪客端即時呼叫 Apps Script `siteBundle`。
- `showNotice` 僅接受 `settings.showNotice === true`；false 時隱藏整個公告區。
- 資料失敗時顯示錯誤提示，不顯示測試公告或假資料。
- 舊 JSON 檔案暫時保留，供必要時回退，但前端不再讀取。
- Apps Script `siteData` 增加 `imageManifest`，確保日後 GitHub Actions 覆蓋單一 JSON 後仍包含作品與老師照片清單。
- 本階段未進行作品分批載入、jsDelivr CDN、GitHub Actions 或試算表發布按鈕。
