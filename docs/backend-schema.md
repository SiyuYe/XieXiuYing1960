# 謝秀英藝術館｜Google 後台資料表規劃 v6

## 目標架構

- GitHub Pages：放 PWA 官網程式。
- Google Drive：放作品展示圖、原圖備份、畫冊與附件。
- Google 試算表：當作品與網站內容管理後台。
- Google Apps Script：把試算表轉成官網可讀的 JSON API。

## 主要工作表

### SiteConfig
| key | value |
|---|---|
| brandZh | 謝秀英 |
| brandEn | Hsieh Hsiu-Ying |
| brandMark | 秀 |
| siteName | 謝秀英書畫藝術館 |
| facebookUrl | https://www.facebook.com/XieXiuYing1960/ |
| primaryColor | #6bc2ba |
| contactReasons | ["作品收藏洽詢","展覽邀約","課程／教學","媒體採訪","其他合作"] |

### Home
| key | value |
|---|---|
| heroEyebrow | Hsieh Hsiu-Ying Art Museum |
| heroTitle | 謝秀英\n書畫藝術館 |
| heroSubtitle | 以書畫來美化這個世界，以書畫來安慰人的心靈。 |
| showTitle | 本期線上展｜墨韻・心香 |
| showPeriod | 展期：2026/07/01—2026/09/30 |
| quoteText | 一花一草皆佛性，昆蟲飛鳥皆如來。 |

### Announcements
| date | title | text | public |
|---|---|---|---|
| 2026 | 線上藝術館骨架建置 | 作品資料陸續整理中 | TRUE |

### Artworks
| id | titleZh | titleEn | categoryZh | categoryEn | size | medium | year | image | public | featured | hero | sold | exhibitionId | note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A0001 | 花鳥清韻 | Floral Birds in Grace | 花鳥 | Bird-and-Flower | 68×136 cm | 水墨設色 | 2026 | https://... | TRUE | TRUE | TRUE | FALSE | EX2026A | 低解析展示圖 |

### Pages
| pageId | eyebrow | pageTitle | subtitle | sectionTitle | body |
|---|---|---|---|---|---|
| about | About | 關於秀英 | 謝秀英，字馥宇，號無心居士。 | 創作理念 | 以書畫來美化這個世界... |

### Exhibitions
| id | title | period | location | type | description | public |
|---|---|---|---|---|---|---|
| EX2026A | 墨韻・心香 | 2026/07/01—2026/09/30 | 線上藝廊 | 線上展 | 本期主題展 | TRUE |

### History
| title | type | year | url | description | public |
|---|---|---|---|---|---|
| 39本戶口名簿 | 自傳 | 2023 | https://... | 畫家自傳與人生經歷 | TRUE |

### Contacts
由 Apps Script 自動建立，用來收表單。

## 官網切換到 Apps Script 後台

1. 部署 Apps Script 為 Web App。
2. 複製 Web App URL。
3. 修改 `data/site-config.json`：

```json
{
  "backendMode": "appsScript",
  "appsScriptApiUrl": "你的 Apps Script Web App URL"
}
```

正式使用時仍建議只上傳低解析、已加浮水印的展示圖。
