# 謝秀英書畫藝術館 CMS V8.2.2 — STEP 3 作品分享流程

## 完成內容

- 獨立作品頁按鈕文字更新：
  - `← 返回作品集`
  - `🔍 在作品集卡片中查看`
- 獨立作品頁新增「分享作品」按鈕。
- 首頁、本月精選、線上藝廊與作品集的大圖卡片新增「分享作品」按鈕。
- 分享網址一律使用 `/works/<作品編號>.html`，不分享舊式 Popup 查詢網址。
- 手機與觸控裝置優先使用 Web Share API，直接叫出系統分享面板。
- 桌機顯示自訂分享面板：Facebook、LINE、X、複製連結。
- Discord、Threads 等沒有固定網頁分享端點的平台，可使用複製連結。
- 複製成功提供畫面提示。
- 支援 Esc、點擊背景與關閉按鈕關閉分享面板。
- GitHub Actions 加入 STEP 3 驗收與 JavaScript 語法檢查。

## 驗收

```bash
python3 scripts/test_generate_artwork_pages.py
python3 scripts/test_artwork_share.py
node --check artwork-share.js
node --check app.js
```

## 範圍限制

STEP 4 的 Facebook、LINE、Discord、Google 最終相容性測試不在本次自動驗收範圍。
