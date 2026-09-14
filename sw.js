
const CACHE="treinos-pah-v2";
const ASSETS=[
  "./","./index.html","./style.css","./app.js","./manifest.webmanifest",
  "./icon-192.png","./icon-512.png",
  "./images/agachamento.svg","./images/leg-press.svg","./images/cadeira-extensora.svg",
  "./images/flexora.svg","./images/elevacao-pelvica.svg","./images/abdutora.svg",
  "./images/puxada-frente.svg","./images/remada.svg","./images/supino.svg",
  "./images/elevacao-lateral.svg","./images/rosca-biceps.svg","./images/triceps.svg",
  "./images/passada.svg","./images/desenvolvimento.svg","./images/abdomen.svg"
];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener("fetch",e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
