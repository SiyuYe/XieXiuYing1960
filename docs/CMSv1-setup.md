# CMS v1 設定說明

## 目標

正式版 v1.0 將後台合併進官方網站專案，但後台不是第二個網站。

- `admin/apps-script/Code.gs`：貼到 Google Apps Script。
- `admin/apps-script/appsscript.json`：Apps Script 權限設定。
- `admin/apps-script/AdminSidebar.html`：試算表側邊欄說明。
- Google 試算表：實際資料庫。

## 權限

`appsscript.json` 採用：

```json
"https://www.googleapis.com/auth/spreadsheets.currentonly"
```

代表 Apps Script 只操作目前這一份試算表，不要求管理所有試算表。

## 預設建立的工作表

- 網站設定
- 首頁內容
- 最新消息
- 作品庫
- 作品分類
- 線上藝廊
- 展覽經歷
- 歷史回顧
- 書籍出版
- 頁面內容
- 聯絡表單設定
- 表單回覆

## 主要管理位置

### 作品庫

用於所有作品資料、首頁輪播、精選作品、作品集。

重要欄位：

- `titleZh`：中文作品名
- `titleEn`：英文作品名
- `categoryZh`：中文分類
- `categoryEn`：英文分類
- `year`：年份
- `size`：尺寸
- `medium`：材質
- `image`：展示圖網址
- `thumbnail`：縮圖網址
- `isHero`：是否可被首頁輪播抽到
- `isFeatured`：是否可被精選作品抽到
- `public`：是否公開
- `isSold`：是否已售出

### 首頁內容

控制首頁大標、按鈕、線上展、語錄、粉專區塊。

### 最新消息

控制首頁公告區。

### 頁面內容

控制關於秀英、藝廊、作品集、展覽經歷、歷史回顧、聯絡等頁面的文字區塊。

## 表單安全

`聯絡表單設定` 裡的 `enableContactPost` 預設為 `FALSE`。
正式要讓網站送出表單到 Google Sheet 時，再改成 `TRUE`。
