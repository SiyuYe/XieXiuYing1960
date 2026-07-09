// 謝秀英書畫藝術館 CMS v7 API client
(function(){
  const CONFIG_PATH = '../data/site-config.json';
  const ROOT_CONFIG_PATH = 'data/site-config.json';
  const LOCAL_API_KEY = 'xxy.cms.apiUrl';
  const LOCAL_TOKEN_KEY = 'xxy.cms.adminToken';
  const CACHE_KEY = 'xxy.cms.siteBundle.cache';

  function qs(name){ return new URLSearchParams(location.search).get(name); }
  function normalizeApiUrl(url){ return String(url||'').trim(); }
  function getStoredApiUrl(){ return normalizeApiUrl(localStorage.getItem(LOCAL_API_KEY) || ''); }
  function setStoredApiUrl(url){ localStorage.setItem(LOCAL_API_KEY, normalizeApiUrl(url)); }
  function getAdminToken(){ return String(localStorage.getItem(LOCAL_TOKEN_KEY)||'').trim(); }
  function setAdminToken(token){ localStorage.setItem(LOCAL_TOKEN_KEY, String(token||'').trim()); }

  async function loadLocalConfig(){
    const path = location.pathname.includes('/admin/') ? CONFIG_PATH : ROOT_CONFIG_PATH;
    try { const r = await fetch(path + '?v=' + Date.now(), {cache:'no-store'}); return await r.json(); }
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
    Object.entries(params||{}).forEach(([k,v])=>u.searchParams.set(k,v));
    u.searchParams.set('_t', Date.now());
    return u.toString();
  }
  async function get(action, params){
    const api = await resolveApiUrl();
    if(!api) throw new Error('尚未設定 Apps Script Web App URL');
    const r = await fetch(withParams(api, Object.assign({action}, params||{})), {cache:'no-store'});
    const data = await r.json();
    if(!data.ok) throw new Error(data.error || 'API 回傳失敗');
    return data;
  }
  async function post(action, data){
    const api = await resolveApiUrl();
    if(!api) throw new Error('尚未設定 Apps Script Web App URL');
    const r = await fetch(api, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify({action, token:getAdminToken(), data:data||{}})});
    const res = await r.json();
    if(!res.ok) throw new Error(res.error || 'API 寫入失敗');
    return res;
  }
  async function siteBundle(){
    try { const data = await get('siteBundle'); localStorage.setItem(CACHE_KEY, JSON.stringify({time:Date.now(), data})); return data; }
    catch(err){
      const cache = localStorage.getItem(CACHE_KEY);
      if(cache){ try { return JSON.parse(cache).data; } catch(e){} }
      throw err;
    }
  }
  window.XxyCms = { loadLocalConfig, resolveApiUrl, getStoredApiUrl, setStoredApiUrl, getAdminToken, setAdminToken, get, post, siteBundle };
})();
