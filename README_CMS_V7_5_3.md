# CMS V7.5.3

- 首頁老師照片與右側作品輪播等高。
- 頂部品牌改為「謝秀英書畫藝術館 / XIE XIU-YING ART MUSEUM」。
- 照片右下資訊卡改為 75% 透明玻璃卡，顯示謝秀英 / Xie Xiu-Ying、理念與按鈕。
- 老師照片固定從 yingphoto/photos.json 讀取，不再呼叫 GitHub API。
- 修正 photos.json 副檔名。
- 老師照片加入骨架與淡入動畫。
- Facebook 改為進入視窗附近時才建立 iframe。
- 首頁下方區塊使用 content-visibility，降低首屏渲染負擔。
- Service Worker 快取版本更新。
