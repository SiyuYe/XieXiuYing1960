// 謝秀英書畫藝術館 CMS v7.2-D API client｜統一排序中心
(function(){
  const CONFIG_PATH = '../data/site-config.json';
  const ROOT_CONFIG_PATH = 'data/site-config.json';
  const LOCAL_API_KEY = 'xxy.cms.apiUrl';
  const LOCAL_TOKEN_KEY = 'xxy.cms.adminToken';
  const CACHE_PREFIX = 'xxy.cms.v72d.';
  const MEMORY = new Map();

  function qs(name){ return new URLSearchParams(location.search).get(name); }
  function normalizeApiUrl(url){ return String(url||'').trim(); }
  function getStoredApiUrl(){ return normalizeApiUrl(localStorage.getItem(LOCAL_API_KEY) || ''); }
  function setStoredApiUrl(url){ localStorage.setItem(LOCAL_API_KEY, normalizeApiUrl(url)); clearCache(); }
  function getAdminToken(){ return String(localStorage.getItem(LOCAL_TOKEN_KEY)||'').trim(); }
  function setAdminToken(token){ localStorage.setItem(LOCAL_TOKEN_KEY, String(token||'').trim()); }

  async function loadLocalConfig(){
    const path = location.pathname.includes('/admin/') ? CONFIG_PATH : ROOT_CONFIG_PATH;
    try { const r = await fetch(path + '?v=7.2-D', {cache:'no-store'}); return await r.json(); }
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
    const u = new URL(url);
    Object.entries(params||{}).forEach(([k,v])=>{
      if(v !== undefined && v !== null && v !== '') u.searchParams.set(k,v);
    });
    return u.toString();
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
      Object.keys(sessionStorage).filter(k=>k.startsWith(CACHE_PREFIX)).forEach(k=>sessionStorage.removeItem(k));
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
  async function siteBundle(){ return get('siteBundle',{}, {cacheMs:5*60*1000}); }
  async function artworksPage(params, options){
    return get('artworksPage', params||{}, Object.assign({cacheMs:2*60*1000},options||{}));
  }

  async function adminMeta(options){
    return get('adminMeta',{},Object.assign({cacheMs:10*60*1000},options||{}));
  }

  async function batchUpdateArtworks(artworkIds, patch){
    return post('adminBatchUpdateArtworks',{artworkIds:Array.from(artworkIds||[]),patch:patch||{}});
  }


  async function displayOrder(section, options){
    return get('displayOrder',{section:section||'homeHero'},Object.assign({cacheMs:60*1000},options||{}));
  }
  async function saveDisplayOrder(section, artworkIds){
    return post('saveDisplayOrder',{section:section,artworkIds:Array.from(artworkIds||[])});
  }

  async function artwork(id, options){
    if(!id) throw new Error('缺少作品 ID');
    return get('artwork',{id},Object.assign({cacheMs:5*60*1000},options||{}));
  }

  window.XxyCms = {
    loadLocalConfig, resolveApiUrl, getStoredApiUrl, setStoredApiUrl,
    getAdminToken, setAdminToken, get, post, siteBundle,
    artworksPage, adminMeta, artwork, batchUpdateArtworks, displayOrder, saveDisplayOrder, clearCache
  };
})();
