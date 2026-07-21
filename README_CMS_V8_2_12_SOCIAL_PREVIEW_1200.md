# V8.2.12 社群網址預覽改用 1200 圖庫

## 修改內容

- 獨立作品頁網址維持 `works/<作品編號>.html`。
- 官網作品頁實際顯示的大圖維持原本 `imageUrl`／2400 圖庫。
- `og:image`、`og:image:secure_url`、`twitter:image` 改為：
  `images/artworks/1200/<作品編號>.webp?v=<dataVersion>`。
- VisualArtwork JSON-LD 的 `image` 同步使用 1200 預覽圖。
- 1200 預覽圖網址保留資料版本號，避免 Facebook 持續沿用舊縮圖。
- 不新增社群合成圖、不裁切圖片，也不修改官網卡片、作品頁版面或分享流程。

## 注意

Facebook 仍會依自己的連結卡片版型決定顯示比例；本版的目的，是明確指定原本的 1200 最長邊圖庫作為網址預覽來源，並避免使用 2400 大圖。
