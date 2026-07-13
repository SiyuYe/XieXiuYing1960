# 謝秀英書畫藝術館｜第 13 次施工：SEO 基礎建設

## 本次完成

- 建立根目錄 `sitemap.xml`，收錄首頁、關於秀英、線上藝廊、作品集、展覽經歷、歷史回顧與聯絡頁。
- 建立根目錄 `robots.txt`，允許搜尋引擎檢索並標示 Sitemap 網址。
- GitHub Actions 每次手動或每週資料發布後，自動更新 Sitemap 的 `lastmod` 日期。
- 七個公開頁面各自設定唯一的 `<title>` 與 Meta Description。
- 七個公開頁面加入 Canonical，避免首頁與 `index.html` 被視為重複頁面。
- 七個公開頁面加入 Open Graph 與 Twitter Card 分享資訊。
- 加入 Schema.org JSON-LD：WebSite、Person、WebPage、BreadcrumbList。
- 更新 PWA `manifest.json` 正式名稱、描述、語言、scope、id 與分類。
- 保留既有 Google Search Console HTML 驗證方式；Repository 中既有 `google*.html` 驗證檔請勿刪除。

## Search Console

網站擁有權已由使用者完成 HTML 檔案驗證。上傳本版並等待 GitHub Pages 部署後，確認：

`https://siyuye.github.io/XieXiuYing1960/sitemap.xml`

可以正常開啟，再到 Search Console 重新提交 `sitemap.xml`。原本顯示「無法擷取」的紀錄可刪除後重送，或直接重新提交同一網址。

## Bing Webmaster

Bing 驗證需要登入 Bing Webmaster Tools，由網站擁有者操作。可直接選「從 Google Search Console 匯入」，通常不需要再增加網站檔案；若 Bing 指定 `BingSiteAuth.xml` 或 Meta Token，請保留其提供的原始內容後再加入 Repository。

## Rich Results／結構化資料

本次已完成 JSON-LD 語法與 JSON 格式檢查。上線後仍應使用 Google Rich Results Test 或 Schema Markup Validator 以正式網址驗證。Person、WebSite 與 Breadcrumb 結構可協助搜尋引擎理解網站；是否顯示搜尋結果特效由 Google 決定，無法保證一定出現。

## 重要：自動資料檔不放進更新 ZIP

本次交付 ZIP 已依專案固定規範移除：

- `data/site-data.json`
- `data/site-version.json`

GitHub Repository 上的這兩個檔案請保留，並繼續交由 GitHub Actions 自動維護。將本 ZIP 覆蓋到現有 Repository 時，不會刪除 GitHub 上既有的兩個 JSON，也不會覆蓋最新版試算表資料。

## 上線檢查

1. 解壓後覆蓋現有 Repository，Commit、Push。
2. 等待 GitHub Pages 部署完成。
3. 開啟 `/robots.txt` 與 `/sitemap.xml` 確認不是 404。
4. Search Console 重新提交 `sitemap.xml`。
5. 分享首頁到 Facebook／LINE 測試標題、描述與橫幅圖。
6. 使用 Google Rich Results Test 檢查首頁與 about.html。
