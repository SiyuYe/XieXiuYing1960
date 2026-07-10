# 謝秀英書畫藝術館｜CMS v7.3-C Excel 管理強化

## 本版完成

- 保留卡片模式與資料表模式。
- 可在卡片或資料表勾選多件作品。
- 批次公開／隱藏。
- 批次加入或移出首頁輪播、精選作品、線上藝廊、作品展示。
- 批次修改作品類型、題材、材質、媒材與收藏狀態。
- 所有固定選單都直接讀取 Google 試算表主資料：作品類型、題材、材質、媒材、收藏狀態。
- 新增「重新整理選單」按鈕；修改主資料表後，不必改前端程式。
- 媒材維持 Checkbox 複選。
- 所有批次寫入都使用 adminWriteToken，並由 Apps Script 後端驗證。

## 更新 Apps Script

將 `admin/apps-script/Code.gs` 覆蓋目前 Apps Script，再以「新版本」重新部署 Web App。
API 版本應顯示：`7.3-C-excel-manager`。

## 更新 GitHub

將整包內容覆蓋 GitHub 工作資料夾，Commit 建議：

`CMS v7.3-C Excel management`

然後 Push origin，最後於後台按 Ctrl + F5。

## 不會更動

本版不會重置既有作品資料、媒材、材質、收藏資料或展示勾選。
