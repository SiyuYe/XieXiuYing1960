"use strict";

function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
// 謝秀英書畫藝術館 CMS v7.3-C API client｜Token 自動檢查
(function () {
  var CONFIG_PATH = '../data/site-config.json';
  var ROOT_CONFIG_PATH = 'data/site-config.json';
  var LOCAL_API_KEY = 'xxy.cms.apiUrl';
  var LOCAL_TOKEN_KEY = 'xxy.cms.adminToken';
  var CACHE_PREFIX = 'xxy.cms.v751.';
  var MEMORY = typeof Map === 'function' ? new Map() : {
    _data: {},
    get: function get(key) {
      return this._data[key];
    },
    set: function set(key, value) {
      this._data[key] = value;
    },
    clear: function clear() {
      this._data = {};
    }
  };
  function qs(name) {
    if (typeof URLSearchParams === 'function') return new URLSearchParams(location.search).get(name);
    var query = String(location.search || '').replace(/^\?/, '').split('&');
    for (var i = 0; i < query.length; i++) {
      var parts = query[i].split('=');
      if (decodeURIComponent(parts[0] || '') === name) return decodeURIComponent((parts.slice(1).join('=') || '').replace(/\+/g, ' '));
    }
    return null;
  }
  function normalizeApiUrl(url) {
    return String(url || '').trim();
  }
  function getStoredApiUrl() {
    return normalizeApiUrl(localStorage.getItem(LOCAL_API_KEY) || '');
  }
  function setStoredApiUrl(url) {
    localStorage.setItem(LOCAL_API_KEY, normalizeApiUrl(url));
    clearCache();
  }
  function getAdminToken() {
    return String(localStorage.getItem(LOCAL_TOKEN_KEY) || '').trim();
  }
  function setAdminToken(token) {
    localStorage.setItem(LOCAL_TOKEN_KEY, String(token || '').trim());
  }
  function loadLocalConfig() {
    return _loadLocalConfig.apply(this, arguments);
  }
  function _loadLocalConfig() {
    _loadLocalConfig = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var path, r, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            path = location.pathname.includes('/admin/') ? CONFIG_PATH : ROOT_CONFIG_PATH;
            _context.p = 1;
            _context.n = 2;
            return fetch(path + '?v=7.5.1', {
              cache: 'no-store'
            });
          case 2:
            r = _context.v;
            _context.n = 3;
            return r.json();
          case 3:
            return _context.a(2, _context.v);
          case 4:
            _context.p = 4;
            _t = _context.v;
            return _context.a(2, {});
        }
      }, _callee, null, [[1, 4]]);
    }));
    return _loadLocalConfig.apply(this, arguments);
  }
  function resolveApiUrl() {
    return _resolveApiUrl.apply(this, arguments);
  }
  function _resolveApiUrl() {
    _resolveApiUrl = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
      var fromQuery, stored, cfg;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.n) {
          case 0:
            fromQuery = qs('api');
            if (!fromQuery) {
              _context2.n = 1;
              break;
            }
            setStoredApiUrl(fromQuery);
            return _context2.a(2, normalizeApiUrl(fromQuery));
          case 1:
            stored = getStoredApiUrl();
            if (!stored) {
              _context2.n = 2;
              break;
            }
            return _context2.a(2, stored);
          case 2:
            _context2.n = 3;
            return loadLocalConfig();
          case 3:
            cfg = _context2.v;
            return _context2.a(2, normalizeApiUrl(cfg.appsScriptApiUrl || ''));
        }
      }, _callee2);
    }));
    return _resolveApiUrl.apply(this, arguments);
  }
  function withParams(url, params) {
    var pairs = [];
    var source = params || {};
    Object.keys(source).forEach(function (k) {
      var v = source[k];
      if (v !== undefined && v !== null && v !== '') pairs.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    });
    if (!pairs.length) return url;
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + pairs.join('&');
  }
  function cacheKey(action, params) {
    return CACHE_PREFIX + action + ':' + JSON.stringify(params || {});
  }
  function readCache(key, maxAgeMs) {
    var mem = MEMORY.get(key);
    if (mem && Date.now() - mem.time < maxAgeMs) return mem.data;
    try {
      var raw = sessionStorage.getItem(key);
      if (!raw) return null;
      var box = JSON.parse(raw);
      if (Date.now() - box.time >= maxAgeMs) {
        sessionStorage.removeItem(key);
        return null;
      }
      MEMORY.set(key, box);
      return box.data;
    } catch (e) {
      return null;
    }
  }
  function writeCache(key, data) {
    var box = {
      time: Date.now(),
      data: data
    };
    MEMORY.set(key, box);
    try {
      sessionStorage.setItem(key, JSON.stringify(box));
    } catch (e) {}
  }
  function clearCache() {
    MEMORY.clear();
    try {
      Object.keys(sessionStorage).filter(function (k) {
        return k.indexOf(CACHE_PREFIX) === 0;
      }).forEach(function (k) {
        sessionStorage.removeItem(k);
      });
    } catch (e) {}
  }
  function get(_x, _x2, _x3) {
    return _get.apply(this, arguments);
  }
  function _get() {
    _get = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(action, params, options) {
      var opts, key, cached, api, r, data;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.n) {
          case 0:
            opts = Object.assign({
              cacheMs: 0,
              signal: null
            }, options || {});
            key = cacheKey(action, params);
            if (!opts.cacheMs) {
              _context3.n = 1;
              break;
            }
            cached = readCache(key, opts.cacheMs);
            if (!cached) {
              _context3.n = 1;
              break;
            }
            return _context3.a(2, cached);
          case 1:
            _context3.n = 2;
            return resolveApiUrl();
          case 2:
            api = _context3.v;
            if (api) {
              _context3.n = 3;
              break;
            }
            throw new Error('尚未設定 Apps Script Web App URL');
          case 3:
            _context3.n = 4;
            return fetch(withParams(api, Object.assign({
              action: action
            }, params || {})), {
              cache: 'no-store',
              signal: opts.signal || undefined
            });
          case 4:
            r = _context3.v;
            _context3.n = 5;
            return r.json();
          case 5:
            data = _context3.v;
            if (data.ok) {
              _context3.n = 6;
              break;
            }
            throw new Error(data.error || 'API 回傳失敗');
          case 6:
            if (opts.cacheMs) writeCache(key, data);
            return _context3.a(2, data);
        }
      }, _callee3);
    }));
    return _get.apply(this, arguments);
  }
  function post(_x4, _x5) {
    return _post.apply(this, arguments);
  }
  function _post() {
    _post = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(action, data) {
      var api, r, res;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.n) {
          case 0:
            _context4.n = 1;
            return resolveApiUrl();
          case 1:
            api = _context4.v;
            if (api) {
              _context4.n = 2;
              break;
            }
            throw new Error('尚未設定 Apps Script Web App URL');
          case 2:
            _context4.n = 3;
            return fetch(api, {
              method: 'POST',
              headers: {
                'Content-Type': 'text/plain;charset=utf-8'
              },
              body: JSON.stringify({
                action: action,
                token: getAdminToken(),
                data: data || {}
              })
            });
          case 3:
            r = _context4.v;
            _context4.n = 4;
            return r.json();
          case 4:
            res = _context4.v;
            if (res.ok) {
              _context4.n = 5;
              break;
            }
            throw new Error(res.error || 'API 寫入失敗');
          case 5:
            clearCache();
            return _context4.a(2, res);
        }
      }, _callee4);
    }));
    return _post.apply(this, arguments);
  }
  function siteBundle() {
    return _siteBundle.apply(this, arguments);
  }
  function _siteBundle() {
    _siteBundle = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
      return _regenerator().w(function (_context5) {
        while (1) switch (_context5.n) {
          case 0:
            return _context5.a(2, get('siteBundle', {}, {
              cacheMs: 0
            }));
        }
      }, _callee5);
    }));
    return _siteBundle.apply(this, arguments);
  }
  function artworksPage(_x6, _x7) {
    return _artworksPage.apply(this, arguments);
  }
  function _artworksPage() {
    _artworksPage = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6(params, options) {
      return _regenerator().w(function (_context6) {
        while (1) switch (_context6.n) {
          case 0:
            return _context6.a(2, get('artworksPage', params || {}, Object.assign({
              cacheMs: 2 * 60 * 1000
            }, options || {})));
        }
      }, _callee6);
    }));
    return _artworksPage.apply(this, arguments);
  }
  function adminMeta(_x8) {
    return _adminMeta.apply(this, arguments);
  }
  function _adminMeta() {
    _adminMeta = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7(options) {
      return _regenerator().w(function (_context7) {
        while (1) switch (_context7.n) {
          case 0:
            return _context7.a(2, get('adminMeta', {}, Object.assign({
              cacheMs: 10 * 60 * 1000
            }, options || {})));
        }
      }, _callee7);
    }));
    return _adminMeta.apply(this, arguments);
  }
  function toArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value.slice();
    if (typeof Array.from === 'function') return Array.from(value);
    var out = [];
    if (typeof value.forEach === 'function') value.forEach(function (item) {
      out.push(item);
    });
    return out;
  }
  function batchUpdateArtworks(_x9, _x0) {
    return _batchUpdateArtworks.apply(this, arguments);
  }
  function _batchUpdateArtworks() {
    _batchUpdateArtworks = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8(artworkIds, patch) {
      return _regenerator().w(function (_context8) {
        while (1) switch (_context8.n) {
          case 0:
            return _context8.a(2, post('adminBatchUpdateArtworks', {
              artworkIds: toArray(artworkIds),
              patch: patch || {}
            }));
        }
      }, _callee8);
    }));
    return _batchUpdateArtworks.apply(this, arguments);
  }
  function displayOrder(_x1, _x10) {
    return _displayOrder.apply(this, arguments);
  }
  function _displayOrder() {
    _displayOrder = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee9(section, options) {
      return _regenerator().w(function (_context9) {
        while (1) switch (_context9.n) {
          case 0:
            return _context9.a(2, get('displayOrder', {
              section: section || 'homeHero'
            }, Object.assign({
              cacheMs: 60 * 1000
            }, options || {})));
        }
      }, _callee9);
    }));
    return _displayOrder.apply(this, arguments);
  }
  function saveDisplayOrder(_x11, _x12) {
    return _saveDisplayOrder.apply(this, arguments);
  }
  function _saveDisplayOrder() {
    _saveDisplayOrder = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee0(section, artworkIds) {
      return _regenerator().w(function (_context0) {
        while (1) switch (_context0.n) {
          case 0:
            return _context0.a(2, post('saveDisplayOrder', {
              section: section,
              artworkIds: toArray(artworkIds)
            }));
        }
      }, _callee0);
    }));
    return _saveDisplayOrder.apply(this, arguments);
  }
  function artwork(_x13, _x14) {
    return _artwork.apply(this, arguments);
  }
  function _artwork() {
    _artwork = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee1(id, options) {
      return _regenerator().w(function (_context1) {
        while (1) switch (_context1.n) {
          case 0:
            if (id) {
              _context1.n = 1;
              break;
            }
            throw new Error('缺少作品 ID');
          case 1:
            return _context1.a(2, get('artwork', {
              id: id
            }, Object.assign({
              cacheMs: 5 * 60 * 1000
            }, options || {})));
        }
      }, _callee1);
    }));
    return _artwork.apply(this, arguments);
  }
  function clearAdminToken() {
    localStorage.removeItem(LOCAL_TOKEN_KEY);
  }
  function hasApiUrl() {
    return !!getStoredApiUrl();
  }
  function hasAdminToken() {
    return !!getAdminToken();
  }
  function validateAdminToken() {
    return _validateAdminToken.apply(this, arguments);
  }
  function _validateAdminToken() {
    _validateAdminToken = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee10() {
      var api, token, r, res;
      return _regenerator().w(function (_context10) {
        while (1) switch (_context10.n) {
          case 0:
            _context10.n = 1;
            return resolveApiUrl();
          case 1:
            api = _context10.v;
            if (api) {
              _context10.n = 2;
              break;
            }
            throw new Error('尚未設定 Apps Script Web App URL');
          case 2:
            token = getAdminToken();
            if (token) {
              _context10.n = 3;
              break;
            }
            throw new Error('尚未設定 adminWriteToken');
          case 3:
            _context10.n = 4;
            return fetch(api, {
              method: 'POST',
              headers: {
                'Content-Type': 'text/plain;charset=utf-8'
              },
              body: JSON.stringify({
                action: 'adminValidateToken',
                token: token
              })
            });
          case 4:
            r = _context10.v;
            _context10.n = 5;
            return r.json();
          case 5:
            res = _context10.v;
            if (res.ok) {
              _context10.n = 6;
              break;
            }
            throw new Error(res.error || 'Token 驗證失敗');
          case 6:
            return _context10.a(2, res);
        }
      }, _callee10);
    }));
    return _validateAdminToken.apply(this, arguments);
  }
  function validateAdminAccess() {
    return _validateAdminAccess.apply(this, arguments);
  }
  function _validateAdminAccess() {
    _validateAdminAccess = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee11() {
      var api, ping, token, verified, message, isApiError, _t2;
      return _regenerator().w(function (_context11) {
        while (1) switch (_context11.p = _context11.n) {
          case 0:
            _context11.n = 1;
            return resolveApiUrl();
          case 1:
            api = _context11.v;
            if (api) {
              _context11.n = 2;
              break;
            }
            return _context11.a(2, {
              ok: false,
              api: false,
              token: false,
              error: '尚未設定 API URL'
            });
          case 2:
            _context11.p = 2;
            _context11.n = 3;
            return get('ping', {}, {
              cacheMs: 0
            });
          case 3:
            ping = _context11.v;
            token = getAdminToken();
            if (token) {
              _context11.n = 4;
              break;
            }
            return _context11.a(2, {
              ok: false,
              api: true,
              token: false,
              ping: ping,
              error: '尚未設定 adminWriteToken'
            });
          case 4:
            _context11.n = 5;
            return validateAdminToken();
          case 5:
            verified = _context11.v;
            return _context11.a(2, {
              ok: true,
              api: true,
              token: true,
              ping: ping,
              verified: verified
            });
          case 6:
            _context11.p = 6;
            _t2 = _context11.v;
            message = _t2 && _t2.message ? _t2.message : String(_t2);
            isApiError = /Failed to fetch|NetworkError|fetch failed/i.test(message);
            return _context11.a(2, {
              ok: false,
              api: !isApiError,
              token: false,
              error: message
            });
        }
      }, _callee11, null, [[2, 6]]);
    }));
    return _validateAdminAccess.apply(this, arguments);
  }
  window.XxyCms = {
    loadLocalConfig: loadLocalConfig,
    resolveApiUrl: resolveApiUrl,
    getStoredApiUrl: getStoredApiUrl,
    setStoredApiUrl: setStoredApiUrl,
    getAdminToken: getAdminToken,
    setAdminToken: setAdminToken,
    clearAdminToken: clearAdminToken,
    hasApiUrl: hasApiUrl,
    hasAdminToken: hasAdminToken,
    validateAdminToken: validateAdminToken,
    validateAdminAccess: validateAdminAccess,
    get: get,
    post: post,
    siteBundle: siteBundle,
    artworksPage: artworksPage,
    adminMeta: adminMeta,
    artwork: artwork,
    batchUpdateArtworks: batchUpdateArtworks,
    displayOrder: displayOrder,
    saveDisplayOrder: saveDisplayOrder,
    clearCache: clearCache
  };
})();
