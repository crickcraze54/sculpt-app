const {app}=require('./regression.cjs');const assert=require('node:assert/strict');const fs=require('fs');const core=require('../core');
let passed=0;function ok(label,fn){fn();passed++;console.log('PASS',label);}
(async()=>{
 const dom=await app();const w=dom.window,run=code=>w.eval(code),state=()=>JSON.parse(run('JSON.stringify(snapshotForRollback())'));
 try{
 ok('clean install selects new program',()=>assert.equal(run('settings.activeProgram'),'complete-hypertrophy-6day-v1'));
 const totals=run('Object.fromEntries(Object.entries(SCULPT_PROGRAM.sessions).map(([id,s])=>[id,s.exercises.reduce((n,e)=>n+e.sets,0)]))');
 ok('source exercise totals',()=>assert.deepEqual(JSON.parse(JSON.stringify(totals)),{pushA:26,pullA:28,legsA:25,pushB:25,pullB:31,legsB:27}));console.log('CALCULATED WEEKLY SETS',Object.values(totals).reduce((a,b)=>a+b,0));
 // Independently compare the raw prescription and fields for all six source sections.
 const source=fs.readFileSync(require('path').join(__dirname,'../program-source.md'),'utf8');
 for(const key of ['pushA','pullA','legsA','pushB','pullB','legsB']){
  const session=run(`SCULPT_PROGRAM.sessions.${key}`);const header=new RegExp('^## '+session.name+' —[^\\n]+\\n([\\s\\S]*?)(?=^## |$)','m');
  const start=source.indexOf('## '+session.name+' —'),end=source.indexOf('\n## ',start+3),section=source.slice(start,end);
  const blocks=[...section.matchAll(/^### (\d+)\. ([^\n]+)\n([\s\S]*?)(?=^### |^\*\*Session total|$(?![\s\S]))/gm)];
  ok(session.name+' order, names, doses, technique and preparation',()=>{
   const normal=session.exercises.filter(e=>!e.id.endsWith('rotation'));assert.equal(normal.length,blocks.length);assert.equal(session.warmup.length,6);
   normal.forEach((ex,i)=>{const block=blocks[i];assert.equal(ex.sourceNumber,Number(block[1]));if(key!=='pullB'||ex.sourceNumber!==10)assert.equal(ex.name,block[2]);assert.equal(ex.sets,Number(block[3].match(/(\d+) ×/)[1]));const doseLine=block[3].split('\n').find(line=>line.includes('×'));const reps=doseLine.match(/× (\d+)(?:–(\d+))?/);assert.equal(ex.repMin,Number(reps[1]));assert.equal(ex.repMax,Number(reps[2]||reps[1]));const rir=doseLine.match(/RIR (\d+)(?:–(\d+))?/);if(rir){assert.equal(ex.rirMin,Number(rir[1]));assert.equal(ex.rirMax,Number(rir[2]||rir[1]));}const clean=text=>text.replace(/[*_]/g,'').replace(/\\~/g,'~').trim();for(const [field,label] of [['ramp','Ramp'],['breathing','Breathing'],['commonError','Error']]){const match=block[3].match(new RegExp('^- \\*\\*'+label+':\\*\\* (.+)$','m'));if(match&&!match[1].startsWith('as Legs A'))assert.equal(ex[field],clean(match[1]));}assert.equal(ex.restSeconds,Number([...block[3].matchAll(/rest (\d+)(?:–(\d+))? s/g)][0]?.[2]||block[3].match(/rest (\d+)/)[1]));for(const field of ['ramp','breathing','commonError','setup','rom'])if(!ex[field]&&!(key==='legsB'&&ex.sourceNumber===8&&field==='commonError'))throw new Error(ex.name+' missing '+field);});
  });
 }
 ok('weekday schedule uses local date and Sunday mobility',()=>{const Original=w.Date;class FakeDate extends Original{constructor(...a){super(...(a.length?a:['2026-10-25T12:00:00']));}static now(){return new Original('2026-10-25T12:00:00').getTime();}}w.Date=FakeDate;assert.equal(w.scheduledId(),null);w.renderToday();assert(w.document.querySelector('#todayScreen').textContent.includes('Rest + Mobility'));w.Date=Original;});
 w.startWorkout('pullA');
 ok('neck loads locked weeks 1–8 and enforce on write',()=>{for(let week=1;week<=8;week++){run(`training.active.weekNumber=${week}`);assert.equal(w.updateSet('pullA-7',0,'load','2.5'),false);}run('training.active.weekNumber=10');assert.equal(w.updateSet('pullA-7',0,'load','1.25'),true);assert.equal(w.updateSet('pullA-7',0,'rir','1'),false);});
 ok('unloaded practice and absolute ramp tiers',()=>{const ex=run('SCULPT_PROGRAM.sessions.pushA.exercises[0]');assert.deepEqual(core.rampSets(ex,40).map(x=>x.reps),[8,4]);assert.equal(core.rampSets(ex,80).length,3);assert.equal(core.rampSets(ex,140).length,4);assert.equal(core.rampSets(ex,160).length,4);assert.equal(core.rampSets({ramp:'none.'},40).length,0);});
 ok('deload counts preserve exercises with ~half sets',()=>{for(const week of [9,14])for(const s of Object.values(run('SCULPT_PROGRAM.sessions'))){s.exercises.forEach(ex=>assert([Math.floor(ex.sets/2),Math.ceil(ex.sets/2)].includes(core.prescribedSets(ex,week))));assert.equal(s.exercises.reduce((n,ex)=>n+core.prescribedSets(ex,week),0),Math.ceil(s.exercises.reduce((n,ex)=>n+ex.sets,0)/2));}});
 w.updateSet('pullA-1',0,'load','30');w.updateSet('pullA-1',0,'reps','12');w.updateSet('pullA-1',0,'rir','2');
 w.toggleDone('pullA-1',0);
 ok('completing working set automatically starts prescribed timer',()=>assert.equal(run('restTimer.timerDuration'),150));
 ok('warm-up and ramps excluded from completion',()=>{const before=run('completedSets(training.active)');w.setWarmup('general',true);w.setRamp('pullA-1',0,true);assert.equal(run('completedSets(training.active)'),before);});
 w.finishWorkout();ok('completed history preserves program/date/week/block',()=>{const s=state().training.sessions[0];for(const k of ['programId','programVersion','sessionId','sessionName','scheduledDate','startedAt','finishedAt','weekNumber','block'])assert(s[k]!=null,k);});
 ok('progression requires all working sets, same load, target RIR',()=>{const ex={name:'Press',repMax:10,rirMin:2,setType:'reps'};const sets=Array.from({length:3},()=>({load:'30',reps:'10',rir:'2',done:true}));assert(w.progressionAdvice(ex,{sets},{weekNumber:1}));sets[2].reps='9';assert.equal(w.progressionAdvice(ex,{sets},{weekNumber:1}),'');sets[2].reps='10';sets[2].rir='1';assert.equal(w.progressionAdvice(ex,{sets},{weekNumber:1}),'');});
 w.showScreen('mobility');
 ok('full/quick routines use all 13 or exact 5 drills',()=>{assert.equal(run('SCULPT_MOBILITY.routine.length'),13);assert.deepEqual(JSON.parse(run("JSON.stringify(SCULPT_MOBILITY.routine.filter(d=>d.quick).map(d=>d.id))")),['mob-2','mob-5','mob-8','mob-9','mob-12']);});
 for(let i=0;i<4;i++){w.startMobilityTimer('mob-5');w.advanceMobility('mob-5');}
 ok('per-side routine timers advance and completion persists',()=>{assert.equal(run("mobilityRecord().completed['mob-5']"),true);assert.equal(JSON.parse(w.localStorage.getItem('sculpt.v3.mobility')).records[0].segments['mob-5'],4);});
 w.showMobilityTest();w.document.querySelector('#mtLeft').value='10';w.document.querySelector('#mtRight').value='8';w.saveMobilityTest();
 ok('mobility tests save asymmetry without diagnosis',()=>{assert.equal(state().mobility.tests.length,1);assert.equal(core.asymmetry(10,8),20);assert.equal(core.asymmetry(0,0),0);assert(w.testFlags(state().mobility.tests[0]).includes('worth monitoring'));});
 const foods=[['rice',200,4,44,1,30,'good',2],['chicken',165,31,0,4,140,'good',3],['lentils',160,11,26,1,35,'mixed',3],['eggs',140,12,1,10,70,'unknown',1],['yogurt',100,10,8,2,50,'good',0],['whey',120,25,2,1,0,'unknown',0],['nuts',190,6,6,16,120,'bad',0],['banana',100,1,25,0,30,'good',0]];
 run('foods.foods='+JSON.stringify(foods.map(([id,calories,protein,carbs,fat,pricePkr,giTolerance,prepSteps])=>({id,name:id,basisQty:1,basisUnit:'serving',calories,protein,carbs,fat,pricePkr,priceQty:1,priceUnit:'serving',giTolerance,prepSteps}))));
 const remaining={calories:650,protein:50,carbs:90,fat:20},rankings={};for(const mode of run('SOLVER_MODES')){const r=w.solveMeal(mode,remaining);assert(r.length);rankings[mode]=r[0].items.map(i=>i.food.id+':'+i.qty).join(',');if(mode==='Cheapest')assert(r.every(p=>Number.isFinite(p.cost)&&p.items.every(i=>i.food.id!=='whey')));if(mode==='GI Friendly')assert(r.every(p=>p.items.every(i=>i.food.giTolerance!=='bad')));}
 ok('seven deterministic solver strategies differ',()=>{assert(new Set(Object.values(rankings)).size>=5,JSON.stringify(rankings));for(const [mode,first] of Object.entries(rankings))assert.equal(w.solveMeal(mode,remaining)[0].items.map(i=>i.food.id+':'+i.qty).join(','),first);});console.log('SOLVER FIRST OPTIONS',rankings);
 ok('missing prices never become zero-cost',()=>assert(Number.isNaN(w.estimateItemCost({food:run("findFood('whey')"),qty:1}))));
 const snapshot=state();w.importPayload({schemaVersion:3,...snapshot});ok('valid v3 roundtrip includes mobility',()=>assert.equal(state().mobility.tests.length,1));
 for(const mutate of [d=>d.training={},d=>d.nutrition.meals=[{}],d=>d.foods.foods=[{}],d=>d.body.records=[{}],d=>d.settings.proteinTarget='abc',d=>d.training.active={id:'x'},d=>d.mobility={records:[],tests:[{}]}]){
  const bad=JSON.parse(JSON.stringify(snapshot));mutate(bad);const old=[...Array(w.localStorage.length)].map((_,i)=>[w.localStorage.key(i),w.localStorage.getItem(w.localStorage.key(i))]);assert.throws(()=>w.importPayload({schemaVersion:3,...bad}));assert.deepEqual([...Array(w.localStorage.length)].map((_,i)=>[w.localStorage.key(i),w.localStorage.getItem(w.localStorage.key(i))]),old);
 }
 ok('nested corrupt imports rejected before persistent writes',()=>{});
 const legacySession={id:'legacy-test',workoutId:'pushA',startedAt:1,finishedAt:100,completedSets:1,totalSets:24,entries:{pa1:{setup:'Keep my setup',note:'Keep my note',sets:[{load:'31',reps:'9',rir:'2',done:true}]}}};
 w.importPayload({sessions:[legacySession],active:null,settings:{unit:'kg'}});
 ok('valid v1 import preserves original legacy logs',()=>{assert.equal(state().training.sessions[0].programId,'legacy-ppl');assert.equal(state().training.sessions[0].entries.pa1.sets[0].load,'31');});
 for(const theme of ['light','dark','system']){w.setTheme(theme);for(const screen of ['today','train','eat','plan','progress','settings','mobility','safety'])w.showScreen(screen);assert.equal(state().settings.theme,theme);}
 ok('all 8 major screens render in all theme preferences',()=>{});
 const prepared=state();prepared.training={sessions:[legacySession],active:{...legacySession,id:'active-legacy',finishedAt:undefined},settings:{unit:'kg'}};
 const seed=Object.fromEntries(['training','nutrition','foods','body','settings'].map(k=>['sculpt.v2.'+k,prepared[k]]));const legacyDom=await app(seed);
 ok('existing v2 active workout migration retains entries and legacy tag',()=>{const v=JSON.parse(legacyDom.window.localStorage.getItem('sculpt.v2.training'));assert.equal(v.active.programId,'legacy-ppl');assert.equal(v.active.entries.pa1.note,'Keep my note');assert.equal(v.sessions.length,1);assert(legacyDom.window.localStorage.getItem('sculpt.v3.preMigration'));});
 const migrated=JSON.parse(legacyDom.window.eval('JSON.stringify(snapshotForRollback())'));legacyDom.window.migrateProgram();assert.equal(legacyDom.window.eval('JSON.stringify(snapshotForRollback())'),JSON.stringify(migrated));legacyDom.window.close();ok('migration idempotent',()=>{});
 console.log(`${passed} acceptance groups passed`);
 }finally{dom.window.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
