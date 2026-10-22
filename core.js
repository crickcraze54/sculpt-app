/* Shared deterministic logic; browser global and Node exports. No network. */
(function(root){
'use strict';
const macroKeys=['calories','protein','carbs','fat'];
const isObj=v=>v!==null && typeof v==='object' && !Array.isArray(v);
function assert(ok,path){if(!ok) throw new Error('Invalid '+path);}
function number(v,path,min=0){assert(typeof v==='number' && Number.isFinite(v) && v>=min,path);}
function str(v,path){assert(typeof v==='string',path);}
function id(v,path){assert(typeof v==='string' && /^[a-zA-Z0-9_-]{1,160}$/.test(v),path);}
function date(v,path){assert(typeof v==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v+'T12:00:00').getTime()),path);}
function session(s,path,active=false){
 assert(isObj(s),path);id(s.id,path+'.id');str(s.workoutId,path+'.workoutId');
 assert(['pushA','pullA','legsA','pushB','pullB','legsB'].includes(s.workoutId),path+'.workoutId');
 if(s.programId!==undefined)assert(['legacy-ppl','complete-hypertrophy-6day-v1'].includes(s.programId),path+'.programId');
 if(s.programVersion!==undefined)number(s.programVersion,path+'.programVersion');
 if(s.weekNumber!==undefined)assert(Number.isInteger(s.weekNumber)&&s.weekNumber>=1&&s.weekNumber<=16,path+'.weekNumber');
 if(s.scheduledDate!==undefined)date(s.scheduledDate,path+'.scheduledDate');
 for(const k of ['sessionId','sessionName','block','loadUnit'])if(s[k]!==undefined)str(s[k],path+'.'+k);
 if(s.warmups!==undefined){assert(isObj(s.warmups),path+'.warmups');Object.values(s.warmups).forEach(v=>assert(typeof v==='boolean',path+'.warmups.value'));}
 number(s.startedAt,path+'.startedAt');if(!active){number(s.finishedAt,path+'.finishedAt');number(s.completedSets,path+'.completedSets');number(s.totalSets,path+'.totalSets');}
 assert(isObj(s.entries)&&Object.keys(s.entries).length>0,path+'.entries');
 Object.entries(s.entries).forEach(([k,e])=>{id(k,path+'.exerciseId');assert(isObj(e)&&Array.isArray(e.sets)&&e.sets.length>0,path+'.sets');
 if(e.plannedLoad!==undefined)assert(typeof e.plannedLoad==='string'||typeof e.plannedLoad==='number',path+'.plannedLoad');
 if(e.ramps!==undefined)assert(Array.isArray(e.ramps)&&e.ramps.every(v=>typeof v==='boolean'),path+'.ramps');
 for(const field of ['setup','note']) if(e[field]!==undefined) str(e[field],path+'.'+field);
 e.sets.forEach(x=>{assert(isObj(x)&&typeof x.done==='boolean',path+'.set.done');if(x.note!==undefined)str(x.note,path+'.set.note');for(const key of ['load','reps','rir']){assert(typeof x[key]==='string'||typeof x[key]==='number',path+'.set.'+key);/* Preserve historical numeric strings, including earlier invalid RIR, verbatim. */} });
 });
}
function validateBackup(d){
 assert(isObj(d),'backup');assert(d.schemaVersion===2||d.schemaVersion===3||d.schemaVersion===4,'schemaVersion');
 const t=d.training;assert(isObj(t)&&Array.isArray(t.sessions)&&isObj(t.settings),'training.sessions/settings');str(t.settings.unit,'training.settings.unit');assert(t.active===null||isObj(t.active),'training.active');
 t.sessions.forEach((s,i)=>session(s,'training.sessions['+i+']'));if(t.active)session(t.active,'training.active',true);
 const n=d.nutrition;assert(isObj(n)&&Array.isArray(n.meals)&&Array.isArray(n.savedMeals),'nutrition.meals/savedMeals');
 n.meals.forEach((m,i)=>{const p='nutrition.meals['+i+']';assert(isObj(m),p);id(m.id,p+'.id');str(m.name,p+'.name');date(m.date,p+'.date');number(m.ts,p+'.ts');macroKeys.forEach(k=>number(m[k],p+'.'+k));for(const k of ['time','source','notes'])if(m[k]!==undefined)str(m[k],p+'.'+k);});
 n.savedMeals.forEach(m=>{assert(isObj(m)&&Array.isArray(m.items),'savedMeal.items');id(m.id,'savedMeal.id');str(m.name,'savedMeal.name');m.items.forEach(it=>{id(it.foodId,'savedMeal.foodId');number(it.qty,'savedMeal.qty');if(it.unit!==undefined)str(it.unit,'savedMeal.unit');});});
 assert(isObj(d.foods)&&Array.isArray(d.foods.foods),'foods.foods');d.foods.foods.forEach(f=>{id(f.id,'food.id');str(f.name,'food.name');number(f.basisQty,'food.basisQty');assert(f.basisQty>0,'food.basisQty');str(f.basisUnit,'food.basisUnit');macroKeys.forEach(k=>number(f[k],'food.'+k));for(const k of ['source','notes'])if(f[k]!==undefined)str(f[k],'food.'+k);if(f.prepSteps!==undefined)number(f.prepSteps,'food.prepSteps');for(const k of ['pricePkr','priceQty'])if(f[k]!=null)number(f[k],'food.'+k);if(f.priceUnit!==undefined)str(f.priceUnit,'food.priceUnit');if(f.giTolerance!==undefined)assert(['good','unknown','mixed','bad'].includes(f.giTolerance),'food.giTolerance');});
 assert(isObj(d.body)&&Array.isArray(d.body.records),'body.records');d.body.records.forEach(r=>{assert(isObj(r),'body.record');date(r.date,'body.date');for(const k of ['weightKg','waistCm','steps','sleepHours','hydrationMl','bloating','reflux','bowel'])if(r[k]!=null&&r[k]!=='')number(r[k],'body.'+k);if(r.notes!==undefined)str(r.notes,'body.notes');});
 assert(isObj(d.settings),'settings');for(const k of ['calorieTarget','proteinTarget','carbTarget','fatTarget','stepTarget'])number(d.settings[k],'settings.'+k);
 for(const k of ['hydrationTargetMl','goalWeightKg'])if(d.settings[k]!==undefined&&d.settings[k]!==null)number(d.settings[k],'settings.'+k);
 for(const k of ['bedtime','unit'])if(d.settings[k]!==undefined)str(d.settings[k],'settings.'+k);
 if(d.settings.completedBlocks!==undefined){assert(Array.isArray(d.settings.completedBlocks),'settings.completedBlocks');d.settings.completedBlocks.forEach(b=>{assert(isObj(b),'completedBlock');date(b.startedOn,'completedBlock.startedOn');date(b.completedOn,'completedBlock.completedOn');str(b.programId,'completedBlock.programId');});}
 if(d.settings.activeProgram!==undefined)assert(['legacy-ppl','complete-hypertrophy-6day-v1'].includes(d.settings.activeProgram),'settings.activeProgram');
 if(d.settings.blockStartedOn!==undefined)date(d.settings.blockStartedOn,'settings.blockStartedOn');
 for(const k of ['timerSound','deficitMode'])if(d.settings[k]!==undefined)assert(typeof d.settings[k]==='boolean','settings.'+k);
 if(d.settings.theme!==undefined)assert(['system','light','dark'].includes(d.settings.theme),'settings.theme');
 if(d.settings.proteinWindows!==undefined){assert(Array.isArray(d.settings.proteinWindows)&&d.settings.proteinWindows.length===4,'proteinWindows');d.settings.proteinWindows.forEach(w=>{str(w.label,'window.label');number(w.grams,'window.grams');});}
 if(d.milestones!==undefined){assert(isObj(d.milestones),'milestones');for(const k of ['usedSolver','usedAIParse'])if(d.milestones[k]!==undefined)assert(typeof d.milestones[k]==='boolean','milestones.'+k);}
 if(d.mobility!==undefined){assert(isObj(d.mobility)&&Array.isArray(d.mobility.records)&&Array.isArray(d.mobility.tests),'mobility');d.mobility.records.forEach(r=>{date(r.date,'mobility.date');assert(isObj(r.completed),'mobility.completed');Object.values(r.completed).forEach(v=>assert(typeof v==='boolean','mobility.completed value'));if(r.segments!==undefined){assert(isObj(r.segments),'mobility.segments');Object.values(r.segments).forEach(v=>number(v,'mobility.segment progress'));}});d.mobility.tests.forEach(t=>{date(t.date,'mobility.test.date');str(t.testId,'mobility.test.id');str(t.unit,'mobility.test.unit');str(t.notes,'mobility.test.notes');for(const k of ['left','right'])if(t[k]!==null)number(t[k],'mobility.test.'+k);});}
 if(root.NutritionCore)root.NutritionCore.validateStorage(d);
 return d;
}
function validSetValue(key,value){if(value==='')return true;const n=Number(value);return String(value).trim()!==''&&Number.isFinite(n)&&n>=0&&(key!=='rir'||(n<=5&&Number.isInteger(n)));}
function blockForWeek(w){return w===9||w===14?'Deload':w<=4?'Accumulation':w<=8?'Intensification':w<=13?'Peak Volume':'Consolidate';}
function prescribedSets(ex,w){return [9,14].includes(w)?(ex.deloadSets??Math.max(1,Math.ceil(ex.sets/2))):ex.sets;}
function rampSets(ex,load){
 const cue=ex.ramp.toLowerCase();if(cue.startsWith('none'))return [];
 if(/unloaded|bodyweight|empty sled/.test(cue)&&!cue.includes('full ramp'))return [{load:0,reps:Number(cue.match(/×\s*(\d+)/)?.[1]||6),type:'practice'}];
 let pairs;
 if(cue.includes('full ramp')){pairs=load<60?[[.5,8],[.75,4]]:load<=100?[[.4,8],[.6,5],[.8,3]]:load<=150?[[.4,8],[.6,5],[.75,3],[.88,1]]:[[.4,8],[.55,5],[.7,3],[.85,1]];}
 else if(cue.includes('two ramps'))pairs=[[.5,8],[.75,5]];
 else {const p=cue.match(/(\d+)%/);pairs=[[p?Number(p[1])/100:.5,Number(cue.match(/×\s*(\d+)/)?.[1]||10)]];}
 const inc=load<15?.5:load<40?1:2.5;
 const rows=pairs.map(([pct,reps])=>({load:Math.round(load*pct/inc)*inc,reps,type:'ramp'}));
 if(cue.includes('empty sled')) rows.unshift({load:0,reps:10,type:'empty sled'});return rows;
}
function asymmetry(left,right){return Number.isFinite(left)&&Number.isFinite(right)&&Math.max(left,right)>0?Math.abs(left-right)/Math.max(left,right)*100:0;}
const api={validateBackup,validSetValue,blockForWeek,prescribedSets,rampSets,asymmetry};root.SculptCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
