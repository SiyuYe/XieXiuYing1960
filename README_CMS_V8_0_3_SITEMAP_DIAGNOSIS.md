# V8.0.3 Sitemap 診斷修正

## 檢查結果

- sitemap.xml 可正常解析，格式符合 Sitemap 0.9。
- sitemap.txt 為每行一個完整網址，格式正確。
- robots.txt 已同時宣告 sitemap.xml 與 sitemap.txt。
- 公開網址回傳 HTTP 200，且沒有重新導向。
- 首頁可被 Google 建立索引。

因此 Google Search Console 顯示「無法擷取」並非 sitemap 內容語法錯誤。
目前現象與 GitHub Pages 專案型網址（username.github.io/repository/）的 Search Console Sitemap 擷取異常相符。

## 本次修改

新增根目錄：

```text
.nojekyll
```

用途：明確要求 GitHub Pages 直接發布靜態檔案，排除 Jekyll 處理對 robots.txt、sitemap.xml、sitemap.txt 的任何影響。

## 沒有修改

- sitemap.xml 的網址清單
- sitemap.txt 的網址清單
- robots.txt（目前已同時列出 XML 與 TXT）
- GitHub Actions 資料同步流程
- Apps Script

## 上傳後

1. 將本修正版覆蓋並 Push 到 GitHub。
2. 確認 `.nojekyll` 位於 Repository 根目錄。
3. 等 GitHub Pages 部署完成。
4. Search Console 移除舊 Sitemap 紀錄後，可重新提交 `sitemap.xml`。
5. 若仍顯示「無法擷取」，不建議再反覆修改 Sitemap；這時可繼續使用網址檢查要求主要頁面建立索引，或日後改用自訂網域／其他靜態託管服務來避開 GitHub Pages 專案網址的相容性問題。

## ZIP 發布資料排除規範

本回傳 ZIP 已依約移除：

```text
data/site-data.json
data/site-version.json
```

GitHub Repository 內原有的兩個檔案請保留，繼續由 GitHub Actions 維護。
