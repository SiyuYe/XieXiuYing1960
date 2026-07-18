var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
// 謝秀英藝術館 CMS v7.5
var DATA_VERSION = 'cms-v7.9.0-step9b';
var CACHE_CLEANUP_VERSION = 'xxy.cacheCleanup.v7909b';
var IMAGE_PLACEHOLDER = 'assets/images/art-placeholder-clean.svg';
var CDN_REPO_BASE = 'https://cdn.jsdelivr.net/gh/siyuye/XieXiuYing1960@main/';
var GITHUB_PAGES_BASE = 'https://siyuye.github.io/XieXiuYing1960/';
var CLIENT_ERROR_LOG_KEY = 'xxy.clientErrors.v7909b';
var JSON_TIMEOUT_MS = 12000;
var SITE_DATA_FILE = 'data/site-data.json';
var SITE_VERSION_FILE = 'data/site-version.json';
var SITE_DATA_CACHE_PREFIX = 'xxy.siteData.';
var SITE_DATA_CURRENT_VERSION_KEY = 'xxy.siteData.currentVersion';
var SITE_VERSION_CACHE_KEY = 'xxy.siteVersion.latest';
var siteConfig = null, homeData = null, pageData = null, artworks = [], exhibitions = [], historyItems = [], books = [], galleryShows = [], imageManifest = { artworks: {}, artworkOrder: [], teacherPhotos: { 1600: ['images/yingphoto/1600/xiexiuying001.webp'], 600: ['images/yingphoto/600/xiexiuying001.webp'] } };
var ART_BATCH_SIZE = 16;
var heroTimer = null, uiEffectsReady = false;
var fallbackArtworks = [];
function rememberClientError_(kind, error, extra) {
    try {
        var list = JSON.parse(sessionStorage.getItem(CLIENT_ERROR_LOG_KEY) || '[]');
        list.push({ time: new Date().toISOString(), kind: String(kind || 'error'), message: String(error && error.message ? error.message : error || ''), stack: String(error && error.stack ? error.stack : ''), extra: extra || null, page: location.pathname });
        while (list.length > 20)
            list.shift();
        sessionStorage.setItem(CLIENT_ERROR_LOG_KEY, JSON.stringify(list));
    }
    catch (_) { }
    if (window.console && typeof window.console.error === 'function')
        console.error('[XieXiuYing ' + kind + ']', error, extra || '');
}
function showGlobalErrorNotice_(message) {
    if (!document.body)
        return;
    var box = document.querySelector('#siteErrorNotice');
    if (!box) {
        box = document.createElement('div');
        box.id = 'siteErrorNotice';
        box.className = 'site-error-notice';
        box.setAttribute('role', 'status');
        box.setAttribute('aria-live', 'polite');
        document.body.appendChild(box);
    }
    box.textContent = message || '網站部分內容暫時無法載入，請重新整理頁面。';
    box.hidden = false;
}
function installGlobalErrorHandling_() {
    window.addEventListener('error', function (event) {
        if (event && event.target && event.target.tagName === 'IMG')
            return;
        rememberClientError_('javascript', event && event.error ? event.error : (event && event.message) || 'Unknown script error', { file: event && event.filename, line: event && event.lineno, column: event && event.colno });
        showGlobalErrorNotice_('網站部分功能暫時發生錯誤，請重新整理頁面。');
    });
    window.addEventListener('unhandledrejection', function (event) {
        rememberClientError_('promise', event ? event.reason : 'Unhandled promise rejection');
        showGlobalErrorNotice_('網站資料暫時無法完整載入，請重新整理頁面。');
    });
}
function installImageFallback_() {
    document.addEventListener('error', function (event) {
        var img = event && event.target;
        if (!img || img.tagName !== 'IMG')
            return;
        if (img.dataset && img.dataset.manualFallback === '1')
            return;
        var current = String(img.getAttribute('src') || '');
        if (current.indexOf('art-placeholder-clean.svg') >= 0)
            return;
        rememberClientError_('image', new Error('圖片載入失敗：' + current), { alt: img.getAttribute('alt') || '' });
        var step = Number((img.dataset && img.dataset.fallbackStep) || 0);
        var githubFallback = (img.dataset && img.dataset.fallbackSrc) || '';
        var finalFallback = (img.dataset && img.dataset.finalFallback) || IMAGE_PLACEHOLDER;
        if (step === 0 && githubFallback && githubFallback !== current) {
            if (img.dataset)
                img.dataset.fallbackStep = '1';
            img.removeAttribute('srcset');
            img.src = githubFallback;
            return;
        }
        if (img.dataset)
            img.dataset.fallbackStep = '2';
        img.removeAttribute('srcset');
        img.src = finalFallback;
        var card = img.closest ? img.closest('.art-card,.hero-art,.artist-profile-card,.admin-preview') : null;
        if (card && card.classList)
            card.classList.add('is-photo-error');
    }, true);
}
function cleanupLegacyCachesOnce_() {
    try {
        if (localStorage.getItem(CACHE_CLEANUP_VERSION) === '1')
            return;
    }
    catch (_) { }
    var preserve = { 'xxy.cms.apiUrl': true, 'xxy.cms.adminToken': true };
    try {
        var remove = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i) || '';
            if (preserve[key])
                continue;
            if (key.indexOf('xxy.static.') === 0 || key.indexOf('xxy.siteBundle.') === 0 || key.indexOf('xxy.cms.v') === 0 || key === 'xxy.cms.authError')
                remove.push(key);
        }
        remove.forEach(function (key) { localStorage.removeItem(key); });
        localStorage.setItem(CACHE_CLEANUP_VERSION, '1');
    }
    catch (err) {
        rememberClientError_('cache-cleanup', err);
    }
    if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations) {
        navigator.serviceWorker.getRegistrations().then(function (registrations) { return Promise.all(registrations.map(function (registration) { return registration.unregister(); })); }).catch(function (err) { rememberClientError_('service-worker-cleanup', err); });
    }
    if ('caches' in window && window.caches && caches.keys) {
        caches.keys().then(function (keys) { return Promise.all(keys.filter(function (key) { return key.indexOf('xxy-') === 0; }).map(function (key) { return caches.delete(key); })); }).catch(function (err) { rememberClientError_('cache-storage-cleanup', err); });
    }
}
function createCompatSet_(initialValues) {
    if (typeof Set === 'function')
        return new Set(initialValues || []);
    var values = [];
    (initialValues || []).forEach(function (value) { if (values.indexOf(value) < 0)
        values.push(value); });
    return {
        has: function (value) { return values.indexOf(value) >= 0; },
        add: function (value) { if (values.indexOf(value) < 0)
            values.push(value); return this; }
    };
}
function readJsonStorage_(key) {
    try {
        var raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    }
    catch (_) {
        return null;
    }
}
function writeJsonStorage_(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    }
    catch (_) { }
}
function siteDataCacheKey_(version) { return SITE_DATA_CACHE_PREFIX + String(version || 'unknown'); }
function cleanupVersionedSiteDataCache_(keepVersion) {
    try {
        var keepKey = siteDataCacheKey_(keepVersion);
        var remove = [];
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i) || '';
            if (key.indexOf(SITE_DATA_CACHE_PREFIX) === 0 && key !== keepKey && key !== SITE_DATA_CURRENT_VERSION_KEY)
                remove.push(key);
        }
        remove.forEach(function (key) { localStorage.removeItem(key); });
        localStorage.removeItem('xxy.static.' + SITE_DATA_FILE);
    }
    catch (err) {
        rememberClientError_('site-data-cache-cleanup', err);
    }
}
function fetchJsonRequest_(url, cacheMode) {
    return __awaiter(this, void 0, void 0, function () {
        var supportsAbort, controller, timer, options, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    supportsAbort = typeof window.AbortController === 'function';
                    controller = supportsAbort ? new window.AbortController() : null;
                    timer = null;
                    if (controller)
                        timer = setTimeout(function () { controller.abort(); }, JSON_TIMEOUT_MS);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 4, 5]);
                    options = { cache: cacheMode || 'default' };
                    if (controller)
                        options.signal = controller.signal;
                    return [4 /*yield*/, fetch(url, options)];
                case 2:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('HTTP ' + response.status + '：' + url);
                    return [4 /*yield*/, response.json()];
                case 3: return [2 /*return*/, _a.sent()];
                case 4:
                    if (timer !== null)
                        clearTimeout(timer);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function fetchLatestSiteVersion_() {
    return __awaiter(this, void 0, void 0, function () {
        var versionUrl, manifest, version, err_1, cached, current, wrapped;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    versionUrl = SITE_VERSION_FILE + '?t=' + Date.now();
                    return [4 /*yield*/, fetchJsonRequest_(versionUrl, 'no-store')];
                case 1:
                    manifest = _a.sent();
                    version = String(manifest && manifest.dataVersion || '').trim();
                    if (!version)
                        throw new Error('site-version.json 缺少 dataVersion');
                    writeJsonStorage_(SITE_VERSION_CACHE_KEY, manifest);
                    return [2 /*return*/, manifest];
                case 2:
                    err_1 = _a.sent();
                    cached = readJsonStorage_(SITE_VERSION_CACHE_KEY);
                    if (cached && cached.dataVersion)
                        return [2 /*return*/, cached];
                    current = '';
                    try {
                        current = localStorage.getItem(SITE_DATA_CURRENT_VERSION_KEY) || '';
                    }
                    catch (_) { }
                    if (current)
                        return [2 /*return*/, { schemaVersion: 1, dataVersion: current, generatedAt: '', publishedAt: '', cached: true }];
                    wrapped = new Error('版本資料讀取失敗：' + SITE_VERSION_FILE);
                    wrapped.cause = err_1;
                    throw wrapped;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchSiteDataByVersion_(version) {
    return __awaiter(this, void 0, void 0, function () {
        var normalizedVersion, cacheKey, dataUrl, data, err_2, exactCached, lastVersion, lastCached, message, wrapped;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    normalizedVersion = String(version || '').trim();
                    if (!normalizedVersion)
                        throw new Error('缺少網站資料版本號');
                    cacheKey = siteDataCacheKey_(normalizedVersion);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    dataUrl = SITE_DATA_FILE + '?v=' + encodeURIComponent(normalizedVersion);
                    return [4 /*yield*/, fetchJsonRequest_(dataUrl, 'default')];
                case 2:
                    data = _a.sent();
                    writeJsonStorage_(cacheKey, data);
                    try {
                        localStorage.setItem(SITE_DATA_CURRENT_VERSION_KEY, normalizedVersion);
                    }
                    catch (_) { }
                    cleanupVersionedSiteDataCache_(normalizedVersion);
                    return [2 /*return*/, data];
                case 3:
                    err_2 = _a.sent();
                    exactCached = readJsonStorage_(cacheKey);
                    if (exactCached)
                        return [2 /*return*/, exactCached];
                    lastVersion = '';
                    try {
                        lastVersion = localStorage.getItem(SITE_DATA_CURRENT_VERSION_KEY) || '';
                    }
                    catch (_) { }
                    if (lastVersion) {
                        lastCached = readJsonStorage_(siteDataCacheKey_(lastVersion));
                        if (lastCached)
                            return [2 /*return*/, lastCached];
                    }
                    message = err_2 && err_2.name === 'AbortError' ? '資料讀取逾時：' + SITE_DATA_FILE : '資料讀取失敗：' + SITE_DATA_FILE;
                    wrapped = new Error(message);
                    wrapped.cause = err_2;
                    throw wrapped;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function fetchCurrentSiteData_() {
    return __awaiter(this, void 0, void 0, function () {
        var manifest, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchLatestSiteVersion_()];
                case 1:
                    manifest = _a.sent();
                    return [4 /*yield*/, fetchSiteDataByVersion_(manifest.dataVersion)];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, { manifest: manifest, data: data }];
            }
        });
    });
}
var truth = function (v) { return v === true || String(v || '').toUpperCase() === 'TRUE' || String(v || '') === '是'; };
function esc(s) {
    if (s === void 0) { s = ''; }
    return String(s).replace(/[&<>'"]/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[m]); });
}
function directImageUrl(url) {
    if (url === void 0) { url = ''; }
    var v = String(url || '').trim();
    if (!v)
        return '';
    var m = v.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=)([-\w]+)/i) || v.match(/[?&]id=([-\w]+)/i);
    return m ? "https://drive.google.com/thumbnail?id=".concat(m[1], "&sz=w1600") : v;
}
function normalizeArtworkId(a) { return String((a === null || a === void 0 ? void 0 : a.artworkId) || (a === null || a === void 0 ? void 0 : a.id) || '').trim().toUpperCase(); }
function validArtworkImageId_(id) { return /^[A-Z0-9_-]+$/.test(String(id || '')); }
function staticArtworkUrl(a, size) {
    if (size === void 0) { size = '1200'; }
    var id = normalizeArtworkId(a);
    return validArtworkImageId_(id) ? "images/artworks/".concat(size, "/").concat(id, ".webp") : '';
}
function cdnArtworkUrl_(a, size) {
    if (size === void 0) { size = '1200'; }
    var id = normalizeArtworkId(a);
    return validArtworkImageId_(id) ? "".concat(CDN_REPO_BASE, "images/artworks/").concat(size, "/").concat(id, ".webp") : '';
}
function githubArtworkFallback_(a, size) {
    if (size === void 0) { size = '1200'; }
    var explicit = size === '2400' ? (a.imageUrl || '') : (a.thumbUrl || a.imageUrl || '');
    var value = String(explicit || '').trim();
    if (value)
        return value;
    return staticArtworkUrl(a, size) || '';
}
function artworkImageSources_(a, size) {
    if (size === void 0) { size = '1200'; }
    var cdnField = size === '2400' ? (a.CDNimageUrl || a.cdnImageUrl || '') : (a.CDNthumbUrl || a.cdnThumbUrl || '');
    var primary = String(cdnField || '').trim() || cdnArtworkUrl_(a, size);
    var fallback = githubArtworkFallback_(a, size);
    return { primary: primary || fallback || IMAGE_PLACEHOLDER, fallback: fallback && fallback !== primary ? fallback : '', final: IMAGE_PLACEHOLDER };
}
function teacherLocalPath_(path, size) {
    var value = String(path || '').trim();
    if (value)
        return value.replace(/^\/+/, '');
    return "images/yingphoto/".concat(size, "/xiexiuying001.webp");
}
function teacherCdnPath_(path, size) { return CDN_REPO_BASE + teacherLocalPath_(path, size); }
function imageFallbackAttrs_(sources) {
    return "data-fallback-src=\"".concat(esc(sources.fallback || ''), "\" data-final-fallback=\"").concat(esc(sources.final || IMAGE_PLACEHOLDER), "\" data-fallback-step=\"0\"");
}
function defaultPublicConfig_() {
    return {
        version: DATA_VERSION,
        backendMode: 'staticJson',
        brand: { zh: '謝秀英', en: 'Xie Xiu-Ying', mark: '秀', siteName: '謝秀英書畫藝術館' },
        facebookUrl: 'https://www.facebook.com/XieXiuYing1960/',
        nav: [
            { id: 'home', label: '首頁', href: 'index.html' }, { id: 'about', label: '關於秀英', href: 'about.html' },
            { id: 'gallery', label: '藝廊', href: 'gallery.html' }, { id: 'works', label: '作品集', href: 'works.html' },
            { id: 'exhibitions', label: '展覽經歷', href: 'exhibitions.html' }, { id: 'history', label: '歷史回顧', href: 'history.html' },
            { id: 'contact', label: '聯絡', href: 'contact.html' }
        ],
        homeQuickNav: [
            { id: 'hero', label: '藝術焦點' }, { id: 'news', label: '最新消息' }, { id: 'online-show', label: '線上藝廊' },
            { id: 'featured', label: '精選作品' }, { id: 'quote', label: '畫家語錄' }, { id: 'fb', label: '粉專消息' }
        ],
        contactReasons: ['作品收藏洽詢', '展覽邀約', '課程／教學', '媒體採訪', '其他合作'],
        showNotice: false
    };
}
function normalizeSiteData_(bundle) {
    if (!bundle || bundle.ok !== true)
        throw new Error('site-data.json 格式不正確或尚未發布');
    if (Number(bundle.schemaVersion) !== 1)
        throw new Error('site-data.json schemaVersion 不支援');
    var settings = bundle.settings || {};
    var base = defaultPublicConfig_();
    var config = __assign(__assign(__assign({}, base), (bundle.config || {})), { version: bundle.dataVersion || bundle.version || DATA_VERSION, backendMode: 'staticJson', brand: __assign(__assign(__assign({}, (base.brand || {})), ((bundle.config && bundle.config.brand) || {})), { zh: settings.artistNameZh || ((bundle.config && bundle.config.brand && bundle.config.brand.zh) || base.brand.zh), en: settings.artistNameEn || ((bundle.config && bundle.config.brand && bundle.config.brand.en) || base.brand.en), mark: settings.artistMark || ((bundle.config && bundle.config.brand && bundle.config.brand.mark) || base.brand.mark), siteName: settings.siteName || ((bundle.config && bundle.config.brand && bundle.config.brand.siteName) || base.brand.siteName) }), nav: Array.isArray(settings.nav) ? settings.nav : ((bundle.config && bundle.config.nav) || base.nav), homeQuickNav: Array.isArray(settings.homeQuickNav) ? settings.homeQuickNav : ((bundle.config && bundle.config.homeQuickNav) || base.homeQuickNav), facebookUrl: settings.facebookUrl || ((bundle.config && bundle.config.facebookUrl) || base.facebookUrl), contactReasons: Array.isArray(settings.contactReasons) ? settings.contactReasons : ((bundle.config && bundle.config.contactReasons) || base.contactReasons), showNotice: settings.showNotice === true });
    var h = bundle.home || {};
    var currentGallery = (bundle.gallery || []).find(function (g) { return truth(g.isCurrent) && (g.isPublic == null || truth(g.isPublic)); }) || (bundle.gallery || []).find(function (g) { return g.isPublic == null || truth(g.isPublic); }) || null;
    var home = (h.hero || h.quote || h.onlineShow) ? h : {
        hero: { eyebrow: h.heroEyebrow || 'XIE XIU-YING ART MUSEUM', title: h.heroTitle || '謝秀英\n書畫藝術館', subtitle: h.heroSubtitle || '以書畫來美化這個世界，以書畫來安慰人的心靈。', primaryButton: { label: h.heroPrimaryLabel || '進入線上藝廊', href: h.heroPrimaryHref || 'gallery.html' }, secondaryButton: { label: h.heroSecondaryLabel || 'Facebook 粉專', href: h.heroSecondaryHref || config.facebookUrl } },
        announcements: (bundle.notices || bundle.announcements || []).map(function (n) { return ({ date: n.date || '', title: n.title || '', text: n.summary || n.text || n.body || '' }); }),
        onlineShow: currentGallery ? { eyebrow: 'Online Exhibition', title: currentGallery.title || '', period: currentGallery.period || '', text: currentGallery.description || '', button: { label: '立即參觀', href: 'gallery.html' } } : {},
        quote: { text: h.quoteText || '一花一草皆佛性，昆蟲飛鳥皆如來。', author: h.quoteAuthor || '謝秀英　無心居士合十' },
        facebook: { title: h.facebookTitle || '粉專最新消息', text: h.facebookText || '', button: '前往粉專' }
    };
    var mapped = (bundle.artworks || []).map(function (a, index) { return (__assign(__assign({}, a), { __staticOrder: index, id: a.artworkId || a.id, titleZh: a.titleZh || '', titleEn: a.titleEn || '', image: a.CDNthumbUrl || a.cdnThumbUrl || a.image || a.thumbUrl || cdnArtworkUrl_(a, '1200') || staticArtworkUrl(a, '1200'), thumbnail: a.CDNthumbUrl || a.cdnThumbUrl || a.thumbnail || a.thumbUrl || cdnArtworkUrl_(a, '1200') || staticArtworkUrl(a, '1200'), featured: a.featured === true || truth(a.isFeatured), hero: a.hero === true || truth(a.isHomeHero), gallery: a.gallery === true || truth(a.isGallery), public: !(a.isPublic === false || String(a.isPublic).toUpperCase() === 'FALSE') })); });
    var manifest = bundle.imageManifest || { artworks: {}, artworkOrder: [], teacherPhotos: { 1600: ['images/yingphoto/1600/xiexiuying001.webp'], 600: ['images/yingphoto/600/xiexiuying001.webp'] } };
    return { config: config, home: home, pages: bundle.pages || {}, artworks: mapped, exhibitions: bundle.exhibitions || [], history: bundle.history || [], books: bundle.books || [], gallery: bundle.gallery || [], imageManifest: manifest };
}
function initData() {
    return __awaiter(this, void 0, void 0, function () {
        var loaded, bundle, normalized, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetchCurrentSiteData_()];
                case 1:
                    loaded = _a.sent();
                    bundle = loaded.data;
                    normalized = normalizeSiteData_(bundle);
                    siteConfig = normalized.config;
                    homeData = normalized.home;
                    pageData = normalized.pages;
                    artworks = normalized.artworks;
                    exhibitions = normalized.exhibitions;
                    historyItems = normalized.history;
                    books = normalized.books;
                    galleryShows = normalized.gallery;
                    imageManifest = normalized.imageManifest || imageManifest;
                    seedArtworkImagesFromManifest_();
                    normalizeArtworkList_();
                    renderSite_();
                    return [3 /*break*/, 3];
                case 2:
                    err_3 = _a.sent();
                    siteConfig = defaultPublicConfig_();
                    homeData = {};
                    pageData = {};
                    artworks = [];
                    exhibitions = [];
                    historyItems = [];
                    books = [];
                    galleryShows = [];
                    try {
                        renderSite_();
                    }
                    catch (renderErr) {
                        rememberClientError_('render-after-site-data-failure', renderErr);
                    }
                    renderDataLoadFailure_([{ path: SITE_DATA_FILE, error: err_3 }]);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function renderDataLoadFailure_(failures) {
    var hasArtworkData = Array.isArray(artworks) && artworks.length > 0;
    var message = hasArtworkData ? '部分即時資料暫時無法更新，已顯示可用內容。' : '作品資料暫時載入失敗，請重新整理頁面。';
    ['#worksGrid', '#galleryGrid', '#featuredGrid'].forEach(function (selector) {
        var host = document.querySelector(selector);
        if (host && !host.children.length)
            host.innerHTML = '<p class="page-loading data-load-error" role="status">' + esc(message) + '</p>';
    });
    var current = document.querySelector('#currentGalleryInfo');
    if (current)
        current.innerHTML = '<p class="page-loading data-load-error" role="status">' + esc(message) + '</p>';
    failures.forEach(function (item) { rememberClientError_('json', item.error, { path: item.path }); });
    if (window.console && typeof window.console.warn === 'function')
        console.warn('[XieXiuYing] JSON load warning', failures);
}
function seedArtworkImagesFromManifest_() {
    var valid = (Array.isArray(artworks) ? artworks : []).filter(function (a) { return /^XH\d{4}$/.test(normalizeArtworkId(a)); });
    if (valid.length) {
        artworks = valid;
        return;
    }
    var ids = (imageManifest.artworkOrder || []).map(function (v) { return String(v || '').toUpperCase(); }).filter(function (v) { return /^XH\d{4}$/.test(v); });
    artworks = ids.map(function (id, index) { return ({ id: id, artworkId: id, titleZh: '', titleEn: '', year: '', size: '', featured: index < 8, hero: index < 3, gallery: true, public: true, isPublic: true, __staticOrder: index }); });
}
function normalizeArtworkList_() {
    var seen = createCompatSet_();
    artworks = (Array.isArray(artworks) ? artworks : [])
        .map(function (a, index) { return (__assign(__assign({}, a), { __staticOrder: Number.isInteger(a.__staticOrder) ? a.__staticOrder : index })); })
        .filter(function (a) { return a.public !== false && a.isPublic !== false; })
        .filter(function (a) { var id = normalizeArtworkId(a) || String(a.id || '').trim(); if (!id)
        return true; if (seen.has(id))
        return false; seen.add(id); return true; });
}
function renderSite_() { renderCommonShell(); renderHome(); renderSubpage(); requestAnimationFrame(function () { initArtSections(); renderCurrentGalleryInfo(); renderExhibitions(); renderHistory(); initContactForm(); if (!uiEffectsReady) {
    initUiEffects();
    uiEffectsReady = true;
} }); }
function shuffle(list) {
    var _a;
    var a = __spreadArray([], list, true);
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        _a = [a[j], a[i]], a[i] = _a[0], a[j] = _a[1];
    }
    return a;
}
var artworkSeoDefault_ = null, collectionSeoDefault_ = null;
var artworkUrlOpened_ = false;
function ensureMeta_(selector, attrs) {
    var el = document.head.querySelector(selector);
    if (!el) {
        el = document.createElement(attrs.tag || 'meta');
        Object.keys(attrs).forEach(function (k) { if (k !== 'tag' && k !== 'content')
            el.setAttribute(k, attrs[k]); });
        document.head.appendChild(el);
    }
    return el;
}
function rememberArtworkSeoDefault_() {
    if (artworkSeoDefault_)
        return;
    var description = document.head.querySelector('meta[name="description"]');
    var canonical = document.head.querySelector('link[rel="canonical"]');
    artworkSeoDefault_ = { title: document.title, description: description ? description.content : '', canonical: canonical ? canonical.href : location.href.split('?')[0] };
}
function applyArtworkSeo_(a) {
    if (!a || !window.SeoHelper)
        return;
    rememberArtworkSeoDefault_();
    var canonical = window.SeoHelper.generateCanonical(a);
    document.title = window.SeoHelper.generateTitle(a);
    ensureMeta_('meta[name="description"]', { name: 'description' }).content = window.SeoHelper.generateDescription(a);
    ensureMeta_('link[rel="canonical"]', { tag: 'link', rel: 'canonical' }).href = canonical;
    var url = new URL(location.href);
    url.searchParams.set('id', a.id || a.artworkId || '');
    history.replaceState({ artworkId: a.id || a.artworkId || '' }, '', url.href);
}
function restoreArtworkSeo_() {
    if (!artworkSeoDefault_)
        return;
    document.title = artworkSeoDefault_.title;
    ensureMeta_('meta[name="description"]', { name: 'description' }).content = artworkSeoDefault_.description;
    ensureMeta_('link[rel="canonical"]', { tag: 'link', rel: 'canonical' }).href = artworkSeoDefault_.canonical;
    var url = new URL(location.href);
    url.searchParams.delete('id');
    history.replaceState({}, '', url.href);
}
function openArtworkFromUrl_() {
    if (artworkUrlOpened_)
        return;
    var id = new URLSearchParams(location.search).get('id');
    if (!id)
        return;
    artworkUrlOpened_ = true;
    openArtwork(id);
}
var COLLECTION_FILTERS = {
    type: { label: '作品類型', fields: ['artworkTypeName', 'categoryZh', 'artworkType', 'typeName'] },
    subject: { label: '題材', fields: ['subjectNames', 'subjectName', 'subject'] },
    material: { label: '材質', fields: ['materialNames', 'materialName', 'material'] },
    medium: { label: '媒材', fields: ['mediumNames', 'mediumName', 'medium'] }
};
function collectionFilterFromUrl_() {
    var params = new URLSearchParams(location.search);
    for (var _i = 0, _a = ['type', 'subject', 'material', 'medium']; _i < _a.length; _i++) {
        var key = _a[_i];
        var value = String(params.get(key) || '').trim();
        if (value)
            return { key: key, value: value, config: COLLECTION_FILTERS[key] };
    }
    return null;
}
function collectionSearchFromUrl_() { return String(new URLSearchParams(location.search).get('q') || '').trim(); }
function filterSearchArtworks_(list, query) {
    var q = String(query || '').trim().toLocaleLowerCase();
    if (!q)
        return list;
    return (list || []).filter(function (a) { return [a.titleZh, a.titleEn, a.artworkTypeName, a.categoryZh, a.subjectNames, a.material, a.medium, a.year, a.size].join(' ').toLocaleLowerCase().includes(q); });
}
function collectionFieldTerms_(artwork, fields) {
    var terms = [];
    (fields || []).forEach(function (field) {
        var raw = artwork && artwork[field];
        var values = Array.isArray(raw) ? raw : String(raw || '').split(/[、,，;；|｜/]+/);
        values.forEach(function (value) { var text = String(value || '').trim(); if (text && terms.indexOf(text) < 0)
            terms.push(text); });
    });
    return terms;
}
function filterCollectionArtworks_(list, filter) {
    if (!filter || !filter.value)
        return list;
    return (list || []).filter(function (artwork) { return collectionFieldTerms_(artwork, filter.config.fields).some(function (term) { return term === filter.value || term.includes(filter.value) || filter.value.includes(term); }); });
}
function rememberCollectionSeoDefault_() {
    if (collectionSeoDefault_)
        return;
    var description = document.head.querySelector('meta[name="description"]');
    var canonical = document.head.querySelector('link[rel="canonical"]');
    collectionSeoDefault_ = { title: document.title, description: description ? description.content : '', canonical: canonical ? canonical.href : location.href.split('?')[0] };
}
function applyCollectionSeo_(filter, replaceUrl) {
    if (replaceUrl === void 0) { replaceUrl = true; }
    rememberCollectionSeoDefault_();
    var base = 'https://siyuye.github.io/XieXiuYing1960/works.html';
    if (!filter || !filter.value) {
        document.title = collectionSeoDefault_.title;
        ensureMeta_('meta[name="description"]', { name: 'description' }).content = collectionSeoDefault_.description;
        ensureMeta_('link[rel="canonical"]', { tag: 'link', rel: 'canonical' }).href = base;
        if (replaceUrl) {
            var url_1 = new URL(location.href);
            ['type', 'subject', 'material', 'medium'].forEach(function (k) { return url_1.searchParams.delete(k); });
            history.replaceState({}, '', url_1.href);
        }
        artworkSeoDefault_ = null;
        return;
    }
    var value = filter.value;
    document.title = value + '作品集｜謝秀英';
    ensureMeta_('meta[name="description"]', { name: 'description' }).content = '瀏覽謝秀英書畫藝術館「' + value + '」' + filter.config.label + '作品集，欣賞謝秀英相關書畫創作。';
    var canonical = base + '?' + filter.key + '=' + encodeURIComponent(value);
    ensureMeta_('link[rel="canonical"]', { tag: 'link', rel: 'canonical' }).href = canonical;
    if (replaceUrl) {
        var url = new URL(location.href);
        url.search = '';
        url.searchParams.set(filter.key, value);
        history.replaceState({ collectionFilter: filter.key, collectionValue: value }, '', url.href);
    }
    artworkSeoDefault_ = null;
}
function activateCollectionPill_(filter) {
    document.querySelectorAll('.category-pills button').forEach(function (btn) {
        var key = String(btn.dataset.category || btn.textContent || '').trim();
        btn.classList.toggle('active', !filter ? key === '全部' : key === filter.value);
    });
}
function valueList(a) { return [a.artworkTypeName || a.categoryZh, a.subjectNames, a.material, a.medium].filter(function (v) { return String(v || '').trim(); }); }
function titleLines(a) { return [a.titleZh, a.titleEn].filter(function (v) { return String(v || '').trim(); }); }
function infoLines(a) { return [[a.year, a.size].filter(function (v) { return String(v || '').trim(); }).join('｜'), valueList(a).join('｜')].filter(Boolean); }
function homePrimaryParts(a) { return [a.titleZh, a.titleEn, a.year, a.size].filter(function (v) { return String(v || '').trim(); }); }
function homePrimaryHtml(a) { var parts = homePrimaryParts(a); return parts.map(function (v, i) { var cls = i < ([a.titleZh, a.titleEn].filter(function (x) { return String(x || '').trim(); }).length) ? 'home-art-name' : 'home-art-detail'; return "".concat(i ? '<span class="home-art-separator">｜</span>' : '', "<span class=\"").concat(cls, "\">").concat(esc(v), "</span>"); }).join(''); }
function homeArtInfoHtml(a) { var second = valueList(a).join('｜'); return "<div class=\"art-info home-art-info\"><div class=\"home-art-primary\">".concat(homePrimaryHtml(a), "</div>").concat(second ? "<small>".concat(esc(second), "</small>") : '', "</div>"); }
function featuredArtInfoHtml(a) { var titles = titleLines(a), meta = [a.year, a.size].filter(function (v) { return String(v || '').trim(); }).join('｜'), details = valueList(a).join('｜'); return "<div class=\"art-info\">".concat(titles.map(function (v, i) { return "".concat(i ? '<span>｜</span>' : '', "<").concat(i ? 'span' : 'strong', ">").concat(esc(v), "</").concat(i ? 'span' : 'strong', ">"); }).join('')).concat(meta ? "<small>".concat(esc(meta), "</small>") : '').concat(details ? "<small>".concat(esc(details), "</small>") : '', "</div>"); }
function heroCaptionLines(a) { return [homePrimaryParts(a).join('｜'), valueList(a).join('｜')].filter(Boolean); }
function artTitle(a) { return a.titleZh || a.titleEn || ''; }
function artworkAlt_(a) { return window.SeoHelper ? window.SeoHelper.generateAlt(a) : (artTitle(a) || '謝秀英作品'); }
function imgSrc(a) { return artworkImageSources_(a, '1200').primary; }
function imgLargeSrc(a) { return artworkImageSources_(a, '2400').primary; }
function artInfoHtml(a) { var titles = titleLines(a), infos = infoLines(a); return "<div class=\"art-info\">".concat(titles.map(function (v, i) { return "<".concat(i ? 'span' : 'strong', ">").concat(esc(v), "</").concat(i ? 'span' : 'strong', ">"); }).join('')).concat(infos.map(function (v) { return "<small>".concat(esc(v), "</small>"); }).join(''), "</div>"); }
function card(a, imageIndex) {
    if (imageIndex === void 0) { imageIndex = 1; }
    var first = imageIndex === 0, sources = artworkImageSources_(a, '1200');
    return "<button class=\"art-card protected-image\" type=\"button\" data-watermark=\"\u8B1D\u79C0\u82F1\" data-art-id=\"".concat(esc(a.id || a.artworkId || ''), "\"><img src=\"").concat(esc(sources.primary), "\" ").concat(imageFallbackAttrs_(sources), " alt=\"").concat(esc(artworkAlt_(a)), "\" draggable=\"false\" loading=\"").concat(first ? 'eager' : 'lazy', "\" decoding=\"async\" fetchpriority=\"").concat(first ? 'high' : 'low', "\" width=\"1200\" height=\"1200\">").concat(artInfoHtml(a), "</button>");
}
function clearPagedArtGrid_(host) {
    if (!host)
        return;
    var state = host._xxyPaging;
    if (state && state.observer)
        state.observer.disconnect();
    if (state && state.controls && state.controls.parentNode)
        state.controls.parentNode.removeChild(state.controls);
    host._xxyPaging = null;
    host.innerHTML = '';
}
function appendArtBatch_(host) {
    var state = host && host._xxyPaging;
    if (!state)
        return;
    var start = state.index, end = Math.min(start + state.batchSize, state.items.length), batch = state.items.slice(start, end);
    if (batch.length) {
        host.insertAdjacentHTML('beforeend', batch.map(function (a, i) { return card(a, start + i); }).join(''));
        state.index = end;
        bindArtworkCards();
    }
    var remaining = Math.max(0, state.items.length - state.index);
    if (state.button) {
        state.button.hidden = remaining === 0;
        state.button.textContent = remaining ? "\u8F09\u5165\u66F4\u591A\u4F5C\u54C1\uFF08\u5C1A\u6709 ".concat(remaining, " \u4EF6\uFF09") : '已顯示全部作品';
    }
    if (state.sentinel)
        state.sentinel.hidden = remaining === 0;
    if (!remaining && state.observer) {
        state.observer.disconnect();
        state.observer = null;
    }
}
function renderPagedArtGrid_(host, items, emptyText) {
    if (emptyText === void 0) { emptyText = '目前尚無公開作品。'; }
    if (!host)
        return;
    clearPagedArtGrid_(host);
    var list = Array.isArray(items) ? items : [];
    if (!list.length) {
        host.innerHTML = "<p class=\"page-loading art-empty\">".concat(esc(emptyText), "</p>");
        return;
    }
    var controls = document.createElement('div');
    controls.className = 'art-paging-controls';
    controls.innerHTML = '<button type="button" class="btn ghost art-load-more">載入更多作品</button><span class="art-load-sentinel" aria-hidden="true"></span>';
    host.insertAdjacentElement('afterend', controls);
    var state = { items: list, index: 0, batchSize: ART_BATCH_SIZE, controls: controls, button: controls.querySelector('.art-load-more'), sentinel: controls.querySelector('.art-load-sentinel'), observer: null };
    host._xxyPaging = state;
    state.button.addEventListener('click', function () { return appendArtBatch_(host); });
    appendArtBatch_(host);
    if ('IntersectionObserver' in window && state.index < state.items.length) {
        state.observer = new IntersectionObserver(function (entries) { if (entries.some(function (entry) { return entry.isIntersecting; }))
            appendArtBatch_(host); }, { rootMargin: '500px 0px', threshold: .01 });
        state.observer.observe(state.sentinel);
    }
}
function preloadArtworkImage_(src) { if (!src)
    return; var img = new Image(); img.decoding = 'async'; img.src = src; }
function preloadHeroNeighbors_(list, index) { if (!Array.isArray(list) || list.length < 2)
    return; var prev = (index - 1 + list.length) % list.length, next = (index + 1) % list.length; preloadArtworkImage_(imgSrc(list[prev])); if (next !== prev)
    preloadArtworkImage_(imgSrc(list[next])); }
function renderCommonShell() {
    var brand = (siteConfig === null || siteConfig === void 0 ? void 0 : siteConfig.brand) || {};
    var isHome = document.body.dataset.page === 'home';
    document.querySelectorAll('.brand').forEach(function (el) { return el.innerHTML = "<span class=\"brand-mark\"><img src=\"assets/icons/icon-192.png\" alt=\"\u8B1D\u79C0\u82F1\u4EE3\u8868\u4F5C\u5716\u793A\"></span><span><strong>".concat(esc(isHome ? (brand.siteName || '謝秀英書畫藝術館') : (brand.zh || '謝秀英')), "</strong><small>").concat(esc(isHome ? 'XIE XIU-YING ART MUSEUM' : (brand.en || 'Xie Xiu-Ying')), "</small></span>"); });
    var page = document.body.dataset.page;
    document.querySelectorAll('.main-nav').forEach(function (nav) { return nav.innerHTML = ((siteConfig === null || siteConfig === void 0 ? void 0 : siteConfig.nav) || []).map(function (i) { return "<a class=\"nav-link ".concat(i.id === page ? 'active' : '', "\" href=\"").concat(esc(i.href), "\">").concat(esc(i.id === 'home' ? '首頁' : i.label), "</a>"); }).join(''); });
}
function nl(s) {
    if (s === void 0) { s = ''; }
    return esc(s).replace(/\r?\n/g, '<br>');
}
function renderHome() {
    var _a, _b, _c, _d, _e, _f, _g;
    if (document.body.dataset.page !== 'home' || !homeData)
        return;
    var h = homeData.hero || {}, copy = document.querySelector('.hero-copy');
    if (copy)
        copy.innerHTML = "<div class=\"artist-profile-card is-loading\"><div class=\"artist-photo-skeleton\" aria-hidden=\"true\"></div><img id=\"artistRandomPhoto\" alt=\"\u8B1D\u79C0\u82F1\u8001\u5E2B\" decoding=\"async\" fetchpriority=\"high\"><div class=\"artist-profile-overlay\"><h1>\u8B1D\u79C0\u82F1</h1><p class=\"artist-name-en\">Xie Xiu-Ying</p><p class=\"hero-sub multiline\">".concat(nl(h.subtitle || '以書畫來美化這個世界，以書畫來安慰人的心靈。'), "</p><div class=\"hero-actions\"><a class=\"btn primary\" data-short=\"\u7DDA\u4E0A\u85DD\u5ECA\" href=\"").concat(esc(((_a = h.primaryButton) === null || _a === void 0 ? void 0 : _a.href) || 'gallery.html'), "\">").concat(esc(((_b = h.primaryButton) === null || _b === void 0 ? void 0 : _b.label) || '進入線上藝廊'), "</a><a class=\"btn ghost\" data-short=\"Facebook\" href=\"").concat(esc(((_c = h.secondaryButton) === null || _c === void 0 ? void 0 : _c.href) || (siteConfig === null || siteConfig === void 0 ? void 0 : siteConfig.facebookUrl) || '#'), "\" target=\"_blank\" rel=\"noopener\">").concat(esc(((_d = h.secondaryButton) === null || _d === void 0 ? void 0 : _d.label) || 'Facebook 粉專'), "</a></div></div></div>");
    loadRandomArtistPhoto();
    var newsSection = document.querySelector('#news');
    var showNotice = (siteConfig === null || siteConfig === void 0 ? void 0 : siteConfig.showNotice) === true;
    if (!showNotice) {
        newsSection === null || newsSection === void 0 ? void 0 : newsSection.remove();
        (_e = document.querySelector('.home-quick a[href="#news"]')) === null || _e === void 0 ? void 0 : _e.remove();
    }
    var news = document.querySelector('.news-grid');
    if (news && Array.isArray(homeData.announcements))
        news.innerHTML = homeData.announcements.map(function (n) { return "<article><time>".concat(esc(n.date), "</time><h3>").concat(esc(n.title), "</h3><p class=\"multiline\">").concat(nl(n.text), "</p></article>"); }).join('');
    var fbInfo = document.querySelector('.fb-info');
    if (fbInfo)
        fbInfo.innerHTML = "<p class=\"eyebrow\">Facebook</p><h2>\u7C89\u5C08\u6700\u65B0\u6D88\u606F</h2><p>\u8FFD\u8E64\u8B1D\u79C0\u82F1\u8001\u5E2B\u8FD1\u671F\u5275\u4F5C\u3001\u5C55\u89BD\u6D3B\u52D5\u3001\u8AB2\u7A0B\u5206\u4EAB\u8207\u85DD\u8853\u751F\u6D3B\u7D00\u9304\u3002</p><p>\u66F4\u591A\u5B8C\u6574\u4F5C\u54C1\u8207\u6700\u65B0\u6D88\u606F\uFF0C\u6B61\u8FCE\u524D\u5F80 Facebook \u7C89\u7D72\u5C08\u9801\u3002</p><a class=\"btn primary\" href=\"".concat(esc((siteConfig === null || siteConfig === void 0 ? void 0 : siteConfig.facebookUrl) || 'https://www.facebook.com/XieXiuYing1960/'), "\" target=\"_blank\" rel=\"noopener\">\u524D\u5F80\u7C89\u5C08</a>");
    var show = homeData.onlineShow || {}, st = document.querySelector('.show-text');
    if (st)
        st.innerHTML = "<p class=\"eyebrow\">".concat(esc(show.eyebrow || 'Online Exhibition'), "</p><h2>").concat(esc(show.title || ''), "</h2><p>").concat(esc(show.period || ''), "</p><p class=\"multiline\">").concat(nl(show.text || ''), "</p><a class=\"btn light\" href=\"").concat(esc(((_f = show.button) === null || _f === void 0 ? void 0 : _f.href) || 'gallery.html'), "\">").concat(esc(((_g = show.button) === null || _g === void 0 ? void 0 : _g.label) || '立即參觀'), "</a>");
    renderRandomQuote();
    deferUntilVisible('#fb', function () { var run = function () { return renderFacebook(); }; if ('requestIdleCallback' in window)
        requestIdleCallback(run, { timeout: 2500 });
    else
        setTimeout(run, 900); }, '120px');
}
function loadRandomArtistPhoto() {
    return __awaiter(this, void 0, void 0, function () {
        var img, card, large, small, pick, mobile, size, chosenLocal, candidates, loaded, _loop_1, i;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    img = document.querySelector('#artistRandomPhoto'), card = document.querySelector('.artist-profile-card');
                    if (!img)
                        return [2 /*return*/];
                    large = (((_a = imageManifest.teacherPhotos) === null || _a === void 0 ? void 0 : _a['1600']) || []).filter(Boolean), small = (((_b = imageManifest.teacherPhotos) === null || _b === void 0 ? void 0 : _b['600']) || []).filter(Boolean);
                    if (!large.length) {
                        card === null || card === void 0 ? void 0 : card.classList.remove('is-loading');
                        card === null || card === void 0 ? void 0 : card.classList.add('is-photo-error');
                        return [2 /*return*/];
                    }
                    pick = Math.floor(Math.random() * large.length), mobile = window.innerWidth <= 720, size = mobile ? '600' : '1600';
                    chosenLocal = teacherLocalPath_((mobile && small[pick]) ? small[pick] : large[pick], size);
                    candidates = [teacherCdnPath_(chosenLocal, size), chosenLocal, IMAGE_PLACEHOLDER];
                    img.dataset.manualFallback = '1';
                    loaded = false;
                    _loop_1 = function (i) {
                        var src, e_1;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    src = candidates[i];
                                    _d.label = 1;
                                case 1:
                                    _d.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, new Promise(function (resolve, reject) { img.onload = resolve; img.onerror = reject; img.src = src; })];
                                case 2:
                                    _d.sent();
                                    loaded = true;
                                    return [3 /*break*/, 4];
                                case 3:
                                    e_1 = _d.sent();
                                    rememberClientError_('teacher-image', e_1, { src: src });
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _c.label = 1;
                case 1:
                    if (!(i < candidates.length && !loaded)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(i)];
                case 2:
                    _c.sent();
                    _c.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4:
                    img.onload = null;
                    img.onerror = null;
                    delete img.dataset.manualFallback;
                    card === null || card === void 0 ? void 0 : card.classList.remove('is-loading');
                    if (loaded && img.src.indexOf('art-placeholder-clean.svg') < 0)
                        card === null || card === void 0 ? void 0 : card.classList.add('is-ready');
                    else
                        card === null || card === void 0 ? void 0 : card.classList.add('is-photo-error');
                    return [2 /*return*/];
            }
        });
    });
}
function deferUntilVisible(selector, callback, rootMargin) {
    if (rootMargin === void 0) { rootMargin = '180px'; }
    var el = document.querySelector(selector);
    if (!el)
        return;
    if (!('IntersectionObserver' in window)) {
        callback();
        return;
    }
    var io = new IntersectionObserver(function (entries) { if (entries.some(function (x) { return x.isIntersecting; })) {
        io.disconnect();
        callback();
    } }, { rootMargin: rootMargin, threshold: .01 });
    io.observe(el);
}
function renderRandomQuote() { var _a, _b; var box = document.querySelector('#quote'); if (!box)
    return; var raw = ((_a = homeData === null || homeData === void 0 ? void 0 : homeData.quote) === null || _a === void 0 ? void 0 : _a.text) || ''; var q = raw.split(/\r?\n|｜|\|/).map(function (x) { return x.trim(); }).filter(Boolean); if (!q.length)
    q = ['以書畫來美化這個世界', '以書畫來安慰人的心靈', '以書畫來累積一世香氣']; var pick = q[Math.floor(Math.random() * q.length)]; box.innerHTML = "<p>\u300C".concat(esc(pick), "\u300D</p><span>").concat(esc(((_b = homeData === null || homeData === void 0 ? void 0 : homeData.quote) === null || _b === void 0 ? void 0 : _b.author) || '謝秀英'), "</span>"); }
var fbResizeTimer = null;
function renderFacebook() {
    var host = document.querySelector('#facebookPosts');
    if (!host)
        return;
    var page = (siteConfig === null || siteConfig === void 0 ? void 0 : siteConfig.facebookUrl) || 'https://www.facebook.com/XieXiuYing1960/';
    var urls = ((siteConfig === null || siteConfig === void 0 ? void 0 : siteConfig.facebookPostUrls) || []).filter(Boolean).slice(0, 3);
    var mobileInset = window.innerWidth <= 620 ? 24 : 0;
    var width = Math.max(260, Math.min(500, Math.floor((host.getBoundingClientRect().width || 500) - mobileInset)));
    var height = window.innerWidth <= 620 ? 680 : 620;
    if (urls.length) {
        host.innerHTML = urls.map(function (u) { return "<div class=\"fb-slide\" style=\"--fb-width:".concat(width, "px\"><iframe width=\"").concat(width, "\" height=\"").concat(height, "\" src=\"https://www.facebook.com/plugins/post.php?href=").concat(encodeURIComponent(u), "&show_text=true&width=").concat(width, "\" loading=\"lazy\" scrolling=\"no\" allowfullscreen=\"true\" title=\"Facebook \u6700\u65B0\u8CBC\u6587\"></iframe></div>"); }).join('');
    }
    else {
        host.innerHTML = "<div class=\"fb-slide fb-page-slide\" style=\"--fb-width:".concat(width, "px\"><iframe width=\"").concat(width, "\" height=\"").concat(height, "\" src=\"https://www.facebook.com/plugins/page.php?href=").concat(encodeURIComponent(page), "&tabs=timeline&width=").concat(width, "&height=").concat(height, "&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false\" loading=\"lazy\" scrolling=\"no\" allowfullscreen=\"true\" title=\"\u8B1D\u79C0\u82F1 Facebook \u7C89\u5C08\u6700\u65B0\u8CBC\u6587\"></iframe></div>");
    }
    if (!host.dataset.resizeBound) {
        host.dataset.resizeBound = '1';
        addEventListener('resize', function () { clearTimeout(fbResizeTimer); fbResizeTimer = setTimeout(renderFacebook, 180); }, { passive: true });
    }
}
function renderSubpage() {
    var page = document.body.dataset.page;
    if (page === 'home')
        return;
    var d = (pageData && pageData[page]) || {};
    var labels = {
        about: ['ABOUT ARTIST', '謝秀英 字：馥宇，號：無心居士。'],
        gallery: ['ONLINE GALLERY', '歡迎蒞臨線上藝廊，欣賞每一期精選展覽與藝術收藏。'],
        works: ['COLLECTIONS', '歷年作品完整收藏'],
        exhibitions: ['EXHIBITIONS', '個展與聯展紀錄'],
        history: ['ARCHIVE', '歷史典藏與出版'],
        contact: ['CONTACT', '歡迎收藏、演講、展覽或合作邀約']
    };
    var pair = labels[page] || [d.eyebrow || '', d.subtitle || ''];
    var hero = document.querySelector('.page-hero');
    if (hero)
        hero.innerHTML = "<p class=\"eyebrow\">".concat(esc(pair[0]), "</p><p class=\"page-brief\">").concat(esc(pair[1]), "</p>");
    var c = document.querySelector('[data-dynamic-sections]');
    if (c)
        c.innerHTML = (page === 'about' && Array.isArray(d.sections)) ? d.sections.map(function (s) { return "<section class=\"content-card\"><h2>".concat(esc(s.title || ''), "</h2><p class=\"multiline\">").concat(nl(s.body || ''), "</p></section>"); }).join('') : '';
}
function renderCurrentGalleryInfo() {
    var host = document.querySelector('#currentGalleryInfo');
    if (!host)
        return;
    var row = (galleryShows || []).find(function (g) { return truth(g.isCurrent) && (g.isPublic == null || truth(g.isPublic)); });
    if (!row) {
        host.innerHTML = '<p class="page-loading">目前尚無公開線上展覽。</p>';
        return;
    }
    host.innerHTML = "<div class=\"current-gallery-card\"><h2>".concat(esc(row.title || ''), "</h2>").concat(row.period ? "<p class=\"gallery-period\">".concat(esc(row.period), "</p>") : '').concat(row.description ? "<p class=\"multiline\">".concat(nl(row.description), "</p>") : '', "</div>");
}
function initArtSections() {
    var _a, _b;
    var pool = shuffle(artworks.filter(function (a) { return a.featured !== false; })), heroes = pool.filter(function (a) { return a.hero === true; }), heroPool = (heroes.length ? heroes : pool).slice(0, 3), ids = createCompatSet_(heroPool.map(function (a) { return a.id; }));
    var feat = pool.filter(function (a) { return !ids.has(a.id); });
    var image = document.querySelector('#heroImage');
    if (image) {
        if (heroTimer) {
            clearInterval(heroTimer);
            heroTimer = null;
        }
        image.loading = 'eager';
        image.decoding = 'async';
        image.setAttribute('fetchpriority', 'high');
        var slide_1 = 0;
        var t_1 = document.querySelector('#heroTitle'), m_1 = document.querySelector('#heroMeta');
        function draw() { var a = heroPool[slide_1]; if (!a) {
            image.removeAttribute('src');
            t_1.textContent = '';
            m_1.textContent = '';
            return;
        } image.src = imgSrc(a); t_1.innerHTML = homePrimaryHtml(a); m_1.textContent = valueList(a).join('｜'); preloadHeroNeighbors_(heroPool, slide_1); }
        (_a = document.querySelector('.next')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function () { slide_1 = (slide_1 + 1) % heroPool.length; draw(); });
        (_b = document.querySelector('.prev')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', function () { slide_1 = (slide_1 - 1 + heroPool.length) % heroPool.length; draw(); });
        draw();
        if (heroPool.length > 1)
            heroTimer = setInterval(function () { slide_1 = (slide_1 + 1) % heroPool.length; draw(); }, 5000);
    }
    var featured = document.querySelector('#featuredWorks');
    if (featured)
        featured.innerHTML = feat.slice(0, 8).map(function (a, i) { var first = i === 0, sources = artworkImageSources_(a, '1200'); return "<button class=\"art-card protected-image\" type=\"button\" data-watermark=\"\u8B1D\u79C0\u82F1\" data-art-id=\"".concat(esc(a.id || a.artworkId || ''), "\"><img src=\"").concat(esc(sources.primary), "\" ").concat(imageFallbackAttrs_(sources), " alt=\"").concat(esc(artworkAlt_(a)), "\" draggable=\"false\" loading=\"").concat(first ? 'eager' : 'lazy', "\" decoding=\"async\" fetchpriority=\"").concat(first ? 'high' : 'low', "\" width=\"1200\" height=\"1200\">").concat(featuredArtInfoHtml(a), "</button>"); }).join('');
    var gallery = document.querySelector('#galleryGrid');
    if (gallery)
        renderPagedArtGrid_(gallery, shuffle(artworks.filter(function (a) { return a.gallery === true || truth(a.isGallery); })), '目前尚無公開線上藝廊作品。');
    var works = document.querySelector('#worksGrid');
    if (works) {
        var drawWorks_1 = function (list) { return renderPagedArtGrid_(works, list, '目前沒有符合此分類或搜尋條件的公開作品。'); };
        var initialFilter = collectionFilterFromUrl_(), initialQuery = collectionSearchFromUrl_();
        drawWorks_1(filterSearchArtworks_(filterCollectionArtworks_(artworks, initialFilter), initialQuery));
        activateCollectionPill_(initialFilter);
        applyCollectionSeo_(initialFilter, false);
        if (initialQuery) {
            document.title = '搜尋「' + initialQuery + '」｜謝秀英作品集';
            ensureMeta_('meta[name="description"]', { name: 'description' }).content = '搜尋謝秀英書畫藝術館中與「' + initialQuery + '」相關的公開作品。';
            ensureMeta_('link[rel="canonical"]', { tag: 'link', rel: 'canonical' }).href = 'https://siyuye.github.io/XieXiuYing1960/works.html?q=' + encodeURIComponent(initialQuery);
        }
        document.querySelectorAll('.category-pills button').forEach(function (btn) { return btn.addEventListener('click', function () { var key = String(btn.dataset.category || btn.textContent || '').trim(); var filter = key === '全部' ? null : { key: 'type', value: key, config: COLLECTION_FILTERS.type }; activateCollectionPill_(filter); drawWorks_1(filterCollectionArtworks_(artworks, filter)); applyCollectionSeo_(filter, true); }); });
    }
    bindArtworkCards();
    openArtworkFromUrl_();
}
function bindArtworkCards() { document.querySelectorAll('[data-art-id]').forEach(function (el) { if (el.dataset.bound)
    return; el.dataset.bound = '1'; el.addEventListener('click', function () { return openArtwork(el.dataset.artId); }); }); }
function openArtwork(id) { var a = artworks.find(function (x) { return String(x.id || x.artworkId) === String(id); }); if (!a)
    return; var modal = document.querySelector('#artModal'); if (!modal) {
    modal = document.createElement('div');
    modal.id = 'artModal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = '<div class="art-modal protected-image"><button class="modal-close" aria-label="關閉">×</button><div class="art-modal-image"><img draggable="false" loading="eager" decoding="async" fetchpriority="high"></div><div class="art-modal-copy"></div></div>';
    document.body.appendChild(modal);
    modal.querySelector('.modal-close').onclick = function () { modal.classList.remove('open'); restoreArtworkSeo_(); };
    modal.onclick = function (e) { if (e.target === modal) {
        modal.classList.remove('open');
        restoreArtworkSeo_();
    } };
} var modalImage = modal.querySelector('img'), sources = artworkImageSources_(a, '2400'); modalImage.removeAttribute('src'); modalImage.dataset.fallbackSrc = sources.fallback || ''; modalImage.dataset.finalFallback = sources.final || IMAGE_PLACEHOLDER; modalImage.dataset.fallbackStep = '0'; modalImage.alt = artworkAlt_(a); modal.querySelector('.art-modal-copy').innerHTML = artInfoHtml(a) + (a.description ? "<p class=\"multiline\">".concat(nl(a.description), "</p>") : ''); applyArtworkSeo_(a); modal.classList.add('open'); requestAnimationFrame(function () { modalImage.src = sources.primary; }); }
function renderExhibitions() { var host = document.querySelector('#exhibitionTimeline'); if (!host)
    return; var rows = (exhibitions || []).filter(function (r) { return r.isPublic == null || truth(r.isPublic); }).sort(function (a, b) { return (Number(b.year || 0) - Number(a.year || 0)) || (Number(a.sort || 0) - Number(b.sort || 0)); }); host.innerHTML = rows.map(function (r) { return "<article class=\"exhibition-row\"><time>".concat(esc(r.year || r.date || ''), "</time><strong>").concat(esc(r.title || ''), "</strong><span>").concat(esc(r.location || ''), "</span><span>").concat(esc(r.type || ''), "</span></article>"); }).join(''); }
function renderHistory() { var host = document.querySelector('#historyCards'); if (!host)
    return; var rows = __spreadArray(__spreadArray([], (historyItems || []), true), (books || []), true).filter(function (r) { return r.isPublic == null || truth(r.isPublic); }); host.innerHTML = rows.map(function (r, i) { var src = directImageUrl(r.imageUrl || r.coverUrl || ''); return "<button class=\"history-card\" type=\"button\" data-history=\"".concat(i, "\">").concat(src ? "<img src=\"".concat(esc(src), "\" alt=\"").concat(esc(r.title || r.name || '歷史資料'), "\">") : '', "<span><strong>").concat(esc(r.title || r.name || '歷史資料'), "</strong><small>").concat(esc(r.year || r.date || ''), "</small></span></button>"); }).join(''); host.querySelectorAll('[data-history]').forEach(function (b) { return b.onclick = function () { return openHistory(rows[Number(b.dataset.history)]); }; }); }
function openHistory(r) { var m = document.querySelector('#historyModal'); if (!m) {
    m = document.createElement('div');
    m.id = 'historyModal';
    m.className = 'modal-backdrop';
    m.innerHTML = '<div class="history-modal"><button class="modal-close">×</button><div class="history-modal-body"></div></div>';
    document.body.appendChild(m);
    m.querySelector('.modal-close').onclick = function () { return m.classList.remove('open'); };
    m.onclick = function (e) { if (e.target === m)
        m.classList.remove('open'); };
} m.querySelector('.history-modal-body').innerHTML = "".concat(directImageUrl(r.imageUrl || r.coverUrl) ? "<img src=\"".concat(esc(directImageUrl(r.imageUrl || r.coverUrl)), "\" alt=\"").concat(esc(r.title || r.name || ''), "\">") : '', "<div><h2>").concat(esc(r.title || r.name || ''), "</h2><p class=\"multiline\">").concat(nl(r.description || r.summary || r.body || ''), "</p></div>"); m.classList.add('open'); }
function initContactForm() {
    var _this = this;
    var reason = document.querySelector('select[name="reason"]');
    if (reason && (siteConfig === null || siteConfig === void 0 ? void 0 : siteConfig.contactReasons))
        reason.innerHTML = '<option value="">請選擇</option>' + siteConfig.contactReasons.map(function (r) { return "<option value=\"".concat(esc(r), "\">").concat(esc(r), "</option>"); }).join('');
    var form = document.querySelector('#contactForm'), msg = document.querySelector('#formMessage');
    if (!form || form.dataset.bound)
        return;
    form.dataset.bound = '1';
    form.addEventListener('submit', function (e) { return __awaiter(_this, void 0, void 0, function () {
        var btn, fd, data, res, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    btn = form.querySelector('button[type="submit"]');
                    btn.disabled = true;
                    msg.textContent = '送出中…';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    fd = new FormData(form), data = Object.fromEntries(fd.entries());
                    data.sourcePage = 'contact.html';
                    data.userAgent = navigator.userAgent;
                    data.lineId = data.contactPlatform === 'LINE' ? data.contactId : '';
                    return [4 /*yield*/, XxyCms.post('contact', data)];
                case 2:
                    res = _a.sent();
                    msg.textContent = res.message || '已收到您的聯絡需求。';
                    form.reset();
                    return [3 /*break*/, 5];
                case 3:
                    err_4 = _a.sent();
                    msg.textContent = '送出失敗：' + err_4.message;
                    return [3 /*break*/, 5];
                case 4:
                    btn.disabled = false;
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); });
}
function initNavProgress() {
    var _a;
    var nav = document.querySelector('.main-nav'), shell = document.querySelector('.nav-shell');
    if (!nav || !shell)
        return;
    (_a = shell.querySelector('.nav-progress')) === null || _a === void 0 ? void 0 : _a.remove();
    var rail = shell.querySelector('.nav-rail');
    if (!rail) {
        rail = document.createElement('span');
        rail.className = 'nav-rail';
        rail.setAttribute('aria-hidden', 'true');
        shell.appendChild(rail);
    }
    var links = __spreadArray([], nav.querySelectorAll('.nav-link'), true);
    var centerActive = function (behavior) {
        if (behavior === void 0) { behavior = 'auto'; }
        var active = links.find(function (x) { return x.classList.contains('active'); });
        if (!active)
            return;
        var left = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
        nav.scrollTo({ left: Math.max(0, left), behavior: behavior });
    };
    var updateEdges = function () { var max = Math.max(0, nav.scrollWidth - nav.clientWidth); shell.classList.toggle('can-scroll-left', nav.scrollLeft > 8); shell.classList.toggle('can-scroll-right', nav.scrollLeft < max - 8); };
    nav.addEventListener('scroll', updateEdges, { passive: true });
    addEventListener('resize', function () { centerActive('auto'); updateEdges(); }, { passive: true });
    addEventListener('pageshow', function () { return setTimeout(function () { centerActive('auto'); updateEdges(); }, 30); }, { once: true });
    requestAnimationFrame(function () { centerActive('auto'); updateEdges(); });
}
function initUiEffects() { var reveals = __spreadArray([], document.querySelectorAll('.reveal'), true); if ('IntersectionObserver' in window) {
    var io_1 = new IntersectionObserver(function (es) { return es.forEach(function (e) { if (e.isIntersecting) {
        e.target.classList.add('visible');
        io_1.unobserve(e.target);
    } }); }, { threshold: .05, rootMargin: '120px' });
    reveals.forEach(function (e) { return io_1.observe(e); });
}
else {
    reveals.forEach(function (e) { return e.classList.add('visible'); });
} var top = document.querySelector('.to-top'); if (top) {
    addEventListener('scroll', function () { return top.classList.toggle('show', scrollY > 500); }, { passive: true });
    top.onclick = function () { return scrollTo({ top: 0, behavior: 'smooth' }); };
} initNavProgress(); }
installGlobalErrorHandling_();
installImageFallback_();
cleanupLegacyCachesOnce_();
document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
document.addEventListener('dragstart', function (e) { e.preventDefault(); });
initData();
