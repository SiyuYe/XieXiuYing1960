# 謝秀英藝術館 CMS v7.2-B｜單頁試算表管理

本版接續 v7.2-A 效能核心，新增：

- 卡片模式與資料表模式切換
- 最上方切換作者／作品庫
- 試算表式單頁快速編輯
- 固定主資料改為下拉選單，畫面只顯示中文
- 點卡片或縮圖，右側滑出快速編輯面板
- 單列儲存到 Google 試算表
- 縮圖滑鼠移上時放大預覽
- 保留 v7.2-A 分頁載入、延遲讀圖、單件讀取與快取

## 更新 Apps Script

將：

`admin/apps-script/Code.gs`

完整覆蓋目前 Apps Script 的 `Code.gs`，然後：

部署 → 管理部署作業 → 編輯 → 新版本 → 部署

API 測試版本應顯示：

`7.2-B-sheet-manager`

## 更新 GitHub

把本資料夾內容全部覆蓋到 GitHub Desktop 的正式專案資料夾：

`GitHub\XieXiuYing1960\`

Commit 建議：

`CMS v7.2-B single-page sheet manager`

再按 Push origin。

## 使用

開啟：

`/admin/works.html`

可切換：

- 卡片
- 資料表

資料表每列可直接修改並按「儲存」。卡片或縮圖可開右側詳細編輯面板。

寫入功能需要先在 API 設定頁填入與 Google 試算表「網站設定」相同的 `adminWriteToken`。
