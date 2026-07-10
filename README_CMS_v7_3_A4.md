# CMS v7.3-A4｜新作品預設值

本版只修改 Google Drive 同步新作品時的展示預設值：

- 官網公開 `isPublic = TRUE`
- 首頁輪播 `isHomeHero = FALSE`
- 精選作品 `isFeatured = FALSE`
- 線上藝廊 `isGallery = FALSE`
- 作品展示 `isShowcase = FALSE`

只影響之後新同步進來的作品，不會修改既有作品資料。
需更新 Apps Script 的 `admin/apps-script/Code.gs` 並重新部署 Web App。
