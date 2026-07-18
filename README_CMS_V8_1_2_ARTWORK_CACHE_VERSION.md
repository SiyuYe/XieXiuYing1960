# CMS V8.1.2 作品圖片版本快取更新

- 作品 1200px 與 2400px 圖片網址自動加入 `?v=<site-data dataVersion>`。
- 套用於首頁輪播、本月精選、藝廊、作品集及作品大圖。
- jsDelivr CDN、GitHub Pages 相對路徑與試算表明確圖片網址皆套用相同版本。
- 保留 CDN → GitHub Pages → 預設圖的失敗備援。
- 更新前端程式查詢版本為 `app.js?v=8120`。
- 更新快取清理版本並清除／停用舊 Service Worker。

每次試算表重新發布並產生新的 `dataVersion` 後，瀏覽器會將作品圖片視為新網址並重新下載。
