# 謝秀英藝術館 CMS_V7_5

## 最新公告開關
在 Google 試算表「網站設定」分頁新增一列（放在現有資料下方即可）：

- key：showNotice
- value：TRUE 或 FALSE
- note：首頁近期公告開關

TRUE 顯示近期公告，FALSE 完全隱藏整個區塊。請放在下方新增一列，不要在右側新增欄位。

## 首頁老師照片
照片放在 GitHub 儲存庫的 `yingphoto` 資料夾。網站會優先讀取 `yingphoto/photos.json`，沒有清單時會嘗試由 GitHub API 讀取資料夾。照片圓角由網站 CSS 處理，不需修改原圖。

建議建立 `yingphoto/photos.json`：
```json
["photo1.jpg", "photo2.jpg", "photo3.png"]
```

## 歷史回顧 Google Drive 圖片
可直接填分享網址，網站會自動轉成縮圖網址。
