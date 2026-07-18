// CMS V8.1.3：清除舊快取並停用舊 Service Worker。
self.addEventListener('install',function(){self.skipWaiting();});
self.addEventListener('activate',function(event){
 event.waitUntil(
  caches.keys()
   .then(function(keys){return Promise.all(keys.map(function(key){return caches.delete(key);}));})
   .then(function(){return self.clients.claim();})
   .then(function(){return self.registration.unregister();})
 );
});
self.addEventListener('fetch',function(){});
