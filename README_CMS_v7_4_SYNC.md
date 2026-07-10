# CMS v7.4｜作品庫指定同步與重複檢查

本版針對 Google 試算表選單與 Drive 同步流程重構：

- 選單只保留「同步指定作品庫」與「檢查指定作品庫重複照片」。
- 兩項功能皆先從「作品庫管理」載入清單，再由使用者選擇單一作品庫。
- 同步不再自動建立、升級、重排或格式化任何作品庫。
- 新作品從最後一筆系統 ID 的下一列開始寫入，優先使用現有空白格式列。
- 不使用 appendRow，不破壞欄寬、下拉選單、核取方塊與公式。
- 作品類型 ID、題材 ID、材質 ID、媒材 ID、收藏狀態 ID 保留給試算表公式自動產生。
- 移除 Apps Script 內舊的 CMS 側邊欄檔案與入口。
- 新作品預設：官網公開 TRUE；首頁輪播、精選、線上藝廊、作品展示皆 FALSE。

## Apps Script 更新

將 `admin/apps-script/Code.gs` 與 `LibraryPicker.html` 貼入 Apps Script 專案。
刪除原本的 `AdminSidebar.html`。
`appsscript.json` 維持原專案設定即可。
