/**
 * 謝秀英書畫藝術館｜CMS API v2.0
 * 目標：Google 試算表當資料庫，Google Drive 當作品圖庫，GitHub Pages 前台讀 API。
 *
 * 安全設計：
 * - 試算表資料只由試算表擁有者/編輯者修改。
 * - Web App 對外公開只輸出 isPublic=TRUE 的資料。
 * - Apps Script 權限請搭配 appsscript.json，只允許目前試算表 + Drive 讀取。
 *
 * 部署：
 * - 執行身分：我
 * - 誰可以存取：任何人
 */

const CMS = {
  timezone: 'Asia/Taipei',
  version: '2.0.0',
  randomHeroLimit: 5,
  randomFeaturedLimit: 8,
  thumbSize: 480,
  displaySize: 1400,
  sheets: {
    settings: '網站設定',
    home: '首頁內容',
    announcements: '最新消息',
    artworks: '作品庫',
    categories: '作品分類',
    gallery: '線上藝廊',
    exhibitions: '展覽經歷',
    history: '歷史回顧',
    books: '書籍出版',
    contacts: '聯絡表單設定',
    contactResponses: '表單回覆',
    pages: '頁面內容',
    apiLog: 'API紀錄'
  }
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('謝秀英藝術館後台')
    .addItem('開啟 CMS 管理面板', 'openCmsAdmin')
    .addSeparator()
    .addItem('① 初始化/更新後台資料庫', 'initMuseumCms')
    .addItem('② 從 Google Drive 同步作品清單', 'syncDriveArtworks')
    .addItem('③ 重新套用表格格式', 'formatMuseumCms')
    .addSeparator()
    .addItem('API 測試：查看完整資料包', 'showApiPreview')
    .addItem('API 測試：查看作品隨機抽選', 'showRandomPreview')
    .addToUi();
}

function openCmsAdmin() {
  const html = HtmlService.createHtmlOutputFromFile('AdminSidebar')
    .setTitle('謝秀英藝術館 CMS')
    .setWidth(420);
  SpreadsheetApp.getUi().showSidebar(html);
}

function initMuseumCms() {
  const ss = SpreadsheetApp.getActive();
  createSettingsSheet_(ss);
  createHomeSheet_(ss);
  createAnnouncementsSheet_(ss);
  createArtworksSheet_(ss);
  createCategoriesSheet_(ss);
  createGallerySheet_(ss);
  createExhibitionsSheet_(ss);
  createHistorySheet_(ss);
  createBooksSheet_(ss);
  createContactSettingsSheet_(ss);
  createContactResponsesSheet_(ss);
  createPagesSheet_(ss);
  createApiLogSheet_(ss);
  formatMuseumCms();
  SpreadsheetApp.getUi().alert('完成：後台資料庫已建立/更新。');
}

function formatMuseumCms() {
  const ss = SpreadsheetApp.getActive();
  Object.values(CMS.sheets).forEach(name => {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    sh.setFrozenRows(1);
    const lastCol = Math.max(sh.getLastColumn(), 1);
    sh.getRange(1, 1, 1, lastCol)
      .setBackground('#6bc2ba')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setVerticalAlignment('middle');
    sh.autoResizeColumns(1, lastCol);
    sh.getDataRange().setWrap(true).setVerticalAlignment('top');
  });
}

/**
 * Web API：
 * ?action=siteBundle  完整網站資料
 * ?action=settings    網站設定
 * ?action=home        首頁內容
 * ?action=artworks    公開作品
 * ?action=randomHome  首頁輪播/精選隨機抽選，不重複
 * ?action=news        最新消息
 * ?action=pages       頁面內容
 * ?action=ping        測試 API
 */
function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = String(params.action || 'siteBundle').trim();
  let payload;

  try {
    if (action === 'ping') payload = { ok: true, version: CMS.version, time: isoNow_() };
    else if (action === 'siteBundle') payload = getSiteBundle_();
    else if (action === 'settings') payload = { ok: true, settings: getSettings_() };
    else if (action === 'home') payload = { ok: true, home: getHome_() };
    else if (action === 'artworks') payload = { ok: true, artworks: getPublicArtworks_() };
    else if (action === 'randomHome') payload = { ok: true, randomHome: getRandomHomeArtworks_() };
    else if (action === 'news') payload = { ok: true, announcements: getPublicRows_(CMS.sheets.announcements) };
    else if (action === 'pages') payload = { ok: true, pages: getPages_() };
    else payload = { ok: false, error: 'Unknown action: ' + action };
  } catch (err) {
    payload = { ok: false, error: String(err && err.message ? err.message : err) };
  }

  return json_(payload);
}

/**
 * 聯絡表單 API。
 * 第一版先收資料；正式公開前可再加 Turnstile/reCAPTCHA 或一次性 token。
 */
function doPost(e) {
  let body = {};
  try {
    body = JSON.parse(e && e.postData && e.postData.contents ? e.postData.contents : '{}');
  } catch (err) {
    return json_({ ok: false, error: 'JSON 格式錯誤' });
  }

  try {
    if (body.action === 'contact') return json_(saveContactResponse_(body.data || {}));
    if (body.action === 'adminValidateToken') return json_(adminValidateToken_(body.token));
    if (body.action === 'adminUpdateArtwork') return json_(adminApiUpdateArtwork_(body.token, body.data || {}));
    if (body.action === 'adminBatchUpdateArtworks') return json_(adminApiBatchUpdateArtworks_(body.token, body.data || {}));
    return json_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function getSiteBundle_() {
  return {
    ok: true,
    version: CMS.version,
    updatedAt: isoNow_(),
    settings: getSettings_(),
    home: getHome_(),
    announcements: getPublicRows_(CMS.sheets.announcements),
    artworks: getPublicArtworks_(),
    categories: getPublicRows_(CMS.sheets.categories),
    gallery: getPublicRows_(CMS.sheets.gallery),
    exhibitions: getPublicRows_(CMS.sheets.exhibitions),
    history: getPublicRows_(CMS.sheets.history),
    books: getPublicRows_(CMS.sheets.books),
    contact: getContactSettings_(),
    pages: getPages_(),
    randomHome: getRandomHomeArtworks_()
  };
}

function getSettings_() {
  const kv = readKeyValue_(CMS.sheets.settings);
  return {
    siteName: kv.siteName || '謝秀英書畫藝術館',
    artistNameZh: kv.artistNameZh || '謝秀英',
    artistNameEn: kv.artistNameEn || 'Hsieh Hsiu-Ying',
    artistMark: kv.artistMark || '秀',
    primaryColor: kv.primaryColor || '#6bc2ba',
    facebookUrl: kv.facebookUrl || 'https://www.facebook.com/XieXiuYing1960/',
    driveFolderUrl: kv.driveFolderUrl || '',
    driveFolderId: kv.driveFolderId || extractDriveId_(kv.driveFolderUrl || ''),
    copyrightText: kv.copyrightText || '本網站作品圖片著作權歸謝秀英所有，未經授權不得下載、轉載、商用或 AI 訓練。',
    nav: safeJson_(kv.nav, defaultNav_()),
    homeQuickNav: safeJson_(kv.homeQuickNav, defaultQuickNav_()),
    contactReasons: safeJson_(kv.contactReasons, ['作品收藏洽詢', '展覽邀約', '課程／教學', '媒體採訪', '其他合作'])
  };
}

function getHome_() {
  const kv = readKeyValue_(CMS.sheets.home);
  return {
    heroEyebrow: kv.heroEyebrow || 'HSIEH HSIU-YING ART MUSEUM',
    heroTitle: kv.heroTitle || '謝秀英\n書畫藝術館',
    heroSubtitle: kv.heroSubtitle || '以書畫來美化這個世界，以書畫來安慰人的心靈。',
    heroPrimaryLabel: kv.heroPrimaryLabel || '進入線上藝廊',
    heroPrimaryHref: kv.heroPrimaryHref || 'gallery.html',
    heroSecondaryLabel: kv.heroSecondaryLabel || 'Facebook 粉專',
    heroSecondaryHref: kv.heroSecondaryHref || 'https://www.facebook.com/XieXiuYing1960/',
    quoteText: kv.quoteText || '一花一草皆佛性，昆蟲飛鳥皆如來。',
    quoteAuthor: kv.quoteAuthor || '謝秀英　無心居士合十',
    facebookTitle: kv.facebookTitle || '粉專最新消息',
    facebookText: kv.facebookText || '正式上線後可嵌入 Facebook Page Plugin，讓最新貼文在官網中呈現。',
    facebookEmbedEnabled: bool_(kv.facebookEmbedEnabled, false),
    facebookHeight: Number(kv.facebookHeight || 760)
  };
}

function getPublicArtworks_() {
  return getPublicRows_(CMS.sheets.artworks).map(row => {
    row.isHomeHero = bool_(row.isHomeHero, false);
    row.isFeatured = bool_(row.isFeatured, false);
    row.isSold = bool_(row.isSold, false);
    row.isPublic = bool_(row.isPublic, true);
    if (!row.imageUrl && row.driveFileId) row.imageUrl = driveImageUrl_(row.driveFileId, CMS.displaySize);
    if (!row.thumbUrl && row.driveFileId) row.thumbUrl = driveImageUrl_(row.driveFileId, CMS.thumbSize);
    return row;
  });
}

function getRandomHomeArtworks_() {
  const all = getPublicArtworks_();
  const heroPool = shuffle_(all.filter(a => a.isHomeHero));
  const hero = heroPool.slice(0, CMS.randomHeroLimit);
  const heroIds = new Set(hero.map(a => String(a.id)));
  const featuredPool = shuffle_(all.filter(a => a.isFeatured && !heroIds.has(String(a.id))));
  const featured = featuredPool.slice(0, CMS.randomFeaturedLimit);
  return { hero, featured };
}

function getContactSettings_() {
  const kv = readKeyValue_(CMS.sheets.contacts);
  return {
    requireLogin: bool_(kv.requireLogin, true),
    allowedLoginProviders: safeJson_(kv.allowedLoginProviders, ['Google', 'LINE']),
    title: kv.title || '聯絡與洽詢',
    description: kv.description || '請留下需求與聯絡方式，將由專人主動回覆。',
    note: kv.note || '正式版可串接 Google 登入或 LINE Login 後再開放填寫。'
  };
}

function getPages_() {
  const rows = getPublicRows_(CMS.sheets.pages);
  const pages = {};
  rows.forEach(r => {
    const pageId = r.pageId;
    if (!pageId) return;
    if (!pages[pageId]) pages[pageId] = { pageId, eyebrow: r.eyebrow || '', title: r.pageTitle || '', subtitle: r.subtitle || '', sections: [] };
    pages[pageId].sections.push({ title: r.sectionTitle || '', body: r.body || '', sort: Number(r.sort || 0) });
  });
  Object.keys(pages).forEach(id => pages[id].sections.sort((a, b) => a.sort - b.sort));
  return pages;
}

function saveContactResponse_(data) {
  const sh = getOrCreateSheet_(SpreadsheetApp.getActive(), CMS.sheets.contactResponses, [
    'createdAt', 'status', 'loginProvider', 'loginUserId', 'name', 'phone', 'email', 'lineId', 'reason', 'subject', 'message', 'preferredContactTime', 'artworkId', 'sourcePage', 'userAgent'
  ]);
  sh.appendRow([
    new Date(), '未處理', data.loginProvider || '', data.loginUserId || '', data.name || '', data.phone || '', data.email || '', data.lineId || '', data.reason || '', data.subject || '', data.message || '', data.preferredContactTime || '', data.artworkId || '', data.sourcePage || '', data.userAgent || ''
  ]);
  return { ok: true, message: '已收到表單資料' };
}

/**
 * 從「網站設定」的 driveFolderUrl/driveFolderId 掃描圖片，寫入作品庫。
 * - 會遞迴掃描子資料夾。
 * - 已存在 driveFileId 的作品不重複新增。
 * - imageUrl / thumbUrl 使用 Google Drive thumbnail endpoint。
 * - 不會修改既有作品資料。
 */
function syncDriveArtworks() {
  const ss = SpreadsheetApp.getActive();
  const settings = getSettings_();
  const folderId = settings.driveFolderId || extractDriveId_(settings.driveFolderUrl || '');
  if (!folderId) throw new Error('請先在「網站設定」填入 driveFolderUrl 或 driveFolderId。');

  const sh = getOrCreateSheet_(ss, CMS.sheets.artworks, artworkHeaders_());
  ensureHeaders_(sh, artworkHeaders_());
  const existingRows = readTable_(CMS.sheets.artworks);
  const existingFileIds = new Set(existingRows.map(r => String(r.driveFileId || '')).filter(Boolean));

  const folder = DriveApp.getFolderById(folderId);
  const files = [];
  collectImageFiles_(folder, '', files);

  const newRows = [];
  files.forEach(item => {
    const file = item.file;
    const id = file.getId();
    if (existingFileIds.has(id)) return;
    const fileName = file.getName();
    const title = cleanFileName_(fileName);
    const category = item.path ? item.path.split('/')[0] : '';
    newRows.push([
      buildArtworkId_(id), title, '', category, '', '', '', '', '', '',
      driveImageUrl_(id, CMS.displaySize), driveImageUrl_(id, CMS.thumbSize), id,
      'FALSE', 'TRUE', 'TRUE', 'FALSE', '洽詢', '', Number(sh.getLastRow() + newRows.length), isoDate_(), isoDate_(), fileName, item.path
    ]);
  });

  if (newRows.length) {
    sh.getRange(sh.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }
  formatMuseumCms();
  SpreadsheetApp.getUi().alert('同步完成：新增 ' + newRows.length + ' 件作品。');
}

function collectImageFiles_(folder, path, out) {
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const mime = file.getMimeType();
    if (mime && mime.indexOf('image/') === 0) out.push({ file, path });
  }
  const folders = folder.getFolders();
  while (folders.hasNext()) {
    const sub = folders.next();
    collectImageFiles_(sub, path ? path + '/' + sub.getName() : sub.getName(), out);
  }
}

function showApiPreview() {
  SpreadsheetApp.getUi().alert(JSON.stringify(getSiteBundle_(), null, 2).slice(0, 9000));
}

function showRandomPreview() {
  SpreadsheetApp.getUi().alert(JSON.stringify(getRandomHomeArtworks_(), null, 2).slice(0, 9000));
}

function createSettingsSheet_(ss) {
  const rows = [
    ['key', 'value', 'note'],
    ['siteName', '謝秀英書畫藝術館', '網站名稱'],
    ['artistNameZh', '謝秀英', '中文名'],
    ['artistNameEn', 'Hsieh Hsiu-Ying', '英文名'],
    ['artistMark', '秀', 'LOGO 文字'],
    ['primaryColor', '#6bc2ba', '主題色'],
    ['facebookUrl', 'https://www.facebook.com/XieXiuYing1960/', 'Facebook 粉專'],
    ['driveFolderUrl', 'https://drive.google.com/drive/folders/1dOln1soIngAS4ovEMA9S1HhL39o8HYyq', '作品雲端資料夾 URL'],
    ['driveFolderId', '1dOln1soIngAS4ovEMA9S1HhL39o8HYyq', '作品雲端資料夾 ID'],
    ['copyrightText', '本網站作品圖片著作權歸謝秀英所有，未經授權不得下載、轉載、商用或 AI 訓練。', '版權文字'],
    ['nav', JSON.stringify(defaultNav_()), '網站上方導覽 JSON'],
    ['homeQuickNav', JSON.stringify(defaultQuickNav_()), 'Home 左側藝術導覽 JSON'],
    ['contactReasons', JSON.stringify(['作品收藏洽詢', '展覽邀約', '課程／教學', '媒體採訪', '其他合作']), '聯絡原因選項 JSON']
  ];
  upsertSheetKeepData_(ss, CMS.sheets.settings, rows);
}

function createHomeSheet_(ss) {
  const rows = [
    ['key', 'value', 'note'],
    ['heroEyebrow', 'HSIEH HSIU-YING ART MUSEUM', '首頁小標'],
    ['heroTitle', '謝秀英\n書畫藝術館', '首頁標題，換行用 \\n'],
    ['heroSubtitle', '以書畫來美化這個世界，以書畫來安慰人的心靈。', '首頁副標'],
    ['heroPrimaryLabel', '進入線上藝廊', '主按鈕文字'],
    ['heroPrimaryHref', 'gallery.html', '主按鈕連結'],
    ['heroSecondaryLabel', 'Facebook 粉專', '副按鈕文字'],
    ['heroSecondaryHref', 'https://www.facebook.com/XieXiuYing1960/', '副按鈕連結'],
    ['quoteText', '一花一草皆佛性，昆蟲飛鳥皆如來。', '畫家語錄'],
    ['quoteAuthor', '謝秀英　無心居士合十', '語錄署名'],
    ['facebookTitle', '粉專最新消息', 'FB 區塊標題'],
    ['facebookText', '正式上線後可嵌入 Facebook Page Plugin，讓最新貼文在官網中呈現。', 'FB 區塊說明'],
    ['facebookEmbedEnabled', 'FALSE', '是否啟用嵌入'],
    ['facebookHeight', '760', 'FB 區塊高度']
  ];
  upsertSheetKeepData_(ss, CMS.sheets.home, rows);
}

function createAnnouncementsSheet_(ss) {
  upsertTableKeepData_(ss, CMS.sheets.announcements, ['id', 'title', 'date', 'type', 'summary', 'linkText', 'linkUrl', 'isPinned', 'isPublic', 'sort'], [
    ['N001', '官網建置中', '2026-07-09', '公告', '謝秀英書畫藝術館 PWA 官網初版建置中，內容將持續補齊。', '前往粉專', 'https://www.facebook.com/XieXiuYing1960/', 'TRUE', 'TRUE', 1]
  ]);
}

function createArtworksSheet_(ss) {
  upsertTableKeepData_(ss, CMS.sheets.artworks, artworkHeaders_(), [
    ['A001', '花鳥清音', 'Pure Songs of Flowers and Birds', '花鳥', '', '2023', '68×136 cm', '彩墨紙本', 'Ink and color on paper', '範例資料，可替換為正式作品。', 'assets/images/art-placeholder-1.svg', 'assets/images/art-placeholder-1.svg', '', 'TRUE', 'TRUE', 'TRUE', 'FALSE', '洽詢', '線上藝廊', 1, '2026-07-09', '2026-07-09', '', ''],
    ['A002', '莫爾海姆', 'Morheim', '彩墨', '', '2024', '68×136 cm', '彩墨紙本', 'Color Ink', '範例資料，可替換為正式作品。', 'assets/images/art-placeholder-2.svg', 'assets/images/art-placeholder-2.svg', '', 'TRUE', 'TRUE', 'TRUE', 'FALSE', '洽詢', '線上藝廊', 2, '2026-07-09', '2026-07-09', '', '']
  ]);
}

function createCategoriesSheet_(ss) {
  upsertTableKeepData_(ss, CMS.sheets.categories, ['id', 'nameZh', 'nameEn', 'description', 'isPublic', 'sort'], [
    ['flower-bird', '花鳥', 'Flowers and Birds', '花鳥題材作品', 'TRUE', 1],
    ['landscape', '山水', 'Landscape', '山水題材作品', 'TRUE', 2],
    ['buddhist', '佛畫', 'Buddhist Painting', '佛像與宗教題材作品', 'TRUE', 3],
    ['calligraphy', '書法', 'Calligraphy', '書法作品', 'TRUE', 4]
  ]);
}

function createGallerySheet_(ss) {
  upsertTableKeepData_(ss, CMS.sheets.gallery, ['id', 'title', 'subtitle', 'period', 'description', 'coverArtworkId', 'isCurrent', 'isPublic', 'sort'], [
    ['G001', '墨韻・心香', '本期線上展', '2026/07/09 - 2026/12/31', '以花鳥、山水與佛畫作品呈現謝秀英老師的書畫世界。', 'A001', 'TRUE', 'TRUE', 1]
  ]);
}

function createExhibitionsSheet_(ss) {
  upsertTableKeepData_(ss, CMS.sheets.exhibitions, ['id', 'year', 'date', 'title', 'location', 'type', 'description', 'isPublic', 'sort'], [
    ['E1991', '1991', '', '台北縣瀚霖藝苑個展', '台北縣瀚霖藝苑', '個展', '', 'TRUE', 1],
    ['E2017', '2017', '', '新竹縣優秀藝術家薪傳展', '新竹縣政府文化局', '個展', '', 'TRUE', 2]
  ]);
}

function createHistorySheet_(ss) {
  upsertTableKeepData_(ss, CMS.sheets.history, ['id', 'year', 'title', 'type', 'summary', 'url', 'isPublic', 'sort'], [
    ['H001', '2026', '39本戶口名簿（自傳）', '書籍', '畫家自傳真實經歷，城邦集團全省書局發行。', 'https://docs.google.com/document/d/1P0uF1PHw1vNaXtnU4a5ST02XXMQQPa64/edit', 'TRUE', 1]
  ]);
}

function createBooksSheet_(ss) {
  upsertTableKeepData_(ss, CMS.sheets.books, ['id', 'title', 'subtitle', 'year', 'publisher', 'description', 'coverUrl', 'linkUrl', 'isPublic', 'sort'], [
    ['B001', '39本戶口名簿', '謝秀英自傳', '', '城邦集團', '內容為畫家的自傳真實經歷。', '', 'https://docs.google.com/document/d/1P0uF1PHw1vNaXtnU4a5ST02XXMQQPa64/edit', 'TRUE', 1],
    ['B002', '謝秀英作品集', '書畫冊 5 集', '', '', '謝秀英老師書畫作品集。', '', '', 'TRUE', 2]
  ]);
}

function createContactSettingsSheet_(ss) {
  const rows = [
    ['key', 'value', 'note'],
    ['requireLogin', 'TRUE', '正式版 TRUE：需 Google 或 LINE 登入後填寫'],
    ['allowedLoginProviders', JSON.stringify(['Google', 'LINE']), '允許登入方式'],
    ['title', '聯絡與洽詢', '聯絡頁標題'],
    ['description', '請留下需求與聯絡方式，將由專人主動回覆。', '聯絡頁說明'],
    ['note', '正式版可串接 Google 登入或 LINE Login 後再開放填寫。', '提示文字']
  ];
  upsertSheetKeepData_(ss, CMS.sheets.contacts, rows);
}

function createContactResponsesSheet_(ss) {
  upsertTableKeepData_(ss, CMS.sheets.contactResponses, ['createdAt', 'status', 'loginProvider', 'loginUserId', 'name', 'phone', 'email', 'lineId', 'reason', 'subject', 'message', 'preferredContactTime', 'artworkId', 'sourcePage', 'userAgent'], []);
}

function createPagesSheet_(ss) {
  upsertTableKeepData_(ss, CMS.sheets.pages, ['pageId', 'eyebrow', 'pageTitle', 'subtitle', 'sectionTitle', 'body', 'isPublic', 'sort'], [
    ['about', 'About Artist', '關於秀英', '謝秀英，字馥宇，號無心居士。', '創作理念', '以書畫來美化這個世界，以書畫來滋長塵世藝緣，以書畫來安慰人的心靈。', 'TRUE', 1],
    ['about', 'About Artist', '關於秀英', '謝秀英，字馥宇，號無心居士。', '簡歷', '國立台灣藝術大學書畫藝術學系。新竹縣政府文化局研習班國畫指導老師，中華民國心齋藝術學會創會理事長。', 'TRUE', 2],
    ['works', 'Collections', '作品集', '所有作品分類總覽。', '作品資料管理', '作品資料由 Google 試算表作品庫維護，包含中英文名稱、尺寸、材質、年份與分類。', 'TRUE', 1],
    ['contact', 'Contact', '聯絡', '歡迎留下收藏、展覽、教學或合作需求。', '聯絡方式', '請透過表單留下資訊，將由專人主動聯繫。', 'TRUE', 1]
  ]);
}

function createApiLogSheet_(ss) {
  upsertTableKeepData_(ss, CMS.sheets.apiLog, ['createdAt', 'type', 'message'], []);
}

function artworkHeaders_() {
  return ['id', 'titleZh', 'titleEn', 'category', 'subCategory', 'year', 'size', 'material', 'medium', 'description', 'imageUrl', 'thumbUrl', 'driveFileId', 'isHomeHero', 'isFeatured', 'isPublic', 'isSold', 'priceNote', 'exhibition', 'sort', 'createdAt', 'updatedAt', 'originalFileName', 'drivePath'];
}

function defaultNav_() {
  return [
    { id: 'home', label: '🏠 Home', href: 'index.html' },
    { id: 'about', label: '關於秀英', href: 'about.html' },
    { id: 'gallery', label: '藝廊', href: 'gallery.html' },
    { id: 'works', label: '作品集', href: 'works.html' },
    { id: 'exhibitions', label: '展覽經歷', href: 'exhibitions.html' },
    { id: 'history', label: '歷史回顧', href: 'history.html' },
    { id: 'contact', label: '聯絡', href: 'contact.html' }
  ];
}

function defaultQuickNav_() {
  return [
    { id: 'hero', label: '藝術焦點' },
    { id: 'news', label: '最新消息' },
    { id: 'online-show', label: '線上藝廊' },
    { id: 'featured', label: '精選作品' },
    { id: 'quote', label: '畫家語錄' },
    { id: 'fb', label: '粉專消息' }
  ];
}

function getPublicRows_(sheetName) {
  return readTable_(sheetName)
    .filter(r => bool_(r.isPublic, true))
    .sort((a, b) => Number(a.sort || 9999) - Number(b.sort || 9999));
}

function readKeyValue_(sheetName) {
  const sh = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return {};
  const rows = sh.getDataRange().getValues().slice(1);
  const out = {};
  rows.forEach(r => {
    if (r[0] !== '') out[String(r[0]).trim()] = normalize_(r[1]);
  });
  return out;
}

function readTable_(sheetName) {
  const sh = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  return values.slice(1).filter(r => r.some(c => c !== '')).map(row => {
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = normalize_(row[i]); });
    return obj;
  });
}

function normalize_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, CMS.timezone, 'yyyy-MM-dd');
  if (typeof v === 'string') {
    const s = v.trim();
    if (s.toUpperCase() === 'TRUE') return true;
    if (s.toUpperCase() === 'FALSE') return false;
    return s;
  }
  return v;
}

function bool_(v, fallback) {
  if (v === '' || v === null || typeof v === 'undefined') return fallback;
  if (v === true || v === false) return v;
  const s = String(v).trim().toLowerCase();
  return ['true', '1', 'yes', 'y', '是', '公開', '啟用'].indexOf(s) >= 0;
}

function safeJson_(value, fallback) {
  try {
    if (!value) return fallback;
    if (typeof value !== 'string') return value;
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
}

function shuffle_(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isoNow_() {
  return Utilities.formatDate(new Date(), CMS.timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function isoDate_() {
  return Utilities.formatDate(new Date(), CMS.timezone, 'yyyy-MM-dd');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (headers && sh.getLastRow() === 0) sh.appendRow(headers);
  return sh;
}

function ensureHeaders_(sh, headers) {
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }
  const current = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(String);
  const missing = headers.filter(h => current.indexOf(h) < 0);
  if (missing.length) {
    sh.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
  }
}

function upsertTableKeepData_(ss, name, headers, sampleRows) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (sampleRows && sampleRows.length) sh.getRange(2, 1, sampleRows.length, headers.length).setValues(sampleRows);
  } else {
    ensureHeaders_(sh, headers);
  }
}

function upsertSheetKeepData_(ss, name, rows) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  } else if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  } else {
    const existing = readKeyValue_(name);
    const append = [];
    rows.slice(1).forEach(r => {
      if (!Object.prototype.hasOwnProperty.call(existing, r[0])) append.push(r);
    });
    if (append.length) sh.getRange(sh.getLastRow() + 1, 1, append.length, rows[0].length).setValues(append);
  }
}

function extractDriveId_(urlOrId) {
  const s = String(urlOrId || '').trim();
  if (!s) return '';
  let m = s.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  m = s.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  m = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s)) return s;
  return '';
}

function driveImageUrl_(fileId, size) {
  return 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(fileId) + '&sz=w' + Number(size || CMS.displaySize);
}

function cleanFileName_(fileName) {
  return String(fileName || '').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
}

function buildArtworkId_(fileId) {
  return 'D' + Utilities.base64EncodeWebSafe(String(fileId)).replace(/=+$/, '').slice(0, 10);
}

/* =========================================================
 * CMS Admin v3：試算表內管理面板
 * ---------------------------------------------------------
 * 這些函式只會由 Google 試算表側邊欄 google.script.run 呼叫，
 * 不走公開 Web App API，因此不提供外部使用者直接改資料。
 * ========================================================= */

const CMS_ADMIN = {
  editable: {
    artworks: { sheet: '作品庫', key: 'id' },
    announcements: { sheet: '最新消息', key: 'id' },
    categories: { sheet: '作品分類', key: 'id' },
    gallery: { sheet: '線上藝廊', key: 'id' },
    exhibitions: { sheet: '展覽經歷', key: 'id' },
    history: { sheet: '歷史回顧', key: 'id' },
    books: { sheet: '書籍出版', key: 'id' },
    pages: { sheet: '頁面內容', key: 'pageId' }
  }
};

function adminGetDashboard() {
  const settings = getSettings_();
  const artworks = readTable_(CMS.sheets.artworks);
  const publicArtworks = artworks.filter(r => bool_(r.isPublic, true));
  const hero = publicArtworks.filter(r => bool_(r.isHomeHero, false)).length;
  const featured = publicArtworks.filter(r => bool_(r.isFeatured, false)).length;
  const responses = readTable_(CMS.sheets.contactResponses);
  const unread = responses.filter(r => String(r.status || '') !== '已處理').length;
  return {
    ok: true,
    version: CMS.version + '-admin-v3',
    siteName: settings.siteName,
    artistNameZh: settings.artistNameZh,
    counts: {
      artworks: artworks.length,
      publicArtworks: publicArtworks.length,
      hero,
      featured,
      announcements: readTable_(CMS.sheets.announcements).length,
      contactResponses: responses.length,
      unreadContacts: unread
    },
    apiPreview: ScriptApp.getService().getUrl() || '尚未部署 Web App'
  };
}

function adminList(entity) {
  const meta = CMS_ADMIN.editable[entity];
  if (!meta) throw new Error('未知管理項目：' + entity);
  const sheetName = meta.sheet;
  const rows = readTable_(sheetName);
  return { ok: true, entity, sheetName, rows };
}

function adminGetSettings() {
  return { ok: true, settings: getSettings_(), home: getHome_(), contact: getContactSettings_() };
}

function adminSaveKeyValue(sheetKey, data) {
  const map = { settings: CMS.sheets.settings, home: CMS.sheets.home, contacts: CMS.sheets.contacts };
  const sheetName = map[sheetKey];
  if (!sheetName) throw new Error('未知設定表：' + sheetKey);
  const sh = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sh) throw new Error('找不到表：' + sheetName);
  const values = sh.getDataRange().getValues();
  const keyToRow = {};
  for (let i = 1; i < values.length; i++) keyToRow[String(values[i][0]).trim()] = i + 1;
  Object.keys(data || {}).forEach(key => {
    const row = keyToRow[key];
    const value = data[key];
    if (row) sh.getRange(row, 2).setValue(typeof value === 'object' ? JSON.stringify(value) : value);
    else sh.appendRow([key, typeof value === 'object' ? JSON.stringify(value) : value, '由 CMS 面板新增']);
  });
  formatMuseumCms();
  return { ok: true, message: '設定已儲存' };
}

function adminSaveRecord(entity, record) {
  const meta = CMS_ADMIN.editable[entity];
  if (!meta) throw new Error('未知管理項目：' + entity);
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(meta.sheet);
  if (!sh) throw new Error('找不到表：' + meta.sheet);
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  const keyCol = headers.indexOf(meta.key);
  if (keyCol < 0) throw new Error('找不到主鍵欄位：' + meta.key);

  let id = String(record[meta.key] || '').trim();
  if (!id) {
    id = buildAdminId_(entity);
    record[meta.key] = id;
  }
  if (headers.indexOf('updatedAt') >= 0) record.updatedAt = isoDate_();
  if (headers.indexOf('createdAt') >= 0 && !record.createdAt) record.createdAt = isoDate_();

  let targetRow = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][keyCol]).trim() === id) {
      targetRow = i + 1;
      break;
    }
  }
  const rowValues = headers.map(h => normalizeForWrite_(record[h]));
  if (targetRow > 0) sh.getRange(targetRow, 1, 1, headers.length).setValues([rowValues]);
  else sh.getRange(sh.getLastRow() + 1, 1, 1, headers.length).setValues([rowValues]);
  formatMuseumCms();
  return { ok: true, id, message: '已儲存' };
}

function adminSoftDeleteRecord(entity, id) {
  const meta = CMS_ADMIN.editable[entity];
  if (!meta) throw new Error('未知管理項目：' + entity);
  const sh = SpreadsheetApp.getActive().getSheetByName(meta.sheet);
  if (!sh) throw new Error('找不到表：' + meta.sheet);
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  const keyCol = headers.indexOf(meta.key);
  const publicCol = headers.indexOf('isPublic');
  if (keyCol < 0 || publicCol < 0) throw new Error('此表不支援下架');
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][keyCol]).trim() === String(id).trim()) {
      sh.getRange(i + 1, publicCol + 1).setValue('FALSE');
      return { ok: true, message: '已下架' };
    }
  }
  return { ok: false, error: '找不到資料' };
}

function adminListContacts() {
  return { ok: true, rows: readTable_(CMS.sheets.contactResponses) };
}

function adminUpdateContactStatus(rowIndex, status) {
  const sh = SpreadsheetApp.getActive().getSheetByName(CMS.sheets.contactResponses);
  if (!sh) throw new Error('找不到表單回覆');
  const row = Number(rowIndex);
  if (!row || row < 2 || row > sh.getLastRow()) throw new Error('rowIndex 不正確');
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  const col = headers.indexOf('status') + 1;
  if (!col) throw new Error('找不到 status 欄位');
  sh.getRange(row, col).setValue(status || '已處理');
  return { ok: true };
}

function adminSyncDriveArtworks() {
  syncDriveArtworks();
  return adminGetDashboard();
}

function buildAdminId_(entity) {
  const prefix = {
    artworks: 'A', announcements: 'N', categories: 'C', gallery: 'G', exhibitions: 'E', history: 'H', books: 'B', pages: 'P'
  }[entity] || 'X';
  return prefix + Utilities.formatDate(new Date(), CMS.timezone, 'yyyyMMddHHmmss') + Math.floor(Math.random() * 1000);
}

function normalizeForWrite_(v) {
  if (v === true) return 'TRUE';
  if (v === false) return 'FALSE';
  if (v && typeof v === 'object') return JSON.stringify(v);
  return v == null ? '' : v;
}

/* =========================================================
 * CMS Admin v4：作品庫正式欄位 + 中英雙標題 + XH 作品編號
 * ---------------------------------------------------------
 * 重要：以下為 v4 覆寫區，會覆寫前方同名函式。
 * - 表格類工作表第 1 列：英文欄位名稱（程式讀取）
 * - 表格類工作表第 2 列：中文欄位名稱（人員閱讀）
 * - 第 3 列開始：資料
 * - 作品編號使用 XH0001、XH0002...，不再用 Google Drive 亂碼 ID 當主編號。
 * - 同步 Google Drive 時以 driveFileId 判斷是否已存在，不會重複新增、不會覆蓋手填資料。
 * ========================================================= */

const CMS_V4 = {
  version: '2.1.0-admin-v4',
  museumPrefix: 'XH',
  tableSheets: null,
  zhLabels: {
    id: '系統ID',
    artworkId: '作品編號',
    titleZh: '中文作品名',
    titleEn: '英文作品名',
    category: '分類',
    subCategory: '子分類',
    year: '年份',
    size: '尺寸',
    material: '材質',
    medium: '媒材／英文媒材',
    collectionStatus: '收藏狀態',
    priceNote: '價錢／洽詢備註',
    isSold: '是否售出',
    description: '作品說明',
    imageUrl: '展示圖網址',
    thumbUrl: '縮圖網址',
    driveFileId: 'Google Drive 檔案ID',
    originalFileName: '原始檔名',
    drivePath: '雲端資料夾路徑',
    isHomeHero: '首頁輪播',
    isFeatured: '精選作品',
    isPublic: '是否公開',
    exhibition: '展覽／線上展',
    sort: '排序',
    dataStatus: '資料狀態',
    seoTitle: 'SEO 標題',
    seoDescription: 'SEO 描述',
    createdAt: '建立日期',
    updatedAt: '更新日期',
    title: '標題',
    date: '日期',
    type: '類型',
    summary: '摘要',
    linkText: '連結文字',
    linkUrl: '連結網址',
    isPinned: '是否置頂',
    nameZh: '中文名稱',
    nameEn: '英文名稱',
    period: '展期',
    coverArtworkId: '封面作品編號',
    isCurrent: '本期展覽',
    location: '地點',
    url: '網址',
    subtitle: '副標題',
    publisher: '出版社',
    coverUrl: '封面網址',
    pageId: '頁面ID',
    eyebrow: '小標',
    pageTitle: '頁面標題',
    sectionTitle: '區塊標題',
    body: '內文',
    status: '處理狀態',
    loginProvider: '登入方式',
    loginUserId: '登入使用者ID',
    name: '姓名',
    phone: '電話',
    email: 'Email',
    lineId: 'LINE ID',
    reason: '聯絡原因',
    subject: '主旨',
    message: '訊息內容',
    preferredContactTime: '方便聯絡時間',
    sourcePage: '來源頁面',
    userAgent: '瀏覽器資訊',
    createdAt: '建立時間'
  }
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('謝秀英藝術館後台')
    .addItem('開啟 CMS 管理面板', 'openCmsAdmin')
    .addSeparator()
    .addItem('① 初始化/更新後台資料庫', 'initMuseumCms')
    .addItem('② 從 Google Drive 同步作品清單', 'syncDriveArtworks')
    .addItem('③ 升級作品欄位與作品編號', 'upgradeArtworkSheetV4')
    .addItem('④ 重新套用表格格式', 'formatMuseumCms')
    .addSeparator()
    .addItem('API 測試：查看完整資料包', 'showApiPreview')
    .addItem('API 測試：查看作品隨機抽選', 'showRandomPreview')
    .addToUi();
}

function initMuseumCms() {
  const ss = SpreadsheetApp.getActive();
  createSettingsSheet_(ss);
  createHomeSheet_(ss);
  createAnnouncementsSheet_(ss);
  createArtworksSheet_(ss);
  createCategoriesSheet_(ss);
  createGallerySheet_(ss);
  createExhibitionsSheet_(ss);
  createHistorySheet_(ss);
  createBooksSheet_(ss);
  createContactSettingsSheet_(ss);
  createContactResponsesSheet_(ss);
  createPagesSheet_(ss);
  createApiLogSheet_(ss);
  upgradeArtworkSheetV4(false);
  formatMuseumCms();
  SpreadsheetApp.getUi().alert('完成：CMS v4 後台資料庫已建立/更新。');
}

function formatMuseumCms() {
  const ss = SpreadsheetApp.getActive();
  Object.values(CMS.sheets).forEach(name => {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    const isTable = isTableSheet_(name);
    sh.setFrozenRows(isTable ? 2 : 1);
    const lastCol = Math.max(sh.getLastColumn(), 1);
    sh.getRange(1, 1, 1, lastCol)
      .setBackground('#6bc2ba')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setVerticalAlignment('middle');
    if (isTable && sh.getLastRow() >= 2) {
      sh.getRange(2, 1, 1, lastCol)
        .setBackground('#e9f8f6')
        .setFontColor('#2b5854')
        .setFontWeight('bold')
        .setVerticalAlignment('middle');
    }
    sh.autoResizeColumns(1, lastCol);
    sh.getDataRange().setWrap(true).setVerticalAlignment('top');
  });
}

function artworkHeaders_() {
  return [
    'id', 'artworkId', 'titleZh', 'titleEn', 'category', 'subCategory', 'year', 'size',
    'material', 'medium', 'collectionStatus', 'priceNote', 'isSold', 'description',
    'imageUrl', 'thumbUrl', 'driveFileId', 'originalFileName', 'drivePath',
    'isHomeHero', 'isFeatured', 'isPublic', 'isGallery', 'isShowcase', 'exhibition', 'sort', 'dataStatus',
    'seoTitle', 'seoDescription', 'createdAt', 'updatedAt'
  ];
}

function createArtworksSheet_(ss) {
  upsertTableKeepData_(ss, CMS.sheets.artworks, artworkHeaders_(), [
    rowFromRecord_(artworkHeaders_(), {
      id: 'XH0001', artworkId: 'XH0001', titleZh: '花鳥清音', titleEn: 'Pure Songs of Flowers and Birds',
      category: '花鳥', year: '2023', size: '68×136 cm', material: '彩墨紙本', medium: 'Ink and color on paper',
      collectionStatus: '無', priceNote: '洽詢', isSold: 'FALSE', description: '範例資料，可替換為正式作品。',
      imageUrl: 'assets/images/art-placeholder-1.svg', thumbUrl: 'assets/images/art-placeholder-1.svg',
      isHomeHero: 'TRUE', isFeatured: 'TRUE', isPublic: 'TRUE', exhibition: '線上藝廊', sort: 1,
      dataStatus: '範例', createdAt: '2026-07-09', updatedAt: '2026-07-09'
    }),
    rowFromRecord_(artworkHeaders_(), {
      id: 'XH0002', artworkId: 'XH0002', titleZh: '莫爾海姆', titleEn: 'Morheim',
      category: '彩墨', year: '2024', size: '68×136 cm', material: '彩墨紙本', medium: 'Color Ink',
      collectionStatus: '無', priceNote: '洽詢', isSold: 'FALSE', description: '範例資料，可替換為正式作品。',
      imageUrl: 'assets/images/art-placeholder-2.svg', thumbUrl: 'assets/images/art-placeholder-2.svg',
      isHomeHero: 'TRUE', isFeatured: 'TRUE', isPublic: 'TRUE', exhibition: '線上藝廊', sort: 2,
      dataStatus: '範例', createdAt: '2026-07-09', updatedAt: '2026-07-09'
    })
  ]);
}

function syncDriveArtworks() {
  const ss = SpreadsheetApp.getActive();
  const settings = getSettings_();
  const folderId = settings.driveFolderId || extractDriveId_(settings.driveFolderUrl || '');
  if (!folderId) throw new Error('請先在「網站設定」填入 driveFolderUrl 或 driveFolderId。');

  const sh = getOrCreateSheet_(ss, CMS.sheets.artworks, artworkHeaders_());
  ensureHeaders_(sh, artworkHeaders_());
  ensureChineseHeaderRow_(sh, artworkHeaders_());
  upgradeArtworkSheetV4(false);

  const existingRows = readTable_(CMS.sheets.artworks);
  const existingFileIds = new Set(existingRows.map(r => String(r.driveFileId || '')).filter(Boolean));
  let nextNo = getNextArtworkNo_(existingRows);

  const folder = DriveApp.getFolderById(folderId);
  const files = [];
  collectImageFiles_(folder, '', files);

  const headers = artworkHeaders_();
  const newRows = [];
  files.forEach(item => {
    const file = item.file;
    const driveFileId = file.getId();
    if (existingFileIds.has(driveFileId)) return;
    const fileName = file.getName();
    const cleanTitle = cleanFileName_(fileName);
    const category = item.path ? item.path.split('/')[0] : '';
    const artworkId = formatArtworkId_(nextNo++);
    const rec = {
      id: artworkId,
      artworkId,
      titleZh: cleanTitle,
      titleEn: '',
      category,
      subCategory: '',
      year: '',
      size: '',
      material: '',
      medium: '',
      collectionStatus: '無',
      priceNote: '洽詢',
      isSold: 'FALSE',
      description: '',
      imageUrl: driveImageUrl_(driveFileId, CMS.displaySize),
      thumbUrl: driveImageUrl_(driveFileId, CMS.thumbSize),
      driveFileId,
      originalFileName: fileName,
      drivePath: item.path,
      isHomeHero: 'FALSE',
      isFeatured: 'FALSE',
      isPublic: 'TRUE',
      isGallery: 'FALSE',
      isShowcase: 'FALSE',
      exhibition: '',
      sort: sh.getLastRow() + newRows.length,
      dataStatus: '待補資料',
      seoTitle: '',
      seoDescription: '',
      createdAt: isoDate_(),
      updatedAt: isoDate_()
    };
    newRows.push(rowFromRecord_(headers, rec));
  });

  if (newRows.length) {
    sh.getRange(sh.getLastRow() + 1, 1, newRows.length, headers.length).setValues(newRows);
  }
  formatMuseumCms();
  SpreadsheetApp.getUi().alert('同步完成：掃描 ' + files.length + ' 個圖片檔，新增 ' + newRows.length + ' 件作品。');
}

function upgradeArtworkSheetV4(showAlert) {
  const ss = SpreadsheetApp.getActive();
  const sh = getOrCreateSheet_(ss, CMS.sheets.artworks, artworkHeaders_());
  ensureHeaders_(sh, artworkHeaders_());
  ensureChineseHeaderRow_(sh, artworkHeaders_());

  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const rows = readTable_(CMS.sheets.artworks);
  let nextNo = getNextArtworkNo_(rows);
  const dataStart = getDataStartRow_(sh);

  const col = name => headers.indexOf(name) + 1;
  const idCol = col('id');
  const artworkIdCol = col('artworkId');
  const titleZhCol = col('titleZh');
  const collectionCol = col('collectionStatus');
  const priceCol = col('priceNote');
  const dataStatusCol = col('dataStatus');
  const updatedCol = col('updatedAt');

  for (let i = 0; i < rows.length; i++) {
    const sheetRow = dataStart + i;
    let artworkId = String(rows[i].artworkId || '').trim();
    if (!/^XH\d{4,}$/.test(artworkId)) artworkId = formatArtworkId_(nextNo++);
    if (artworkIdCol) sh.getRange(sheetRow, artworkIdCol).setValue(artworkId);
    if (idCol) sh.getRange(sheetRow, idCol).setValue(artworkId);
    if (titleZhCol && !rows[i].titleZh && rows[i].originalFileName) sh.getRange(sheetRow, titleZhCol).setValue(cleanFileName_(rows[i].originalFileName));
    if (collectionCol && !rows[i].collectionStatus) sh.getRange(sheetRow, collectionCol).setValue('無');
    if (priceCol && !rows[i].priceNote) sh.getRange(sheetRow, priceCol).setValue('洽詢');
    if (dataStatusCol && !rows[i].dataStatus) sh.getRange(sheetRow, dataStatusCol).setValue(calcArtworkDataStatus_(rows[i]));
    if (updatedCol && !rows[i].updatedAt) sh.getRange(sheetRow, updatedCol).setValue(isoDate_());
  }
  formatMuseumCms();
  if (showAlert !== false) SpreadsheetApp.getUi().alert('完成：作品庫已升級為 v4 欄位與 XH 作品編號。');
}

function getPublicArtworks_() {
  return getPublicRows_(CMS.sheets.artworks).map(row => {
    row.artworkId = row.artworkId || row.id;
    row.id = row.artworkId || row.id;
    row.isHomeHero = bool_(row.isHomeHero, false);
    row.isFeatured = bool_(row.isFeatured, false);
    row.isSold = bool_(row.isSold, false);
    row.isPublic = bool_(row.isPublic, true);
    if (!row.imageUrl && row.driveFileId) row.imageUrl = driveImageUrl_(row.driveFileId, CMS.displaySize);
    if (!row.thumbUrl && row.driveFileId) row.thumbUrl = driveImageUrl_(row.driveFileId, CMS.thumbSize);
    if (!row.dataStatus) row.dataStatus = calcArtworkDataStatus_(row);
    return row;
  });
}

function getRandomHomeArtworks_() {
  const all = getPublicArtworks_();
  const heroPool = shuffle_(all.filter(a => a.isHomeHero));
  const hero = heroPool.slice(0, CMS.randomHeroLimit);
  const heroIds = new Set(hero.map(a => String(a.artworkId || a.id)));
  const featuredPool = shuffle_(all.filter(a => a.isFeatured && !heroIds.has(String(a.artworkId || a.id))));
  const featured = featuredPool.slice(0, CMS.randomFeaturedLimit);
  return { hero, featured };
}

CMS_ADMIN.editable.artworks = { sheet: '作品庫', key: 'artworkId' };

function adminGetDashboard() {
  const settings = getSettings_();
  const artworks = readTable_(CMS.sheets.artworks);
  const publicArtworks = artworks.filter(r => bool_(r.isPublic, true));
  const hero = publicArtworks.filter(r => bool_(r.isHomeHero, false)).length;
  const featured = publicArtworks.filter(r => bool_(r.isFeatured, false)).length;
  const incomplete = publicArtworks.filter(r => String(r.dataStatus || calcArtworkDataStatus_(r)) !== '完整').length;
  const responses = readTable_(CMS.sheets.contactResponses);
  const unread = responses.filter(r => String(r.status || '') !== '已處理').length;
  return {
    ok: true,
    version: CMS_V4.version,
    siteName: settings.siteName,
    artistNameZh: settings.artistNameZh,
    counts: {
      artworks: artworks.length,
      publicArtworks: publicArtworks.length,
      incompleteArtworks: incomplete,
      hero,
      featured,
      announcements: readTable_(CMS.sheets.announcements).length,
      contactResponses: responses.length,
      unreadContacts: unread
    },
    apiPreview: ScriptApp.getService().getUrl() || '尚未部署 Web App'
  };
}

function adminList(entity) {
  const meta = CMS_ADMIN.editable[entity];
  if (!meta) throw new Error('未知管理項目：' + entity);
  const rows = readTable_(meta.sheet);
  return { ok: true, entity, sheetName: meta.sheet, rows, labels: getLabelsForHeaders_(getHeaders_(meta.sheet)) };
}

function adminSaveRecord(entity, record) {
  const meta = CMS_ADMIN.editable[entity];
  if (!meta) throw new Error('未知管理項目：' + entity);
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(meta.sheet);
  if (!sh) throw new Error('找不到表：' + meta.sheet);
  ensureChineseHeaderRow_(sh, getHeaders_(meta.sheet));
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  const keyCol = headers.indexOf(meta.key);
  if (keyCol < 0) throw new Error('找不到主鍵欄位：' + meta.key);

  let id = String(record[meta.key] || '').trim();
  if (entity === 'artworks') {
    if (!id) id = formatArtworkId_(getNextArtworkNo_(readTable_(CMS.sheets.artworks)));
    record.artworkId = id;
    record.id = id;
    record.dataStatus = calcArtworkDataStatus_(record);
  } else if (!id) {
    id = buildAdminId_(entity);
    record[meta.key] = id;
  }
  if (headers.indexOf('updatedAt') >= 0) record.updatedAt = isoDate_();
  if (headers.indexOf('createdAt') >= 0 && !record.createdAt) record.createdAt = isoDate_();

  let targetRow = -1;
  for (let i = 2; i < values.length; i++) {
    if (String(values[i][keyCol]).trim() === id) {
      targetRow = i + 1;
      break;
    }
  }
  const rowValues = headers.map(h => normalizeForWrite_(record[h]));
  if (targetRow > 0) sh.getRange(targetRow, 1, 1, headers.length).setValues([rowValues]);
  else sh.getRange(sh.getLastRow() + 1, 1, 1, headers.length).setValues([rowValues]);
  formatMuseumCms();
  return { ok: true, id, message: '已儲存' };
}

function adminSoftDeleteRecord(entity, id) {
  const meta = CMS_ADMIN.editable[entity];
  if (!meta) throw new Error('未知管理項目：' + entity);
  const sh = SpreadsheetApp.getActive().getSheetByName(meta.sheet);
  if (!sh) throw new Error('找不到表：' + meta.sheet);
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  const keyCol = headers.indexOf(meta.key);
  const publicCol = headers.indexOf('isPublic');
  if (keyCol < 0 || publicCol < 0) throw new Error('此表不支援下架');
  for (let i = 2; i < values.length; i++) {
    if (String(values[i][keyCol]).trim() === String(id).trim()) {
      sh.getRange(i + 1, publicCol + 1).setValue('FALSE');
      return { ok: true, message: '已下架' };
    }
  }
  return { ok: false, error: '找不到資料' };
}

function readTable_(sheetName) {
  const sh = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  const start = hasChineseHeaderRowValues_(values, headers) ? 2 : 1;
  return values.slice(start).filter(r => r.some(c => c !== '')).map(row => {
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = normalize_(row[i]); });
    return obj;
  });
}

function upsertTableKeepData_(ss, name, headers, sampleRows) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(2, 1, 1, headers.length).setValues([headers.map(fieldLabel_)]);
    if (sampleRows && sampleRows.length) sh.getRange(3, 1, sampleRows.length, headers.length).setValues(sampleRows);
  } else {
    ensureHeaders_(sh, headers);
    ensureChineseHeaderRow_(sh, headers);
  }
}

function ensureHeaders_(sh, headers) {
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }
  const current = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0].map(h => String(h).trim());
  const missing = headers.filter(h => current.indexOf(h) < 0);
  if (missing.length) sh.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
}

function ensureChineseHeaderRow_(sh, headers) {
  if (!isTableSheet_(sh.getName())) return;
  const currentHeaders = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), headers.length)).getValues()[0].map(h => String(h).trim());
  const labels = currentHeaders.map(fieldLabel_);
  const values = sh.getDataRange().getValues();
  if (!hasChineseHeaderRowValues_(values, currentHeaders)) sh.insertRowAfter(1);
  sh.getRange(2, 1, 1, currentHeaders.length).setValues([labels]);
}

function hasChineseHeaderRowValues_(values, headers) {
  if (!values || values.length < 2) return false;
  const row2 = values[1].map(v => String(v).trim());
  return row2[0] === fieldLabel_(headers[0]) || row2.some(v => /作品編號|中文作品名|系統ID|標題|日期/.test(v));
}

function isTableSheet_(sheetName) {
  const tableNames = [CMS.sheets.announcements, CMS.sheets.artworks, CMS.sheets.categories, CMS.sheets.gallery, CMS.sheets.exhibitions, CMS.sheets.history, CMS.sheets.books, CMS.sheets.contactResponses, CMS.sheets.pages, CMS.sheets.apiLog];
  return tableNames.indexOf(sheetName) >= 0;
}

function getDataStartRow_(sh) {
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  return hasChineseHeaderRowValues_(values, headers) ? 3 : 2;
}

function fieldLabel_(field) {
  return CMS_V4.zhLabels[field] || field;
}

function getLabelsForHeaders_(headers) {
  const out = {};
  headers.forEach(h => out[h] = fieldLabel_(h));
  return out;
}

function getHeaders_(sheetName) {
  const sh = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sh || sh.getLastRow() === 0) return [];
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim()).filter(Boolean);
}

function rowFromRecord_(headers, record) {
  return headers.map(h => normalizeForWrite_(record[h]));
}

function getNextArtworkNo_(rows) {
  let max = 0;
  (rows || []).forEach(r => {
    const s = String(r.artworkId || r.id || '').trim();
    const m = s.match(/^XH(\d+)$/i);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return max + 1;
}

function formatArtworkId_(num) {
  return CMS_V4.museumPrefix + String(num).padStart(4, '0');
}

function calcArtworkDataStatus_(r) {
  const missing = [];
  if (!r.titleZh) missing.push('中文作品名');
  if (!r.titleEn) missing.push('英文作品名');
  if (!r.category) missing.push('分類');
  if (!r.year) missing.push('年份');
  if (!r.size) missing.push('尺寸');
  if (!r.material) missing.push('材質');
  return missing.length ? '待補：' + missing.join('、') : '完整';
}

/* =========================================================
 * CMS Admin v5：多作品庫 + 藏售私密欄位 + 公開資訊過濾
 * ---------------------------------------------------------
 * - 售價/收藏者/收藏日期皆為後台欄位，前台預設不公開。
 * - priceNote 為公開顯示用，建議維持「洽詢」。
 * - 支援「作品庫管理」分頁，可新增學生作品庫、收藏品作品庫。
 * - 每個作品庫可設定自己的作品編號前綴與 Drive 資料夾 ID。
 * ========================================================= */

CMS.sheets.artworkLibraries = '作品庫管理';

const CMS_V5 = {
  version: '2.2.0-admin-v5',
  defaultLibrarySheet: '作品庫',
  defaultPrefix: 'XH',
  libraryHeaders: [
    'libraryId', 'libraryName', 'sheetName', 'authorType', 'authorName', 'prefix',
    'driveFolderId', 'driveFolderUrl', 'description', 'isActive', 'isPublic', 'sort', 'createdAt', 'updatedAt'
  ],
  extraArtworkFields: [
    'authorType', 'authorName', 'libraryId',
    'collectionPrice', 'collectionCurrency', 'collectionPriceVisibility',
    'collectionInfoVisibility', 'collectorName', 'collectionDate',
    'isForSale', 'allowInquiry', 'allowPrint'
  ],
  zhLabels: {
    libraryId: '作品庫ID',
    libraryName: '作品庫名稱',
    sheetName: '分頁名稱',
    authorType: '作者分類',
    authorName: '作者姓名',
    prefix: '作品編號前綴',
    driveFolderId: '雲端資料夾ID',
    driveFolderUrl: '雲端資料夾網址',
    collectionPrice: '收藏價（後台）',
    collectionCurrency: '幣別',
    collectionPriceVisibility: '收藏價公開狀態',
    collectionInfoVisibility: '收藏資訊公開狀態',
    collectorName: '收藏者（後台）',
    collectionDate: '收藏日期',
    isForSale: '是否可販售',
    allowInquiry: '是否接受洽詢',
    allowPrint: '是否接受複製畫委託'
  }
};
Object.assign(CMS_V4.zhLabels, CMS_V5.zhLabels);
CMS_ADMIN.editable.libraries = { sheet: '作品庫管理', key: 'libraryId' };

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('謝秀英藝術館後台')
    .addItem('開啟 CMS 管理面板', 'openCmsAdmin')
    .addSeparator()
    .addItem('① 初始化/更新後台資料庫', 'initMuseumCms')
    .addItem('② 從 Google Drive 同步目前作品庫', 'syncDriveArtworks')
    .addItem('③ 升級作品欄位與作品編號', 'upgradeArtworkSheetV5')
    .addItem('④ 新增作品庫分頁', 'promptCreateArtworkLibrary')
    .addItem('⑤ 重新套用表格格式', 'formatMuseumCms')
    .addSeparator()
    .addItem('API 測試：查看完整資料包', 'showApiPreview')
    .addItem('API 測試：查看作品隨機抽選', 'showRandomPreview')
    .addToUi();
}

function initMuseumCms() {
  const ss = SpreadsheetApp.getActive();
  createSettingsSheet_(ss);
  createHomeSheet_(ss);
  createAnnouncementsSheet_(ss);
  createArtworkLibrariesSheet_(ss);
  createArtworksSheet_(ss);
  createCategoriesSheet_(ss);
  createGallerySheet_(ss);
  createExhibitionsSheet_(ss);
  createHistorySheet_(ss);
  createBooksSheet_(ss);
  createContactSettingsSheet_(ss);
  createContactResponsesSheet_(ss);
  createPagesSheet_(ss);
  createApiLogSheet_(ss);
  upgradeArtworkSheetV5(false);
  formatMuseumCms();
  SpreadsheetApp.getUi().alert('完成：CMS v5 後台資料庫已建立/更新。');
}

function formatMuseumCms() {
  const ss = SpreadsheetApp.getActive();
  Object.values(CMS.sheets).forEach(name => {
    const sh = ss.getSheetByName(name);
    if (!sh) return;
    const isTable = isTableSheet_(name);
    sh.setFrozenRows(isTable ? 2 : 1);
    const lastCol = Math.max(sh.getLastColumn(), 1);
    sh.getRange(1, 1, 1, lastCol)
      .setBackground('#6bc2ba')
      .setFontColor('#ffffff')
      .setFontWeight('bold')
      .setVerticalAlignment('middle');
    if (isTable && sh.getLastRow() >= 2) {
      sh.getRange(2, 1, 1, lastCol)
        .setBackground('#e9f8f6')
        .setFontColor('#2b5854')
        .setFontWeight('bold')
        .setVerticalAlignment('middle');
    }
    sh.autoResizeColumns(1, lastCol);
    sh.getDataRange().setWrap(true).setVerticalAlignment('top');
  });
}

function artworkHeaders_() {
  return [
    'id', 'artworkId', 'titleZh', 'titleEn', 'category', 'subCategory', 'authorType', 'authorName', 'libraryId',
    'year', 'size', 'material', 'medium', 'collectionStatus', 'priceNote',
    'collectionPrice', 'collectionCurrency', 'collectionPriceVisibility', 'collectionInfoVisibility', 'collectorName', 'collectionDate',
    'isSold', 'isForSale', 'allowInquiry', 'allowPrint', 'description',
    'imageUrl', 'thumbUrl', 'driveFileId', 'originalFileName', 'drivePath',
    'isHomeHero', 'isFeatured', 'isPublic', 'isGallery', 'isShowcase', 'exhibition', 'sort', 'dataStatus',
    'seoTitle', 'seoDescription', 'createdAt', 'updatedAt'
  ];
}

function createArtworkLibrariesSheet_(ss) {
  upsertTableKeepData_(ss, CMS.sheets.artworkLibraries, CMS_V5.libraryHeaders, [
    rowFromRecord_(CMS_V5.libraryHeaders, {
      libraryId: 'LIB_XH', libraryName: '謝秀英作品庫', sheetName: CMS.sheets.artworks,
      authorType: '畫家', authorName: '謝秀英', prefix: 'XH',
      driveFolderId: extractDriveId_('https://drive.google.com/drive/folders/1dOln1soIngAS4ovEMA9S1HhL39o8HYyq'),
      driveFolderUrl: 'https://drive.google.com/drive/folders/1dOln1soIngAS4ovEMA9S1HhL39o8HYyq',
      description: '官方畫家作品庫', isActive: 'TRUE', isPublic: 'TRUE', sort: 1,
      createdAt: isoDate_(), updatedAt: isoDate_()
    })
  ]);
}

function createArtworksSheet_(ss) {
  upsertTableKeepData_(ss, CMS.sheets.artworks, artworkHeaders_(), [
    rowFromRecord_(artworkHeaders_(), {
      id: 'XH0001', artworkId: 'XH0001', titleZh: '花鳥清音', titleEn: 'Pure Songs of Flowers and Birds',
      category: '花鳥', authorType: '畫家', authorName: '謝秀英', libraryId: 'LIB_XH', year: '2023', size: '68×136 cm',
      material: '彩墨紙本', medium: 'Ink and color on paper', collectionStatus: '無', priceNote: '洽詢',
      collectionPrice: '', collectionCurrency: 'TWD', collectionPriceVisibility: '隱藏', collectionInfoVisibility: '隱藏', collectorName: '', collectionDate: '',
      isSold: 'FALSE', isForSale: 'TRUE', allowInquiry: 'TRUE', allowPrint: 'FALSE', description: '範例資料，可替換為正式作品。',
      imageUrl: 'assets/images/art-placeholder-1.svg', thumbUrl: 'assets/images/art-placeholder-1.svg',
      isHomeHero: 'TRUE', isFeatured: 'TRUE', isPublic: 'TRUE', exhibition: '線上藝廊', sort: 1,
      dataStatus: '範例', createdAt: '2026-07-09', updatedAt: '2026-07-09'
    }),
    rowFromRecord_(artworkHeaders_(), {
      id: 'XH0002', artworkId: 'XH0002', titleZh: '莫爾海姆', titleEn: 'Morheim',
      category: '彩墨', authorType: '畫家', authorName: '謝秀英', libraryId: 'LIB_XH', year: '2024', size: '68×136 cm',
      material: '彩墨紙本', medium: 'Color Ink', collectionStatus: '無', priceNote: '洽詢',
      collectionPrice: '', collectionCurrency: 'TWD', collectionPriceVisibility: '隱藏', collectionInfoVisibility: '隱藏', collectorName: '', collectionDate: '',
      isSold: 'FALSE', isForSale: 'TRUE', allowInquiry: 'TRUE', allowPrint: 'FALSE', description: '範例資料，可替換為正式作品。',
      imageUrl: 'assets/images/art-placeholder-2.svg', thumbUrl: 'assets/images/art-placeholder-2.svg',
      isHomeHero: 'TRUE', isFeatured: 'TRUE', isPublic: 'TRUE', exhibition: '線上藝廊', sort: 2,
      dataStatus: '範例', createdAt: '2026-07-09', updatedAt: '2026-07-09'
    })
  ]);
}

function promptCreateArtworkLibrary() {
  const ui = SpreadsheetApp.getUi();
  const name = ui.prompt('新增作品庫', '請輸入作品庫名稱，例如：學生作品庫、收藏品作品庫', ui.ButtonSet.OK_CANCEL);
  if (name.getSelectedButton() !== ui.Button.OK) return;
  const prefix = ui.prompt('作品編號前綴', '請輸入英文前綴，例如 ST、CL、XH。學生建議 ST，收藏品建議 CL。', ui.ButtonSet.OK_CANCEL);
  if (prefix.getSelectedButton() !== ui.Button.OK) return;
  const authorType = ui.prompt('作者分類', '例如：學生、收藏品、畫家、師生展', ui.ButtonSet.OK_CANCEL);
  if (authorType.getSelectedButton() !== ui.Button.OK) return;
  const sheetName = sanitizeSheetName_(name.getResponseText());
  const result = createArtworkLibrary_({
    libraryName: name.getResponseText(),
    sheetName,
    prefix: prefix.getResponseText(),
    authorType: authorType.getResponseText(),
    authorName: '',
    driveFolderId: '',
    driveFolderUrl: '',
    description: ''
  });
  ui.alert(result.message);
}

function adminCreateArtworkLibrary(data) {
  return createArtworkLibrary_(data || {});
}

function createArtworkLibrary_(data) {
  const ss = SpreadsheetApp.getActive();
  createArtworkLibrariesSheet_(ss);
  const cleanName = sanitizeSheetName_(data.sheetName || data.libraryName || '新作品庫');
  if (ss.getSheetByName(cleanName)) throw new Error('分頁已存在：' + cleanName);
  const prefix = String(data.prefix || 'WK').replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'WK';
  const libraryId = buildLibraryId_(prefix, cleanName);
  const sh = ss.insertSheet(cleanName);
  sh.getRange(1, 1, 1, artworkHeaders_().length).setValues([artworkHeaders_()]);
  sh.getRange(2, 1, 1, artworkHeaders_().length).setValues([artworkHeaders_().map(fieldLabel_)]);
  const libSh = ss.getSheetByName(CMS.sheets.artworkLibraries);
  const folderId = data.driveFolderId || extractDriveId_(data.driveFolderUrl || '');
  libSh.appendRow(rowFromRecord_(CMS_V5.libraryHeaders, {
    libraryId, libraryName: data.libraryName || cleanName, sheetName: cleanName,
    authorType: data.authorType || '未分類', authorName: data.authorName || '', prefix,
    driveFolderId: folderId, driveFolderUrl: data.driveFolderUrl || '', description: data.description || '',
    isActive: 'TRUE', isPublic: 'TRUE', sort: libSh.getLastRow(), createdAt: isoDate_(), updatedAt: isoDate_()
  }));
  formatMuseumCms();
  return { ok: true, libraryId, sheetName: cleanName, message: '已建立作品庫分頁：' + cleanName + '（前綴：' + prefix + '）' };
}

function syncDriveArtworks() {
  const lib = getDefaultArtworkLibrary_();
  const result = syncArtworkLibrary_(lib);
  SpreadsheetApp.getUi().alert(result.message);
  return result;
}

function adminSyncArtworkLibrary(libraryId) {
  const lib = getArtworkLibraryById_(libraryId) || getDefaultArtworkLibrary_();
  return syncArtworkLibrary_(lib);
}

function syncArtworkLibrary_(lib) {
  if (!lib || !lib.sheetName) throw new Error('找不到作品庫設定。');
  const ss = SpreadsheetApp.getActive();
  const folderId = lib.driveFolderId || extractDriveId_(lib.driveFolderUrl || '');
  if (!folderId) throw new Error('請先在「作品庫管理」填入雲端資料夾 ID 或網址：' + lib.libraryName);

  const sh = getOrCreateSheet_(ss, lib.sheetName, artworkHeaders_());
  ensureHeaders_(sh, artworkHeaders_());
  ensureChineseHeaderRow_(sh, artworkHeaders_());
  upgradeArtworkSheetByName_(lib.sheetName, lib.prefix || 'WK', false);

  const existingRows = readTableFromSheet_(lib.sheetName);
  const existingFileIds = new Set(existingRows.map(r => String(r.driveFileId || '')).filter(Boolean));
  let nextNo = getNextArtworkNoByPrefix_(existingRows, lib.prefix || 'WK');

  const folder = DriveApp.getFolderById(folderId);
  const files = [];
  collectImageFiles_(folder, '', files);

  const headers = artworkHeaders_();
  const newRows = [];
  files.forEach(item => {
    const file = item.file;
    const driveFileId = file.getId();
    if (existingFileIds.has(driveFileId)) return;
    const fileName = file.getName();
    const cleanTitle = cleanFileName_(fileName);
    const category = item.path ? item.path.split('/')[0] : '';
    const artworkId = formatArtworkIdByPrefix_(lib.prefix || 'WK', nextNo++);
    const rec = {
      id: artworkId, artworkId, titleZh: cleanTitle, titleEn: '', category, subCategory: '',
      authorType: lib.authorType || '', authorName: lib.authorName || '', libraryId: lib.libraryId || '',
      year: '', size: '', material: '', medium: '', collectionStatus: '無', priceNote: '洽詢',
      collectionPrice: '', collectionCurrency: 'TWD', collectionPriceVisibility: '隱藏', collectionInfoVisibility: '隱藏', collectorName: '', collectionDate: '',
      isSold: 'FALSE', isForSale: 'TRUE', allowInquiry: 'TRUE', allowPrint: 'FALSE', description: '',
      imageUrl: driveImageUrl_(driveFileId, CMS.displaySize), thumbUrl: driveImageUrl_(driveFileId, CMS.thumbSize),
      driveFileId, originalFileName: fileName, drivePath: item.path,
      isHomeHero: 'FALSE', isFeatured: 'TRUE', isPublic: 'TRUE', exhibition: '', sort: sh.getLastRow() + newRows.length,
      dataStatus: '待補資料', seoTitle: '', seoDescription: '', createdAt: isoDate_(), updatedAt: isoDate_()
    };
    newRows.push(rowFromRecord_(headers, rec));
  });
  if (newRows.length) sh.getRange(sh.getLastRow() + 1, 1, newRows.length, headers.length).setValues(newRows);
  formatMuseumCms();
  return { ok: true, scanned: files.length, added: newRows.length, sheetName: lib.sheetName, message: '同步完成：' + lib.libraryName + ' 掃描 ' + files.length + ' 個圖片檔，新增 ' + newRows.length + ' 件作品。' };
}

function upgradeArtworkSheetV5(showAlert) {
  const libs = getArtworkLibraries_();
  if (!libs.length) createArtworkLibrariesSheet_(SpreadsheetApp.getActive());
  (getArtworkLibraries_().length ? getArtworkLibraries_() : [getDefaultArtworkLibrary_()]).forEach(lib => upgradeArtworkSheetByName_(lib.sheetName, lib.prefix || 'WK', false));
  formatMuseumCms();
  if (showAlert !== false) SpreadsheetApp.getUi().alert('完成：所有作品庫已升級 v5 欄位。');
}

function upgradeArtworkSheetV4(showAlert) { return upgradeArtworkSheetV5(showAlert); }

function upgradeArtworkSheetByName_(sheetName, prefix, showAlert) {
  const ss = SpreadsheetApp.getActive();
  const sh = getOrCreateSheet_(ss, sheetName, artworkHeaders_());
  ensureHeaders_(sh, artworkHeaders_());
  ensureChineseHeaderRow_(sh, artworkHeaders_());
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const rows = readTableFromSheet_(sheetName);
  let nextNo = getNextArtworkNoByPrefix_(rows, prefix || 'WK');
  const dataStart = getDataStartRow_(sh);
  const col = name => headers.indexOf(name) + 1;
  const defaults = {
    collectionStatus: '無', priceNote: '洽詢', collectionCurrency: 'TWD', collectionPriceVisibility: '隱藏', collectionInfoVisibility: '隱藏',
    isSold: 'FALSE', isForSale: 'TRUE', allowInquiry: 'TRUE', allowPrint: 'FALSE', isPublic: 'TRUE'
  };
  for (let i = 0; i < rows.length; i++) {
    const sheetRow = dataStart + i;
    let artworkId = String(rows[i].artworkId || '').trim();
    if (!new RegExp('^' + String(prefix || 'WK').toUpperCase() + '\\d{4,}$', 'i').test(artworkId)) artworkId = formatArtworkIdByPrefix_(prefix || 'WK', nextNo++);
    if (col('artworkId')) sh.getRange(sheetRow, col('artworkId')).setValue(artworkId);
    if (col('id')) sh.getRange(sheetRow, col('id')).setValue(artworkId);
    if (col('titleZh') && !rows[i].titleZh && rows[i].originalFileName) sh.getRange(sheetRow, col('titleZh')).setValue(cleanFileName_(rows[i].originalFileName));
    Object.keys(defaults).forEach(k => { if (col(k) && (rows[i][k] === '' || rows[i][k] == null)) sh.getRange(sheetRow, col(k)).setValue(defaults[k]); });
    if (col('dataStatus') && !rows[i].dataStatus) sh.getRange(sheetRow, col('dataStatus')).setValue(calcArtworkDataStatus_(rows[i]));
    if (col('seoTitle') && !rows[i].seoTitle) sh.getRange(sheetRow, col('seoTitle')).setValue(buildSeoTitle_(rows[i]));
    if (col('seoDescription') && !rows[i].seoDescription) sh.getRange(sheetRow, col('seoDescription')).setValue(buildSeoDescription_(rows[i]));
    if (col('updatedAt') && !rows[i].updatedAt) sh.getRange(sheetRow, col('updatedAt')).setValue(isoDate_());
  }
  if (showAlert) SpreadsheetApp.getUi().alert('完成：' + sheetName + ' 已升級。');
}

function getPublicArtworks_() {
  const libs = getArtworkLibraries_().filter(l => bool_(l.isActive, true) && bool_(l.isPublic, true));
  const rows = [];
  (libs.length ? libs : [getDefaultArtworkLibrary_()]).forEach(lib => {
    readTableFromSheet_(lib.sheetName).forEach(r => rows.push(Object.assign({ libraryId: lib.libraryId, libraryName: lib.libraryName }, r)));
  });
  return rows
    .filter(r => bool_(r.isPublic, true))
    .sort((a, b) => Number(a.sort || 9999) - Number(b.sort || 9999))
    .map(sanitizeArtworkForPublic_);
}

function sanitizeArtworkForPublic_(row) {
  const r = Object.assign({}, row);
  r.artworkId = r.artworkId || r.id;
  r.id = r.artworkId || r.id;
  r.isHomeHero = bool_(r.isHomeHero, false);
  r.isFeatured = bool_(r.isFeatured, false);
  r.isSold = bool_(r.isSold, false);
  r.isPublic = bool_(r.isPublic, true);
  r.isForSale = bool_(r.isForSale, true);
  r.allowInquiry = bool_(r.allowInquiry, true);
  r.allowPrint = bool_(r.allowPrint, false);
  if (!r.imageUrl && r.driveFileId) r.imageUrl = driveImageUrl_(r.driveFileId, CMS.displaySize);
  if (!r.thumbUrl && r.driveFileId) r.thumbUrl = driveImageUrl_(r.driveFileId, CMS.thumbSize);
  if (!r.dataStatus) r.dataStatus = calcArtworkDataStatus_(r);

  const infoPublic = visibilityPublic_(r.collectionInfoVisibility);
  const pricePublic = visibilityPublic_(r.collectionPriceVisibility);
  r.publicPriceNote = r.priceNote || '洽詢';
  if (infoPublic) {
    r.publicCollectionStatus = r.collectionStatus || '';
    r.publicCollectorName = r.collectorName || '';
    if (pricePublic && r.collectionPrice) {
      r.publicCollectionPrice = r.collectionPrice;
      r.publicCollectionCurrency = r.collectionCurrency || 'TWD';
    }
  } else {
    const status = String(r.collectionStatus || '').trim();
    r.publicCollectionStatus = (/私人|售|收藏|館藏/.test(status)) ? '私人收藏' : status;
    r.publicCollectorName = '';
  }
  delete r.collectionPrice;
  delete r.collectionCurrency;
  delete r.collectionPriceVisibility;
  delete r.collectionInfoVisibility;
  delete r.collectorName;
  delete r.collectionDate;
  return r;
}

function adminGetDashboard() {
  const settings = getSettings_();
  const libs = getArtworkLibraries_();
  let artworks = [];
  (libs.length ? libs : [getDefaultArtworkLibrary_()]).forEach(lib => artworks = artworks.concat(readTableFromSheet_(lib.sheetName)));
  const publicArtworks = artworks.filter(r => bool_(r.isPublic, true));
  const hero = publicArtworks.filter(r => bool_(r.isHomeHero, false)).length;
  const featured = publicArtworks.filter(r => bool_(r.isFeatured, false)).length;
  const incomplete = publicArtworks.filter(r => String(r.dataStatus || calcArtworkDataStatus_(r)) !== '完整').length;
  const responses = readTable_(CMS.sheets.contactResponses);
  const unread = responses.filter(r => String(r.status || '') !== '已處理').length;
  return { ok: true, version: CMS_V5.version, siteName: settings.siteName, artistNameZh: settings.artistNameZh,
    counts: { artworks: artworks.length, libraries: libs.length, publicArtworks: publicArtworks.length, incompleteArtworks: incomplete, hero, featured, announcements: readTable_(CMS.sheets.announcements).length, contactResponses: responses.length, unreadContacts: unread },
    apiPreview: ScriptApp.getService().getUrl() || '尚未部署 Web App' };
}

function adminList(entity) {
  if (entity === 'artworks') {
    const libs = getArtworkLibraries_();
    let rows = [];
    (libs.length ? libs : [getDefaultArtworkLibrary_()]).forEach(lib => rows = rows.concat(readTableFromSheet_(lib.sheetName).map(r => Object.assign({ libraryName: lib.libraryName }, r))));
    return { ok: true, entity, sheetName: '所有作品庫', rows, labels: getLabelsForHeaders_(artworkHeaders_()) };
  }
  const meta = CMS_ADMIN.editable[entity];
  if (!meta) throw new Error('未知管理項目：' + entity);
  const rows = readTable_(meta.sheet);
  return { ok: true, entity, sheetName: meta.sheet, rows, labels: getLabelsForHeaders_(getHeaders_(meta.sheet)) };
}

function adminSaveRecord(entity, record) {
  if (entity === 'artworks') {
    const lib = getArtworkLibraryById_(record.libraryId) || getDefaultArtworkLibrary_();
    return adminSaveRecordToSheet_(lib.sheetName, 'artworkId', record, lib.prefix || 'WK');
  }
  const meta = CMS_ADMIN.editable[entity];
  if (!meta) throw new Error('未知管理項目：' + entity);
  return adminSaveRecordToSheet_(meta.sheet, meta.key, record, '');
}

function adminSaveRecordToSheet_(sheetName, key, record, prefix) {
  const ss = SpreadsheetApp.getActive();
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('找不到表：' + sheetName);
  ensureChineseHeaderRow_(sh, getHeaders_(sheetName));
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  const keyCol = headers.indexOf(key);
  if (keyCol < 0) throw new Error('找不到主鍵欄位：' + key);
  let id = String(record[key] || '').trim();
  if (key === 'artworkId') {
    if (!id) id = formatArtworkIdByPrefix_(prefix || 'WK', getNextArtworkNoByPrefix_(readTableFromSheet_(sheetName), prefix || 'WK'));
    record.artworkId = id; record.id = id;
    record.dataStatus = calcArtworkDataStatus_(record);
    if (!record.seoTitle) record.seoTitle = buildSeoTitle_(record);
    if (!record.seoDescription) record.seoDescription = buildSeoDescription_(record);
  } else if (!id) { id = buildAdminId_(key); record[key] = id; }
  if (headers.indexOf('updatedAt') >= 0) record.updatedAt = isoDate_();
  if (headers.indexOf('createdAt') >= 0 && !record.createdAt) record.createdAt = isoDate_();
  let targetRow = -1;
  for (let i = 2; i < values.length; i++) if (String(values[i][keyCol]).trim() === id) { targetRow = i + 1; break; }
  const rowValues = headers.map(h => normalizeForWrite_(record[h]));
  if (targetRow > 0) sh.getRange(targetRow, 1, 1, headers.length).setValues([rowValues]);
  else sh.getRange(sh.getLastRow() + 1, 1, 1, headers.length).setValues([rowValues]);
  formatMuseumCms();
  return { ok: true, id, message: '已儲存' };
}

function adminSoftDeleteRecord(entity, id) {
  if (entity === 'artworks') {
    const libs = getArtworkLibraries_();
    for (let l = 0; l < libs.length; l++) {
      const res = softDeleteInSheet_(libs[l].sheetName, 'artworkId', id);
      if (res.ok) return res;
    }
    return { ok: false, error: '找不到作品' };
  }
  const meta = CMS_ADMIN.editable[entity];
  if (!meta) throw new Error('未知管理項目：' + entity);
  return softDeleteInSheet_(meta.sheet, meta.key, id);
}

function softDeleteInSheet_(sheetName, key, id) {
  const sh = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sh) return { ok: false, error: '找不到表：' + sheetName };
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  const keyCol = headers.indexOf(key);
  const publicCol = headers.indexOf('isPublic');
  if (keyCol < 0 || publicCol < 0) return { ok: false, error: '此表不支援下架' };
  for (let i = 2; i < values.length; i++) if (String(values[i][keyCol]).trim() === String(id).trim()) { sh.getRange(i + 1, publicCol + 1).setValue('FALSE'); return { ok: true, message: '已下架' }; }
  return { ok: false, error: '找不到資料' };
}

function isTableSheet_(sheetName) {
  const standard = [CMS.sheets.announcements, CMS.sheets.artworks, CMS.sheets.categories, CMS.sheets.gallery, CMS.sheets.exhibitions, CMS.sheets.history, CMS.sheets.books, CMS.sheets.contactResponses, CMS.sheets.pages, CMS.sheets.apiLog, CMS.sheets.artworkLibraries];
  if (standard.indexOf(sheetName) >= 0) return true;
  return getArtworkLibraries_().some(l => l.sheetName === sheetName);
}

function readTableFromSheet_(sheetName) {
  const sh = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(h => String(h).trim());
  const start = hasChineseHeaderRowValues_(values, headers) ? 2 : 1;
  return values.slice(start).filter(r => r.some(c => c !== '')).map(row => {
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = normalize_(row[i]); });
    return obj;
  });
}

function getArtworkLibraries_() {
  try { return readTableFromSheet_(CMS.sheets.artworkLibraries).filter(l => l.sheetName); }
  catch (e) { return []; }
}
function getDefaultArtworkLibrary_() {
  const settings = getSettings_();
  return { libraryId: 'LIB_XH', libraryName: '謝秀英作品庫', sheetName: CMS.sheets.artworks, authorType: '畫家', authorName: '謝秀英', prefix: 'XH', driveFolderId: settings.driveFolderId || extractDriveId_(settings.driveFolderUrl || ''), driveFolderUrl: settings.driveFolderUrl || '', isActive: true, isPublic: true };
}
function getArtworkLibraryById_(libraryId) { return getArtworkLibraries_().filter(l => String(l.libraryId) === String(libraryId))[0] || null; }
function buildLibraryId_(prefix, name) { return 'LIB_' + String(prefix || 'WK').toUpperCase() + '_' + Utilities.getUuid().slice(0, 6).toUpperCase(); }
function sanitizeSheetName_(name) { return String(name || '新作品庫').replace(/[\\\/\?\*\[\]\:]/g, '').slice(0, 90).trim() || '新作品庫'; }
function getNextArtworkNoByPrefix_(rows, prefix) { let max = 0; const re = new RegExp('^' + String(prefix || 'WK').toUpperCase() + '(\\d+)$', 'i'); (rows || []).forEach(r => { const m = String(r.artworkId || r.id || '').trim().match(re); if (m) max = Math.max(max, Number(m[1])); }); return max + 1; }
function formatArtworkIdByPrefix_(prefix, num) { return String(prefix || 'WK').toUpperCase() + String(num).padStart(4, '0'); }
function formatArtworkId_(num) { return formatArtworkIdByPrefix_(CMS_V5.defaultPrefix, num); }
function visibilityPublic_(v) { return ['公開', 'TRUE', 'true', '1', 'yes', '是'].indexOf(String(v || '').trim()) >= 0; }
function buildSeoTitle_(r) { return (r.titleZh || r.originalFileName || r.artworkId || '作品') + '｜謝秀英書畫藝術館'; }
function buildSeoDescription_(r) { const parts = []; if (r.titleZh) parts.push('《' + r.titleZh + '》'); if (r.authorName) parts.push('作者' + r.authorName); if (r.year) parts.push(r.year + '年作品'); if (r.medium || r.material) parts.push(r.medium || r.material); if (r.size) parts.push('尺寸' + r.size); return parts.join('，') + '。'; }

/* =========================================================
 * CMS Admin v6｜主資料重構 + 作品重複檢查
 * 追加於 v5 後方。Apps Script 會以本段同名函式覆蓋前方舊定義。
 * ========================================================= */
const CMS_V6 = {
  version: '6.0.0',
  masterSheets: {
    artists: '作者管理',
    artworkTypes: '作品類型',
    artworkSubjects: '作品題材',
    media: '媒材管理',
    materials: '材質管理',
    currencies: '幣別管理',
    collectionStatuses: '收藏狀態',
    duplicateReport: '重複照片檢查'
  }
};

CMS.version = CMS_V6.version;
CMS.sheets.artists = CMS_V6.masterSheets.artists;
CMS.sheets.artworkTypes = CMS_V6.masterSheets.artworkTypes;
CMS.sheets.artworkSubjects = CMS_V6.masterSheets.artworkSubjects;
CMS.sheets.media = CMS_V6.masterSheets.media;
CMS.sheets.materials = CMS_V6.masterSheets.materials;
CMS.sheets.currencies = CMS_V6.masterSheets.currencies;
CMS.sheets.collectionStatuses = CMS_V6.masterSheets.collectionStatuses;
CMS.sheets.duplicateReport = CMS_V6.masterSheets.duplicateReport;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('謝秀英藝術館後台')
    .addItem('開啟 CMS 管理面板', 'openCmsAdmin')
    .addSeparator()
    .addItem('① 初始化/更新後台資料庫', 'initMuseumCms')
    .addItem('② 從 Google Drive 同步作品清單', 'syncDriveArtworks')
    .addItem('③ 升級作品欄位與作品編號', 'upgradeArtworkSheetV6')
    .addItem('④ 建立/更新主資料表', 'createMasterDataSheets')
    .addItem('⑤ 檢查重複照片', 'scanDuplicateArtworkFiles')
    .addItem('⑥ 重新套用表格格式', 'formatMuseumCms')
    .addSeparator()
    .addItem('API 測試：查看完整資料包', 'showApiPreview')
    .addItem('API 測試：查看作品隨機抽選', 'showRandomPreview')
    .addToUi();
}

function initMuseumCms() {
  const ss = SpreadsheetApp.getActive();
  createSettingsSheet_(ss);
  createHomeSheet_(ss);
  createAnnouncementsSheet_(ss);
  createMasterDataSheets_(ss);
  createArtworkLibrariesSheet_(ss);
  createArtworksSheet_(ss);
  createGallerySheet_(ss);
  createExhibitionsSheet_(ss);
  createHistorySheet_(ss);
  createBooksSheet_(ss);
  createContactSettingsSheet_(ss);
  createContactResponsesSheet_(ss);
  createPagesSheet_(ss);
  createApiLogSheet_(ss);
  createDuplicateReportSheet_(ss);
  upgradeArtworkSheetV6(false);
  formatMuseumCms();
  SpreadsheetApp.getUi().alert('完成：CMS v6 後台資料庫已建立/更新。');
}

function createMasterDataSheets() {
  createMasterDataSheets_(SpreadsheetApp.getActive());
  formatMuseumCms();
  SpreadsheetApp.getUi().alert('完成：主資料表已建立/更新。');
}

function createMasterDataSheets_(ss) {
  createArtistsSheet_(ss);
  createArtworkTypesSheet_(ss);
  createArtworkSubjectsSheet_(ss);
  createMediaSheet_(ss);
  createMaterialsSheet_(ss);
  createCurrenciesSheet_(ss);
  createCollectionStatusesSheet_(ss);
}

function createArtistsSheet_(ss) {
  const h = ['artistId', 'artistNameZh', 'artistNameEn', 'artistType', 'prefix', 'driveFolderId', 'driveFolderUrl', 'bio', 'avatarUrl', 'isPublic', 'sort', 'createdAt', 'updatedAt'];
  upsertTableKeepData_(ss, CMS.sheets.artists, h, [rowFromRecord_(h, {
    artistId:'XH', artistNameZh:'謝秀英', artistNameEn:'Hsieh Hsiu-Ying', artistType:'畫家', prefix:'XH',
    driveFolderId:'1dOln1soIngAS4ovEMA9S1HhL39o8HYyq', driveFolderUrl:'https://drive.google.com/drive/folders/1dOln1soIngAS4ovEMA9S1HhL39o8HYyq',
    bio:'謝秀英，字馥宇，號無心居士。', isPublic:'TRUE', sort:1, createdAt:isoDate_(), updatedAt:isoDate_()
  })]);
}

function createArtworkTypesSheet_(ss) {
  const h = ['typeId', 'nameZh', 'nameEn', 'prefixHint', 'description', 'defaultMaterialId', 'defaultMediumIds', 'defaultMediumNames', 'isPublic', 'sort', 'createdAt', 'updatedAt'];
  upsertTableKeepData_(ss, CMS.sheets.artworkTypes, h, [
    rowFromRecord_(h,{typeId:'GB',nameZh:'工筆',nameEn:'Gongbi',prefixHint:'GB',description:'工筆類作品',defaultMaterialId:'ALUM_XUAN',defaultMediumIds:'INK,CHINESE_COLOR,SUIGAN,GLUE',defaultMediumNames:'墨、國畫顏料、水干、膠',isPublic:'TRUE',sort:1,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{typeId:'JC',nameZh:'膠彩',nameEn:'Mineral Pigment Painting',prefixHint:'JC',description:'膠彩類作品',defaultMaterialId:'SILK',defaultMediumIds:'MINERAL,SUIGAN,GLUE',defaultMediumNames:'礦岩、水干、膠',isPublic:'TRUE',sort:2,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{typeId:'XY',nameZh:'寫意',nameEn:'Freehand Ink Painting',prefixHint:'XY',description:'寫意類作品',defaultMaterialId:'XUAN',defaultMediumIds:'INK,CHINESE_COLOR',defaultMediumNames:'墨、國畫顏料',isPublic:'TRUE',sort:3,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{typeId:'SF',nameZh:'書法',nameEn:'Calligraphy',prefixHint:'SF',description:'書法作品',defaultMaterialId:'XUAN',defaultMediumIds:'INK',defaultMediumNames:'墨',isPublic:'TRUE',sort:4,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{typeId:'CL',nameZh:'收藏品',nameEn:'Collection',prefixHint:'CL',description:'收藏品、文物等',defaultMaterialId:'',defaultMediumIds:'',defaultMediumNames:'',isPublic:'TRUE',sort:5,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{typeId:'CER',nameZh:'陶藝',nameEn:'Ceramics',prefixHint:'CER',description:'陶藝作品',defaultMaterialId:'CERAMIC',defaultMediumIds:'',defaultMediumNames:'',isPublic:'TRUE',sort:6,createdAt:isoDate_(),updatedAt:isoDate_()})
  ]);
}

function createArtworkSubjectsSheet_(ss) {
  const h = ['subjectId', 'nameZh', 'nameEn', 'description', 'isPublic', 'sort', 'createdAt', 'updatedAt'];
  upsertTableKeepData_(ss, CMS.sheets.artworkSubjects, h, [
    rowFromRecord_(h,{subjectId:'FL',nameZh:'花鳥',nameEn:'Flowers and Birds',isPublic:'TRUE',sort:1,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{subjectId:'AN',nameZh:'動物',nameEn:'Animals',isPublic:'TRUE',sort:2,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{subjectId:'LS',nameZh:'山水',nameEn:'Landscape',isPublic:'TRUE',sort:3,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{subjectId:'BU',nameZh:'佛像',nameEn:'Buddhist Figures',isPublic:'TRUE',sort:4,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{subjectId:'PE',nameZh:'人物',nameEn:'Figures',isPublic:'TRUE',sort:5,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{subjectId:'IN',nameZh:'昆蟲',nameEn:'Insects',isPublic:'TRUE',sort:6,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{subjectId:'OT',nameZh:'其他',nameEn:'Other',isPublic:'TRUE',sort:99,createdAt:isoDate_(),updatedAt:isoDate_()})
  ]);
}

function createMediaSheet_(ss) {
  const h = ['mediumId', 'nameZh', 'nameEn', 'description', 'isPublic', 'sort', 'createdAt', 'updatedAt'];
  upsertTableKeepData_(ss, CMS.sheets.media, h, [
    rowFromRecord_(h,{mediumId:'INK',nameZh:'墨',nameEn:'Chinese Ink',description:'書畫用墨汁或墨條研墨',isPublic:'TRUE',sort:1,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{mediumId:'MINERAL',nameZh:'礦岩',nameEn:'Mineral Pigment',description:'天然或人工礦物顏料',isPublic:'TRUE',sort:2,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{mediumId:'SUIGAN',nameZh:'水干',nameEn:'Suigan Pigment',description:'水干顏料',isPublic:'TRUE',sort:3,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{mediumId:'GLUE',nameZh:'膠',nameEn:'Animal Glue',description:'膠彩用膠媒介',isPublic:'TRUE',sort:4,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{mediumId:'CHINESE_COLOR',nameZh:'國畫顏料',nameEn:'Chinese Painting Pigment',description:'國畫用顏料',isPublic:'TRUE',sort:5,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{mediumId:'WATERCOLOR',nameZh:'水彩顏料',nameEn:'Watercolor Pigment',description:'水彩顏料',isPublic:'TRUE',sort:6,createdAt:isoDate_(),updatedAt:isoDate_()})
  ]);
}

function createMaterialsSheet_(ss) {
  const h = ['materialId', 'nameZh', 'nameEn', 'description', 'isPublic', 'sort', 'createdAt', 'updatedAt'];
  upsertTableKeepData_(ss, CMS.sheets.materials, h, [
    rowFromRecord_(h,{materialId:'PAPER',nameZh:'紙本',nameEn:'Paper',description:'一般紙本',isPublic:'TRUE',sort:1,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{materialId:'XUAN',nameZh:'宣紙',nameEn:'Xuan Paper',description:'宣紙',isPublic:'TRUE',sort:2,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{materialId:'ALUM_XUAN',nameZh:'礬宣紙',nameEn:'Alum-sized Xuan Paper',description:'經礬處理的宣紙',isPublic:'TRUE',sort:3,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{materialId:'SILK',nameZh:'絹布',nameEn:'Silk',description:'絹布／絹本',isPublic:'TRUE',sort:4,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{materialId:'CANVAS',nameZh:'畫布',nameEn:'Canvas',description:'畫布',isPublic:'TRUE',sort:5,createdAt:isoDate_(),updatedAt:isoDate_()}),
    rowFromRecord_(h,{materialId:'CERAMIC',nameZh:'陶瓷',nameEn:'Ceramic',description:'陶瓷材質',isPublic:'TRUE',sort:6,createdAt:isoDate_(),updatedAt:isoDate_()})
  ]);
}

function createCurrenciesSheet_(ss) {
  const h = ['currencyId', 'nameZh', 'nameEn', 'symbol', 'isPublic', 'sort'];
  upsertTableKeepData_(ss, CMS.sheets.currencies, h, [
    rowFromRecord_(h,{currencyId:'TWD',nameZh:'新台幣',nameEn:'Taiwan Dollar',symbol:'NT$',isPublic:'TRUE',sort:1}),
    rowFromRecord_(h,{currencyId:'USD',nameZh:'美元',nameEn:'US Dollar',symbol:'$',isPublic:'TRUE',sort:2}),
    rowFromRecord_(h,{currencyId:'JPY',nameZh:'日圓',nameEn:'Japanese Yen',symbol:'¥',isPublic:'TRUE',sort:3})
  ]);
}

function createCollectionStatusesSheet_(ss) {
  const h = ['statusId', 'nameZh', 'nameEn', 'defaultPublicText', 'isPublic', 'sort'];
  upsertTableKeepData_(ss, CMS.sheets.collectionStatuses, h, [
    rowFromRecord_(h,{statusId:'AVAILABLE',nameZh:'可洽詢',nameEn:'Available for Inquiry',defaultPublicText:'洽詢',isPublic:'TRUE',sort:1}),
    rowFromRecord_(h,{statusId:'PRIVATE',nameZh:'私人收藏',nameEn:'Private Collection',defaultPublicText:'私人收藏',isPublic:'TRUE',sort:2}),
    rowFromRecord_(h,{statusId:'SOLD',nameZh:'已售出',nameEn:'Sold',defaultPublicText:'私人收藏',isPublic:'TRUE',sort:3}),
    rowFromRecord_(h,{statusId:'NOT_FOR_SALE',nameZh:'非賣品',nameEn:'Not for Sale',defaultPublicText:'非賣品',isPublic:'TRUE',sort:4}),
    rowFromRecord_(h,{statusId:'MUSEUM',nameZh:'館藏',nameEn:'Museum Collection',defaultPublicText:'館藏',isPublic:'TRUE',sort:5})
  ]);
}

function createDuplicateReportSheet_(ss) {
  const h = ['checkedAt','groupKey','reason','libraryName','drivePath','fileName','fileId','fileSize','mimeType','md5','url'];
  upsertTableKeepData_(ss, CMS.sheets.duplicateReport, h, []);
}

function artworkHeaders_() {
  return [
    'id', 'artworkId',
    'artistId', 'artistName', 'libraryId',
    'artworkTypeId', 'artworkTypeName',
    'subjectIds', 'subjectNames',
    'titleZh', 'titleEn',
    'year', 'size',
    'materialId', 'material',
    'mediumId', 'medium',
    'collectionStatusId', 'collectionStatus', 'priceNote',
    'collectionPrice', 'collectionCurrency', 'collectionPriceVisibility', 'collectionInfoVisibility', 'collectorName', 'collectionDate',
    'isSold', 'isForSale', 'allowInquiry', 'allowPrint', 'description',
    'imageUrl', 'thumbUrl', 'driveFileId', 'originalFileName', 'drivePath', 'fileSize', 'mimeType',
    'isHomeHero', 'isFeatured', 'isPublic', 'isGallery', 'isShowcase', 'exhibition', 'sort', 'dataStatus',
    'seoTitle', 'seoDescription', 'createdAt', 'updatedAt'
  ];
}

function createArtworksSheet_(ss) {
  upsertTableKeepData_(ss, CMS.sheets.artworks, artworkHeaders_(), [
    rowFromRecord_(artworkHeaders_(), {
      id:'XH0001', artworkId:'XH0001', artistId:'XH', artistName:'謝秀英', libraryId:'LIB_XH',
      artworkTypeId:'JC', artworkTypeName:'膠彩', subjectIds:'FL', subjectNames:'花鳥', titleZh:'花鳥清音', titleEn:'Pure Songs of Flowers and Birds',
      year:'2023', size:'68×136 cm', materialId:'PAPER', material:'紙本', mediumId:'MINERAL', medium:'膠彩',
      collectionStatusId:'AVAILABLE', collectionStatus:'可洽詢', priceNote:'洽詢', collectionCurrency:'TWD', collectionPriceVisibility:'隱藏', collectionInfoVisibility:'隱藏',
      isSold:'FALSE', isForSale:'TRUE', allowInquiry:'TRUE', allowPrint:'FALSE', description:'範例資料，可替換為正式作品。',
      imageUrl:'assets/images/art-placeholder-1.svg', thumbUrl:'assets/images/art-placeholder-1.svg',
      isHomeHero:'TRUE', isFeatured:'TRUE', isPublic:'TRUE', exhibition:'線上藝廊', sort:1, dataStatus:'範例', createdAt:isoDate_(), updatedAt:isoDate_()
    })
  ]);
}

function upgradeArtworkSheetV6(showAlert) {
  createMasterDataSheets_(SpreadsheetApp.getActive());
  const libs = getArtworkLibraries_();
  if (!libs.length) createArtworkLibrariesSheet_(SpreadsheetApp.getActive());
  (getArtworkLibraries_().length ? getArtworkLibraries_() : [getDefaultArtworkLibrary_()]).forEach(lib => upgradeArtworkSheetByNameV6_(lib.sheetName, lib.prefix || 'WK', false));
  formatMuseumCms();
  if (showAlert !== false) SpreadsheetApp.getUi().alert('完成：所有作品庫已升級 v6 主資料欄位。');
}
function upgradeArtworkSheetV5(showAlert) { return upgradeArtworkSheetV6(showAlert); }
function upgradeArtworkSheetV4(showAlert) { return upgradeArtworkSheetV6(showAlert); }

function upgradeArtworkSheetByNameV6_(sheetName, prefix, showAlert) {
  const ss = SpreadsheetApp.getActive();
  const sh = getOrCreateSheet_(ss, sheetName, artworkHeaders_());
  ensureHeaders_(sh, artworkHeaders_());
  ensureChineseHeaderRow_(sh, artworkHeaders_());
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const rows = readTableFromSheet_(sheetName);
  let nextNo = getNextArtworkNoByPrefix_(rows, prefix || 'WK');
  const dataStart = getDataStartRow_(sh);
  const col = name => headers.indexOf(name) + 1;
  for (let i = 0; i < rows.length; i++) {
    const sheetRow = dataStart + i;
    const row = rows[i];
    let artworkId = String(row.artworkId || row.id || '').trim();
    if (!new RegExp('^' + String(prefix || 'WK').toUpperCase() + '\\d{4,}$', 'i').test(artworkId)) artworkId = formatArtworkIdByPrefix_(prefix || 'WK', nextNo++);
    setIfCol_(sh, sheetRow, col('artworkId'), artworkId); setIfCol_(sh, sheetRow, col('id'), artworkId);
    setDefaultIfBlank_(sh, sheetRow, col('artistId'), row.artistId || 'XH');
    setDefaultIfBlank_(sh, sheetRow, col('artistName'), row.artistName || row.authorName || '謝秀英');
    setDefaultIfBlank_(sh, sheetRow, col('artworkTypeId'), inferArtworkTypeId_(row.artworkTypeId || row.category || row.drivePath));
    setDefaultIfBlank_(sh, sheetRow, col('artworkTypeName'), lookupMasterName_(CMS.sheets.artworkTypes, 'typeId', row.artworkTypeId || inferArtworkTypeId_(row.category || row.drivePath)));
    setDefaultIfBlank_(sh, sheetRow, col('subjectNames'), row.subjectNames || row.subCategory || inferSubjectFromPath_(row.drivePath));
    setDefaultIfBlank_(sh, sheetRow, col('titleZh'), row.titleZh || cleanFileName_(row.originalFileName || ''));
    setDefaultIfBlank_(sh, sheetRow, col('collectionStatusId'), row.collectionStatusId || inferCollectionStatusId_(row.collectionStatus));
    setDefaultIfBlank_(sh, sheetRow, col('collectionStatus'), row.collectionStatus || lookupMasterName_(CMS.sheets.collectionStatuses, 'statusId', row.collectionStatusId || 'AVAILABLE'));
    setDefaultIfBlank_(sh, sheetRow, col('priceNote'), '洽詢');
    setDefaultIfBlank_(sh, sheetRow, col('collectionCurrency'), 'TWD');
    setDefaultIfBlank_(sh, sheetRow, col('collectionPriceVisibility'), '隱藏');
    setDefaultIfBlank_(sh, sheetRow, col('collectionInfoVisibility'), '隱藏');
    setDefaultIfBlank_(sh, sheetRow, col('isSold'), 'FALSE');
    setDefaultIfBlank_(sh, sheetRow, col('isForSale'), 'TRUE');
    setDefaultIfBlank_(sh, sheetRow, col('allowInquiry'), 'TRUE');
    setDefaultIfBlank_(sh, sheetRow, col('allowPrint'), 'FALSE');
    setDefaultIfBlank_(sh, sheetRow, col('isPublic'), 'TRUE');
    setDefaultIfBlank_(sh, sheetRow, col('dataStatus'), calcArtworkDataStatus_(row));
    setDefaultIfBlank_(sh, sheetRow, col('seoTitle'), buildSeoTitle_(row));
    setDefaultIfBlank_(sh, sheetRow, col('seoDescription'), buildSeoDescription_(row));
    setDefaultIfBlank_(sh, sheetRow, col('updatedAt'), isoDate_());
  }
  if (showAlert) SpreadsheetApp.getUi().alert('完成：' + sheetName + ' 已升級 v6。');
}

function syncArtworkLibrary_(lib) {
  if (!lib || !lib.sheetName) throw new Error('找不到作品庫設定。');
  const ss = SpreadsheetApp.getActive();
  createMasterDataSheets_(ss);
  const folderId = lib.driveFolderId || extractDriveId_(lib.driveFolderUrl || '');
  if (!folderId) throw new Error('請先在「作品庫管理」填入雲端資料夾 ID 或網址：' + lib.libraryName);
  const sh = getOrCreateSheet_(ss, lib.sheetName, artworkHeaders_());
  ensureHeaders_(sh, artworkHeaders_()); ensureChineseHeaderRow_(sh, artworkHeaders_());
  upgradeArtworkSheetByNameV6_(lib.sheetName, lib.prefix || 'WK', false);
  const existingRows = readTableFromSheet_(lib.sheetName);
  const existingFileIds = new Set(existingRows.map(r => String(r.driveFileId || '')).filter(Boolean));
  let nextNo = getNextArtworkNoByPrefix_(existingRows, lib.prefix || 'WK');
  const folder = DriveApp.getFolderById(folderId);
  const files = []; collectImageFiles_(folder, '', files);
  const headers = artworkHeaders_(); const newRows = [];
  files.forEach(item => {
    const file = item.file; const driveFileId = file.getId();
    if (existingFileIds.has(driveFileId)) return;
    const fileName = file.getName(); const cleanTitle = cleanFileName_(fileName);
    const firstFolder = item.path ? item.path.split('/')[0] : '';
    const secondFolder = item.path && item.path.split('/').length > 1 ? item.path.split('/')[1] : '';
    const typeId = inferArtworkTypeId_(firstFolder);
    const typeName = lookupMasterName_(CMS.sheets.artworkTypes, 'typeId', typeId) || firstFolder;
    const artworkId = formatArtworkIdByPrefix_(lib.prefix || 'WK', nextNo++);
    const rec = {
      id:artworkId, artworkId, artistId:lib.prefix || 'XH', artistName:lib.authorName || '謝秀英', libraryId:lib.libraryId || '',
      artworkTypeId:typeId, artworkTypeName:typeName, subjectIds:'', subjectNames:secondFolder || '',
      titleZh:cleanTitle, titleEn:'', year:'', size:'', materialId:'', material:'', mediumId:'', medium:'',
      collectionStatusId:'AVAILABLE', collectionStatus:'可洽詢', priceNote:'洽詢',
      collectionPrice:'', collectionCurrency:'TWD', collectionPriceVisibility:'隱藏', collectionInfoVisibility:'隱藏', collectorName:'', collectionDate:'',
      isSold:'FALSE', isForSale:'TRUE', allowInquiry:'TRUE', allowPrint:'FALSE', description:'',
      imageUrl:driveImageUrl_(driveFileId, CMS.displaySize), thumbUrl:driveImageUrl_(driveFileId, CMS.thumbSize),
      driveFileId, originalFileName:fileName, drivePath:item.path, fileSize:file.getSize(), mimeType:file.getMimeType(),
      isHomeHero:'FALSE', isFeatured:'TRUE', isPublic:'TRUE', exhibition:'', sort:sh.getLastRow()+newRows.length,
      dataStatus:'待補資料', seoTitle:'', seoDescription:'', createdAt:isoDate_(), updatedAt:isoDate_()
    };
    newRows.push(rowFromRecord_(headers, rec));
  });
  if (newRows.length) sh.getRange(sh.getLastRow()+1,1,newRows.length,headers.length).setValues(newRows);
  formatMuseumCms();
  return {ok:true, scanned:files.length, added:newRows.length, sheetName:lib.sheetName, message:'同步完成：'+lib.libraryName+' 掃描 '+files.length+' 個圖片檔，新增 '+newRows.length+' 件作品。'};
}

function getSiteBundle_() {
  return {
    ok:true, version:CMS.version, updatedAt:isoNow_(),
    settings:getSettings_(), home:getHome_(), announcements:getPublicRows_(CMS.sheets.announcements),
    artworks:getPublicArtworks_(), categories:getPublicRows_(CMS.sheets.artworkTypes), artworkTypes:getPublicRows_(CMS.sheets.artworkTypes),
    subjects:getPublicRows_(CMS.sheets.artworkSubjects), media:getPublicRows_(CMS.sheets.media), materials:getPublicRows_(CMS.sheets.materials),
    currencies:getPublicRows_(CMS.sheets.currencies), collectionStatuses:getPublicRows_(CMS.sheets.collectionStatuses),
    gallery:getPublicRows_(CMS.sheets.gallery), exhibitions:getPublicRows_(CMS.sheets.exhibitions), history:getPublicRows_(CMS.sheets.history), books:getPublicRows_(CMS.sheets.books),
    contact:getContactSettings_(), pages:getPages_(), randomHome:getRandomHomeArtworks_()
  };
}

function fieldLabel_(field) {
  const labels = {
    id:'系統ID', artworkId:'作品編號', artistId:'作者ID', artistName:'作者名稱', libraryId:'作品庫ID',
    artworkTypeId:'作品類型ID', artworkTypeName:'作品類型', subjectIds:'題材ID', subjectNames:'題材',
    titleZh:'中文作品名', titleEn:'英文作品名', year:'年份', size:'尺寸', materialId:'材質ID', material:'材質', mediumId:'媒材ID', medium:'媒材',
    collectionStatusId:'收藏狀態ID', collectionStatus:'收藏狀態', priceNote:'公開價格文字', collectionPrice:'收藏價（後台）', collectionCurrency:'幣別',
    collectionPriceVisibility:'收藏價公開狀態', collectionInfoVisibility:'收藏資訊公開狀態', collectorName:'收藏者', collectionDate:'收藏日期',
    isSold:'是否已售出', isForSale:'是否可販售', allowInquiry:'是否接受洽詢', allowPrint:'是否接受複製畫委託', description:'作品介紹',
    imageUrl:'展示圖網址', thumbUrl:'縮圖網址', driveFileId:'Drive檔案ID', originalFileName:'原始檔名', drivePath:'Drive路徑', fileSize:'檔案大小', mimeType:'檔案類型',
    isHomeHero:'首頁輪播', isFeatured:'精選作品', isPublic:'是否公開', isGallery:'線上藝廊', isShowcase:'作品展示', exhibition:'展覽', sort:'排序', dataStatus:'資料狀態', seoTitle:'SEO標題', seoDescription:'SEO描述',
    createdAt:'建立日期', updatedAt:'更新日期', typeId:'類型ID', nameZh:'中文名稱', nameEn:'英文名稱', prefixHint:'建議前綴', subjectId:'題材ID', mediumId:'媒材ID', materialId:'材質ID', currencyId:'幣別ID', statusId:'狀態ID'
  };
  return labels[field] || field;
}

function scanDuplicateArtworkFiles() {
  const ss = SpreadsheetApp.getActive();
  createDuplicateReportSheet_(ss);
  const libs = getArtworkLibraries_().length ? getArtworkLibraries_() : [getDefaultArtworkLibrary_()];
  const items = [];
  libs.forEach(lib => {
    const folderId = lib.driveFolderId || extractDriveId_(lib.driveFolderUrl || '');
    if (!folderId) return;
    const files = []; collectImageFiles_(DriveApp.getFolderById(folderId), '', files);
    files.forEach(item => {
      const f = item.file;
      items.push({ libraryName:lib.libraryName, drivePath:item.path, fileName:f.getName(), fileId:f.getId(), fileSize:f.getSize(), mimeType:f.getMimeType(), url:'https://drive.google.com/file/d/'+f.getId()+'/view' });
    });
  });
  const groups = {};
  items.forEach(it => {
    const normalizedName = String(it.fileName || '').replace(/\.[^.]+$/,'').replace(/\s|_|-|\(|\)|（|）/g,'').toLowerCase();
    const key = it.fileSize + '::' + normalizedName;
    if (!groups[key]) groups[key] = [];
    groups[key].push(it);
  });
  const h = ['checkedAt','groupKey','reason','libraryName','drivePath','fileName','fileId','fileSize','mimeType','md5','url'];
  const rows = [];
  Object.keys(groups).forEach(key => {
    if (groups[key].length > 1) groups[key].forEach(it => rows.push([new Date(), key, '檔案大小＋近似檔名相同', it.libraryName, it.drivePath, it.fileName, it.fileId, it.fileSize, it.mimeType, '', it.url]));
  });
  // 第二層：只用檔案大小找疑似重複，避免漏掉改名照片。
  const sizeGroups = {};
  items.forEach(it => { const key = String(it.fileSize); if (!sizeGroups[key]) sizeGroups[key]=[]; sizeGroups[key].push(it); });
  Object.keys(sizeGroups).forEach(key => {
    if (sizeGroups[key].length > 1) sizeGroups[key].forEach(it => rows.push([new Date(), 'SIZE:'+key, '檔案大小相同，可能是改名重複圖', it.libraryName, it.drivePath, it.fileName, it.fileId, it.fileSize, it.mimeType, '', it.url]));
  });
  const sh = ss.getSheetByName(CMS.sheets.duplicateReport);
  sh.clear(); sh.getRange(1,1,1,h.length).setValues([h]); sh.getRange(2,1,1,h.length).setValues([h.map(fieldLabel_)]);
  if (rows.length) sh.getRange(3,1,rows.length,h.length).setValues(rows);
  formatMuseumCms();
  SpreadsheetApp.getUi().alert('重複照片檢查完成：掃描 '+items.length+' 個圖片，找到 '+rows.length+' 筆疑似重複紀錄。請查看「重複照片檢查」分頁。');
  return {ok:true, scanned:items.length, duplicateRows:rows.length};
}

function lookupMasterName_(sheetName, keyField, id) {
  if (!id) return '';
  const rows = readTable_(sheetName);
  const found = rows.filter(r => String(r[keyField]) === String(id))[0];
  return found ? (found.nameZh || found.artistNameZh || found.defaultPublicText || '') : '';
}
function inferArtworkTypeId_(value) {
  const s = String(value || '').trim();
  if (/工筆/.test(s)) return 'GB'; if (/膠彩/.test(s)) return 'JC'; if (/寫意/.test(s)) return 'XY'; if (/書法/.test(s)) return 'SF'; if (/收藏|陶|瓷|古董|文物/.test(s)) return 'CL';
  return '';
}
function inferSubjectFromPath_(path) { const parts = String(path || '').split('/').filter(Boolean); return parts.length > 1 ? parts.slice(1).join('/') : ''; }
function inferCollectionStatusId_(value) { const s=String(value||''); if(/售/.test(s)) return 'SOLD'; if(/私人|收藏/.test(s)) return 'PRIVATE'; if(/館藏/.test(s)) return 'MUSEUM'; if(/非賣/.test(s)) return 'NOT_FOR_SALE'; return 'AVAILABLE'; }
function setIfCol_(sh,row,col,value){ if(col>0) sh.getRange(row,col).setValue(value); }
function setDefaultIfBlank_(sh,row,col,value){ if(col<=0) return; const r=sh.getRange(row,col); const cur=r.getValue(); if(cur===''||cur===null) r.setValue(value); }

// 讓管理面板也能編輯主資料。
CMS_ADMIN.editable.artworkTypes = { sheet: CMS.sheets.artworkTypes, key: 'typeId' };
CMS_ADMIN.editable.artworkSubjects = { sheet: CMS.sheets.artworkSubjects, key: 'subjectId' };
CMS_ADMIN.editable.media = { sheet: CMS.sheets.media, key: 'mediumId' };
CMS_ADMIN.editable.materials = { sheet: CMS.sheets.materials, key: 'materialId' };
CMS_ADMIN.editable.artists = { sheet: CMS.sheets.artists, key: 'artistId' };
CMS_ADMIN.editable.collectionStatuses = { sheet: CMS.sheets.collectionStatuses, key: 'statusId' };
CMS_ADMIN.editable.currencies = { sheet: CMS.sheets.currencies, key: 'currencyId' };

/**
 * CMS v6.1 FIX：同步欄位對位修正
 * - 新增作品時依照「目前試算表實際表頭」寫入，不再用固定欄位位置硬塞。
 * - 空作品庫會先重建成 v6 標準欄位順序，避免舊版表頭殘留造成錯位。
 * - Google Drive 檔名只寫入 originalFileName，不寫入 description。
 */
function resetArtworkHeadersIfEmptyV61_(sh, headers) {
  const values = sh.getDataRange().getValues();
  const hasRows = values.length >= 3 && values.slice(2).some(r => r.some(c => c !== ''));
  if (!hasRows) {
    sh.clear();
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(2, 1, 1, headers.length).setValues([headers.map(fieldLabel_)]);
  }
}

function upgradeArtworkSheetByNameV6_(sheetName, prefix, showAlert) {
  const ss = SpreadsheetApp.getActive();
  const standardHeaders = artworkHeaders_();
  const sh = getOrCreateSheet_(ss, sheetName, standardHeaders);
  resetArtworkHeadersIfEmptyV61_(sh, standardHeaders);
  ensureHeaders_(sh, standardHeaders);
  ensureChineseHeaderRow_(sh, standardHeaders);

  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const rows = readTableFromSheet_(sheetName);
  let nextNo = getNextArtworkNoByPrefix_(rows, prefix || 'WK');
  const dataStart = getDataStartRow_(sh);
  const col = name => headers.indexOf(name) + 1;

  for (let i = 0; i < rows.length; i++) {
    const sheetRow = dataStart + i;
    const row = rows[i];
    let artworkId = String(row.artworkId || row.id || '').trim();
    if (!new RegExp('^' + String(prefix || 'WK').toUpperCase() + '\\d{4,}$', 'i').test(artworkId)) {
      artworkId = formatArtworkIdByPrefix_(prefix || 'WK', nextNo++);
    }
    setIfCol_(sh, sheetRow, col('artworkId'), artworkId);
    setIfCol_(sh, sheetRow, col('id'), artworkId);
    setDefaultIfBlank_(sh, sheetRow, col('artistId'), row.artistId || 'XH');
    setDefaultIfBlank_(sh, sheetRow, col('artistName'), row.artistName || row.authorName || '謝秀英');
    setDefaultIfBlank_(sh, sheetRow, col('artworkTypeId'), inferArtworkTypeId_(row.artworkTypeId || row.category || row.drivePath));
    setDefaultIfBlank_(sh, sheetRow, col('artworkTypeName'), lookupMasterName_(CMS.sheets.artworkTypes, 'typeId', row.artworkTypeId || inferArtworkTypeId_(row.category || row.drivePath)));
    setDefaultIfBlank_(sh, sheetRow, col('subjectNames'), row.subjectNames || row.subCategory || inferSubjectFromPath_(row.drivePath));
    setDefaultIfBlank_(sh, sheetRow, col('titleZh'), row.titleZh || cleanFileName_(row.originalFileName || ''));
    setDefaultIfBlank_(sh, sheetRow, col('collectionStatusId'), row.collectionStatusId || inferCollectionStatusId_(row.collectionStatus));
    setDefaultIfBlank_(sh, sheetRow, col('collectionStatus'), row.collectionStatus || lookupMasterName_(CMS.sheets.collectionStatuses, 'statusId', row.collectionStatusId || 'AVAILABLE'));
    setDefaultIfBlank_(sh, sheetRow, col('priceNote'), '洽詢');
    setDefaultIfBlank_(sh, sheetRow, col('collectionCurrency'), 'TWD');
    setDefaultIfBlank_(sh, sheetRow, col('collectionPriceVisibility'), '隱藏');
    setDefaultIfBlank_(sh, sheetRow, col('collectionInfoVisibility'), '隱藏');
    setDefaultIfBlank_(sh, sheetRow, col('isSold'), 'FALSE');
    setDefaultIfBlank_(sh, sheetRow, col('isForSale'), 'TRUE');
    setDefaultIfBlank_(sh, sheetRow, col('allowInquiry'), 'TRUE');
    setDefaultIfBlank_(sh, sheetRow, col('allowPrint'), 'FALSE');
    setDefaultIfBlank_(sh, sheetRow, col('isPublic'), 'TRUE');
    setDefaultIfBlank_(sh, sheetRow, col('dataStatus'), calcArtworkDataStatus_(row));
    setDefaultIfBlank_(sh, sheetRow, col('seoTitle'), buildSeoTitle_(row));
    setDefaultIfBlank_(sh, sheetRow, col('seoDescription'), buildSeoDescription_(row));
    setDefaultIfBlank_(sh, sheetRow, col('updatedAt'), isoDate_());
  }
  if (showAlert) SpreadsheetApp.getUi().alert('完成：' + sheetName + ' 已升級 v6.1。');
}

function syncArtworkLibrary_(lib) {
  if (!lib || !lib.sheetName) throw new Error('找不到作品庫設定。');
  const ss = SpreadsheetApp.getActive();
  createMasterDataSheets_(ss);
  const folderId = lib.driveFolderId || extractDriveId_(lib.driveFolderUrl || '');
  if (!folderId) throw new Error('請先在「作品庫管理」填入雲端資料夾 ID 或網址：' + lib.libraryName);

  const standardHeaders = artworkHeaders_();
  const sh = getOrCreateSheet_(ss, lib.sheetName, standardHeaders);
  resetArtworkHeadersIfEmptyV61_(sh, standardHeaders);
  ensureHeaders_(sh, standardHeaders);
  ensureChineseHeaderRow_(sh, standardHeaders);
  upgradeArtworkSheetByNameV6_(lib.sheetName, lib.prefix || 'WK', false);

  // 重要：用目前試算表實際表頭寫入，避免舊版欄位順序造成錯位。
  const actualHeaders = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const existingRows = readTableFromSheet_(lib.sheetName);
  const existingFileIds = new Set(existingRows.map(r => String(r.driveFileId || '')).filter(Boolean));
  let nextNo = getNextArtworkNoByPrefix_(existingRows, lib.prefix || 'WK');

  const folder = DriveApp.getFolderById(folderId);
  const files = [];
  collectImageFiles_(folder, '', files);
  const newRows = [];

  files.forEach(item => {
    const file = item.file;
    const driveFileId = file.getId();
    if (existingFileIds.has(driveFileId)) return;

    const fileName = file.getName();
    const cleanTitle = cleanFileName_(fileName);
    const parts = item.path ? item.path.split('/').filter(Boolean) : [];
    const firstFolder = parts[0] || '';
    const secondFolder = parts[1] || '';
    const typeId = inferArtworkTypeId_(firstFolder);
    const typeName = lookupMasterName_(CMS.sheets.artworkTypes, 'typeId', typeId) || firstFolder;
    const artworkId = formatArtworkIdByPrefix_(lib.prefix || 'WK', nextNo++);

    const rec = {
      id: artworkId,
      artworkId: artworkId,
      artistId: lib.prefix || 'XH',
      artistName: lib.authorName || '謝秀英',
      libraryId: lib.libraryId || '',
      artworkTypeId: typeId,
      artworkTypeName: typeName,
      subjectIds: '',
      subjectNames: secondFolder || '',
      titleZh: cleanTitle,
      titleEn: '',
      year: '',
      size: '',
      materialId: '',
      material: '',
      mediumId: '',
      medium: '',
      collectionStatusId: 'AVAILABLE',
      collectionStatus: '可洽詢',
      priceNote: '洽詢',
      collectionPrice: '',
      collectionCurrency: 'TWD',
      collectionPriceVisibility: '隱藏',
      collectionInfoVisibility: '隱藏',
      collectorName: '',
      collectionDate: '',
      isSold: 'FALSE',
      isForSale: 'TRUE',
      allowInquiry: 'TRUE',
      allowPrint: 'FALSE',
      description: '',
      imageUrl: driveImageUrl_(driveFileId, CMS.displaySize),
      thumbUrl: driveImageUrl_(driveFileId, CMS.thumbSize),
      driveFileId: driveFileId,
      originalFileName: fileName,
      drivePath: item.path,
      fileSize: file.getSize(),
      mimeType: file.getMimeType(),
      isHomeHero: 'FALSE',
      isFeatured: 'FALSE',
      isPublic: 'TRUE',
      isGallery: 'FALSE',
      isShowcase: 'FALSE',
      exhibition: '',
      sort: sh.getLastRow() + newRows.length,
      dataStatus: '待補資料',
      seoTitle: '',
      seoDescription: '',
      createdAt: isoDate_(),
      updatedAt: isoDate_()
    };
    newRows.push(rowFromRecord_(actualHeaders, rec));
  });

  if (newRows.length) sh.getRange(sh.getLastRow() + 1, 1, newRows.length, actualHeaders.length).setValues(newRows);
  formatMuseumCms();
  return { ok: true, scanned: files.length, added: newRows.length, sheetName: lib.sheetName, message: '同步完成：' + lib.libraryName + ' 掃描 ' + files.length + ' 個圖片檔，新增 ' + newRows.length + ' 件作品。' };
}

/* =========================================================
 * CMS Admin v6.2｜作品庫分頁名稱保護 + 欄位重排修正
 * ---------------------------------------------------------
 * 追加於 v6.1 後方，同名函式會覆蓋前方舊定義。
 * 修正重點：
 * 1. 若使用者把「作品庫」分頁改名成「謝秀英作品庫」，系統會自動更新「作品庫管理」的 sheetName，不再重建舊的「作品庫」。
 * 2. 所有作品庫分頁（包含收藏品作品庫、學生作品庫）都會重排成 v6 標準欄位。
 * 3. 同步時一律先依實際表頭寫入，不再用固定欄位位置。
 * 4. 原始檔名只寫入 originalFileName，不寫入 description。
 * ========================================================= */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('謝秀英藝術館後台')
    .addItem('① 初始化/更新後台資料庫', 'initMuseumCms')
    .addItem('② 從 Google Drive 同步作品清單', 'syncDriveArtworks')
    .addItem('③ 升級/重排所有作品庫欄位', 'upgradeArtworkSheetV6')
    .addItem('④ 建立/更新主資料表', 'createMasterDataSheetsMenu')
    .addItem('⑤ 檢查重複照片', 'scanDuplicateArtworkFiles')
    .addSeparator()
    .addItem('⑥ 開啟 CMS 管理面板', 'showAdminSidebar')
    .addItem('⑦ 重新套用表格格式', 'formatMuseumCms')
    .addToUi();
}

function createMasterDataSheetsMenu() {
  createMasterDataSheets_(SpreadsheetApp.getActive());
  formatMuseumCms();
  SpreadsheetApp.getUi().alert('完成：主資料表已建立/更新。');
}

function getHeaderIndexMap_(headers) {
  const map = {};
  headers.forEach((h, i) => { if (h) map[String(h).trim()] = i + 1; });
  return map;
}

function setCellByHeader_(sheet, rowIndex, headerMap, field, value) {
  const col = headerMap[field];
  if (col) sheet.getRange(rowIndex, col).setValue(value);
}

function getArtworkLibrarySheetNames_() {
  const knownNonArtwork = new Set(Object.values(CMS.sheets).map(String));
  knownNonArtwork.add(CMS.sheets.artworkLibraries);
  knownNonArtwork.add(CMS.sheets.duplicateReport);
  knownNonArtwork.add('工作表1');
  const names = [];
  SpreadsheetApp.getActive().getSheets().forEach(sh => {
    const name = sh.getName();
    if (name === CMS.sheets.artworkLibraries) return;
    if (name.indexOf('作品庫') >= 0 && name !== CMS.sheets.artworkLibraries) names.push(name);
  });
  return names;
}

function createArtworkLibrariesSheet_(ss) {
  upsertTableKeepData_(ss, CMS.sheets.artworkLibraries, CMS_V5.libraryHeaders, [
    rowFromRecord_(CMS_V5.libraryHeaders, {
      libraryId: 'LIB_XH', libraryName: '謝秀英作品庫', sheetName: '謝秀英作品庫',
      authorType: '畫家', authorName: '謝秀英', prefix: 'XH',
      driveFolderId: extractDriveId_('https://drive.google.com/drive/folders/1dOln1soIngAS4ovEMA9S1HhL39o8HYyq'),
      driveFolderUrl: 'https://drive.google.com/drive/folders/1dOln1soIngAS4ovEMA9S1HhL39o8HYyq',
      description: '官方畫家作品庫', isActive: 'TRUE', isPublic: 'TRUE', sort: 1,
      createdAt: isoDate_(), updatedAt: isoDate_()
    })
  ]);
  repairArtworkLibraryRegistry_();
}

function repairArtworkLibraryRegistry_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(CMS.sheets.artworkLibraries);
  if (!sh) return;
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const hmap = getHeaderIndexMap_(headers);
  const rows = readTableFromSheet_(CMS.sheets.artworkLibraries);
  const existingSheetNames = new Set(ss.getSheets().map(s => s.getName()));
  const registeredNames = new Set();

  rows.forEach((lib, idx) => {
    const sheetRow = getDataStartRow_(sh) + idx;
    let sheetName = String(lib.sheetName || '').trim();
    const libraryName = String(lib.libraryName || '').trim();

    if (sheetName && existingSheetNames.has(sheetName)) {
      registeredNames.add(sheetName);
      return;
    }

    // 使用者常見情況：把「作品庫」改名成「謝秀英作品庫」。
    const candidates = [libraryName, '謝秀英作品庫', '收藏品作品庫', '學生作品庫'].filter(Boolean);
    const found = candidates.find(n => existingSheetNames.has(n));
    if (found) {
      setCellByHeader_(sh, sheetRow, hmap, 'sheetName', found);
      setCellByHeader_(sh, sheetRow, hmap, 'updatedAt', isoDate_());
      registeredNames.add(found);
      return;
    }

    // 找不到才建立，不再無條件重建「作品庫」。
    if (!sheetName) sheetName = sanitizeSheetName_(libraryName || '新作品庫');
    if (!existingSheetNames.has(sheetName)) {
      const newSh = ss.insertSheet(sheetName);
      rebuildArtworkSheetColumns_(newSh, artworkHeaders_());
      existingSheetNames.add(sheetName);
    }
    setCellByHeader_(sh, sheetRow, hmap, 'sheetName', sheetName);
    setCellByHeader_(sh, sheetRow, hmap, 'updatedAt', isoDate_());
    registeredNames.add(sheetName);
  });

  // 將已存在但尚未登記的「xxx作品庫」加入作品庫管理，例如收藏品作品庫。
  getArtworkLibrarySheetNames_().forEach(name => {
    if (registeredNames.has(name)) return;
    const prefix = name.indexOf('收藏') >= 0 ? 'CL' : (name.indexOf('學生') >= 0 ? 'ST' : 'XH');
    const authorType = name.indexOf('收藏') >= 0 ? '收藏品' : (name.indexOf('學生') >= 0 ? '學生' : '畫家');
    sh.appendRow(rowFromRecord_(CMS_V5.libraryHeaders, {
      libraryId: buildLibraryId_(prefix, name), libraryName: name, sheetName: name,
      authorType, authorName: name.indexOf('收藏') >= 0 ? '' : '謝秀英', prefix,
      driveFolderId: '', driveFolderUrl: '', description: '', isActive: 'TRUE', isPublic: 'TRUE',
      sort: sh.getLastRow(), createdAt: isoDate_(), updatedAt: isoDate_()
    }));
  });
}

function getArtworkLibraries_() {
  try {
    createArtworkLibrariesSheet_(SpreadsheetApp.getActive());
    repairArtworkLibraryRegistry_();
    return readTableFromSheet_(CMS.sheets.artworkLibraries).filter(l => l.sheetName);
  } catch (e) {
    return [];
  }
}

function getDefaultArtworkLibrary_() {
  const libs = getArtworkLibraries_();
  const xh = libs.filter(l => String(l.libraryId) === 'LIB_XH')[0] || libs.filter(l => String(l.prefix || '').toUpperCase() === 'XH')[0];
  if (xh) return xh;
  const settings = getSettings_();
  return { libraryId: 'LIB_XH', libraryName: '謝秀英作品庫', sheetName: '謝秀英作品庫', authorType: '畫家', authorName: '謝秀英', prefix: 'XH', driveFolderId: settings.driveFolderId || extractDriveId_(settings.driveFolderUrl || ''), driveFolderUrl: settings.driveFolderUrl || '', isActive: true, isPublic: true };
}

function isLikelyChineseHeaderRow_(row) {
  return row.some(v => /中文|作品|檔名|收藏|網址|日期|狀態|作者|類型|題材|媒材|材質|價格|尺寸|年份/.test(String(v || '')));
}

function readRowsAsObjectsFromSheet_(sh) {
  if (!sh || sh.getLastRow() < 1) return [];
  const values = sh.getDataRange().getValues();
  if (!values.length) return [];
  const headers = values[0].map(h => String(h).trim());
  const start = values.length > 1 && isLikelyChineseHeaderRow_(values[1]) ? 2 : 1;
  return values.slice(start).filter(r => r.some(c => c !== '')).map(row => {
    const obj = {};
    headers.forEach((h, i) => { if (h) obj[h] = normalize_(row[i]); });
    return obj;
  });
}

function rebuildArtworkSheetColumns_(sh, standardHeaders) {
  const rows = readRowsAsObjectsFromSheet_(sh);
  sh.clear();
  sh.getRange(1, 1, 1, standardHeaders.length).setValues([standardHeaders]);
  sh.getRange(2, 1, 1, standardHeaders.length).setValues([standardHeaders.map(fieldLabel_)]);
  if (rows.length) {
    const out = rows.map(r => rowFromRecord_(standardHeaders, r));
    sh.getRange(3, 1, out.length, standardHeaders.length).setValues(out);
  }
}

function upgradeArtworkSheetV6(showAlert) {
  const ss = SpreadsheetApp.getActive();
  createMasterDataSheets_(ss);
  createArtworkLibrariesSheet_(ss);
  repairArtworkLibraryRegistry_();
  const libs = getArtworkLibraries_();
  libs.forEach(lib => upgradeArtworkSheetByNameV6_(lib.sheetName, lib.prefix || 'WK', false));
  formatMuseumCms();
  if (showAlert !== false) SpreadsheetApp.getUi().alert('完成：所有作品庫已升級/重排為 v6.2 標準欄位。');
}
function upgradeArtworkSheetV5(showAlert) { return upgradeArtworkSheetV6(showAlert); }
function upgradeArtworkSheetV4(showAlert) { return upgradeArtworkSheetV6(showAlert); }

function upgradeArtworkSheetByNameV6_(sheetName, prefix, showAlert) {
  const ss = SpreadsheetApp.getActive();
  const sh = getOrCreateSheet_(ss, sheetName, artworkHeaders_());
  const standardHeaders = artworkHeaders_();
  rebuildArtworkSheetColumns_(sh, standardHeaders);

  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const rows = readTableFromSheet_(sheetName);
  let nextNo = getNextArtworkNoByPrefix_(rows, prefix || 'WK');
  const dataStart = getDataStartRow_(sh);
  const col = name => headers.indexOf(name) + 1;

  for (let i = 0; i < rows.length; i++) {
    const sheetRow = dataStart + i;
    const row = rows[i];
    let artworkId = String(row.artworkId || row.id || '').trim();
    if (!new RegExp('^' + String(prefix || 'WK').toUpperCase() + '\\d{4,}$', 'i').test(artworkId)) artworkId = formatArtworkIdByPrefix_(prefix || 'WK', nextNo++);
    setIfCol_(sh, sheetRow, col('artworkId'), artworkId);
    setIfCol_(sh, sheetRow, col('id'), artworkId);
    setDefaultIfBlank_(sh, sheetRow, col('artistId'), row.artistId || prefix || 'XH');
    setDefaultIfBlank_(sh, sheetRow, col('artistName'), row.artistName || row.authorName || '謝秀英');
    setDefaultIfBlank_(sh, sheetRow, col('collectionStatusId'), row.collectionStatusId || inferCollectionStatusId_(row.collectionStatus));
    setDefaultIfBlank_(sh, sheetRow, col('collectionStatus'), row.collectionStatus || lookupMasterName_(CMS.sheets.collectionStatuses, 'statusId', row.collectionStatusId || 'AVAILABLE'));
    setDefaultIfBlank_(sh, sheetRow, col('priceNote'), '洽詢');
    setDefaultIfBlank_(sh, sheetRow, col('collectionCurrency'), 'TWD');
    setDefaultIfBlank_(sh, sheetRow, col('collectionPriceVisibility'), '隱藏');
    setDefaultIfBlank_(sh, sheetRow, col('collectionInfoVisibility'), '隱藏');
    setDefaultIfBlank_(sh, sheetRow, col('isSold'), 'FALSE');
    setDefaultIfBlank_(sh, sheetRow, col('isForSale'), 'TRUE');
    setDefaultIfBlank_(sh, sheetRow, col('allowInquiry'), 'TRUE');
    setDefaultIfBlank_(sh, sheetRow, col('allowPrint'), 'FALSE');
    setDefaultIfBlank_(sh, sheetRow, col('isPublic'), 'TRUE');
    setDefaultIfBlank_(sh, sheetRow, col('dataStatus'), calcArtworkDataStatus_(row));
    setDefaultIfBlank_(sh, sheetRow, col('updatedAt'), isoDate_());
  }
  if (showAlert) SpreadsheetApp.getUi().alert('完成：' + sheetName + ' 已升級/重排 v6.2。');
}

function syncDriveArtworks() {
  createArtworkLibrariesSheet_(SpreadsheetApp.getActive());
  repairArtworkLibraryRegistry_();
  const lib = getDefaultArtworkLibrary_();
  const result = syncArtworkLibrary_(lib);
  SpreadsheetApp.getUi().alert(result.message);
  return result;
}

function syncArtworkLibrary_(lib) {
  if (!lib || !lib.sheetName) throw new Error('找不到作品庫設定。');
  const ss = SpreadsheetApp.getActive();
  createMasterDataSheets_(ss);
  repairArtworkLibraryRegistry_();
  const folderId = lib.driveFolderId || extractDriveId_(lib.driveFolderUrl || '');
  if (!folderId) throw new Error('請先在「作品庫管理」填入雲端資料夾 ID 或網址：' + lib.libraryName);

  const sh = getOrCreateSheet_(ss, lib.sheetName, artworkHeaders_());
  rebuildArtworkSheetColumns_(sh, artworkHeaders_());
  upgradeArtworkSheetByNameV6_(lib.sheetName, lib.prefix || 'WK', false);

  const actualHeaders = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const existingRows = readTableFromSheet_(lib.sheetName);
  const existingFileIds = new Set(existingRows.map(r => String(r.driveFileId || '')).filter(Boolean));
  let nextNo = getNextArtworkNoByPrefix_(existingRows, lib.prefix || 'WK');

  const folder = DriveApp.getFolderById(folderId);
  const files = [];
  collectImageFiles_(folder, '', files);
  const newRows = [];

  files.forEach(item => {
    const file = item.file;
    const driveFileId = file.getId();
    if (existingFileIds.has(driveFileId)) return;

    const fileName = file.getName();
    const cleanTitle = cleanFileName_(fileName);
    const parts = item.path ? item.path.split('/').filter(Boolean) : [];
    const firstFolder = parts[0] || '';
    const secondFolder = parts[1] || '';
    const typeId = inferArtworkTypeId_(firstFolder);
    const typeName = lookupMasterName_(CMS.sheets.artworkTypes, 'typeId', typeId) || firstFolder;
    const artworkId = formatArtworkIdByPrefix_(lib.prefix || 'WK', nextNo++);

    const rec = {
      id: artworkId,
      artworkId: artworkId,
      artistId: lib.prefix || 'XH',
      artistName: lib.authorName || '謝秀英',
      libraryId: lib.libraryId || '',
      artworkTypeId: typeId,
      artworkTypeName: typeName,
      subjectIds: '',
      subjectNames: secondFolder || '',
      titleZh: cleanTitle,
      titleEn: '',
      year: '',
      size: '',
      materialId: '',
      material: '',
      mediumId: '',
      medium: '',
      collectionStatusId: 'AVAILABLE',
      collectionStatus: '可洽詢',
      priceNote: '洽詢',
      collectionPrice: '',
      collectionCurrency: 'TWD',
      collectionPriceVisibility: '隱藏',
      collectionInfoVisibility: '隱藏',
      collectorName: '',
      collectionDate: '',
      isSold: 'FALSE',
      isForSale: 'TRUE',
      allowInquiry: 'TRUE',
      allowPrint: 'FALSE',
      description: '',
      imageUrl: driveImageUrl_(driveFileId, CMS.displaySize),
      thumbUrl: driveImageUrl_(driveFileId, CMS.thumbSize),
      driveFileId: driveFileId,
      originalFileName: fileName,
      drivePath: item.path,
      fileSize: file.getSize(),
      mimeType: file.getMimeType(),
      isHomeHero: 'FALSE',
      isFeatured: 'FALSE',
      isPublic: 'TRUE',
      isGallery: 'FALSE',
      isShowcase: 'FALSE',
      exhibition: '',
      sort: sh.getLastRow() + newRows.length,
      dataStatus: '待補資料',
      seoTitle: '',
      seoDescription: '',
      createdAt: isoDate_(),
      updatedAt: isoDate_()
    };
    newRows.push(rowFromRecord_(actualHeaders, rec));
  });

  if (newRows.length) sh.getRange(sh.getLastRow() + 1, 1, newRows.length, actualHeaders.length).setValues(newRows);
  formatMuseumCms();
  return { ok: true, scanned: files.length, added: newRows.length, sheetName: lib.sheetName, message: '同步完成：' + lib.libraryName + ' 掃描 ' + files.length + ' 個圖片檔，新增 ' + newRows.length + ' 件作品。' };
}

/* =========================================================
 * CMS Admin v6.3｜選單安全化 + 作品庫格式/欄寬修正
 * 追加於 v6.2 後方。同名函式覆蓋前方舊定義。
 * 修正重點：
 * 1. 初始化從主選單移除，避免誤按清空/重建資料。
 * 2. 重新套用格式會處理所有分頁，不只 CMS.sheets 內建分頁。
 * 3. 所有「xxx作品庫」分頁都會套用雙列表頭、綠色標題列、欄寬設定。
 * 4. 升級/重排作品欄位會包含已手動改名或新增的收藏品/學生作品庫。
 * ========================================================= */
CMS.version = '6.3.0-formatfix';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('謝秀英藝術館後台')
    .addItem('開啟 CMS 管理面板', 'showAdminSidebar')
    .addSeparator()
    .addItem('① 從 Google Drive 同步作品清單', 'syncDriveArtworks')
    .addItem('② 升級/重排所有作品庫欄位', 'upgradeArtworkSheetV6')
    .addItem('③ 建立/更新主資料表', 'createMasterDataSheetsMenu')
    .addItem('③-1 升級智慧媒材字典（不更動作品）', 'upgradeSmartMediaV73B')
    .addItem('④ 檢查重複照片', 'scanDuplicateArtworkFiles')
    .addItem('⑤ 重新套用表格格式與欄寬', 'formatMuseumCms')
    .addSeparator()
    .addItem('API 測試：查看完整資料包', 'showApiPreview')
    .addItem('API 測試：查看作品隨機抽選', 'showRandomPreview')
    .addToUi();
}

function getAllArtworkSheetNamesForUpgrade_() {
  const ss = SpreadsheetApp.getActive();
  const out = new Set();

  // 作品庫管理登記的 sheetName。
  try {
    createArtworkLibrariesSheet_(ss);
    repairArtworkLibraryRegistry_();
    readTableFromSheet_(CMS.sheets.artworkLibraries).forEach(lib => {
      const n = String(lib.sheetName || '').trim();
      if (n) out.add(n);
    });
  } catch (err) {}

  // 現有分頁名稱含「作品庫」，但排除管理表本身。
  ss.getSheets().forEach(sh => {
    const n = sh.getName();
    if (n.indexOf('作品庫') >= 0 && n !== CMS.sheets.artworkLibraries) out.add(n);
  });

  return Array.from(out).filter(Boolean);
}

function upgradeArtworkSheetV6(showAlert) {
  const ss = SpreadsheetApp.getActive();
  createMasterDataSheets_(ss);
  createArtworkLibrariesSheet_(ss);
  repairArtworkLibraryRegistry_();

  const libs = getArtworkLibraries_();
  const prefixByName = {};
  libs.forEach(lib => { prefixByName[String(lib.sheetName || '').trim()] = String(lib.prefix || 'WK').trim() || 'WK'; });

  getAllArtworkSheetNamesForUpgrade_().forEach(name => {
    let prefix = prefixByName[name];
    if (!prefix) prefix = name.indexOf('收藏') >= 0 ? 'CL' : (name.indexOf('學生') >= 0 ? 'ST' : 'XH');
    upgradeArtworkSheetByNameV6_(name, prefix, false);
  });

  formatMuseumCms();
  if (showAlert !== false) SpreadsheetApp.getUi().alert('完成：所有作品庫已升級/重排欄位，並重新套用格式與欄寬。');
}
function upgradeArtworkSheetV5(showAlert) { return upgradeArtworkSheetV6(showAlert); }
function upgradeArtworkSheetV4(showAlert) { return upgradeArtworkSheetV6(showAlert); }

function isArtworkSheet_(sh) {
  if (!sh) return false;
  const name = sh.getName();
  if (name === CMS.sheets.artworkLibraries) return false;
  if (name.indexOf('作品庫') >= 0) return true;
  if (sh.getLastColumn() < 2) return false;
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(v => String(v || '').trim());
  return headers.indexOf('artworkId') >= 0 && headers.indexOf('driveFileId') >= 0;
}

function hasChineseHeaderRow_(sh) {
  if (!sh || sh.getLastRow() < 2) return false;
  const row = sh.getRange(2, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0];
  return isLikelyChineseHeaderRow_(row);
}

function applyHeaderStyle_(sh, frozenRows) {
  const lastCol = Math.max(sh.getLastColumn(), 1);
  sh.setFrozenRows(frozenRows);
  sh.getRange(1, 1, 1, lastCol)
    .setBackground('#6bc2ba')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('center')
    .setWrap(true);
  if (frozenRows >= 2 && sh.getLastRow() >= 2) {
    sh.getRange(2, 1, 1, lastCol)
      .setBackground('#e9f8f6')
      .setFontColor('#2b5854')
      .setFontWeight('bold')
      .setVerticalAlignment('middle')
      .setHorizontalAlignment('center')
      .setWrap(true);
  }
}

function applyArtworkColumnWidths_(sh) {
  const lastCol = sh.getLastColumn();
  if (lastCol <= 0) return;
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(v => String(v || '').trim());
  const widthMap = {
    id: 88, artworkId: 88, artistId: 70, artistName: 90, libraryId: 95,
    artworkTypeId: 95, artworkTypeName: 95, subjectIds: 90, subjectNames: 110,
    titleZh: 230, titleEn: 220, year: 70, size: 90,
    materialId: 90, material: 95, mediumId: 90, medium: 95,
    collectionStatusId: 115, collectionStatus: 90, priceNote: 105,
    collectionPrice: 110, collectionCurrency: 75, collectionPriceVisibility: 130,
    collectionInfoVisibility: 130, collectorName: 120, collectorNote: 160, collectionDate: 105,
    isSold: 80, isForSale: 90, allowInquiry: 95, allowPrint: 95,
    description: 260, imageUrl: 260, thumbUrl: 260, driveFileId: 190,
    originalFileName: 260, drivePath: 180, fileSize: 90, mimeType: 130,
    isHomeHero: 90, isFeatured: 90, isPublic: 80, isGallery: 90, isShowcase: 90, exhibition: 120, sort: 65,
    dataStatus: 95, seoTitle: 180, seoDescription: 260, createdAt: 105, updatedAt: 105
  };
  headers.forEach((h, idx) => {
    sh.setColumnWidth(idx + 1, widthMap[h] || 100);
  });
}

function formatMuseumCms() {
  const ss = SpreadsheetApp.getActive();
  ss.getSheets().forEach(sh => {
    const isArtwork = isArtworkSheet_(sh);
    const hasCn = hasChineseHeaderRow_(sh);
    const frozenRows = (isArtwork || hasCn) ? 2 : 1;
    applyHeaderStyle_(sh, frozenRows);

    if (isArtwork) {
      applyArtworkColumnWidths_(sh);
    } else {
      // 其他分頁避免大量 autoResize 造成 Apps Script 超時，只做適中欄寬。
      const lastCol = Math.max(sh.getLastColumn(), 1);
      for (let c = 1; c <= lastCol; c++) {
        const current = sh.getColumnWidth(c);
        if (current < 90) sh.setColumnWidth(c, 110);
        if (current > 320) sh.setColumnWidth(c, 260);
      }
    }

    const range = sh.getDataRange();
    if (range) range.setWrap(true).setVerticalAlignment('top');
  });
  SpreadsheetApp.getUi().alert('完成：已重新套用所有分頁格式與欄寬。');
}

/* =========================================================
 * CMS Admin v6.4｜升級超時修正 + 輕量格式化
 * 追加於 v6.3 後方。同名函式覆蓋前方舊定義。
 * 修正重點：
 * 1. 升級作品欄位時不再自動重刷全工作簿格式，避免「執行時間已達上限」。
 * 2. 重新套用格式改成輕量版，只處理表頭、凍結列與必要欄寬。
 * 3. 分開提供「目前分頁格式化」與「全部分頁輕量格式化」。
 * 4. 保留初始化隱藏，不放主選單。
 * ========================================================= */
CMS.version = '6.4.0-timeoutfix';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('謝秀英藝術館後台')
    .addItem('開啟 CMS 管理面板', 'showAdminSidebar')
    .addSeparator()
    .addItem('① 從 Google Drive 同步作品清單', 'syncDriveArtworks')
    .addItem('② 升級/重排所有作品庫欄位（不重刷格式）', 'upgradeArtworkSheetV6')
    .addItem('③ 建立/更新主資料表', 'createMasterDataSheetsMenu')
    .addItem('③-1 升級智慧媒材字典（不更動作品）', 'upgradeSmartMediaV73B')
    .addItem('④ 檢查重複照片', 'scanDuplicateArtworkFiles')
    .addSeparator()
    .addItem('⑤ 格式化目前分頁', 'formatActiveSheetOnly')
    .addItem('⑥ 全部分頁輕量格式化', 'formatMuseumCms')
    .addSeparator()
    .addItem('API 測試：查看完整資料包', 'showApiPreview')
    .addItem('API 測試：查看作品隨機抽選', 'showRandomPreview')
    .addToUi();
}

function upgradeArtworkSheetV6(showAlert) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  createMasterDataSheets_(ss);
  createArtworkLibrariesSheet_(ss);
  repairArtworkLibraryRegistry_();

  const libs = getArtworkLibraries_();
  const prefixByName = {};
  libs.forEach(lib => { prefixByName[String(lib.sheetName || '').trim()] = String(lib.prefix || 'WK').trim() || 'WK'; });

  const names = getAllArtworkSheetNamesForUpgrade_();
  names.forEach(name => {
    let prefix = prefixByName[name];
    if (!prefix) prefix = name.indexOf('收藏') >= 0 ? 'CL' : (name.indexOf('學生') >= 0 ? 'ST' : 'XH');
    upgradeArtworkSheetByNameV6_(name, prefix, false);
    const sh = ss.getSheetByName(name);
    if (sh) applyLightFormatToSheet_(sh);
  });

  SpreadsheetApp.flush();
  if (showAlert !== false) SpreadsheetApp.getUi().alert('完成：所有作品庫已升級/重排欄位。若顏色或欄寬未更新，請再執行「全部分頁輕量格式化」。');
}
function upgradeArtworkSheetV5(showAlert) { return upgradeArtworkSheetV6(showAlert); }
function upgradeArtworkSheetV4(showAlert) { return upgradeArtworkSheetV6(showAlert); }

function formatActiveSheetOnly() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  applyLightFormatToSheet_(sh);
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('完成：已格式化目前分頁「' + sh.getName() + '」。');
}

function formatMuseumCms() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  sheets.forEach(sh => applyLightFormatToSheet_(sh));
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('完成：已輕量格式化所有分頁。');
}

function applyLightFormatToSheet_(sh) {
  if (!sh || sh.getLastColumn() < 1) return;
  const lastCol = Math.min(sh.getLastColumn(), 60);
  const isArtwork = isArtworkSheet_(sh);
  const frozenRows = (isArtwork || hasChineseHeaderRow_(sh)) ? 2 : 1;

  sh.setFrozenRows(frozenRows);
  sh.getRange(1, 1, 1, lastCol)
    .setBackground('#6bc2ba')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('center')
    .setWrap(true);

  if (frozenRows >= 2 && sh.getLastRow() >= 2) {
    sh.getRange(2, 1, 1, lastCol)
      .setBackground('#e9f8f6')
      .setFontColor('#2b5854')
      .setFontWeight('bold')
      .setVerticalAlignment('middle')
      .setHorizontalAlignment('center')
      .setWrap(true);
  }

  if (isArtwork) {
    applyArtworkColumnWidthsSafe_(sh);
  } else {
    for (let c = 1; c <= lastCol; c++) {
      const current = sh.getColumnWidth(c);
      if (current < 80 || current > 260) sh.setColumnWidth(c, 120);
    }
  }
}

function applyArtworkColumnWidthsSafe_(sh) {
  const lastCol = Math.min(sh.getLastColumn(), 60);
  if (lastCol <= 0) return;
  const headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(v => String(v || '').trim());
  const widthMap = {
    id: 82, artworkId: 92, artistId: 70, artistName: 90, libraryId: 95,
    artworkTypeId: 95, artworkTypeName: 100, subjectIds: 90, subjectNames: 110,
    titleZh: 260, titleEn: 220, year: 70, size: 90,
    materialId: 90, material: 95, mediumId: 90, medium: 95,
    collectionStatusId: 115, collectionStatus: 90, priceNote: 105,
    collectionPrice: 110, collectionCurrency: 75, collectionPriceVisibility: 130,
    collectionInfoVisibility: 130, collectorName: 120, collectorNote: 160, collectionDate: 105,
    isSold: 80, isForSale: 90, allowInquiry: 95, allowPrint: 95,
    description: 260, imageUrl: 260, thumbUrl: 260, driveFileId: 190,
    originalFileName: 260, drivePath: 180, fileSize: 90, mimeType: 130,
    isHomeHero: 90, isFeatured: 90, isPublic: 80, isGallery: 90, isShowcase: 90, exhibition: 120, sort: 65,
    dataStatus: 95, seoTitle: 180, seoDescription: 260, createdAt: 105, updatedAt: 105
  };
  headers.forEach((h, idx) => sh.setColumnWidth(idx + 1, widthMap[h] || 100));
}



/**
 * CMS v7.3-B｜智慧媒材主資料升級
 * 只重建「媒材管理」字典並補齊作品類型預設對照；不修改任何作品資料。
 */
function upgradeSmartMediaV73B() {
  const ss = SpreadsheetApp.getActive();
  const mediaName = CMS.sheets.media;
  let mediaSheet = ss.getSheetByName(mediaName);
  if (!mediaSheet) mediaSheet = ss.insertSheet(mediaName);
  mediaSheet.clear();
  const h = ['mediumId', 'nameZh', 'nameEn', 'description', 'isPublic', 'sort', 'createdAt', 'updatedAt'];
  const rows = [
    {mediumId:'INK',nameZh:'墨',nameEn:'Chinese Ink',description:'書畫用墨汁或墨條研墨',isPublic:'TRUE',sort:1},
    {mediumId:'MINERAL',nameZh:'礦岩',nameEn:'Mineral Pigment',description:'天然或人工礦物顏料',isPublic:'TRUE',sort:2},
    {mediumId:'SUIGAN',nameZh:'水干',nameEn:'Suigan Pigment',description:'水干顏料',isPublic:'TRUE',sort:3},
    {mediumId:'GLUE',nameZh:'膠',nameEn:'Animal Glue',description:'膠彩用膠媒介',isPublic:'TRUE',sort:4},
    {mediumId:'CHINESE_COLOR',nameZh:'國畫顏料',nameEn:'Chinese Painting Pigment',description:'國畫用顏料',isPublic:'TRUE',sort:5},
    {mediumId:'WATERCOLOR',nameZh:'水彩顏料',nameEn:'Watercolor Pigment',description:'水彩顏料',isPublic:'TRUE',sort:6}
  ].map(r => rowFromRecord_(h, Object.assign(r,{createdAt:isoDate_(),updatedAt:isoDate_()})));
  mediaSheet.getRange(1,1,1,h.length).setValues([h]);
  mediaSheet.getRange(2,1,1,h.length).setValues([h.map(x => ({mediumId:'媒材ID',nameZh:'中文名稱',nameEn:'英文名稱',description:'說明',isPublic:'是否啟用',sort:'排序',createdAt:'建立日期',updatedAt:'更新日期'}[x] || x))]);
  mediaSheet.getRange(3,1,rows.length,h.length).setValues(rows);
  mediaSheet.setFrozenRows(2);
  mediaSheet.getRange(1,1,1,h.length).setBackground('#6bc2ba').setFontColor('#ffffff').setFontWeight('bold');
  mediaSheet.getRange(2,1,1,h.length).setBackground('#dff2ef').setFontWeight('bold');

  createArtworkTypesSheet_(ss);
  createMaterialsSheet_(ss);
  CacheService.getScriptCache().removeAll(['v72b_admin_meta','v72a_all_artworks']);
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('完成：智慧媒材字典與作品類型預設對照已更新。現有作品的媒材資料完全沒有被更動。');
}

/* =========================================================
 * CMS v7｜官網後台 API 寫入支援
 * - adminUpdateArtwork：更新單筆作品資料
 * - 需在「網站設定」新增 key=adminWriteToken，value=自訂密鑰
 * ========================================================= */
function getAdminWriteToken_() {
  const kv = readKeyValue_(CMS.sheets.settings);
  return String(kv.adminWriteToken || '').trim();
}
function assertAdminToken_(token) {
  const saved = getAdminWriteToken_();
  if (!saved) throw new Error('尚未設定 adminWriteToken。請先在「網站設定」新增 adminWriteToken 後再開放寫入。');
  if (String(token || '').trim() !== saved) throw new Error('管理 Token 錯誤，拒絕寫入。');
}
function adminValidateToken_(token) {
  assertAdminToken_(token);
  return { ok:true, valid:true, version:CMS.version, verifiedAt:isoNow_() };
}
function adminApiUpdateArtwork_(token, data) {
  assertAdminToken_(token);
  const artworkId = String(data.artworkId || data.id || '').trim();
  if (!artworkId) throw new Error('缺少 artworkId');
  const libs = getArtworkLibraries_();
  const allowed = ['titleZh','titleEn','year','size','materialId','material','mediumId','medium','artworkTypeId','artworkTypeName','subjectIds','subjectNames','description','collectionStatusId','collectionStatus','priceNote','collectionPrice','collectionCurrency','collectionPriceVisibility','collectionInfoVisibility','collectorName','collectionDate','isSold','isForSale','allowInquiry','allowPrint','isHomeHero','isFeatured','isPublic','isGallery','isShowcase','exhibition','sort','dataStatus','seoTitle','seoDescription'];
  for (let li=0; li<libs.length; li++) {
    const sh = SpreadsheetApp.getActive().getSheetByName(libs[li].sheetName);
    if (!sh || sh.getLastRow() < 3) continue;
    const values = sh.getDataRange().getValues();
    const headers = values[0].map(h => String(h).trim());
    const map = getHeaderIndexMap_(headers);
    const idCol = map.artworkId || map.id;
    if (!idCol) continue;
    for (let r=2; r<values.length; r++) {
      if (String(values[r][idCol-1]).trim() === artworkId) {
        allowed.forEach(k => { if (Object.prototype.hasOwnProperty.call(data, k)) setCellByHeader_(sh, r+1, map, k, data[k]); });
        setCellByHeader_(sh, r+1, map, 'updatedAt', isoDate_());
        CacheService.getScriptCache().removeAll(['v72a_all_artworks','v72b_admin_meta','v72a_art_'+artworkId]);
        return { ok:true, message:'已更新作品 '+artworkId, artworkId: artworkId, sheetName: libs[li].sheetName };
      }
    }
  }
  throw new Error('找不到作品：' + artworkId);
}


function adminApiBatchUpdateArtworks_(token, data) {
  assertAdminToken_(token);
  const ids = Array.isArray(data.artworkIds) ? data.artworkIds.map(v => String(v || '').trim()).filter(Boolean) : [];
  const patch = data.patch && typeof data.patch === 'object' ? data.patch : {};
  if (!ids.length) throw new Error('沒有選取任何作品');
  if (ids.length > 500) throw new Error('單次最多批次更新 500 件作品');
  const allowed = ['artworkTypeId','artworkTypeName','subjectIds','subjectNames','materialId','material','mediumId','medium','collectionStatusId','collectionStatus','isPublic','isHomeHero','isFeatured','isGallery','isShowcase'];
  const clean = {};
  allowed.forEach(k => { if (Object.prototype.hasOwnProperty.call(patch, k)) clean[k] = patch[k]; });
  if (!Object.keys(clean).length) throw new Error('沒有可更新的欄位');
  const wanted = new Set(ids);
  const updated = [];
  const libs = getArtworkLibraries_();
  libs.forEach(lib => {
    const sh = SpreadsheetApp.getActive().getSheetByName(lib.sheetName);
    if (!sh || sh.getLastRow() < 3) return;
    const values = sh.getDataRange().getValues();
    const headers = values[0].map(h => String(h || '').trim());
    const map = getHeaderIndexMap_(headers);
    const idCol = map.artworkId || map.id;
    if (!idCol) return;
    const touchedRows = [];
    for (let r = 2; r < values.length; r++) {
      const id = String(values[r][idCol - 1] || '').trim();
      if (!wanted.has(id)) continue;
      Object.keys(clean).forEach(k => {
        const col = map[k];
        if (col) values[r][col - 1] = clean[k];
      });
      if (map.updatedAt) values[r][map.updatedAt - 1] = isoDate_();
      touchedRows.push(r + 1);
      updated.push(id);
    }
    if (touchedRows.length) {
      const minRow = Math.min.apply(null, touchedRows);
      const maxRow = Math.max.apply(null, touchedRows);
      const slice = values.slice(minRow - 1, maxRow);
      sh.getRange(minRow, 1, slice.length, headers.length).setValues(slice);
    }
  });
  const cache = CacheService.getScriptCache();
  cache.removeAll(['v72a_all_artworks','v72b_admin_meta'].concat(updated.map(id => 'v72a_art_' + id)));
  return {ok:true, updatedCount:updated.length, artworkIds:updated};
}


/* =========================================================
 * CMS v7.2-A｜效能核心 API
 * 1. artworksPage：分頁、搜尋、篩選，只回傳卡片需要的輕量欄位
 * 2. artwork：只讀單一作品，不再下載全部作品
 * 3. 使用 CacheService 短暫快取，降低重複讀取試算表
 * ========================================================= */
CMS.version = '7.2-A-performance';

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = String(params.action || 'siteBundle').trim();
  let payload;
  try {
    if (action === 'ping') payload = { ok:true, version:CMS.version, time:isoNow_() };
    else if (action === 'artworksPage') payload = getAdminArtworkPageV72_(params);
    else if (action === 'artwork') payload = getAdminArtworkV72_(params.id || params.artworkId);
    else if (action === 'siteBundle') payload = getSiteBundle_();
    else if (action === 'settings') payload = { ok:true, settings:getSettings_() };
    else if (action === 'home') payload = { ok:true, home:getHome_() };
    else if (action === 'artworks') payload = { ok:true, artworks:getAllAdminArtworksV72_() };
    else if (action === 'randomHome') payload = { ok:true, randomHome:getRandomHomeArtworks_() };
    else if (action === 'news') payload = { ok:true, announcements:getPublicRows_(CMS.sheets.announcements) };
    else if (action === 'pages') payload = { ok:true, pages:getPages_() };
    else payload = { ok:false, error:'Unknown action: ' + action };
  } catch (err) {
    payload = { ok:false, error:String(err && err.message ? err.message : err) };
  }
  return json_(payload);
}

function getAllAdminArtworksV72_() {
  const cache = CacheService.getScriptCache();
  const key = 'v72a_all_artworks';
  const cached = cache.get(key);
  if (cached) {
    try { return JSON.parse(cached); } catch (err) {}
  }
  const out = [];
  const libs = getArtworkLibraries_();
  libs.forEach(lib => {
    const sh = SpreadsheetApp.getActive().getSheetByName(lib.sheetName);
    if (!sh || sh.getLastRow() < 3 || sh.getLastColumn() < 1) return;
    const values = sh.getDataRange().getValues();
    const headers = values[0].map(h => String(h || '').trim());
    for (let r = 2; r < values.length; r++) {
      const row = {};
      headers.forEach((h,c) => { if (h) row[h] = normalizeApiCellV72_(values[r][c]); });
      if (!String(row.artworkId || row.id || '').trim()) return;
      row.librarySheetName = lib.sheetName;
      out.push(row);
    }
  });
  try {
    const raw = JSON.stringify(out);
    if (raw.length < 95000) cache.put(key, raw, 120);
  } catch (err) {}
  return out;
}

function getAdminArtworkPageV72_(params) {
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(10, parseInt(params.pageSize || '24', 10) || 24));
  const q = String(params.q || '').trim().toLowerCase();
  const filter = String(params.filter || '').trim();
  const artistId = String(params.artistId || '').trim();
  const libraryId = String(params.libraryId || '').trim();

  let list = getAllAdminArtworksV72_().filter(a => {
    if (artistId && String(a.artistId || '') !== artistId) return false;
    if (libraryId && String(a.libraryId || '') !== libraryId) return false;
    if (q) {
      const hay = [a.artworkId,a.id,a.titleZh,a.titleEn,a.artistName,a.originalFileName]
        .map(v => String(v || '')).join(' ').toLowerCase();
      if (hay.indexOf(q) < 0) return false;
    }
    if (filter === 'missing' && String(a.dataStatus || '').indexOf('待補') < 0) return false;
    if (filter === 'featured' && !truthyV72_(a.isFeatured)) return false;
    if (filter === 'hero' && !truthyV72_(a.isHomeHero)) return false;
    if (filter === 'public' && !truthyV72_(a.isPublic)) return false;
    if (filter === 'hidden' && truthyV72_(a.isPublic)) return false;
    if (filter === 'gallery' && !truthyV72_(a.isGallery)) return false;
    if (filter === 'showcase' && !truthyV72_(a.isShowcase)) return false;
    return true;
  });

  const total = list.length;
  const start = (page - 1) * pageSize;
  const slice = list.slice(start, start + pageSize).map(lightArtworkV72_);
  return {
    ok:true, version:CMS.version, page:page, pageSize:pageSize, total:total,
    hasMore:start + slice.length < total, artworks:slice
  };
}

function getAdminArtworkV72_(id) {
  const target = String(id || '').trim();
  if (!target) throw new Error('缺少作品 ID');
  const cache = CacheService.getScriptCache();
  const key = 'v72a_art_' + target;
  const cached = cache.get(key);
  if (cached) {
    try { return {ok:true, version:CMS.version, artwork:JSON.parse(cached)}; } catch (err) {}
  }
  const all = getAllAdminArtworksV72_();
  const found = all.find(a => String(a.artworkId || a.id || '').trim() === target);
  if (!found) throw new Error('找不到作品：' + target);
  try {
    const raw = JSON.stringify(found);
    if (raw.length < 90000) cache.put(key, raw, 300);
  } catch (err) {}
  return {ok:true, version:CMS.version, artwork:found};
}

function lightArtworkV72_(a) {
  return {
    id:a.id || a.artworkId || '',
    artworkId:a.artworkId || a.id || '',
    artistId:a.artistId || '',
    artistName:a.artistName || '',
    libraryId:a.libraryId || '',
    titleZh:a.titleZh || '',
    titleEn:a.titleEn || '',
    year:a.year || '',
    size:a.size || '',
    artworkTypeName:a.artworkTypeName || '',
    originalFileName:a.originalFileName || '',
    thumbUrl:a.thumbUrl || a.imageUrl || '',
    imageUrl:a.imageUrl || a.thumbUrl || '',
    dataStatus:a.dataStatus || '',
    isFeatured:a.isFeatured,
    isHomeHero:a.isHomeHero,
    isPublic:a.isPublic,
    isGallery:a.isGallery,
    isShowcase:a.isShowcase
  };
}

function normalizeApiCellV72_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, CMS.timezone || 'Asia/Taipei', 'yyyy-MM-dd');
  return v;
}
function truthyV72_(v) {
  return v === true || String(v || '').toUpperCase() === 'TRUE' || String(v || '') === '是';
}


/* =========================================================
 * CMS v7.2-B｜單頁試算表管理 API
 * - adminMeta：回傳作者／作品庫與所有主資料下拉選單
 * - artworksPage：補足資料表模式需要的欄位
 * ========================================================= */
CMS.version = '7.2-C-batch-manager';

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = String(params.action || 'siteBundle').trim();
  let payload;
  try {
    if (action === 'ping') payload = { ok:true, version:CMS.version, time:isoNow_() };
    else if (action === 'artworksPage') payload = getAdminArtworkPageV72_(params);
    else if (action === 'artwork') payload = getAdminArtworkV72_(params.id || params.artworkId);
    else if (action === 'adminMeta') payload = getAdminMetaV72B_();
    else if (action === 'siteBundle') payload = getSiteBundle_();
    else if (action === 'settings') payload = { ok:true, settings:getSettings_() };
    else if (action === 'home') payload = { ok:true, home:getHome_() };
    else if (action === 'artworks') payload = { ok:true, artworks:getAllAdminArtworksV72_() };
    else if (action === 'randomHome') payload = { ok:true, randomHome:getRandomHomeArtworks_() };
    else if (action === 'news') payload = { ok:true, announcements:getPublicRows_(CMS.sheets.announcements) };
    else if (action === 'pages') payload = { ok:true, pages:getPages_() };
    else payload = { ok:false, error:'Unknown action: ' + action };
  } catch (err) {
    payload = { ok:false, error:String(err && err.message ? err.message : err) };
  }
  return json_(payload);
}

function getAdminMetaV72B_() {
  const cache = CacheService.getScriptCache();
  const key = 'v72b_admin_meta';
  const cached = cache.get(key);
  if (cached) {
    try { return JSON.parse(cached); } catch (err) {}
  }
  const payload = {
    ok:true,
    version:CMS.version,
    libraries:getArtworkLibraries_().map(lib => ({
      libraryId:String(lib.libraryId || ''),
      libraryName:String(lib.libraryName || lib.sheetName || ''),
      sheetName:String(lib.sheetName || ''),
      authorName:String(lib.authorName || ''),
      prefix:String(lib.prefix || '')
    })),
    artists:readTable_(CMS.sheets.artists),
    artworkTypes:readTable_(CMS.sheets.artworkTypes).filter(r => truthyV72_(r.isPublic) || r.isPublic === '' || r.isPublic == null),
    subjects:readTable_(CMS.sheets.artworkSubjects).filter(r => truthyV72_(r.isPublic) || r.isPublic === '' || r.isPublic == null),
    media:readTable_(CMS.sheets.media).filter(r => truthyV72_(r.isPublic) || r.isPublic === '' || r.isPublic == null),
    materials:readTable_(CMS.sheets.materials).filter(r => truthyV72_(r.isPublic) || r.isPublic === '' || r.isPublic == null),
    currencies:readTable_(CMS.sheets.currencies).filter(r => truthyV72_(r.isPublic) || r.isPublic === '' || r.isPublic == null),
    collectionStatuses:readTable_(CMS.sheets.collectionStatuses).filter(r => truthyV72_(r.isPublic) || r.isPublic === '' || r.isPublic == null)
  };
  try {
    const raw = JSON.stringify(payload);
    if (raw.length < 95000) cache.put(key, raw, 600);
  } catch (err) {}
  return payload;
}

function lightArtworkV72_(a) {
  return {
    id:a.id || a.artworkId || '',
    artworkId:a.artworkId || a.id || '',
    artistId:a.artistId || '',
    artistName:a.artistName || '',
    libraryId:a.libraryId || '',
    titleZh:a.titleZh || '',
    titleEn:a.titleEn || '',
    year:a.year || '',
    size:a.size || '',
    artworkTypeId:a.artworkTypeId || '',
    artworkTypeName:a.artworkTypeName || '',
    subjectIds:a.subjectIds || '',
    subjectNames:a.subjectNames || '',
    materialId:a.materialId || '',
    material:a.material || '',
    mediumId:a.mediumId || '',
    medium:a.medium || '',
    collectionStatusId:a.collectionStatusId || '',
    collectionStatus:a.collectionStatus || '',
    originalFileName:a.originalFileName || '',
    thumbUrl:a.thumbUrl || a.imageUrl || '',
    imageUrl:a.imageUrl || a.thumbUrl || '',
    dataStatus:a.dataStatus || '',
    isFeatured:a.isFeatured,
    isHomeHero:a.isHomeHero,
    isPublic:a.isPublic,
    isGallery:a.isGallery,
    isShowcase:a.isShowcase
  };
}


/* =========================================================
 * CMS v7.2-D｜統一排序中心
 * - 四個展示區共用同一張「網站展示配置」表
 * - 已勾選作品一定有順位；新勾選作品自動補到最後
 * - 排序中心只允許拖曳／上下移動，不開放手填順位
 * ========================================================= */
CMS.version = '7.3-C-excel-manager';
CMS.sheets.displayConfig = '網站展示配置';

const CMS_DISPLAY_SECTIONS = {
  homeHero: { flag:'isHomeHero', label:'首頁輪播' },
  featured: { flag:'isFeatured', label:'精選作品' },
  gallery: { flag:'isGallery', label:'線上藝廊' },
  showcase: { flag:'isShowcase', label:'作品展示' }
};

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = String(params.action || 'siteBundle').trim();
  let payload;
  try {
    if (action === 'ping') payload = { ok:true, version:CMS.version, time:isoNow_() };
    else if (action === 'artworksPage') payload = getAdminArtworkPageV72_(params);
    else if (action === 'artwork') payload = getAdminArtworkV72_(params.id || params.artworkId);
    else if (action === 'adminMeta') payload = getAdminMetaV72B_();
    else if (action === 'displayOrder') payload = getDisplayOrderV72D_(params.section || 'homeHero');
    else if (action === 'siteBundle') payload = getSiteBundle_();
    else if (action === 'settings') payload = { ok:true, settings:getSettings_() };
    else if (action === 'home') payload = { ok:true, home:getHome_() };
    else if (action === 'artworks') payload = { ok:true, artworks:getAllAdminArtworksV72_() };
    else if (action === 'randomHome') payload = { ok:true, randomHome:getRandomHomeArtworks_() };
    else if (action === 'news') payload = { ok:true, announcements:getPublicRows_(CMS.sheets.announcements) };
    else if (action === 'pages') payload = { ok:true, pages:getPages_() };
    else payload = { ok:false, error:'Unknown action: ' + action };
  } catch (err) {
    payload = { ok:false, error:String(err && err.message ? err.message : err) };
  }
  return json_(payload);
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e && e.postData && e.postData.contents ? e.postData.contents : '{}'); }
  catch (err) { return json_({ ok:false, error:'JSON 格式錯誤' }); }
  try {
    if (body.action === 'contact') return json_(saveContactResponse_(body.data || {}));
    if (body.action === 'adminValidateToken') return json_(adminValidateToken_(body.token));
    if (body.action === 'adminUpdateArtwork') return json_(adminApiUpdateArtwork_(body.token, body.data || {}));
    if (body.action === 'adminBatchUpdateArtworks') return json_(adminApiBatchUpdateArtworks_(body.token, body.data || {}));
    if (body.action === 'saveDisplayOrder') return json_(saveDisplayOrderV72D_(body.token, body.data || {}));
    return json_({ ok:false, error:'Unknown action' });
  } catch (err) {
    return json_({ ok:false, error:String(err && err.message ? err.message : err) });
  }
}

function ensureDisplayConfigSheetV72D_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(CMS.sheets.displayConfig);
  const headers = ['section','artworkId','sort','updatedAt'];
  const labels = ['展示區','作品編號','排序','更新時間'];
  if (!sh) sh = ss.insertSheet(CMS.sheets.displayConfig);
  if (sh.getLastRow() < 2 || sh.getLastColumn() < headers.length) {
    sh.clear();
    sh.getRange(1,1,2,headers.length).setValues([headers,labels]);
  } else {
    const current = sh.getRange(1,1,1,Math.max(sh.getLastColumn(),headers.length)).getValues()[0];
    if (headers.some((h,i)=>String(current[i]||'').trim() !== h)) {
      const old = readDisplayConfigRowsV72D_(sh);
      sh.clear();
      sh.getRange(1,1,2,headers.length).setValues([headers,labels]);
      if (old.length) sh.getRange(3,1,old.length,headers.length).setValues(old.map(r=>[r.section,r.artworkId,r.sort,r.updatedAt||'']));
    }
  }
  sh.setFrozenRows(2);
  sh.getRange(1,1,1,headers.length).setBackground('#6bc2ba').setFontColor('#ffffff').setFontWeight('bold');
  sh.getRange(2,1,1,headers.length).setBackground('#dff2ef').setFontWeight('bold');
  sh.setColumnWidth(1,120);sh.setColumnWidth(2,120);sh.setColumnWidth(3,70);sh.setColumnWidth(4,150);
  return sh;
}

function readDisplayConfigRowsV72D_(sh) {
  sh = sh || SpreadsheetApp.getActive().getSheetByName(CMS.sheets.displayConfig);
  if (!sh || sh.getLastRow() < 3) return [];
  const values = sh.getRange(1,1,sh.getLastRow(),Math.max(sh.getLastColumn(),4)).getValues();
  const headers = values[0].map(v=>String(v||'').trim());
  const map = {}; headers.forEach((h,i)=>{if(h)map[h]=i;});
  return values.slice(2).filter(r=>String(r[map.artworkId]||'').trim()).map(r=>({
    section:String(r[map.section]||'').trim(), artworkId:String(r[map.artworkId]||'').trim(),
    sort:Number(r[map.sort]||0), updatedAt:r[map.updatedAt]||''
  }));
}

function getSelectedArtworkIdsV72D_(section) {
  const cfg = CMS_DISPLAY_SECTIONS[section];
  if (!cfg) throw new Error('未知展示區：' + section);
  return getAllAdminArtworksV72_().filter(a=>truthyV72_(a[cfg.flag])).map(a=>String(a.artworkId||a.id||'').trim()).filter(Boolean);
}

function reconcileDisplayOrderV72D_(section) {
  const sh = ensureDisplayConfigSheetV72D_();
  const selected = getSelectedArtworkIdsV72D_(section);
  const selectedSet = new Set(selected);
  const allRows = readDisplayConfigRowsV72D_(sh);
  const sectionRows = allRows.filter(r=>r.section===section && selectedSet.has(r.artworkId)).sort((a,b)=>(a.sort||999999)-(b.sort||999999));
  const ordered = [];
  const seen = new Set();
  sectionRows.forEach(r=>{if(!seen.has(r.artworkId)){ordered.push(r.artworkId);seen.add(r.artworkId);}});
  selected.forEach(id=>{if(!seen.has(id)){ordered.push(id);seen.add(id);}});
  writeDisplaySectionV72D_(section, ordered, allRows.filter(r=>r.section!==section));
  return ordered;
}

function writeDisplaySectionV72D_(section, orderedIds, otherRows) {
  const sh = ensureDisplayConfigSheetV72D_();
  const rows = (otherRows || readDisplayConfigRowsV72D_(sh).filter(r=>r.section!==section)).map(r=>[r.section,r.artworkId,r.sort,r.updatedAt||'']);
  orderedIds.forEach((id,i)=>rows.push([section,id,i+1,new Date()]));
  if (sh.getLastRow() > 2) sh.getRange(3,1,sh.getLastRow()-2,Math.max(sh.getLastColumn(),4)).clearContent();
  if (rows.length) sh.getRange(3,1,rows.length,4).setValues(rows);
  CacheService.getScriptCache().remove('v72d_order_' + section);
}

function getDisplayOrderV72D_(section) {
  section = String(section||'homeHero').trim();
  const cfg = CMS_DISPLAY_SECTIONS[section];
  if (!cfg) throw new Error('未知展示區：' + section);
  const ordered = reconcileDisplayOrderV72D_(section);
  const byId = {};
  getAllAdminArtworksV72_().forEach(a=>byId[String(a.artworkId||a.id||'').trim()]=a);
  const items = ordered.map((id,i)=>{
    const a = byId[id] || {};
    return {
      artworkId:id, sort:i+1, titleZh:a.titleZh||a.originalFileName||'未命名作品', titleEn:a.titleEn||'',
      artistName:a.artistName||'', libraryId:a.libraryId||'', librarySheetName:a.librarySheetName||'',
      thumbUrl:a.thumbUrl||a.imageUrl||'', imageUrl:a.imageUrl||a.thumbUrl||'', originalFileName:a.originalFileName||''
    };
  });
  return {ok:true, version:CMS.version, section, sectionLabel:cfg.label, items, total:items.length};
}

function saveDisplayOrderV72D_(token, data) {
  assertAdminToken_(token);
  const section = String(data.section||'').trim();
  if (!CMS_DISPLAY_SECTIONS[section]) throw new Error('未知展示區：' + section);
  const ids = Array.isArray(data.artworkIds) ? data.artworkIds.map(v=>String(v||'').trim()).filter(Boolean) : [];
  const unique = Array.from(new Set(ids));
  const selected = getSelectedArtworkIdsV72D_(section);
  const selectedSet = new Set(selected), uniqueSet = new Set(unique);
  if (unique.length !== selected.length || unique.some(id=>!selectedSet.has(id)) || selected.some(id=>!uniqueSet.has(id))) {
    throw new Error('排序清單已改變，請重新載入後再排序。');
  }
  writeDisplaySectionV72D_(section, unique);
  return {ok:true, section, savedCount:unique.length, message:'已儲存 '+CMS_DISPLAY_SECTIONS[section].label+' 排序'};
}
