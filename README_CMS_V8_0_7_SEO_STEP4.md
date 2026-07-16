# 謝秀英書畫藝術館 CMS V8.0.7 — SEO STEP 4

## 本次範圍
只實作「Google 結構化 SEO」，未加入關聯作品或其他版面功能。

## 完成項目
- 作品開啟時自動建立 `VisualArtwork` JSON-LD。
- 作品圖片以 `ImageObject` 寫入結構化資料。
- 作品與分類頁自動建立 `BreadcrumbList`。
- 作品集與分類頁自動建立 `CollectionPage`。
- 作品與分類切換時同步更新 Open Graph。
- 作品與分類切換時同步更新 Twitter Card。
- 關閉作品時恢復原分類頁或作品集的 SEO 與結構化資料。
- `scripts/update_sitemap.py` 改為每次發布後重新建立 Sitemap。
- Sitemap 自動加入所有公開作品頁，以及作品類型、題材、材質、媒材分類頁。
- 同步輸出 `sitemap.xml` 與 `sitemap.txt`。

## 主要修改路徑
- `/app.js`
- `/src/app.source.js`
- `/scripts/update_sitemap.py`
- `/sitemap.xml`
- `/sitemap.txt`
- 根目錄所有前台 HTML（僅更新 JS 版本參數，避免讀取舊快取）

## Sitemap 來源
更新程式預設讀取：

`/data/artworks.json`

只納入公開作品，並從作品資料自動整理：
- `type`
- `subject`
- `material`
- `medium`

## 驗收提醒
Google Rich Results Test 對 `BreadcrumbList` 可直接驗證；`VisualArtwork` 屬於 Schema.org 結構化型別，但不保證會被 Google 顯示為特定複合式搜尋結果。應同時確認測試工具沒有 JSON-LD 語法錯誤，並以 Search Console 網址檢查確認 Google 已讀取頁面。
