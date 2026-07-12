# CMS V7.9.0 STEP 9C｜補齊後台預覽 CDN

本版補齊施工順序第 9 次遺漏的「後台預覽」。

## 完成項目
- 網頁後台作品管理卡片：CDNthumbUrl → jsDelivr 自組 → thumbUrl/imageUrl → GitHub Pages → 預設圖。
- 網頁後台排序中心縮圖：同一套三層備援。
- 網頁後台作品編輯預覽：CDNimageUrl → jsDelivr 2400 → imageUrl/thumbUrl → GitHub Pages 2400 → 預設圖。
- Apps Script 回傳的後台作品資料補上 CDNimageUrl/CDNthumbUrl。
- 試算表「① 開啟作品預覽」改為 jsDelivr → GitHub Pages → 預設圖。
- 新增 admin/admin-images.js，統一後台圖片網址與備援規則。
- 快取版本更新為 7909c。

本版未進行 GitHub Actions 與發布按鈕。
