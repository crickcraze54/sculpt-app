/* Network-first document; cache only this version's known, same-origin shell. */
const CACHE='sculpt-v4-ai-nutrition-20261022-1';
const ASSETS=['./','./index.html','./core.js','./nutrition-core.js','./nutrition.js','./nutrition.css','./app.js','./program-data.js','./storage.js','./upgrade.js','./theme.css','./program-source.md','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('sculpt-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 const navigation=req.mode==='navigate'||url.pathname.endsWith('/index.html');
 if(navigation){event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const res=await fetch(req,{cache:'no-store'});if(res.ok){await cache.put('./index.html',res.clone());return res;}return (await cache.match('./index.html'))||res;}catch(e){return (await cache.match('./index.html'))||Response.error();}})());return;}
 const known=ASSETS.some(asset=>new URL(asset,self.registration.scope).href===url.href);if(!known)return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),hit=await cache.match(req);const update=fetch(req).then(async res=>{if(res.ok)await cache.put(req,res.clone());return res;}).catch(()=>hit||Response.error());event.waitUntil(update.then(()=>{}));return hit||update;})());
});
