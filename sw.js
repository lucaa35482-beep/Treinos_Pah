
const CACHE="treinos-pah-v5-video";
const SHELL=["./","./index.html","./style.css","./app.js","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch",e=>{
  const r=e.request;
  if(r.destination==="video"){ e.respondWith(fetch(r)); return; }
  if(r.method!=="GET"){ return; }
  e.respondWith(caches.match(r).then(c=>c||fetch(r).then(res=>{
    if(new URL(r.url).origin===location.origin){
      const copy=res.clone(); caches.open(CACHE).then(cache=>cache.put(r,copy)).catch(()=>{});
    }
    return res;
  })));
});
