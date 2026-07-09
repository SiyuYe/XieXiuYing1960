const CACHE_NAME='hsieh-artist-cms-v7-1';
const ASSETS=['./','./index.html','./style.css','./app.js','./manifest.json','./data/site-config.json','./data/home.json','./data/pages.json','./data/artworks.json','./data/exhibitions.json','./admin/apps-script/Code.gs','./about.html','./gallery.html','./works.html','./exhibitions.html','./history.html','./contact.html','./admin/index.html','./admin/settings.html','./admin/works.html','./admin/artwork-edit.html','./api/cms.js'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS).catch(()=>{})))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.searchParams.has('t') || url.pathname.includes('/data/') || url.pathname.includes('/admin/') || url.pathname.includes('/api/')){
    event.respondWith(fetch(event.request).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return res}).catch(()=>caches.match(event.request)));
});
