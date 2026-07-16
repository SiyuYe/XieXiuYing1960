# CMS V8.0.6 — SEO STEP 3 分類頁 SEO

## 本次範圍
只實作 STEP 3，不包含 STEP 4 結構化資料與 Sitemap。

## 已完成
- 作品類型：`works.html?type=工筆`
- 題材：`works.html?subject=荷花`
- 材質：`works.html?material=宣紙`
- 媒材：`works.html?medium=膠彩`
- 自動更新 Title、Meta Description、Canonical
- 直接開啟分類網址時自動篩選作品
- 點擊既有作品類型按鈕時同步更新網址與 SEO
- 返回「全部」時恢復作品集預設 SEO

## 主要修改檔案
- `/app.js`
- `/src/app.source.js`
- 公開 HTML 的前端版本參數
