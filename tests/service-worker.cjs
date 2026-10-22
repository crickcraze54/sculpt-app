const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const handlers={},cacheData=new Map(),deleted=[];
function response(body,ok=true){return {body,ok,clone(){return response(body,ok);}};}
const cache={async addAll(){},async match(key){return cacheData.get(typeof key==='string'?key:key.url)},async put(key,value){cacheData.set(typeof key==='string'?key:key.url,value)}};
const ctx={URL,Response:{error:()=>response('error',false)},caches:{open:async()=>cache,keys:async()=>['sculpt-v2','unrelated-cache','sculpt-v3-20261022-1'],delete:async k=>deleted.push(k)},self:{location:{origin:'https://sculpt.test'},registration:{scope:'https://sculpt.test/'},addEventListener:(n,fn)=>handlers[n]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},fetch:async()=>response('new document')};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../service-worker.js'),'utf8'),ctx);
async function fetchEvent(req){let result=null;const waits=[];handlers.fetch({request:req,respondWith:p=>result=p,waitUntil:p=>waits.push(p)});const r=await result;await Promise.all(waits);return r;}
(async()=>{
 const req={url:'https://sculpt.test/',method:'GET',mode:'navigate'};cacheData.set('./index.html',response('old document'));
 let res=await fetchEvent(req);assert.equal(res.body,'new document');assert.equal(cacheData.get('./index.html').body,'new document');console.log('PASS newer navigation HTML replaces old cached document');
 ctx.fetch=async()=>{throw new Error('offline')};res=await fetchEvent(req);assert.equal(res.body,'new document');console.log('PASS navigation offline fallback uses current document');
 for(const req of [{url:'https://sculpt.test/api/nutrition-parse',method:'GET',mode:'cors'},{url:'https://sculpt.test/index.html',method:'POST',mode:'cors'},{url:'https://other.test/index.html',method:'GET',mode:'cors'}])assert.equal(await fetchEvent(req),null);console.log('PASS API, POST, cross-origin excluded');
 ctx.fetch=async()=>response('failed',false);await fetchEvent({url:'https://sculpt.test/core.js',method:'GET',mode:'cors'});assert(!cacheData.has('https://sculpt.test/core.js'));console.log('PASS failed responses not cached');
 let wait;handlers.activate({waitUntil:p=>wait=p});await wait;assert.deepEqual(deleted,['sculpt-v2']);console.log('PASS activation only deletes old Sculpt caches');
})().catch(e=>{console.error(e);process.exitCode=1;});
