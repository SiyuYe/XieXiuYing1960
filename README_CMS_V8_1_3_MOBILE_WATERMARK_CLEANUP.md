# CMS V8.1.3｜手機版預設浮水印清除

- 移除 app.js、src/app.source.js、index.html 內殘留的 data-watermark 屬性。
- style.css 加入桌機與手機共用的最終保護規則，禁止 protected-image 的 ::before / ::after 產生浮水印。
- 全站 style.css 與 app.js 版本參數更新為 v=8130，強制手機瀏覽器重新下載。
- 保留圖片本身已嵌入的正式浮水印。
