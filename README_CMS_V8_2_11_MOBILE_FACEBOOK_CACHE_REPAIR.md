# 謝秀英書畫藝術館 V8.2.11
## 手機與 Facebook 分享縮圖快取修復

本版針對部分 Android／Facebook App 長期顯示舊作品圖、舊首頁橫幅，以及手機 Web Share 發布後縮圖消失進行相容性補強。

### 1. 強制取得最新版網站資料
- site-version.json 維持 no-store 與時間戳。
- site-data.json 改為 no-store，並額外加上每次請求時間戳。
- 快取清理版本更新為 xxy.cacheCleanup.v82110。
- 首次載入本版時會清除舊的 xxy.siteData.* 與 xxy.siteVersion.latest 本機資料快取。

### 2. 作品圖片與分享網址版本化
- 獨立作品頁的 og:image、twitter:image、JSON-LD image 加入 dataVersion。
- 分享網址加入 share=dataVersion，避免 Facebook App 一直沿用舊連結預覽。
- 作品卡片的大圖分享網址同步加入 share=dataVersion。

### 3. 首頁橫幅與社群縮圖版本化
- 新增 scripts/update_social_meta.py。
- 每次 GitHub Actions 發布網站資料後，自動替首頁及各分頁的橫幅、og:image、twitter:image 加入最新 dataVersion。
- 使用同一檔名重新上傳橫幅時，社群爬蟲與手機瀏覽器會取得新的圖片 URL。

### 4. Samsung／Facebook App 分享相容模式
- 手機 Web Share API 保留。
- 分享資料改為純網址 `{url}`，避免部分 Android Facebook App 在預覽階段有縮圖、真正發布後卻把連結附件移除。
- 標題與縮圖改由作品頁 Open Graph 資料提供。

### 5. 未更動
- 桌機分享視窗與四個按鈕。
- SEO Canonical。
- 作品頁功能與版面。
- 首頁、藝廊、作品集、輪播版面。
- 試算表欄位與 CMS 操作方式。
