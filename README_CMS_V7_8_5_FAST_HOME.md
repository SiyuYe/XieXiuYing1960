# CMS V7.8.5｜首頁快速顯示修正版

- 近期公告的初始畫面只顯示「讀取中…」。
- `showNotice` 預設設為 `false`，資料載入後公告區會自動移除。
- 首頁主輪播預設立即顯示 GitHub WebP，不再顯示空白佔位圖。
- 精選作品加入 GitHub WebP 靜態首屏備援，JavaScript 尚未完成時也會先有圖片。
- CSS、JS 加入版本參數，避開舊 Service Worker 快取。
- 網站前台暫停註冊 Service Worker，並清除舊版快取，避免更新後仍讀到舊程式。
- 舊瀏覽器沒有 IntersectionObserver 時，內容會直接顯示，不會永遠維持隱藏。
