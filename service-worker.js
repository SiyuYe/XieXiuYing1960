// CMS v7.9.0 STEP 4：停用舊 Service Worker 與快取。
self.addEventListener('install',function(){self.skipWaiting();});
self.addEventListener('activate',function(event){event.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.filter(function(key){return key.indexOf('xxy-')===0;}).map(function(key){return caches.delete(key);}));}).then(function(){return self.registration.unregister();}).then(function(){return self.clients.matchAll({type:'window'});}).then(function(clients){clients.forEach(function(client){client.navigate(client.url);});}));});
self.addEventListener('fetch',function(){});
