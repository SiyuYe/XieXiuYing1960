# CMS V7.9.0 STEP 9B｜官網圖片 CDN 與三層備援

## 本次完成

- 官網作品縮圖優先讀取 `CDNthumbUrl`。
- 官網作品放大圖優先讀取 `CDNimageUrl`。
- 欄位空白時，依作品 ID 自動組成 jsDelivr 網址。
- 作品圖片失敗順序：jsDelivr → GitHub Pages／站內原路徑 → `art-placeholder-clean.svg`。
- 老師照片改由 jsDelivr 優先載入。
- 螢幕寬度 720px 以下使用 600 版本；桌機使用 1600 版本。
- 老師照片失敗順序：jsDelivr → GitHub Pages／站內原路徑 → 預設圖。
- 首頁橫幅仍保留 `assets/images/header-banner.webp`，未改 CDN。
- `data/site-data.json` 已補入 `CDNimageUrl`、`CDNthumbUrl`。
- Apps Script 的 imageManifest 也加入 CDN 路徑，供後續 GitHub Actions 發布使用。

## 版本

- app/style/API 查詢版本：`7909b`
- site-data 版本：`cms-v7.9.0-step9b`

## 尚未進行

- GitHub Actions 每日同步
- 試算表「發布網站資料」按鈕
- 最終跨瀏覽器封版驗收
