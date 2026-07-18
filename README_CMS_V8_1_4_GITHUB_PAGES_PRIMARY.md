# CMS V8.1.4 — GitHub Pages 作品圖片優先

## 修改內容
- 1200px 縮圖與 2400px 大圖改為 GitHub Pages／專案相對路徑優先。
- jsDelivr CDN 改為圖片載入失敗時的第二備援。
- 保留 dataVersion 查詢參數，發布網站資料後會形成新的圖片 URL。
- 更新前端資源版本與快取清理版本為 8140。
- 保留最終預設圖片備援。

## 圖片載入順序
1. GitHub Pages
2. jsDelivr CDN
3. 預設圖片
