# CMS V7.9.0 STEP 9A｜試算表圖片網址工具整理

## 本次完成

### 選單精簡
「謝秀英藝術館後台」現在只保留：

1. `① 開啟作品預覽`
2. `② 將作品圖片欄位改為 GitHub WebP`
3. `③ 將 CDN 網址增加到欄位內`

### 已拆除
- 開啟 CMS 管理面板選單與 `openCmsAdmin()`。
- Google Drive 同步指定作品庫選單與目前同步執行函式。
- 指定作品庫重複照片檢查選單與目前檢查執行函式。
- 兩個 API 測試選單與測試函式。
- 舊管理面板使用的 Drive 同步入口。

公開官網與網頁 CMS 不依賴上述試算表選單，因此不影響公開網站資料讀取與網頁後台。

### ② GitHub WebP 網址
按下後先顯示作品庫選擇器。清單直接讀取：

- 分頁：`作品庫管理`
- 欄位：`sheetName`
- 起始列：第 3 列

只更新選取的作品庫分頁：

- `originalFileName`：`作品ID.webp`
- `imageUrl`：GitHub Pages 2400 圖片網址
- `thumbUrl`：GitHub Pages 1200 圖片網址

缺少欄位時會安全加在最右側，不移動既有欄位。

### ③ CDN 網址
同樣先選擇單一作品庫，之後寫入：

- `CDNimageUrl`：`https://cdn.jsdelivr.net/gh/siyuye/XieXiuYing1960@main/images/artworks/2400/作品ID.webp`
- `CDNthumbUrl`：`https://cdn.jsdelivr.net/gh/siyuye/XieXiuYing1960@main/images/artworks/1200/作品ID.webp`

缺少 CDN 欄位時會安全加在最右側。

## 尚未進行
- 公開官網前端切換 CDN 欄位。
- 老師照片 CDN。
- 三層圖片備援。
- GitHub Actions。
- 試算表發布網站資料按鈕。
