/**
 * 謝秀英書畫藝術館－SEO 共用底層工具
 * STEP 1：只提供資料正規化與 SEO 字串產生函式，不主動修改頁面 DOM。
 *
 * 支援的主要作品欄位：
 * - titleZh：中文作品名稱
 * - titleEn：英文作品名稱
 * - artworkTypeName / categoryZh：作品類型
 * - subjectNames：作品題材
 * - artistName / artistNameZh：畫家名稱
 *
 * 瀏覽器：window.SeoHelper
 * CommonJS：require('./SeoHelper.js')
 */
(function (root, factory) {
  var api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.SeoHelper = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DEFAULTS = Object.freeze({
    artistName: '謝秀英',
    siteName: '謝秀英書畫藝術館',
    baseUrl: 'https://siyuye.github.io/XieXiuYing1960/',
    fallbackTitle: '作品典藏',
    artistUrl: 'https://siyuye.github.io/XieXiuYing1960/',
    organizationName: '謝秀英書畫藝術館',
    facebookUrl: 'https://www.facebook.com/XieXiuYing1960/'
  });

  function cleanText(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/<[^>]*>/g, ' ')
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function firstText() {
    for (var i = 0; i < arguments.length; i += 1) {
      var value = cleanText(arguments[i]);
      if (value) return value;
    }
    return '';
  }

  function uniqueTexts(values) {
    var seen = Object.create(null);
    var output = [];

    (values || []).forEach(function (value) {
      var text = cleanText(value);
      var key = text.toLocaleLowerCase();
      if (!text || seen[key]) return;
      seen[key] = true;
      output.push(text);
    });

    return output;
  }

  function splitTerms(value) {
    if (Array.isArray(value)) {
      return uniqueTexts(value);
    }

    var text = cleanText(value);
    if (!text) return [];

    return uniqueTexts(text.split(/[、,，;；|｜/]+/));
  }

  function normalizeArtwork(input, options) {
    var artwork = input || {};
    var config = options || {};

    return {
      id: firstText(artwork.artworkId, artwork.id),
      titleZh: firstText(artwork.titleZh, artwork.nameZh, artwork.title),
      titleEn: firstText(artwork.titleEn, artwork.nameEn),
      artworkType: firstText(
        artwork.artworkTypeName,
        artwork.categoryZh,
        artwork.artworkType,
        artwork.typeName
      ),
      subjects: splitTerms(firstText(artwork.subjectNames, artwork.subjectName, artwork.subject)),
      artistName: firstText(
        artwork.artistName,
        artwork.artistNameZh,
        config.artistName,
        DEFAULTS.artistName
      ),
      year: firstText(artwork.year, artwork.dateCreated, artwork.creationYear),
      size: firstText(artwork.size, artwork.dimensions, artwork.artworkSize)
    };
  }

  function joinTitleParts(parts) {
    return uniqueTexts(parts).join('｜');
  }

  /**
   * 建立作品 SEO 標題。
   * STEP 2 格式：中文作品名｜作品類型＋作品題材＋作品｜謝秀英
   */
  function generateTitle(artwork, options) {
    var data = normalizeArtwork(artwork, options);
    var config = options || {};
    var fallbackTitle = firstText(config.fallbackTitle, DEFAULTS.fallbackTitle);
    var classification = uniqueTexts([data.artworkType].concat(data.subjects)).join('');
    if (classification) classification += '作品';

    return joinTitleParts([
      data.titleZh || data.titleEn || fallbackTitle,
      classification,
      data.artistName
    ]);
  }

  /**
   * 建立作品 Meta Description。
   * 自動使用作品名稱、英文名稱、類型、題材、年份與尺寸。
   */
  function generateDescription(artwork, options) {
    var data = normalizeArtwork(artwork, options);
    var config = options || {};
    var siteName = firstText(config.siteName, DEFAULTS.siteName);
    var title = firstText(data.titleZh, data.titleEn, config.fallbackTitle, DEFAULTS.fallbackTitle);
    var description = '《' + title + '》';
    if (data.titleEn && data.titleEn !== title) description += '（' + data.titleEn + '）';
    description += '為' + data.artistName + '作品';

    var details = [];
    if (data.artworkType) details.push('作品類型：' + data.artworkType);
    if (data.subjects.length) details.push('題材：' + data.subjects.join('、'));
    if (data.year) details.push('年份：' + data.year);
    if (data.size) details.push('尺寸：' + data.size);
    if (details.length) description += '，' + details.join('；');
    description += '。收錄於' + siteName + '。';

    return cleanText(description);
  }

  /**
   * 建立關鍵字字串，輸出為逗號分隔。
   */
  function generateKeywords(artwork, options) {
    var data = normalizeArtwork(artwork, options);
    return uniqueTexts([
      data.titleZh,
      data.titleEn,
      data.artworkType
    ].concat(data.subjects, [data.artistName, '謝秀英書畫藝術館'])).join(', ');
  }

  /**
   * 產生穩定、可讀且適合 URL 的 slug。
   * 中文會保留並以 encodeURIComponent 安全編碼；英文會轉小寫連字號。
   */
  function slugGenerator(value, fallback) {
    var source = cleanText(value) || cleanText(fallback);
    if (!source) return '';

    var slug = source
      .normalize('NFKC')
      .toLocaleLowerCase()
      .replace(/[’'"“”‘’]/g, '')
      .replace(/&/g, ' and ')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');

    return encodeURIComponent(slug);
  }

  /**
   * 建立 Canonical URL。
   * 可傳入 options.path；否則使用作品 ID，再退回作品名稱 slug。
   */
  function generateCanonical(artwork, options) {
    var data = normalizeArtwork(artwork, options);
    var config = options || {};
    var baseUrl = firstText(config.baseUrl, DEFAULTS.baseUrl).replace(/\/+$/, '') + '/';
    var requestedPath = cleanText(config.path);
    var identity = data.id || decodeURIComponent(slugGenerator(data.titleEn || data.titleZh));
    var path = requestedPath || (identity ? 'works.html?id=' + encodeURIComponent(identity) : 'works.html');

    try {
      return new URL(path, baseUrl).href;
    } catch (_) {
      return baseUrl + path.replace(/^\/+/, '');
    }
  }

  /**
   * 建立作品圖片替代文字。
   */
  function generateAlt(artwork, options) {
    var data = normalizeArtwork(artwork, options);
    var name = firstText(data.titleZh, data.titleEn, DEFAULTS.fallbackTitle);
    var details = uniqueTexts([data.artworkType].concat(data.subjects));
    return uniqueTexts([name].concat(details, [data.artistName, '作品'])).join(' ');
  }


  /**
   * 建立首頁品牌實體資料，供 Person／Organization／WebSite JSON-LD 共用。
   * sameAs 僅收錄已確認的官方身分網址，避免加入未驗證連結。
   */
  function generateEntityProfile(options) {
    var config = options || {};
    var baseUrl = firstText(config.baseUrl, DEFAULTS.baseUrl).replace(/\/+$/, '') + '/';
    var facebookUrl = firstText(config.facebookUrl, DEFAULTS.facebookUrl);
    return Object.freeze({
      artistName: firstText(config.artistName, DEFAULTS.artistName),
      artistUrl: firstText(config.artistUrl, DEFAULTS.artistUrl),
      organizationName: firstText(config.organizationName, DEFAULTS.organizationName),
      websiteUrl: baseUrl,
      sameAs: uniqueTexts([facebookUrl].concat(config.sameAs || []))
    });
  }

  return Object.freeze({
    DEFAULTS: DEFAULTS,
    cleanText: cleanText,
    normalizeArtwork: normalizeArtwork,
    generateTitle: generateTitle,
    generateDescription: generateDescription,
    generateKeywords: generateKeywords,
    generateCanonical: generateCanonical,
    generateAlt: generateAlt,
    slugGenerator: slugGenerator,
    generateEntityProfile: generateEntityProfile
  });
});
