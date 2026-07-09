# 謝秀英書畫藝術館｜CMS v7.1

## 本版重點

- 保留 v7 的 Apps Script API 串接。
- 作品管理清單可讀取 Google 試算表作品庫。
- 新增 `admin/artwork-edit.html` 作品編輯器。
- 支援修改中文/英文作品名、年份、尺寸、類型、題材、材質、媒材、收藏資訊、公開狀態、首頁輪播、精選、SEO。
- 儲存時會透過 Apps Script `adminUpdateArtwork` 寫回 Google 試算表。

## 使用順序

1. GitHub Desktop 覆蓋整包檔案。
2. Commit：`CMS v7.1 artwork editor`。
3. Push origin。
4. 到官網後台 `/admin/` 確認 API 已連線。
5. 到「API 設定」填入管理寫入 Token。
6. 到「作品管理」點任一作品卡片，進入編輯頁測試。

## 寫入 Token

請到 Google 試算表「網站設定」新增：

| key | value |
|---|---|
| adminWriteToken | 自訂一組長密碼 |

然後在 `/admin/settings.html` 填入同一組 Token。

沒有 Token 時，後台只能讀取作品，不能儲存修改。
