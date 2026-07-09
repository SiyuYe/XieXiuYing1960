# 謝秀英書畫藝術館｜CMS v7

## 本版重點

- 從 `XieXiuYing1960_official_v1` 正式升級。
- 前台網站可讀 Apps Script API。
- 新增 `api/cms.js` 統一管理 API URL、快取與 POST。
- 新增 `/admin/` 網站後台骨架。
- 新增 `/admin/settings.html` 可在瀏覽器設定 Apps Script Web App URL。
- 新增 `/admin/works.html` 作品管理清單，會直接讀 Google 試算表作品庫。
- Apps Script 新增 `adminUpdateArtwork` 寫入接口，需設定 `adminWriteToken` 才能寫入。

## 使用順序

1. 把 `admin/apps-script/Code.gs` 貼到 Apps Script。
2. 貼上 `appsscript.json`。
3. 重新部署 Web App，複製 Web App URL。
4. 用 Live Server 開本專案。
5. 打開 `admin/settings.html`，貼上 Web App URL，按測試。
6. 打開 `admin/works.html`，確認作品清單能讀到。

## 正式上 GitHub 前

可把 Web App URL 寫入：

```json
// data/site-config.json
{
  "backendMode": "appsScript",
  "appsScriptApiUrl": "你的 Web App URL"
}
```

## 寫入安全

若要讓網站後台可以修改作品資料，請到「網站設定」新增：

| key | value |
|---|---|
| adminWriteToken | 自訂一組長密碼 |

然後在 `admin/settings.html` 填入同一組 Token。

沒有設定 Token 時，後台只能讀取，不能寫入。
