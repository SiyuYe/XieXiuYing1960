# CMS v7.3-A2｜Token 自動檢查與管理

- API URL 與 adminWriteToken 儲存在目前瀏覽器的 localStorage。
- 後台開啟時先檢查 API URL 與 Token 是否存在。
- 後端新增 `adminValidateToken` 驗證介面；公開 API 不回傳 Token。
- 驗證失敗或缺少設定時，直接導向 `admin/settings.html`。
- 後台右上角顯示 API／Token 狀態。
- 所有新增、單列儲存、全部儲存、批次更新與排序儲存，仍由 Apps Script 後端驗證 Token。
- 更換 Token 時只需修改試算表「網站設定」中的 `adminWriteToken`，再於 API 設定頁輸入新值。

## 更新

1. 覆蓋 Apps Script 的 `Code.gs`。
2. 重新部署 Web App 新版本。
3. 覆蓋 GitHub 專案並 Commit / Push。
