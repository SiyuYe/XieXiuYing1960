# 謝秀英書畫藝術館 V8.2.13

## 本次修正

1. 獨立作品頁的 `og:url` 改為帶入 `?share=dataVersion` 的分享網址。
2. Canonical 繼續維持不帶參數的乾淨作品頁網址。
3. 自動產生作品頁時，頁首橫幅 `header-banner.webp` 直接套用當次 `dataVersion`。
4. 作品頁模板保留 `{{DATA_VERSION}}`，不再由 `update_social_meta.py` 預先改寫，避免產生頁使用上一版版本號。

## 未修改

- 1200 社群預覽圖來源
- 手機 Web Share API
- 分享按鈕與介面
- 作品頁主圖
- SEO Canonical、Twitter Card、JSON-LD 結構
- 首頁、藝廊、作品集版面
