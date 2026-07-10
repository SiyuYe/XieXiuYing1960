# 謝秀英書畫藝術館 CMS v7.2-A｜效能核心

本版依照升級計畫，先只處理效能，不改成試算表介面。

## 已完成

- 作品列表改成每次 24 筆分批載入
- 縮圖使用 lazy loading 與 async decoding
- 滑到頁面底部自動載入下一批，也保留「載入更多作品」按鈕
- 搜尋改為伺服器端搜尋，並加入 350ms 防抖
- 點作品後只呼叫 `?action=artwork&id=XH0001`
- 不再於編輯頁重新下載全部作品
- `sessionStorage` 瀏覽器快取
- Apps Script `CacheService` 短暫快取
- 保留原本卡片模式

## 必須更新的 Apps Script

請把：

`admin/apps-script/Code.gs`

完整覆蓋到 Google Apps Script，儲存後：

1. 部署
2. 管理部署作業
3. 編輯目前部署
4. 版本選「新版本」
5. 部署

若沒有重新部署，新 API `artworksPage` 與 `artwork` 不會生效。

## GitHub 更新

將本資料夾全部覆蓋至 GitHub Desktop 的正式專案資料夾：

`GitHub\XieXiuYing1960\`

Commit 建議：

`CMS v7.2-A performance core`

再按 Push origin。

## 測試

1. API 設定頁測試連線，版本應顯示 `7.2-A-performance`
2. 作品管理頁先顯示 24 件
3. 往下滑會載入下一批
4. 點作品後，應只讀單一作品，速度明顯比 v7.1 快
