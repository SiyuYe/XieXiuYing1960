# 謝秀英官網 V7.9.1｜首頁作品完整顯示修正

本次只調整首頁圖片呈現，不修改試算表、siteData、GitHub Actions、CDN 或發布流程。

## 修正內容

1. 首頁「藝術焦點」輪播作品由 `object-fit: cover` 改為 `object-fit: contain`，整張原畫完整放入輪播框，不再裁切。
2. 首頁「本月精選作品」縮圖改為 `object-fit: contain`，直式、橫式與超長幅作品都完整顯示。
3. 本月精選卡片下方白色資訊列縮小 padding、gap 與 line-height，把更多空間留給圖片。
4. 桌機精選圖片高度調整為 240px；手機為 215px。
5. 公開頁面 CSS／JS 查詢版本更新為 `v=7901`，避免瀏覽器沿用舊樣式。

## 未修改

- 作品集與線上藝廊既有完整圖片效果
- CDN 三層備援
- JSON 版本發布
- GitHub Actions
- 試算表「④ 發布網站資料」
