# CMS V7.7.1｜GitHub WebP 圖片正式對接

- 所有作品縮圖直接依 `artworkId` 讀取 `images/artworks/1200/<artworkId>.webp`。
- 所有作品放大圖直接依 `artworkId` 讀取 `images/artworks/2400/<artworkId>.webp`。
- 官網首頁、作品集、線上藝廊、精選作品、後台畫廊卡片、排序中心、單件作品預覽與 Apps Script 側欄皆已切換。
- Apps Script 新增選單：`④ 將作品圖片欄位改為 GitHub WebP`，可一次更新所有作品庫的 `originalFileName`、`imageUrl`、`thumbUrl`。
- 舊 Drive 欄位先保留，不建議立即刪除；確認正式網站無誤後再刪。
