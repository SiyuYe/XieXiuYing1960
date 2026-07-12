// 謝秀英書畫藝術館 CMS v7.3-C API client｜Token 自動檢查
(function(){
  const CONFIG_PATH = '../data/site-config.json';
  const ROOT_CONFIG_PATH = 'data/site-config.json';
  const LOCAL_API_KEY = 'xxy.cms.apiUrl';
  const LOCAL_TOKEN_KEY = 'xxy.cms.adminToken';
  const CACHE_PREFIX = 'xxy.cms.v751.';
  const MEMORY = typeof Map === 'function' ? new Map() : {
    _data:{},
    get:function(key){ return this._data[key]; },
    set:function(key,value){ this._data[key]=value; },
    clear:function(){ this._data={}; }
  };

  function qs(name){
    if(typeof URLSearchParams === 'function') return new URLSearchParams(location.search).get(name);
    const query=String(location.search||'').replace(/^\?/,'').split('&');
    for(let i=0;i<query.length;i++){
      const parts=query[i].split('=');
      if(decodeURIComponent(parts[0]||'')===name) return decodeURIComponent((parts.slice(1).join('=')||'').replace(/\+/g,' '));
    }
    return null;
  }
  function normalizeApiUrl(url){ return String(url||'').trim(); }
  function getStoredApiUrl(){ return normalizeApiUrl(localStorage.getItem(LOCAL_API_KEY) || ''); }
  function setStoredApiUrl(url){ localStorage.setItem(LOCAL_API_KEY, normalizeApiUrl(url)); clearCache(); }
  function getAdminToken(){ return String(localStorage.getItem(LOCAL_TOKEN_KEY)||'').trim(); }
  function setAdminToken(token){ localStorage.setItem(LOCAL_TOKEN_KEY, String(token||'').trim()); }

  async function loadLocalConfig(){
    const path = location.pathname.includes('/admin/') ? CONFIG_PATH : ROOT_CONFIG_PATH;
    try { const r = await fetch(path + '?v=7.5.1', {cache:'no-store'}); return await r.json(); }
    catch(e){ return {}; }
  }
  async function resolveApiUrl(){
    const fromQuery = qs('api');
    if(fromQuery){ setStoredApiUrl(fromQuery); return normalizeApiUrl(fromQuery); }
    const stored = getStoredApiUrl();
    if(stored) return stored;
    const cfg = await loadLocalConfig();
    return normalizeApiUrl(cfg.appsScriptApiUrl || '');
  }
  function withParams(url, params){
    const pairs=[];
    const source=params||{};
    Object.keys(source).forEach(function(k){
      const v=source[k];
      if(v !== undefined && v !== null && v !== '') pairs.push(encodeURIComponent(k)+'='+encodeURIComponent(v));
    });
    if(!pairs.length)return url;
    return url+(url.indexOf('?')>=0?'&':'?')+pairs.join('&');
  }
  function cacheKey(action, params){ return CACHE_PREFIX + action + ':' + JSON.stringify(params||{}); }
  function readCache(key, maxAgeMs){
    const mem = MEMORY.get(key);
    if(mem && Date.now()-mem.time < maxAgeMs) return mem.data;
    try{
      const raw=sessionStorage.getItem(key);
      if(!raw) return null;
      const box=JSON.parse(raw);
      if(Date.now()-box.time >= maxAgeMs){ sessionStorage.removeItem(key); return null; }
      MEMORY.set(key, box);
      return box.data;
    }catch(e){ return null; }
  }
  function writeCache(key,data){
    const box={time:Date.now(),data};
    MEMORY.set(key,box);
    try{ sessionStorage.setItem(key,JSON.stringify(box)); }catch(e){}
  }
  function clearCache(){
    MEMORY.clear();
    try{
      Object.keys(sessionStorage).filter(function(k){return k.indexOf(CACHE_PREFIX)===0;}).forEach(function(k){sessionStorage.removeItem(k);});
    }catch(e){}
  }
  async function get(action, params, options){
    const opts=Object.assign({cacheMs:0,signal:null}, options||{});
    const key=cacheKey(action,params);
    if(opts.cacheMs){
      const cached=readCache(key,opts.cacheMs);
      if(cached) return cached;
    }
    const api = await resolveApiUrl();
    if(!api) throw new Error('尚未設定 Apps Script Web App URL');
    const r = await fetch(withParams(api, Object.assign({action}, params||{})), {cache:'no-store', signal:opts.signal||undefined});
    const data = await r.json();
    if(!data.ok) throw new Error(data.error || 'API 回傳失敗');
    if(opts.cacheMs) writeCache(key,data);
    return data;
  }
  async function post(action, data){
    const api = await resolveApiUrl();
    if(!api) throw new Error('尚未設定 Apps Script Web App URL');
    const r = await fetch(api, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify({action, token:getAdminToken(), data:data||{}})});
    const res = await r.json();
    if(!res.ok) throw new Error(res.error || 'API 寫入失敗');
    clearCache();
    return res;
  }
  async function siteBundle(){ return get('siteBundle',{}, {cacheMs:0}); }
  async function artworksPage(params, options){
    return get('artworksPage', params||{}, Object.assign({cacheMs:2*60*1000},options||{}));
  }

  async function adminMeta(options){
    return get('adminMeta',{},Object.assign({cacheMs:10*60*1000},options||{}));
  }

  function toArray(value){
    if(!value)return [];
    if(Array.isArray(value))return value.slice();
    if(typeof Array.from==='function')return Array.from(value);
    const out=[];
    if(typeof value.forEach==='function')value.forEach(function(item){out.push(item);});
    return out;
  }
  async function batchUpdateArtworks(artworkIds, patch){
    return post('adminBatchUpdateArtworks',{artworkIds:toArray(artworkIds),patch:patch||{}});
  }


  async function displayOrder(section, options){
    return get('displayOrder',{section:section||'homeHero'},Object.assign({cacheMs:60*1000},options||{}));
  }
  async function saveDisplayOrder(section, artworkIds){
    return post('saveDisplayOrder',{section:section,artworkIds:toArray(artworkIds)});
  }

  async function artwork(id, options){
    if(!id) throw new Error('缺少作品 ID');
    return get('artwork',{id},Object.assign({cacheMs:5*60*1000},options||{}));
  }


  function clearAdminToken(){ localStorage.removeItem(LOCAL_TOKEN_KEY); }
  function hasApiUrl(){ return !!getStoredApiUrl(); }
  function hasAdminToken(){ return !!getAdminToken(); }

  async function validateAdminToken(){
    const api = await resolveApiUrl();
    if(!api) throw new Error('尚未設定 Apps Script Web App URL');
    const token = getAdminToken();
    if(!token) throw new Error('尚未設定 adminWriteToken');
    const r = await fetch(api, {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({action:'adminValidateToken', token})
    });
    const res = await r.json();
    if(!res.ok) throw new Error(res.error || 'Token 驗證失敗');
    return res;
  }

  async function validateAdminAccess(){
    const api = await resolveApiUrl();
    if(!api) return {ok:false, api:false, token:false, error:'尚未設定 API URL'};
    try{
      const ping = await get('ping',{}, {cacheMs:0});
      const token = getAdminToken();
      if(!token) return {ok:false, api:true, token:false, ping, error:'尚未設定 adminWriteToken'};
      const verified = await validateAdminToken();
      return {ok:true, api:true, token:true, ping, verified};
    }catch(err){
      const message = err && err.message ? err.message : String(err);
      const isApiError = /Failed to fetch|NetworkError|fetch failed/i.test(message);
      return {ok:false, api:!isApiError, token:false, error:message};
    }
  }

  window.XxyCms = {
    loadLocalConfig, resolveApiUrl, getStoredApiUrl, setStoredApiUrl,
    getAdminToken, setAdminToken, clearAdminToken, hasApiUrl, hasAdminToken, validateAdminToken, validateAdminAccess, get, post, siteBundle,
    artworksPage, adminMeta, artwork, batchUpdateArtworks, displayOrder, saveDisplayOrder, clearCache
  };
})();
