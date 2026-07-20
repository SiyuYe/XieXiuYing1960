# V8.2.1 STEP 2 — Social SEO 完整整合

## 完成內容
- 每個獨立作品頁自動建立唯一 Canonical URL：`/works/<作品編號>.html`。
- 自動建立 Open Graph：`og:locale`、`og:type`、`og:site_name`、`og:title`、`og:description`、`og:url`、`og:image`、`og:image:secure_url`、`og:image:alt`。
- 自動建立 Twitter(X) Card：`summary_large_image`、標題、描述、圖片與圖片替代文字。
- 自動建立 Schema.org `VisualArtwork` JSON-LD。
- JSON-LD 依作品資料帶入：作品名稱、英文名稱、作品編號、圖片、年份、類型、題材、材質、媒材、尺寸、畫家與網站實體。
- SEO 標題與描述沿用網站既有 `SeoHelper.js` 的欄位規則，避免作品集與獨立頁產生不同內容。
- 所有 URL 與分享圖片均輸出絕對 HTTPS 網址，適用 Facebook、LINE、Discord、Threads 與 Twitter(X) 爬蟲。
- `data/artwork-pages.json` 升級至 schemaVersion 2，額外記錄 canonical 與 image。
- 特殊字元與 `</script>` 已安全處理，避免 JSON-LD 被作品文字破壞。
- GitHub Actions 持續在每次資料發布時自動重建所有 Social SEO 標籤並執行驗收。

## 自動化驗收範圍
- Canonical 指向正確獨立作品頁。
- `og:url` 與 Canonical 一致。
- `og:image` 為正確絕對網址。
- Twitter Card 使用大圖格式。
- JSON-LD 可解析且類型為 `VisualArtwork`。
- JSON-LD 的作品 URL、圖片與 creator 正確。
- Manifest schemaVersion 與 canonical 正確。
- 含關閉 script 字串的作品文字不會破壞 JSON-LD。
- STEP 1 原有公開篩選、舊頁清除、人工頁保護與重複 ID 中止驗收仍全部通過。

## 本機執行
```bash
python3 scripts/generate_artwork_pages.py data/site-data.json templates/artwork-page.html works --manifest data/artwork-pages.json
```

## 本機驗收
```bash
python3 scripts/test_generate_artwork_pages.py
```

## STEP 2 邊界
- STEP 2 程式端已完成。
- Facebook、LINE、Discord、Threads、Twitter(X) 與 Google 的正式線上抓取結果，依原施工順序留在 STEP 4 部署後驗收。
- STEP 3 分享按鈕與 Web Share API 尚未加入。
