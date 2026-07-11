# CMS V7.7 WEBP（重新命名版）

## 圖片命名規則

作品圖片以試算表的 `artworkId` 作為檔名：

- `XH0001` → `images/artworks/1200/XH0001.webp`
- `XH0001` → `images/artworks/2400/XH0001.webp`

網站卡片讀取 1200 版；點開大圖才讀取 2400 版。

## 試算表是否需要修改

必要條件只有 `artworkId` 必須正確，例如 `XH0001`。網站現在直接以 artworkId 對應 GitHub 圖片，因此：

- `imageUrl`、`thumbUrl`、Google Drive 網址可保留作備援，也可清空。
- `originalFileName` 不再是必要欄位。
- 若要整理得一致，可把 `originalFileName` 改為 `XH0001.webp`，但不改也不影響顯示。
- 不要修改作品系統 ID 與 artworkId 的對應。

## 老師照片

- 電腦版：`images/yingphoto/1600/`
- 手機版：`images/yingphoto/600/`

照片清單已自動寫入 `data/images-manifest.json`，不必另外維護 photos.json。

## Icon

本版已將 favicon、PWA 192/256/512 與網站品牌圖示全部換成 `images/icons/` 內的新圖示。
