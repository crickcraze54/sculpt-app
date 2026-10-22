const {JSDOM,ResourceLoader,VirtualConsole}=require(process.env.JSDOM_PATH||'jsdom');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
async function app(seed={},options={}){
 const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,src)=>'<script>'+fs.readFileSync(path.join(root,src),'utf8')+'</script>'),{url:'http://sculpt.test/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){const listeners=[];const scheme={matches:!!options.dark,addEventListener(type,fn){listeners.push(fn);}};w.matchMedia=query=>query.includes('prefers-color-scheme')?scheme:{matches:false,addEventListener(){}};w.setSystemDark=value=>{scheme.matches=value;listeners.forEach(fn=>fn({matches:value}));};w.scrollTo=()=>{};w.confirm=()=>true;w.alert=msg=>{w.lastAlert=msg;};w.fetch=async()=>{throw new Error('mock network unavailable');};Object.entries(seed).forEach(([k,v])=>w.localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v)));}});
 await new Promise(resolve=>dom.window.addEventListener('load',resolve));
 assert.deepEqual(errors,[],errors.join('\n'));return dom;
}
if(require.main===module)(async()=>{
 const dom=await app();const w=dom.window,run=code=>w.eval(code);
 w.showScreen('train');w.startWorkout('pushA');w.showScreen('eat');run("eatSubview='log';renderEat()");
 const food=w.document.querySelector('#sfFood');food.value='seed_massgainer';food.dispatchEvent(new w.Event('change'));
 assert.equal(w.document.querySelector('#sfUnit').value,'g');w.document.querySelector('#sfQty').value='65';w.submitSavedFood();
 assert.equal(run('nutrition.meals.at(-1).calories'),248);console.log('PASS Hydropure → Mass Gainer → 65 g');
 for(const bad of ['-1','6','abc'])assert.equal(w.updateSet('pushA-1',0,'rir',bad),false);
 assert.equal(run('training.active.entries["pushA-1"].sets[0].rir'),'');console.log('PASS RIR rejects -1, 6, abc');
 for(const bad of ['abc','-1']){assert.equal(w.updateSet('pushA-1',0,'load',bad),false);assert.equal(w.updateSet('pushA-1',0,'reps',bad),false);}
 const before=run('JSON.stringify(snapshotForRollback())');assert.throws(()=>w.importPayload({schemaVersion:2,training:{},nutrition:{},foods:{},body:{},settings:{}}));assert.equal(run('JSON.stringify(snapshotForRollback())'),before);console.log('PASS empty shell import leaves state unchanged');
 for(const value of [0,500,1000,1200]){const html=w.calorieRing(value,1000);assert(!html.includes('id='));assert(html.includes('--ring-progress:'+Math.min(100,value/10)+'%'));}console.log('PASS ring output 0/50/100/120% without SVG IDs');
 w.renderSettings();w.document.querySelector('#stPro').value='140';w.saveSettings();assert.equal(run('settings.proteinWindows[0].grams'),35);w.document.querySelector('#stPro').value='200';w.saveSettings();assert.equal(run('settings.proteinWindows[0].grams'),50);console.log('PASS protein targets 140→35, 200→50');
 // Date helper uses local components; simulate a date rollover while keeping the form open.
 run("calendarDay='2000-01-01';eatDate='2000-01-01';historicalLogging=false");w.logMeal({date:'2000-01-01',name:'Midnight meal',calories:1,protein:0,carbs:0,fat:0});assert.equal(run('nutrition.meals.at(-1).date'),w.localDateStr());
 w.chooseEatDate('2026-01-01');run('historicalLogging=true');w.logMeal({name:'Historical',calories:1,protein:0,carbs:0,fat:0});assert.equal(run('nutrition.meals.at(-1).date'),'2026-01-01');w.chooseEatDate(w.localDateStr());console.log('PASS rollover and intentional past-date logging');
 w.startTimer(90);assert.equal(run('timerLeft()'),90);w.pauseTimer();assert.equal(run('restTimer.pausedRemaining'),90);w.addTimer();assert.equal(run('timerLeft()'),120);w.pauseTimer();assert.equal(run('restTimer.pausedRemaining'),null);w.stopTimer();console.log('PASS timestamp timer pause/resume/+30');
 console.log('PASS phase 1 DOM regression suite');dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={app};
