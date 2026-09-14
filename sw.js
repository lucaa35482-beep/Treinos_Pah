
const CACHE="treinos-pah-coliseu-fix2";
const SHELL=[
  "./","./index.html","./style.css","./app.js","./manifest.webmanifest",
  "./icon-192.png","./icon-512.png"
];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.destination==="image"){
    e.respondWith(
      caches.match(req).then(cached=>{
        const fresh=fetch(req).then(res=>{
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
          return res;
        }).catch(()=>cached);
        return cached || fresh;
      })
    );
    return;
  }
  e.respondWith(caches.match(req).then(r=>r||fetch(req)));
});
