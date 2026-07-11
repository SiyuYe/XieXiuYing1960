const CACHE_NAME='xxy-art-museum-v7-7-webp-1';
const CORE_ASSETS=[
  './','./index.html','./style.css','./app.js','./manifest.json',
  './data/site-config.json','./data/home.json','./data/pages.json','./data/artworks.json','./data/exhibitions.json','./data/images-manifest.json',
  './about.html','./gallery.html','./works.html','./exhibitions.html','./history.html','./contact.html',
  './assets/icons/icon-192.png','./assets/icons/icon-512.png','./api/cms.js'
];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE_ASSETS).catch(()=>{})))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  const sameOrigin=url.origin===self.location.origin;
  if(!sameOrigin)return;
  if(url.pathname.includes('/images/')){
    event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));}return res;})));
    return;
  }
  if(url.pathname.includes('/data/')||url.pathname.includes('/admin/')||url.pathname.includes('/api/')){
    event.respondWith(fetch(event.request).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));}return res;}).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(res=>{if(res.ok){const copy=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));}return res;})));
});
