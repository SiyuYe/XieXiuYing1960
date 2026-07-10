# 目前版本：CMS v7.3-C

# 謝秀英書畫藝術館｜正式版 v1.0

這是一個「前台官網 + Google 試算表 CMS 後台」整合專案。

## 專案用途

- GitHub Pages：放置官方 PWA 網站。
- Google 試算表：作為網站資料庫與內容管理後台。
- Apps Script：提供網站讀取資料的 API。
- Google Drive：放置作品展示圖、縮圖與原圖備份。

## 資料夾說明

```text
XieXiuYing1960/
├── index.html              # 首頁
├── about.html              # 關於秀英
├── gallery.html            # 藝廊
├── works.html              # 作品集
├── exhibitions.html        # 展覽經歷
├── history.html            # 歷史回顧
├── contact.html            # 聯絡
├── app.js                  # 前台資料讀取與互動邏輯
├── style.css               # 網站樣式
├── manifest.json           # PWA 設定
├── service-worker.js       # PWA 快取
├── data/                   # 本機備用 JSON，未串接 CMS 時使用
├── assets/                 # 圖示、圖片、作品預留圖
├── admin/apps-script/      # Google Apps Script 後台程式碼備份
└── docs/                   # 後台資料表規格與說明
```

## 第一次建立 Google 試算表 CMS

1. 開啟 Google 試算表。
2. 擴充功能 → Apps Script。
3. 貼上 `admin/apps-script/Code.gs`。
4. 在 Apps Script 左側「專案設定」勾選「在編輯器中顯示 appsscript.json」。
5. 貼上 `admin/apps-script/appsscript.json`。
6. 新增 HTML 檔案，名稱填 `AdminSidebar`，貼上 `admin/apps-script/AdminSidebar.html`。
7. 儲存，回到試算表重新整理。
8. 上方選單會出現「謝秀英藝術館後台」。
9. 執行「初始化／修復後台資料庫」。

## 發布 API

Apps Script 右上角：部署 → 新增部署 → 網頁應用程式。

建議設定：

```text
執行身分：我
誰可以存取：任何人
```

這是讓官網可以讀取公開資料，不代表任何人能修改試算表。請勿把 Google 試算表分享權限開成「任何人可編輯」。

## 串接官網

取得 Web App URL 後，修改：

```text
data/site-config.json
```

把：

```json
"backendMode": "local",
"appsScriptApiUrl": ""
```

改成：

```json
"backendMode": "appsScript",
"appsScriptApiUrl": "你的 Web App URL"
```

完成後，官網會優先讀取 Google 試算表資料。若 API 失敗，仍可用 `data/` 裡的本機 JSON 作為備援。

## 作品防盜原則

網站只應放低解析展示圖，不要放原始高清圖。
目前前台已包含：

- 禁右鍵
- 禁拖曳
- 禁長按
- 透明遮罩
- 浮水印層

這些只能降低盜用，無法 100% 防止截圖或技術擷取。

## 正式上 GitHub Pages

將本資料夾內的所有內容放到 GitHub repository 根目錄。`index.html` 必須在最外層。

GitHub → Settings → Pages：

```text
Source: Deploy from a branch
Branch: main
Folder: /root
```
