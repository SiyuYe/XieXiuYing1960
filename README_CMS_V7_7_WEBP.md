# CMS V7.7 WebP 圖片加速版

本版沿用 CMS V7.6 Gallery Manager，將網站作品與老師照片改為 GitHub Pages 本地 WebP 圖片。

## 圖片路徑
- 作品列表、首頁輪播、精選作品、線上藝廊：`images/artworks/1200/`
- 作品點開大圖：`images/artworks/2400/`
- 老師照片（電腦）：`images/yingphoto/1600/`
- 老師照片（手機）：`images/yingphoto/600/`
- 對照清單：`data/images-manifest.json`

## 載入策略
- 卡片圖片使用 `loading="lazy"` 與 1200px WebP。
- 點開作品時才讀取 2400px WebP。
- 手機首頁優先使用 600px 老師照片，電腦使用 1600px。
- Service Worker 不會預先下載全部作品；圖片瀏覽過後才個別快取。
- Google Drive 圖片網址保留為找不到本地圖片時的備援。

## 圖片對應方式
優先依作品的 `originalFileName`、`drivePath`、`artworkId` 或 `id` 中的數字對應。例如 `XH0001` 會對應圖片清單中的 `001...webp`。

## 部署
本次只修改 GitHub 前端檔案，不需要重新部署 Apps Script。將全部檔案 Commit、Push 後等待 GitHub Pages 更新即可。
