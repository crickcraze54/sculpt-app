if(document.documentElement.dataset.storageRecovery==='required')throw new Error('Import recovery could not finish; stored data is retained.');
/* =========================================================================
   PROGRAM — unchanged workout prescriptions, carried over verbatim from
   the original Sculpt PPL tracker. Do not alter exercises/sets/reps here.
   ========================================================================= */
const PROGRAM = {
  pushA: {
    name: 'Push A', color: 'var(--push-a)', focus: 'Upper chest + lateral delts + triceps',
    exercises: [
      ['pa1','Low-Incline Smith Press (20–30°)',4,'6–10','2.5–3 min','2→1','Upper chest','Controlled deep eccentric; keep the incline low enough that your pecs—not front delts—dominate.'],
      ['pa2','Low-Incline Dumbbell Press',3,'8–12','2–3 min','1–2','Upper chest','Use a comfortable deep ROM. Log the weight of ONE dumbbell.'],
      ['pa3','Low-to-High Cable Fly',3,'10–15','1.5–2 min','1','Upper chest','Bring the arms up and inward; do not turn it into a front raise.'],
      ['pa4','Behind-the-Body Single-Arm Cable Lateral Raise',4,'10–15','1.5 min','1','Lateral delt','Lead with the elbow and keep shrugging minimal.'],
      ['pa5','Machine Lateral Raise',4,'12–20','1–1.5 min','1→0','Lateral delt','Keep the torso fixed; progress reps before load.'],
      ['pa6','Overhead Cable Triceps Extension',3,'8–12','1.5–2 min','1','Triceps long head','Keep the upper arm stable and control the stretch.'],
      ['pa7','Cross-Body Cable Triceps Extension / Pressdown',3,'10–15','1.5 min','1→0','Triceps','Use the version that gives you the cleanest elbow path.']
    ]
  },
  pullA: {
    name: 'Pull A', color: 'var(--pull-a)', focus: 'Lat width + lat sweep + biceps',
    exercises: [
      ['pla1','Neutral / Medium-Grip Pull-Up or Pulldown',4,'6–10','2.5 min','1–2','Lats / width','Think elbow down toward your side pocket; do not turn it into a row.'],
      ['pla2','One-Arm Lat Pulldown',3,'8–12','2 min','1','Lats','Use a full overhead reach and drive the elbow toward the hip.'],
      ['pla3','One-Arm Cable Lat Row',3,'10–15','1.5–2 min','1','Lat sweep','Keep the upper arm close to the torso; pull the elbow toward the hip.'],
      ['pla4','Cable Pullover / Straight-Arm Pulldown',3,'10–15','1.5 min','1','Lats','Keep elbow angle nearly fixed; move through shoulder extension.'],
      ['pla5','Chest-Supported Neutral Row',3,'8–12','2 min','1–2','Lats + mid-back','Do not bounce your chest off the pad.'],
      ['pla6','Bayesian Cable Curl',3,'10–15','1.5 min','1','Biceps','Keep the shoulder slightly behind the torso and control the lengthened position.'],
      ['pla7','Preacher Curl',3,'8–12','1.5–2 min','1','Biceps','Keep the upper arm planted; no shoulder roll.'],
      ['pla8','Cross-Body Hammer Curl',2,'10–15','1.5 min','1','Brachialis / brachioradialis','Neutral grip; no torso swing.']
    ]
  },
  pushB: {
    name: 'Push B', color: 'var(--push-b)', focus: 'Delt architecture + rear delts + upper chest + triceps',
    exercises: [
      ['pb1','Machine Shoulder Press',3,'6–10','2.5 min','2','Delts','Use a stable path and stop before technique degrades.'],
      ['pb2','Machine / Cable Lateral Raise',4,'10–15','1.5 min','1','Lateral delt','Keep your neck relaxed and lead with the elbow.'],
      ['pb3','Leaning Single-Arm Cable Lateral Raise',4,'12–20','1–1.5 min','1→0','Lateral delt','Use controlled reps; do not chase stack weight.'],
      ['pb4','Reverse Pec Deck',4,'12–20','1.5 min','1','Rear delt','Drive the upper arm outward; avoid excessive shrugging.'],
      ['pb5','Incline Machine / Smith Press',3,'8–12','2 min','1–2','Upper chest','Upper-chest reinforcement; no need for maximal loading.'],
      ['pb6','Cable Fly — Midline',2,'12–15','1.5 min','1','Chest maintenance','Use a controlled stretch and squeeze.'],
      ['pb7','Overhead Cable Triceps Extension',3,'10–15','1.5 min','1','Triceps long head','Keep shoulder position stable.'],
      ['pb8','Single-Arm Pressdown',2,'12–15','1 min','0–1','Triceps','Safe final isolation work.']
    ]
  },
  pullB: {
    name: 'Pull B', color: 'var(--pull-b)', focus: '3D back + traps + rear delts + arms',
    exercises: [
      ['plb1','Chest-Supported T-Bar Row',4,'6–10','2.5–3 min','1–2','Mid-back / mid traps','Retract under control; no torso heave.'],
      ['plb2','High Chest-Supported Row (elbows 45–70°)',3,'8–12','2 min','1','Upper back / mid traps','Pull wider than your lat row and make scapular retraction deliberate.'],
      ['plb3','Neutral-Grip Lat Pulldown',2,'8–12','2 min','1','Lats','Use a full reach; drive the elbow down.'],
      ['plb4','One-Arm Cable Pulldown',2,'10–15','1.5 min','1','Lats','Controlled unilateral lat work.'],
      ['plb5','Reverse Pec Deck',3,'12–20','1.5 min','1→0','Rear delt','Rear-delt emphasis; do not shrug.'],
      ['plb6','Cable Rear-Delt Fly',2,'12–20','1–1.5 min','1→0','Rear delt','Keep the arm path consistent.'],
      ['plb7','Smith / Machine Shrug',3,'8–12','1.5–2 min','1','Upper traps','Elevate the shoulders vertically, pause briefly, and do not roll them.'],
      ['plb8','Cable Y-Raise',2,'12–20','1–1.5 min','1–2','Lower-trap emphasis','Use light load and a clean Y path without lumbar extension.'],
      ['plb9','Incline Dumbbell Curl',3,'8–12','1.5 min','1','Biceps','Keep the shoulder extended and upper arm stable.'],
      ['plb10','Hammer Curl',2,'8–12','1.5 min','1','Brachialis / brachioradialis','Neutral grip with a controlled eccentric.']
    ]
  }
};
const WORKOUT_ORDER = ['pushA','pullA','pushB','pullB'];

/* =========================================================================
   Core helpers
   ========================================================================= */
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

// Central HTML-escaping helper. Use before interpolating ANY user- or
// API-derived string into innerHTML (meal names, notes, saved-food names,
// setup notes, parsed AI text, etc).
function esc(s=''){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

// LOCAL calendar date as YYYY-MM-DD (device timezone, NOT UTC). Never use
// new Date().toISOString().split('T')[0] — that reports the UTC day, which
// is wrong for the second half of most local days.
function localDateStr(d){
  d = d instanceof Date ? d : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function fmtDate(ts){ return new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric'}).format(new Date(ts)); }
function todayLong(){ return new Intl.DateTimeFormat(undefined,{weekday:'short',day:'numeric',month:'short'}).format(new Date()); }
function round1(n){ return Math.round((Number(n)||0)*10)/10; }
function num(v,def=0){ const n=parseFloat(v); return Number.isFinite(n)?n:def; }

/* =========================================================================
   Storage — versioned v2 namespaces + legacy migration
   ========================================================================= */
const NS = {
  training: 'sculpt.v2.training',
  nutrition: 'sculpt.v2.nutrition',
  foods: 'sculpt.v2.foods',
  body: 'sculpt.v2.body',
  settings: 'sculpt.v2.settings',
  migrated: 'sculpt.v2.migrated',
  milestones: 'sculpt.v2.milestones'
};

function loadNS(key, factory){
  const raw = localStorage.getItem(key);
  if(raw!=null){
    try { const v = JSON.parse(raw); if(v && typeof v==='object') return v; } catch(e){}
    document.body.textContent='Sculpt paused to protect unreadable stored data in '+key+'. Existing keys have not been changed. Save your browser storage before recovery.';
    throw new Error('Unreadable stored data: '+key);
  }
  return factory();
}
function saveNS(key,val){ localStorage.setItem(key, JSON.stringify(val)); }
function saveAll(){
  saveNS(NS.training, training);
  saveNS(NS.nutrition, nutrition);
  saveNS(NS.foods, foods);
  saveNS(NS.body, body);
  saveNS(NS.settings, settings);
  saveNS(NS.milestones, milestones);
}

function defaultSettings(){
  return {
    calorieTarget: 2350, proteinTarget: 190, carbTarget: 240, fatTarget: 70, stepTarget: 7000,
    hydrationTargetMl: 3000, goalWeightKg: null,
    unit: 'kg', bedtime: '', proteinWindows: [
      {label:'Morning', grams: Math.round(190/4)},
      {label:'Midday', grams: Math.round(190/4)},
      {label:'Afternoon', grams: Math.round(190/4)},
      {label:'Evening', grams: Math.round(190/4)}
    ],
    legacyMigrationMeta: null
  };
}
function defaultTraining(){ return {sessions:[],active:null,settings:{unit:'kg'}}; }
function defaultNutrition(){ return {meals:[],savedMeals:[]}; }
function defaultBody(){ return {records:[]}; }
// Milestones — tiny local-only flags for achievements that can't be derived
// purely from other data (e.g. "used the meal solver at least once").
// Never synced anywhere; purely cosmetic/motivational.
function defaultMilestones(){ return {usedSolver:false, usedAIParse:false}; }
function seedFoods(){
  return {
    foods: [
      {
        id:'seed_hydropure', name:'Nutrabolics Hydropure (1 scoop)',
        basisQty:1, basisUnit:'scoop',
        calories:130, protein:28, carbs:0, fat:2,
        source:'label-partial', pricePkr:0, priceQty:1, priceUnit:'scoop',
        giTolerance:'unknown',
        notes:'Calories/protein from label. Carbs/fat are placeholders — edit to match your tub label exactly.'
      },
      {
        id:'seed_massgainer', name:'Dymatize Super Mass Gainer (335g)',
        basisQty:335, basisUnit:'g',
        calories:1280, protein:52, carbs:245, fat:11,
        source:'label', pricePkr:0, priceQty:335, priceUnit:'g',
        giTolerance:'unknown',
        notes:'Per label 335g serving. Arbitrary gram quantities scale proportionally.'
      }
    ]
  };
}

const settingsExistedBefore = localStorage.getItem(NS.settings)!=null;
let training = loadNS(NS.training, defaultTraining);
let nutrition = loadNS(NS.nutrition, defaultNutrition);
let foods = loadNS(NS.foods, seedFoods);
let body = loadNS(NS.body, defaultBody);
let settings = loadNS(NS.settings, defaultSettings);
if(!Array.isArray(settings.proteinWindows) || settings.proteinWindows.length!==4){
  settings.proteinWindows = defaultSettings().proteinWindows;
}
if(settings.hydrationTargetMl==null) settings.hydrationTargetMl = 3000;
if(settings.goalWeightKg===undefined) settings.goalWeightKg = null;
let milestones = loadNS(NS.milestones, defaultMilestones);
if(typeof milestones.usedSolver!=='boolean') milestones.usedSolver = false;
if(typeof milestones.usedAIParse!=='boolean') milestones.usedAIParse = false;

let migrationResult = {ran:false};
function migrateLegacyData(){
  if(localStorage.getItem(NS.migrated)==='true') return {ran:false};
  let trainingCopied=false, sessionsCopied=0, mealsCopied=0, legacyTargets=null;

  try {
    const legacy = JSON.parse(localStorage.getItem('sculptPPL.v1'));
    if(!localStorage.getItem(NS.training) && legacy && (Array.isArray(legacy.sessions) || legacy.active)){
      training.sessions = Array.isArray(legacy.sessions) ? legacy.sessions : [];
      training.active = legacy.active || null;
      training.settings = legacy.settings || {unit:'kg'};
      trainingCopied = true; sessionsCopied = training.sessions.length;
    }
  } catch(e){}

  try {
    const legacyLogKeys = (localStorage.getItem(NS.nutrition)?[]:Object.keys(localStorage)).filter(k=>/^logs_\d{4}-\d{2}-\d{2}$/.test(k));
    legacyLogKeys.forEach(k=>{
      const date = k.slice(5);
      let arr = [];
      try { arr = JSON.parse(localStorage.getItem(k)) || []; } catch(e){ arr = []; }
      arr.forEach(m=>{
        const ts = Number(m.id) || Date.now();
        nutrition.meals.push({
          id: 'legacy_'+(m.id!=null?m.id:uid()),
          date, ts,
          time: m.time || new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(new Date(ts)),
          name: m.name || 'Meal',
          calories: Math.round(num(m.cal)),
          protein: round1(num(m.pro)),
          carbs: round1(num(m.carb)),
          fat: round1(num(m.fat)),
          source: 'legacy-import',
          notes: m.details || ''
        });
        mealsCopied++;
      });
    });
  } catch(e){}

  try {
    const t = JSON.parse(localStorage.getItem('macro_targets'));
    if(t) legacyTargets = t;
  } catch(e){}

  if(!settingsExistedBefore){
    settings = defaultSettings();
  }
  settings.legacyMigrationMeta = legacyTargets ? {importedTargets:legacyTargets, importedAt:Date.now()} : settings.legacyMigrationMeta || null;

  saveAll();
  localStorage.setItem(NS.migrated,'true');
  return {ran:true, trainingCopied, sessionsCopied, mealsCopied};
}
if([NS.training,NS.nutrition,NS.foods,NS.body,NS.settings].some(key=>localStorage.getItem(key)!==null)){
  try{SculptCore.validateBackup({schemaVersion:2,training,nutrition,foods,body,settings,milestones});}
  catch(e){document.body.textContent='Sculpt has paused to protect existing data: '+e.message+'. Your stored data has not been changed. Restore a valid backup after saving the existing browser storage.';throw e;}
}
migrationResult = migrateLegacyData();

/* =========================================================================
   TRAIN module (workout logging) — behavior preserved from Sculpt PPL v1
   ========================================================================= */
let trainSubview = 'program'; // 'program' | 'log' | 'history' | 'library'
let libraryQuery = '';
let libraryMuscle = 'all';

function totalSets(workout){ return workout.exercises.reduce((n,e)=>n+e[2],0); }


function newestFirst(){ training.sessions.sort((a,b)=>b.finishedAt-a.finishedAt); }

// ---- Derived training stats (pure functions over existing session data;
// nothing new is stored, everything here is recomputed on demand) ----

// Consecutive-day training streak, counting back from today. A day with no
// finished session breaks the streak. If nothing is logged today yet, the
// streak still counts from yesterday backward (so it doesn't zero out at
// midnight before you've had a chance to train).
function trainingStreak(){
  const days = new Set(training.sessions.map(s=>localDateStr(new Date(s.finishedAt))));
  let streak = 0;
  let cursor = new Date();
  if(!days.has(localDateStr(cursor))) cursor.setDate(cursor.getDate()-1);
  while(days.has(localDateStr(cursor))){
    streak++;
    cursor.setDate(cursor.getDate()-1);
  }
  return streak;
}
function hoursTrained(){
  const ms = training.sessions.reduce((sum,s)=> sum + Math.max(0,(s.finishedAt||0)-(s.startedAt||0)), 0);
  return ms/3600000;
}
// Heaviest logged load per exercise across all history, with the date and
// which workout/session it came from. Only considers sets with a positive
// numeric load actually entered.

// Read-only exercise library — browses the existing PROGRAM prescriptions
// by muscle group with a search box. Never edits sets/reps/prescriptions.

function trainLibraryHtml(){
  const all = allExercisesFlat();
  const muscles = Array.from(new Set(all.map(e=>e.muscle))).sort();
  return `<div class="field"><input id="libSearch" class="detail-input" placeholder="Search exercises or muscle group…" value="${esc(libraryQuery)}"></div>
    <div class="tag-row" id="libMuscleRow">
      <button class="mini lib-muscle-btn" data-m="all" style="${libraryMuscle==='all'?'background:var(--accent);color:var(--accent-contrast);border-color:var(--accent)':''}">All</button>
      ${muscles.map(m=>`<button class="mini lib-muscle-btn" data-m="${esc(m)}" style="${libraryMuscle===m?'background:var(--accent);color:var(--accent-contrast);border-color:var(--accent)':''}">${esc(m)}</button>`).join('')}
    </div>
    <div id="libResults"></div>`;
}
function libraryResultsHtml(){
  const all = allExercisesFlat();
  const q = libraryQuery.trim().toLowerCase();
  const filtered = all.filter(e=>{
    if(libraryMuscle!=='all' && e.muscle!==libraryMuscle) return false;
    if(q && !(e.name.toLowerCase().includes(q) || e.muscle.toLowerCase().includes(q))) return false;
    return true;
  });
  let html = `<div class="section-title"><h2>Exercises</h2><span>${filtered.length} found</span></div>`;
  if(!filtered.length){ html += `<div class="notice info">No exercises match that search.</div>`; }
  filtered.forEach(e=>{
    html += `<div class="card exercise-lib-row" style="--wcolor:${e.workoutColor}">
      <div class="exercise-head"><div><h3 style="font-size:15px">${esc(e.name)}</h3>
        <div class="exercise-meta">${e.setCount} sets · ${esc(e.reps)} reps · ${esc(e.rest)} rest · RIR ${esc(e.rir)}</div>
        <div class="muscle-tag">${esc(e.muscle)}</div></div>
        <span class="pill">${esc(e.workoutName)}</span></div>
      <div class="cue">${esc(e.cue)}</div>
    </div>`;
  });
  return html;
}
function renderLibraryResults(){
  const results = document.getElementById('libResults');
  if(results) results.innerHTML = libraryResultsHtml();
}
function wireLibraryEvents(){
  const search = document.getElementById('libSearch');
  if(search){
    renderLibraryResults();
    search.addEventListener('input', ()=>{ libraryQuery = search.value; renderLibraryResults(); });
  }
  document.querySelectorAll('.lib-muscle-btn').forEach(b=>b.addEventListener('click',()=>{ libraryMuscle=b.dataset.m; renderTrain(); }));
}

function goTrainLog(){ trainSubview='log'; showScreen('train'); }

function updateSet(exId,i,key,val,inputEl){
  const set=training.active.entries[exId].sets[i];
  if(!SculptCore.validSetValue(key,val)){toast(key==='rir'?'RIR must be a whole number from 0 to 5':`${key} must be a number ≥ 0`);if(inputEl)inputEl.value=set[key];return false;}
  if(key==='reps'&&Number(val)>50&&!confirm(`${val} reps is unusually high — confirm this is intentional?`)){if(inputEl)inputEl.value=set[key];return false;}
  set[key]=val;saveNS(NS.training,training);return true;
}
function updateEntry(exId,key,val){ training.active.entries[exId][key]=val; saveNS(NS.training, training); }


function cancelWorkout(){ if(confirm('Delete the current in-progress workout? Logged data from this active session will be lost.')){ training.active=null; saveNS(NS.training, training); trainSubview='program'; showScreen('train'); } }

function restSeconds(text){const values=String(text).match(/[\d.]+/g)||[90];return Math.round(Number(values[values.length-1])*(text.includes('min')?60:1));}
let timerInterval=null;
let restTimer=null;
try{restTimer=JSON.parse(localStorage.getItem('sculpt.timer')||'null');}catch(e){}
function persistTimer(){if(restTimer)localStorage.setItem('sculpt.timer',JSON.stringify(restTimer));else localStorage.removeItem('sculpt.timer');}
function startTimer(seconds,label='Rest'){
 restTimer={timerStartedAt:Date.now(),timerDuration:seconds,originalDuration:seconds,pausedRemaining:null,label,announced:false};persistTimer();
 clearInterval(timerInterval);tickTimer();timerInterval=setInterval(tickTimer,1000);
}
function timerLeft(){if(!restTimer)return 0;return restTimer.pausedRemaining??Math.max(0,Math.ceil(restTimer.timerDuration-(Date.now()-restTimer.timerStartedAt)/1000));}
function tickTimer(){
 const box=document.getElementById('timerBox');document.body.classList.toggle('timer-active',!!restTimer);if(!restTimer){box.classList.remove('show');return;}
 const left=timerLeft();box.classList.add('show');box.classList.toggle('finished',left===0);
 document.getElementById('timerText').textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0');
 document.getElementById('timerLabel').textContent=left===0?restTimer.label+' complete':restTimer.label;
 document.getElementById('timerPause').textContent=restTimer.pausedRemaining===null?'Pause':'Resume';
 box.style.setProperty('--timer-progress',Math.min(100,left/Math.max(1,restTimer.timerDuration)*100)+'%');
 if(left===0){clearInterval(timerInterval);timerInterval=null;}
 if(left===0&&!restTimer.announced){restTimer.announced=true;persistTimer();toast(restTimer.label+' complete');if(settings.timerSound)playTimerSound();}
}
function pauseTimer(){if(!restTimer)return;const left=timerLeft();if(restTimer.pausedRemaining===null)restTimer.pausedRemaining=left;else{restTimer.timerStartedAt=Date.now()-(restTimer.timerDuration-left)*1000;restTimer.pausedRemaining=null;}persistTimer();tickTimer();}
function addTimer(){if(!restTimer)return;restTimer.timerDuration+=30;if(restTimer.pausedRemaining!==null)restTimer.pausedRemaining+=30;restTimer.announced=false;persistTimer();clearInterval(timerInterval);timerInterval=setInterval(tickTimer,1000);tickTimer();}
function resetTimer(){if(restTimer)startTimer(restTimer.originalDuration||restTimer.timerDuration,restTimer.label);}
function stopTimer(){restTimer=null;clearInterval(timerInterval);persistTimer();tickTimer();}
let audioContext=null;
function unlockAudio(){if(!settings.timerSound)return;try{audioContext=audioContext||new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();}catch(e){}}
function playTimerSound(){try{if(!audioContext||audioContext.state!=='running')return;const o=audioContext.createOscillator(),g=audioContext.createGain();o.connect(g);g.connect(audioContext.destination);o.frequency.value=660;g.gain.setValueAtTime(.04,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.3);o.start();o.stop(audioContext.currentTime+.3);}catch(e){}}
document.addEventListener('pointerdown',unlockAudio);

/* =========================================================================
   FOODS module — deterministic saved-food store
   ========================================================================= */
function findFood(id){ return foods.foods.find(f=>f.id===id) || null; }
function isWeightUnit(u){ return ['g','kg','oz','lb'].includes(u); }
function isVolumeUnit(u){ return ['ml','l'].includes(u); }
function toGrams(qty,unit){
  switch(unit){ case 'g': return qty; case 'kg': return qty*1000; case 'oz': return qty*28.3495; case 'lb': return qty*453.592; default: return null; }
}
function toMl(qty,unit){ switch(unit){ case 'ml': return qty; case 'l': return qty*1000; default: return null; } }

// Returns scale factor (qty relative to the food's basis), or null if the
// requested unit is not compatible with the food's basis unit (in which
// case the caller must fall back to manual entry — we never guess).
function foodScaleFactor(food, qty, unit){
  if(!food || !Number.isFinite(qty) || qty<=0) return null;
  if(unit === food.basisUnit) return qty/food.basisQty;
  if(isWeightUnit(unit) && isWeightUnit(food.basisUnit)){
    const g = toGrams(qty,unit), bg = toGrams(food.basisQty, food.basisUnit);
    if(g!=null && bg) return g/bg;
  }
  if(isVolumeUnit(unit) && isVolumeUnit(food.basisUnit)){
    const ml = toMl(qty,unit), bml = toMl(food.basisQty, food.basisUnit);
    if(ml!=null && bml) return ml/bml;
  }
  return null;
}
function scaledMacros(food, qty, unit){
  const f = foodScaleFactor(food, qty, unit);
  if(f==null) return null;
  return {
    calories: Math.round(food.calories*f),
    protein: round1(food.protein*f),
    carbs: round1(food.carbs*f),
    fat: round1(food.fat*f)
  };
}
function upsertFood(f){
  const i = foods.foods.findIndex(x=>x.id===f.id);
  if(i>=0) foods.foods[i]=f; else foods.foods.push(f);
  saveNS(NS.foods, foods);
}
function deleteFood(id){
  foods.foods = foods.foods.filter(f=>f.id!==id);
  saveNS(NS.foods, foods);
}

/* =========================================================================
   EAT module — nutrition dashboard, logging, history
   ========================================================================= */
let eatSubview = 'dashboard'; // 'dashboard' | 'log' | 'history'
let eatDate = localDateStr();
let calendarDay = localDateStr();
let historicalLogging = false;
function checkLocalDay(){
 const day=localDateStr();
 if(day!==calendarDay){calendarDay=day;eatDate=day;historicalLogging=false;shuffledWorkoutId=null;}
 document.getElementById('todayBadge').textContent=todayLong();
 return day;
}
function chooseEatDate(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||isNaN(new Date(value+'T12:00:00')))return;
 checkLocalDay();eatDate=value;historicalLogging=false;renderEat();
}
function shiftEatDate(delta){const d=new Date(eatDate+'T12:00:00');d.setDate(d.getDate()+delta);chooseEatDate(localDateStr(d));}
function mealDestination(){checkLocalDay();return historicalLogging?eatDate:localDateStr();}
let pendingParse = null; // { rawText, items:[{name,quantity,unit,matchedFoodId|null}] }

function mealsForDate(d){ return nutrition.meals.filter(m=>m.date===d); }
function sumMacros(meals){
  return meals.reduce((acc,m)=>{
    acc.calories += num(m.calories); acc.protein += num(m.protein); acc.carbs += num(m.carbs); acc.fat += num(m.fat); return acc;
  },{calories:0,protein:0,carbs:0,fat:0});
}
function logMeal(entry){
  if(['calories','protein','carbs','fat'].some(k=>!Number.isFinite(entry[k])||entry[k]<0)){toast('Meal values must be non-negative numbers');return false;}
  entry.date=mealDestination();
  nutrition.meals.push({ id: uid(), ts: Date.now(), source:'manual', notes:'', ...entry });
  saveNS(NS.nutrition, nutrition);
}
function deleteMeal(id){ nutrition.meals = nutrition.meals.filter(m=>m.id!==id); saveNS(NS.nutrition, nutrition); }
function duplicateMeal(id){
  const m = nutrition.meals.find(x=>x.id===id); if(!m) return;
  nutrition.meals.push({...m, id: uid(), ts: Date.now(), time: new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(new Date())});
  saveNS(NS.nutrition, nutrition);
}
function copyMealToToday(id){
  const m = nutrition.meals.find(x=>x.id===id); if(!m) return;
  const now = new Date();
  nutrition.meals.push({...m, id: uid(), ts: now.getTime(), date: localDateStr(now), time: new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(now)});
  saveNS(NS.nutrition, nutrition);
  toast('Copied to today');
}

function renderEat(){
  checkLocalDay();
  const el = document.getElementById('eatScreen');
  let html = `<div class="subnav">
    <button data-esub="dashboard" class="${eatSubview==='dashboard'?'active':''}">Dashboard</button>
    <button data-esub="log" class="${eatSubview==='log'?'active':''}">Log meal</button>
    <button data-esub="history" class="${eatSubview==='history'?'active':''}">History</button>
  </div>`;
  html+=`<div class="date-nav"><button class="icon-btn" aria-label="Previous day" onclick="shiftEatDate(-1)">‹</button><label class="date-chip">Viewing <input type="date" aria-label="Nutrition date" value="${esc(eatDate)}" onchange="chooseEatDate(this.value)"></label><button class="icon-btn" aria-label="Next day" onclick="shiftEatDate(1)">›</button><button class="icon-btn" onclick="chooseEatDate(localDateStr())">Today</button></div>`;
  if(eatDate!==localDateStr()&&eatSubview==='log')html+=`<div class="notice">Viewing ${esc(eatDate)}. New meals default to today.<label style="display:block;margin-top:8px"><input type="checkbox" ${historicalLogging?'checked':''} onchange="historicalLogging=this.checked"> Intentionally log to ${esc(eatDate)}</label></div>`;
  if(eatSubview==='dashboard') html += eatDashboardHtml();
  else if(eatSubview==='log') html += eatLogHtml();
  else html += eatHistoryHtml();
  el.innerHTML = html;
  el.querySelectorAll('[data-esub]').forEach(b=>b.addEventListener('click',()=>{ eatSubview=b.dataset.esub; renderEat(); }));
  wireEatLogForm();
}

function macroLine(label, eaten, target, color){
  const remaining = target - eaten;
  const over = remaining < 0;
  const pct = target>0 ? Math.min(100, Math.round(eaten/target*100)) : 0;
  const remTxt = over ? `<span class="over-text">+${round1(Math.abs(remaining))} over</span>` : `${round1(remaining)} left`;
  const style = color ? ` style="--mcolor:${color}"` : '';
  return `<div class="macrobar-wrap"${style}>
    <div class="macrobar-label"><span>${label}: <b>${round1(eaten)}</b> / ${round1(target)}</span><span>${remTxt}</span></div>
    <div class="macrobar"><div class="${over?'over':''}" style="width:${pct}%"></div></div>
  </div>`;
}
// Circular calorie-remaining ring, in the spirit of Fitonomy's "kcal left" dial.
// Pure inline SVG, no chart library.
function calorieRing(eaten,target){
 const pct=target>0?Math.max(0,Math.min(100,eaten/target*100)):0,remaining=Math.round(target-eaten),over=remaining<0;
 return `<div class="ring-wrap"><div class="calorie-dial ${over?'over':''}" role="img" aria-label="${Math.round(eaten)} of ${Math.round(target)} calories" style="--ring-progress:${pct}%"><div class="calorie-center"><div class="ring-value">${over?'+'+Math.abs(remaining):remaining}</div><div class="ring-label">${over?'kcal over':'kcal left'}</div></div></div></div>`;
}

function eatDashboardHtml(){
  const meals = mealsForDate(eatDate);
  const eaten = sumMacros(meals);
  let html = `<span class="eyebrow">${esc(eatDate)}</span>
  <div class="section-title" style="margin-top:0"><h2>${eatDate===localDateStr()?"Today's nutrition":'Nutrition'}</h2></div>
  <div class="card" style="padding:16px">
    ${calorieRing(eaten.calories, settings.calorieTarget)}
    ${macroLine('Protein', eaten.protein, settings.proteinTarget, 'var(--protein)')}
    ${macroLine('Carbs', eaten.carbs, settings.carbTarget, 'var(--carbs)')}
    ${macroLine('Fat', eaten.fat, settings.fatTarget, 'var(--fat)')}
  </div>`;
  if(!meals.length){
    html += `<div class="notice info" style="margin-top:14px">No meals logged for ${esc(eatDate)} yet. Use Log meal to add one.</div>`;
  } else {
    html += `<div class="section-title"><h2>Logged today</h2></div>`;
    meals.slice().sort((a,b)=>a.ts-b.ts).forEach(m=>{
      html += `<div class="card food-row" style="padding:12px 14px"><div><div class="fname">${esc(m.name)}</div><div class="fmeta">${esc(m.time||'')} · ${Math.round(m.calories)} kcal · ${round1(m.protein)}P / ${round1(m.carbs)}C / ${round1(m.fat)}F</div></div></div>`;
    });
  }
  return html;
}

function eatLogHtml(){
  return `<div class="card settings-card">
    <h3>Add a meal</h3>
    <div class="field"><label>Mode</label>
      <select id="mealMode" class="detail-input">
        <option value="saved">Saved Food</option>
        <option value="savedMeal">Saved Meal</option>
        <option value="parse">Natural Language Parse</option>
        <option value="manual">Manual Nutrition Entry</option>
      </select>
    </div>
    <div id="mealModeBody"></div>
  </div>`;
}

function wireEatLogForm(){
  const modeSel = document.getElementById('mealMode');
  if(!modeSel) return;
  modeSel.addEventListener('change', renderMealModeBody);
  renderMealModeBody();
}
function renderMealModeBody(){
  const mode = document.getElementById('mealMode').value;
  const body_ = document.getElementById('mealModeBody');
  if(mode==='saved') body_.innerHTML = savedFoodFormHtml();
  else if(mode==='savedMeal') body_.innerHTML = savedMealFormHtml();
  else if(mode==='parse') body_.innerHTML = parseFormHtml();
  else body_.innerHTML = manualFormHtml();
  wireModeBodyEvents(mode);
}
function savedFoodFormHtml(){
  if(!foods.foods.length) return `<div class="notice">No saved foods yet. Add one in Settings → Saved foods.</div>`;
  const opts = foods.foods.map(f=>`<option value="${esc(f.id)}">${esc(f.name)} (${f.basisQty}${esc(f.basisUnit)})</option>`).join('');
  return `<div class="field"><label>Food</label><select id="sfFood" class="detail-input">${opts}</select></div>
    <div class="row">
      <div class="field"><label>Quantity</label><input id="sfQty" class="detail-input" inputmode="decimal" placeholder="e.g. 250"></div>
      <div class="field"><label>Unit</label><select id="sfUnit" class="detail-input" aria-label="Food unit"></select></div>
    </div>
    <div id="sfPreview" class="small" style="margin:8px 0"></div>
    <button class="primary wide" onclick="submitSavedFood()">Log food</button>`;
}
function savedMealFormHtml(){
  if(!nutrition.savedMeals.length) return `<div class="notice">No saved meals yet. Build one from Log Food entries — coming from repeated logging, or add manually below.</div>
    <button class="secondary wide" style="margin-top:10px" onclick="showCreateSavedMeal()">Create a saved meal</button>`;
  const opts = nutrition.savedMeals.map(m=>`<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('');
  return `<div class="field"><label>Saved meal</label><select id="smMeal" class="detail-input">${opts}</select></div>
    <button class="primary wide" onclick="submitSavedMeal()">Log meal</button>
    <button class="secondary wide" style="margin-top:8px" onclick="showCreateSavedMeal()">Create another saved meal</button>`;
}
function parseFormHtml(){
  return `<div class="field"><label>Describe what you ate</label><textarea id="npText" class="detail-input" placeholder="e.g. 250g cooked chicken breast and 1 scoop whey"></textarea></div>
    <button class="grad-btn wide" id="npBtn" onclick="submitParse()">✨ Parse with AI</button>
    <div id="npResult" style="margin-top:12px"></div>`;
}
function manualFormHtml(){
  return `<div class="field"><label>Name</label><input id="mnName" class="detail-input" placeholder="Meal name"></div>
    <div class="row">
      <div class="field"><label>Calories</label><input id="mnCal" class="detail-input" inputmode="decimal"></div>
      <div class="field"><label>Protein g</label><input id="mnPro" class="detail-input" inputmode="decimal"></div>
    </div>
    <div class="row">
      <div class="field"><label>Carbs g</label><input id="mnCarb" class="detail-input" inputmode="decimal"></div>
      <div class="field"><label>Fat g</label><input id="mnFat" class="detail-input" inputmode="decimal"></div>
    </div>
    <button class="primary wide" onclick="submitManual()">Log meal</button>`;
}
function wireModeBodyEvents(mode){
  if(mode==='saved'){
    const qtyEl=document.getElementById('sfQty'), unitEl=document.getElementById('sfUnit'), foodEl=document.getElementById('sfFood');
    const refresh=()=>{
      const f=findFood(foodEl.value); const qty=num(qtyEl.value,NaN); const unit=(unitEl.value||f.basisUnit).trim();
      const m = f && Number.isFinite(qty) ? scaledMacros(f,qty,unit) : null;
      document.getElementById('sfPreview').textContent = m ? `${m.calories} kcal · ${m.protein}P / ${m.carbs}C / ${m.fat}F` : 'Enter a quantity in a compatible unit to preview macros.';
    };
    if(foodEl){
      const selectFood=()=>{const f=findFood(foodEl.value);const units=isWeightUnit(f.basisUnit)?['g','kg','oz','lb']:isVolumeUnit(f.basisUnit)?['ml','l']:[f.basisUnit];unitEl.innerHTML=units.map(u=>`<option value="${esc(u)}">${esc(u)}</option>`).join('');unitEl.value=f.basisUnit;qtyEl.value=f.basisQty;refresh();};
      foodEl.addEventListener('change',selectFood);[qtyEl,unitEl].forEach(e=>e.addEventListener('input',refresh));selectFood();
    }
  }
}
function submitSavedFood(){
  const foodEl=document.getElementById('sfFood'), qtyEl=document.getElementById('sfQty'), unitEl=document.getElementById('sfUnit');
  const f = findFood(foodEl.value);
  const qty = num(qtyEl.value, NaN);
  const unit = (unitEl.value||f?.basisUnit||'').trim();
  if(!f || !Number.isFinite(qty) || qty<=0){ toast('Enter a valid quantity'); return; }
  const m = scaledMacros(f, qty, unit);
  if(!m){ toast(`Unit "${unit}" is not compatible with ${f.basisUnit} — enter it manually instead`); return; }
  const now = new Date();
  logMeal({ date: eatDate, ts: now.getTime(), time: new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(now), name: `${f.name} (${qty}${unit})`, calories:m.calories, protein:m.protein, carbs:m.carbs, fat:m.fat, source:'saved-food', foodId:f.id });
  toast('Logged'); eatSubview='dashboard'; renderEat();
}
function submitSavedMeal(){
  const sel=document.getElementById('smMeal'); const meal=nutrition.savedMeals.find(x=>x.id===sel.value); if(!meal) return;
  let totals={calories:0,protein:0,carbs:0,fat:0};
  meal.items.forEach(it=>{ const f=findFood(it.foodId); if(!f) return; const m=scaledMacros(f,it.qty,it.unit||f.basisUnit); if(m){ totals.calories+=m.calories; totals.protein+=m.protein; totals.carbs+=m.carbs; totals.fat+=m.fat; } });
  const now = new Date();
  logMeal({ date:eatDate, ts:now.getTime(), time:new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(now), name:meal.name, calories:Math.round(totals.calories), protein:round1(totals.protein), carbs:round1(totals.carbs), fat:round1(totals.fat), source:'saved-meal', savedMealId:meal.id });
  toast('Logged'); eatSubview='dashboard'; renderEat();
}
function showCreateSavedMeal(){
  if(!foods.foods.length){ toast('Add saved foods first (Settings → Saved foods)'); return; }
  const rows = foods.foods.map(f=>`<label style="display:flex;align-items:center;gap:8px;padding:6px 0"><input type="checkbox" class="smk-food" value="${esc(f.id)}"><span style="flex:1">${esc(f.name)}</span><input type="number" class="smk-qty detail-input" style="max-width:90px" placeholder="${f.basisQty}" data-food="${esc(f.id)}"></label>`).join('');
  showModal(`<h3>Create saved meal</h3>
    <div class="field"><label>Name</label><input id="smkName" class="detail-input" placeholder="e.g. Post-workout shake"></div>
    <div style="max-height:40vh;overflow:auto">${rows}</div>
    <button class="primary wide" style="margin-top:12px" onclick="saveSavedMeal()">Save meal</button>`);
}
function saveSavedMeal(){
  const name = document.getElementById('smkName').value.trim();
  if(!name){ toast('Enter a name'); return; }
  const items=[];
  document.querySelectorAll('.smk-food:checked').forEach(cb=>{
    const f=findFood(cb.value); const qtyEl=[...document.querySelectorAll('.smk-qty')].find(el=>el.dataset.food===cb.value);
    const qty = num(qtyEl.value, f.basisQty);
    items.push({foodId:f.id, qty, unit:f.basisUnit});
  });
  if(!items.length){ toast('Select at least one food'); return; }
  nutrition.savedMeals.push({id:uid(), name, items, notes:''});
  saveNS(NS.nutrition, nutrition);
  closeModal(); toast('Saved meal created'); renderEat();
}

async function submitParse(){
  const text = document.getElementById('npText').value.trim();
  if(!text){ toast('Describe what you ate first'); return; }
  const btn = document.getElementById('npBtn');
  const resultEl = document.getElementById('npResult');
  if(!navigator.onLine){ resultEl.innerHTML = `<div class="notice">Internet connection required</div>`; return; }
  btn.disabled = true; btn.textContent = 'Parsing…';
  resultEl.innerHTML = '';
  try {
    const res = await fetch('/api/nutrition-parse', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({text}), signal:AbortSignal.timeout(20000) });
    if(!res.ok){
      let msg = res.status===422?'Could not understand meal text.':res.status>=500?'Server unavailable. Try again later.':`HTTP error ${res.status}.`;
      try { const j = await res.json(); if(j && typeof j.error==='string') msg += ' '+j.error; } catch(e){}
      resultEl.innerHTML = `<div class="notice">${esc(msg)}</div>`;
      return;
    }
    let data;try{data=await res.json();}catch(e){throw new Error('Invalid server response');}
    if(!data || !Array.isArray(data.items) || data.items.some(it=>!it||typeof it.name!=='string'||!it.name.trim()||typeof it.unit!=='string'||!it.unit.trim()||!Number.isFinite(it.quantity)||it.quantity<=0)){throw new Error('Invalid server response');}
    if(!data.items.length){
      resultEl.innerHTML = `<div class="notice">No food items were found in that text.</div>`;
      return;
    }
    pendingParse = { items: data.items.map(it=>({...it, matchedFoodId: matchFoodByName(it.name)})) };
    if(!milestones.usedAIParse){ milestones.usedAIParse = true; saveNS(NS.milestones, milestones); }
    renderParseReview();
  } catch(e){
    resultEl.innerHTML = `<div class="notice">${esc(!navigator.onLine?'Internet connection required':e.message==='Invalid server response'?e.message:'Server unavailable. Check your connection and try again.')}</div>`;
  } finally {
    btn.disabled = false; btn.textContent = '✨ Parse with AI';
  }
}
function matchFoodByName(name){
  const n = String(name||'').toLowerCase();
  const hit = foods.foods.find(f=>{
    const fn = f.name.toLowerCase();
    return fn.includes(n) || n.includes(fn.split('(')[0].trim());
  });
  return hit ? hit.id : null;
}
function renderParseReview(){
  const resultEl = document.getElementById('npResult');
  if(!pendingParse){ resultEl.innerHTML=''; return; }
  let html = `<div class="notice info">Review each item — matched items use your saved-food values; unmatched items need confirmation before logging.</div>`;
  pendingParse.items.forEach((it,i)=>{
    const f = it.matchedFoodId ? findFood(it.matchedFoodId) : null;
    const m = f ? scaledMacros(f, it.quantity, it.unit) : null;
    html += `<div class="card" style="padding:12px;margin:10px 0">
      <div class="fname">${esc(it.name)} — ${esc(String(it.quantity))} ${esc(it.unit)}</div>`;
    if(f && m){
      html += `<div class="fmeta">Matched: ${esc(f.name)} → ${m.calories} kcal · ${m.protein}P / ${m.carbs}C / ${m.fat}F</div>
        <button class="icon-btn" onclick="acceptParsedItem(${i})">Confirm & log</button>
        <button class="icon-btn" onclick="manualizeParsedItem(${i})" style="margin-left:6px">Enter manually instead</button>`;
    } else {
      html += `<div class="fmeta">Food not found in saved database${f?' (unit incompatible)':''}. Enter nutrition manually to log this item.</div>
        <div class="row" style="margin-top:8px">
          <input class="detail-input pi-cal" data-i="${i}" inputmode="decimal" placeholder="kcal">
          <input class="detail-input pi-pro" data-i="${i}" inputmode="decimal" placeholder="protein g">
        </div>
        <div class="row" style="margin-top:8px">
          <input class="detail-input pi-carb" data-i="${i}" inputmode="decimal" placeholder="carbs g">
          <input class="detail-input pi-fat" data-i="${i}" inputmode="decimal" placeholder="fat g">
        </div>
        <button class="icon-btn" style="margin-top:8px" onclick="acceptManualParsedItem(${i})">Confirm & log</button>`;
    }
    html += `</div>`;
  });
  resultEl.innerHTML = html;
}
function acceptParsedItem(i){
  const it = pendingParse.items[i]; const f = findFood(it.matchedFoodId); const m = scaledMacros(f, it.quantity, it.unit);
  if(!m){ toast('Could not compute macros for this item'); return; }
  const now = new Date();
  logMeal({date:eatDate, ts:now.getTime(), time:new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(now), name:`${it.name} (${it.quantity}${it.unit})`, calories:m.calories, protein:m.protein, carbs:m.carbs, fat:m.fat, source:'ai-parse-matched', foodId:f.id});
  toast('Logged'); pendingParse.items.splice(i,1); if(!pendingParse.items.length){ pendingParse=null; eatSubview='dashboard'; renderEat(); } else renderParseReview();
}
function manualizeParsedItem(i){ pendingParse.items[i].matchedFoodId = null; renderParseReview(); }
function acceptManualParsedItem(i){
  const cal = num(document.querySelector(`.pi-cal[data-i="${i}"]`).value, NaN);
  const pro = num(document.querySelector(`.pi-pro[data-i="${i}"]`).value, 0);
  const carb = num(document.querySelector(`.pi-carb[data-i="${i}"]`).value, 0);
  const fat = num(document.querySelector(`.pi-fat[data-i="${i}"]`).value, 0);
  if(!Number.isFinite(cal)||cal<0){ toast('Enter a non-negative calorie value'); return; }
  const it = pendingParse.items[i];
  if([cal,pro,carb,fat].some(v=>v<0)){toast('Nutrition values must be non-negative');return;}
  const now = new Date();
  logMeal({date:eatDate, ts:now.getTime(), time:new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(now), name:`${it.name} (${it.quantity}${it.unit})`, calories:Math.round(cal), protein:round1(pro), carbs:round1(carb), fat:round1(fat), source:'ai-parse-manual'});
  toast('Logged'); pendingParse.items.splice(i,1); if(!pendingParse.items.length){ pendingParse=null; eatSubview='dashboard'; renderEat(); } else renderParseReview();
}
function submitManual(){
  const name = document.getElementById('mnName').value.trim() || 'Meal';
  const cal = num(document.getElementById('mnCal').value, NaN);
  if(!Number.isFinite(cal)||cal<0){ toast('Enter a non-negative calorie value'); return; }
  const pro = num(document.getElementById('mnPro').value,0), carb = num(document.getElementById('mnCarb').value,0), fat = num(document.getElementById('mnFat').value,0);
  if([cal,pro,carb,fat].some(v=>v<0)){toast('Nutrition values must be non-negative');return;}
  const now = new Date();
  logMeal({date:eatDate, ts:now.getTime(), time:new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(now), name, calories:Math.round(cal), protein:round1(pro), carbs:round1(carb), fat:round1(fat), source:'manual'});
  toast('Logged'); eatSubview='dashboard'; renderEat();
}

function eatHistoryHtml(){
  const dates = Array.from(new Set(nutrition.meals.map(m=>m.date))).sort().reverse();
  if(!dates.length) return `<div class="card hero"><h2>No meals logged yet</h2><p>Use Log meal to record your first entry.</p></div>`;
  let html = `<div class="section-title"><h2>Meal history</h2><span>${dates.length} days</span></div>`;
  dates.forEach(d=>{
    const meals = mealsForDate(d).slice().sort((a,b)=>a.ts-b.ts);
    const sums = sumMacros(meals);
    html += `<div class="card" style="padding:14px;margin:10px 0"><div class="history-top"><h3>${esc(d)}</h3><span class="pill">${Math.round(sums.calories)} kcal</span></div>`;
    meals.forEach(m=>{
      html += `<div class="food-row"><div><div class="fname">${esc(m.name)}</div><div class="fmeta">${esc(m.time||'')} · ${Math.round(m.calories)} kcal · ${round1(m.protein)}P/${round1(m.carbs)}C/${round1(m.fat)}F</div>
        <div class="list-actions">
          <button class="icon-btn" onclick="editMealPrompt('${m.id}')">Edit</button>
          <button class="icon-btn" onclick="duplicateMeal('${m.id}');renderEat();">Duplicate</button>
          <button class="icon-btn" onclick="copyMealToToday('${m.id}');renderEat();">Copy to today</button>
          <button class="icon-btn" onclick="if(confirm('Delete this meal entry?')){deleteMeal('${m.id}');renderEat();}">Delete</button>
        </div></div></div>`;
    });
    html += `</div>`;
  });
  return html;
}
function editMealPrompt(id){
  const m = nutrition.meals.find(x=>x.id===id); if(!m) return;
  showModal(`<h3>Edit meal</h3>
    <div class="field"><label>Name</label><input id="emName" class="detail-input" value="${esc(m.name)}"></div>
    <div class="row"><div class="field"><label>Calories</label><input id="emCal" class="detail-input" inputmode="decimal" value="${m.calories}"></div>
    <div class="field"><label>Protein g</label><input id="emPro" class="detail-input" inputmode="decimal" value="${m.protein}"></div></div>
    <div class="row"><div class="field"><label>Carbs g</label><input id="emCarb" class="detail-input" inputmode="decimal" value="${m.carbs}"></div>
    <div class="field"><label>Fat g</label><input id="emFat" class="detail-input" inputmode="decimal" value="${m.fat}"></div></div>
    <p>Timestamp preserved: ${fmtDate(m.ts)} ${esc(m.time||'')}</p>
    <button class="primary wide" onclick="saveMealEdit('${id}')">Save</button>`);
}
function saveMealEdit(id){
 const index=nutrition.meals.findIndex(x=>x.id===id);if(index<0)return;
 const previous=nutrition.meals[index],values={};
 for(const [key,field] of [['calories','emCal'],['protein','emPro'],['carbs','emCarb'],['fat','emFat']]){const raw=document.getElementById(field).value;if(raw.trim()===''||!Number.isFinite(Number(raw))||Number(raw)<0){toast('Nutrition values must be non-negative numbers');return;}values[key]=round1(Number(raw));}
 nutrition.meals[index]={...previous,...values,name:document.getElementById('emName').value.trim()||previous.name};saveNS(NS.nutrition,nutrition);closeModal();toast('Meal updated');renderEat();
}

/* =========================================================================
   PLAN module — pricing + local economic meal solver (no network calls)
   ========================================================================= */
let planSubview = 'pricing';

function pricePerUnit(f){ return f.priceQty>0 ? f.pricePkr/f.priceQty : 0; }
function priceDerived(f){
  // Cost of exactly one basis serving, priced from whatever priceQty/priceUnit
  // the user entered. Falls back to null (shown as "—") when the price unit
  // isn't compatible with the basis unit — we never guess a conversion.
  const perServing = estimateItemCost({food:f, qty:f.basisQty});
  let per100g = null, per25gProtein = null, per500kcal = null;
  if(isWeightUnit(f.priceUnit)&&Number.isFinite(perServing)){
    const pricePerGram = pricePerUnit(f)/toGrams(1,f.priceUnit);
    per100g = pricePerGram*100;
  }
  if(Number.isFinite(perServing)){
    if(f.protein>0) per25gProtein = perServing/f.protein*25;
    if(f.calories>0) per500kcal = perServing/f.calories*500;
  }
  return { perServing: Number.isFinite(perServing)?perServing:null, per100g, per25gProtein, per500kcal };
}

function renderPlan(){
  const el = document.getElementById('planScreen');
  let html = `<div class="subnav">
    <button data-psub="pricing" class="${planSubview==='pricing'?'active':''}">Pricing</button>
    <button data-psub="solver" class="${planSubview==='solver'?'active':''}">Meal solver</button>
    <button data-psub="pacing" class="${planSubview==='pacing'?'active':''}">Protein pacing</button>
  </div>`;
  if(planSubview==='pricing') html += planPricingHtml();
  else if(planSubview==='solver') html += planSolverHtml();
  else html += planPacingHtml();
  el.innerHTML = html;
  el.querySelectorAll('[data-psub]').forEach(b=>b.addEventListener('click',()=>{ planSubview=b.dataset.psub; renderPlan(); }));
}
function planPricingHtml(){
  if(!foods.foods.length) return `<div class="card hero"><h2>No saved foods</h2><p>Add foods in Settings to price them here.</p></div>`;
  let html = `<div class="section-title"><h2>Food pricing</h2><span>${foods.foods.length} foods</span></div>`;
  foods.foods.forEach(f=>{
    const d = priceDerived(f);
    html += `<div class="card" style="padding:14px;margin:10px 0">
      <div class="fname">${esc(f.name)}</div>${d.perServing==null?'<span class="pill">Price missing</span>':''}
      <div class="row" style="margin-top:8px">
        <div class="field"><label>Price PKR</label><input class="detail-input pp-price" data-id="${esc(f.id)}" inputmode="decimal" value="${f.pricePkr}"></div>
        <div class="field"><label>Qty</label><input class="detail-input pp-qty" data-id="${esc(f.id)}" inputmode="decimal" value="${f.priceQty}"></div>
        <div class="field"><label>Unit</label><input class="detail-input pp-unit" data-id="${esc(f.id)}" value="${esc(f.priceUnit)}"></div>
      </div>
      <button class="icon-btn" onclick="savePricing('${esc(f.id)}')">Save price</button>
      <div class="tag-row">
        <span class="pill">₨${d.perServing!=null?round1(d.perServing):'—'} / ${f.basisQty}${esc(f.basisUnit)} serving</span>
        <span class="pill">₨${d.per100g!=null?round1(d.per100g):'—'} / 100g</span>
        <span class="pill">₨${d.per25gProtein!=null?round1(d.per25gProtein):'—'} / 25g protein</span>
        <span class="pill">₨${d.per500kcal!=null?round1(d.per500kcal):'—'} / 500 kcal</span>
      </div>
    </div>`;
  });
  return html;
}
function savePricing(id){
  const current=findFood(id);if(!current)return;const f={...current};
  const priceValue=document.querySelector(`.pp-price[data-id="${id}"]`).value,qtyValue=document.querySelector(`.pp-qty[data-id="${id}"]`).value;
  if(!Number.isFinite(Number(priceValue))||Number(priceValue)<0||!Number.isFinite(Number(qtyValue))||Number(qtyValue)<=0){toast('Price must be ≥0 and quantity >0');return;}
  f.pricePkr = num(document.querySelector(`.pp-price[data-id="${id}"]`).value, f.pricePkr);
  f.priceQty = num(document.querySelector(`.pp-qty[data-id="${id}"]`).value, f.priceQty);
  f.priceUnit = document.querySelector(`.pp-unit[data-id="${id}"]`).value.trim() || f.priceUnit;
  upsertFood(f); toast('Price saved'); renderPlan();
}

const SOLVER_MODES = ['Cheapest','Highest Protein','Low Effort','Pre Workout','Post Workout','GI Friendly','Fit Remaining Macros'];
function planSolverHtml(){
  const remaining = remainingMacrosToday();
  let html = `<div class="section-title"><h2>Meal solver</h2></div>
  <div class="card" style="padding:14px">
    <div class="small">Remaining today: ${round1(remaining.calories)} kcal · ${round1(remaining.protein)}P / ${round1(remaining.carbs)}C / ${round1(remaining.fat)}F</div>
    <div class="field" style="margin-top:10px"><label>Mode</label>
      <select id="solverMode" class="detail-input">${SOLVER_MODES.map(m=>`<option>${m}</option>`).join('')}</select>
    </div>
    <button class="primary wide" onclick="runSolver()">Generate plan</button>
  </div>
  <p class="small">Local search: up to 10 candidate foods, 1–3 foods per plan. Effort uses entered prep steps (default: 1 per food), food count and saved meals. Cheapest excludes missing prices and compares near-best macro fits. GI uses your own tolerance labels.</p><div id="solverResults"></div>`;
  return html;
}
function remainingMacrosToday(){
  const eaten = sumMacros(mealsForDate(localDateStr()));
  return {
    calories: settings.calorieTarget - eaten.calories,
    protein: settings.proteinTarget - eaten.protein,
    carbs: settings.carbTarget - eaten.carbs,
    fat: settings.fatTarget - eaten.fat
  };
}
function runSolver(){
  const mode = document.getElementById('solverMode').value;
  const remaining = remainingMacrosToday();
  const results = solveMeal(mode, remaining);
  if(!milestones.usedSolver){ milestones.usedSolver = true; saveNS(NS.milestones, milestones); }
  const el = document.getElementById('solverResults');
  if(!results.length){ el.innerHTML = `<div class="notice" style="margin-top:12px">No feasible plan found within the current calorie allowance. Check remaining targets, compatible prices (Cheapest), or add more food alternatives.</div>`; return; }
  el.innerHTML = results.map(r=>`
    <div class="card plan-result">
      <h4>${esc(r.label)}</h4>
      <div class="small">${r.items.map(it=>`${esc(it.food.name)} × ${round1(it.qty)}${esc(it.food.basisUnit)}`).join(', ')}</div>
      <div class="tag-row">
        <span class="pill">${Math.round(r.totals.calories)} kcal (Δ${r.diff.calories>=0?'+':''}${round1(r.diff.calories)})</span>
        <span class="pill">${round1(r.totals.protein)}P (Δ${r.diff.protein>=0?'+':''}${round1(r.diff.protein)})</span>
        <span class="pill">${round1(r.totals.carbs)}C (Δ${r.diff.carbs>=0?'+':''}${round1(r.diff.carbs)})</span>
        <span class="pill">${round1(r.totals.fat)}F (Δ${r.diff.fat>=0?'+':''}${round1(r.diff.fat)})</span>
        <span class="pill">${Number.isFinite(r.cost)?'₨'+round1(r.cost):'Price missing'}</span>
      </div>
    </div>`).join('') + `<div class="notice" style="margin-top:8px">This is a planning aid, not medical guidance. It is not a claim of medical safety for IBS, hernia, or any condition.</div>`;
}
// Bounded brute-force solver. The saved-food list is small by design (spec:
// up to ~200 foods), so we pre-filter to a small candidate pool per mode,
// then enumerate combinations of 1–3 foods across a handful of serving
// multipliers. No network calls — deterministic, local only.
function solveMeal(mode, remaining){
  if(!Number.isFinite(remaining.calories)||remaining.calories<=0)return [];
  remaining=Object.fromEntries(Object.entries(remaining).map(([k,v])=>[k,Math.max(0,v)]));
  let pool = foods.foods.filter(f=>f.calories>0 || f.protein>0);
  if(mode==='GI Friendly'&&pool.some(f=>f.giTolerance!=='bad')) pool=pool.filter(f=>f.giTolerance!=='bad');
  if(mode==='Cheapest')pool=pool.filter(f=>Number.isFinite(estimateItemCost({food:f,qty:f.basisQty})));
  if(mode==='GI Friendly')pool=pool.slice().sort((a,b)=>({good:0,unknown:1,mixed:2,bad:3}[a.giTolerance]??1)-({good:0,unknown:1,mixed:2,bad:3}[b.giTolerance]??1));
  if(mode==='Pre Workout') pool = pool.slice().sort((a,b)=>(b.carbs/Math.max(1,b.calories))-(a.carbs/Math.max(1,a.calories)));
  else if(mode==='Post Workout') pool = pool.slice().sort((a,b)=>(b.protein+b.carbs*0.5)-(a.protein+a.carbs*0.5));
  else if(mode==='Highest Protein') pool = pool.slice().sort((a,b)=>b.protein-a.protein);
  else if(mode==='Cheapest') pool = pool.slice().sort((a,b)=>pricePerUnit(a)-pricePerUnit(b));
  else if(mode==='Low Effort') pool = pool.slice().sort((a,b)=>(a.prepSteps??1)-(b.prepSteps??1));
  const candidates = pool.slice(0, 10);
  const multipliers = [0.5,1,1.5,2,3];
  const combos = [];
  const maxItems = mode==='Low Effort' ? 1 : 3;
  function* combosOfSize(arr,size){
    if(size===0){ yield []; return; }
    for(let i=0;i<arr.length;i++){
      for(const rest of combosOfSize(arr.slice(i+1),size-1)) yield [arr[i],...rest];
    }
  }
  for(let size=1; size<=maxItems; size++){
    for(const combo of combosOfSize(candidates,size)){
      const stacks = combo.map(()=>multipliers);
      const idxMax = stacks.map(s=>s.length);
      const idx = new Array(combo.length).fill(0);
      while(true){
        const items = combo.map((f,i)=>({food:f, qty: f.basisQty*multipliers[idx[i]]}));
        const totals = items.reduce((acc,it)=>{
          const m = scaledMacros(it.food, it.qty, it.food.basisUnit);
          acc.calories+=m.calories; acc.protein+=m.protein; acc.carbs+=m.carbs; acc.fat+=m.fat; return acc;
        },{calories:0,protein:0,carbs:0,fat:0});
        const diff = { calories: totals.calories-remaining.calories, protein: totals.protein-remaining.protein, carbs: totals.carbs-remaining.carbs, fat: totals.fat-remaining.fat };
        const withinCal = Math.abs(diff.calories) <= 100;
        const withinCarb = diff.carbs <= 5;
        const withinFat = diff.fat <= 5;
        if(totals.protein>0 || totals.calories>0){
          const cost = items.reduce((c,it)=>c+estimateItemCost(it),0);
          combos.push({ items, totals, diff, withinCal, withinCarb, withinFat, cost });
        }
        let carry=true, p=0;
        while(carry && p<idx.length){ idx[p]++; if(idx[p]>=idxMax[p]){ idx[p]=0; p++; } else carry=false; }
        if(carry) break;
      }
    }
  }
  if(mode==='Low Effort')nutrition.savedMeals.forEach(meal=>{
    const items=meal.items.map(it=>{const f=findFood(it.foodId);const factor=f&&foodScaleFactor(f,it.qty,it.unit||f.basisUnit);return f&&factor!==null?{food:f,qty:factor*f.basisQty}:null;});
    if(!items.length||items.some(it=>!it))return;
    const totals=items.reduce((a,it)=>{const m=scaledMacros(it.food,it.qty,it.food.basisUnit);for(const k of ['calories','protein','carbs','fat'])a[k]+=m[k];return a;},{calories:0,protein:0,carbs:0,fat:0});
    combos.push({items,totals,diff:Object.fromEntries(Object.keys(totals).map(k=>[k,totals[k]-remaining[k]])),cost:items.reduce((c,it)=>c+estimateItemCost(it),0),savedMeal:meal.name});
  });
  let pickFrom=combos.filter(c=>c.totals.calories<=remaining.calories+Math.max(100,remaining.calories*.1)&&c.totals.carbs<=remaining.carbs+10&&c.totals.fat<=remaining.fat+5);
  if(mode==='Highest Protein')pickFrom=combos.filter(c=>c.totals.calories<=remaining.calories&&c.totals.carbs<=remaining.carbs+10&&c.totals.fat<=remaining.fat+5);
  if(!pickFrom.length){if(mode==='Highest Protein')return [];pickFrom=combos.filter(c=>c.totals.calories<=remaining.calories+100);} 
  if(mode==='Cheapest'&&pickFrom.length){const bestFit=Math.min(...pickFrom.map(c=>SculptCore.macroError(c.totals,remaining)));pickFrom=pickFrom.filter(c=>SculptCore.macroError(c.totals,remaining)<=bestFit+.6);}
  pickFrom.sort((a,b)=>SculptCore.scoreMeal(mode,a,remaining)-SculptCore.scoreMeal(mode,b,remaining));
  return pickFrom.slice(0,3).map((c,i)=>({...c,label:c.savedMeal?c.savedMeal:`${mode} option ${i+1}`}));
}
// it.qty is always expressed in the food's basisUnit. Returns cost in PKR,
// or NaN when priceUnit isn't compatible with basisUnit (never guessed).
function estimateItemCost(it){
  const f = it.food;
  if(!(Number.isFinite(f.pricePkr)&&f.pricePkr>0&&Number.isFinite(f.priceQty)&&f.priceQty>0))return NaN;
  if(f.priceUnit === f.basisUnit) return pricePerUnit(f)*it.qty;
  if(isWeightUnit(f.priceUnit) && isWeightUnit(f.basisUnit)){
    const grams = toGrams(it.qty, f.basisUnit);
    const pricePerGram = pricePerUnit(f)/toGrams(1,f.priceUnit);
    return pricePerGram*grams;
  }
  if(isVolumeUnit(f.priceUnit) && isVolumeUnit(f.basisUnit)){
    const ml = toMl(it.qty, f.basisUnit);
    const pricePerMl = pricePerUnit(f)/toMl(1,f.priceUnit);
    return pricePerMl*ml;
  }
  return NaN;
}
function planPacingHtml(){
  let html = `<div class="section-title"><h2>Protein pacing</h2><span>Planning heuristic only</span></div>
  <div class="notice info">Default is your daily protein target ÷ 4. Adjust windows below.</div>`;
  settings.proteinWindows.forEach((w,i)=>{
    html += `<div class="card" style="padding:12px;margin:8px 0">
      <div class="row">
        <div class="field"><label>Window label</label><input class="detail-input pw-label" data-i="${i}" value="${esc(w.label)}"></div>
        <div class="field"><label>Grams</label><input class="detail-input pw-grams" data-i="${i}" inputmode="decimal" value="${w.grams}"></div>
      </div>
    </div>`;
  });
  html += `<button class="primary wide" onclick="savePacing()">Save windows</button>`;
  return html;
}
function savePacing(){
  document.querySelectorAll('.pw-label').forEach(el=>{ settings.proteinWindows[el.dataset.i].label = el.value.trim(); });
  document.querySelectorAll('.pw-grams').forEach(el=>{ settings.proteinWindows[el.dataset.i].grams = num(el.value, settings.proteinWindows[el.dataset.i].grams); });
  saveNS(NS.settings, settings); toast('Saved'); renderPlan();
}

/* =========================================================================
   PROGRESS module — body/GI/step tracking
   ========================================================================= */
function bodyRecordFor(date){ return body.records.find(r=>r.date===date) || null; }
function upsertBodyRecord(rec){
  const i = body.records.findIndex(r=>r.date===rec.date);
  if(i>=0) body.records[i] = {...body.records[i], ...rec}; else body.records.push(rec);
  body.records.sort((a,b)=>a.date<b.date?1:-1);
  saveNS(NS.body, body);
}
function avgWeight(records){
  const vals = records.map(r=>num(r.weightKg,null)).filter(v=>v!=null && Number.isFinite(v));
  if(!vals.length) return null;
  return vals.reduce((a,b)=>a+b,0)/vals.length;
}
let progressSubview = 'log'; // 'log' | 'trends' | 'records'
let progressCalMonth = new Date(); // navigable month cursor, not persisted

function renderProgress(){
  const el = document.getElementById('progressScreen');
  let html = `<div class="subnav">
    <button data-psub2="log" class="${progressSubview==='log'?'active':''}">Log</button>
    <button data-psub2="trends" class="${progressSubview==='trends'?'active':''}">Trends</button>
    <button data-psub2="records" class="${progressSubview==='records'?'active':''}">Records</button>
  </div>`;
  if(progressSubview==='trends') html += progressTrendsHtml();
  else if(progressSubview==='records') html += progressRecordsHtml();
  else html += progressLogHtml();
  el.innerHTML = html;
  el.querySelectorAll('[data-psub2]').forEach(b=>b.addEventListener('click',()=>{ progressSubview=b.dataset.psub2; renderProgress(); }));
}

function progressLogHtml(){
  const today = localDateStr();
  const rec = bodyRecordFor(today) || {date:today,weightKg:'',waistCm:'',steps:'',hydrationMl:'',bloating:0,reflux:0,bowel:0,sleepHours:'',notes:''};
  let html = `<div class="section-title" style="margin-top:0"><h2>Today's record</h2><span>${esc(today)}</span></div>
  <div class="card" style="padding:14px">
    <div class="row"><div class="field"><label>Weight (kg)</label><input id="prWeight" class="detail-input" inputmode="decimal" value="${rec.weightKg}"></div>
    <div class="field"><label>Waist (cm)</label><input id="prWaist" class="detail-input" inputmode="decimal" value="${rec.waistCm}"></div></div>
    <div class="row"><div class="field"><label>Steps</label><input id="prSteps" class="detail-input" inputmode="numeric" value="${rec.steps}"></div>
    <div class="field"><label>Sleep (hrs)</label><input id="prSleep" class="detail-input" inputmode="decimal" value="${rec.sleepHours}"></div></div>
    <div class="field"><label>Hydration (ml)</label><input id="prHydration" class="detail-input" inputmode="numeric" placeholder="target ${settings.hydrationTargetMl}ml" value="${rec.hydrationMl||''}"></div>
    <div class="row">
      <div class="field"><label>Bloating (0–5)</label><input id="prBloat" class="detail-input" inputmode="numeric" value="${rec.bloating}"></div>
      <div class="field"><label>Reflux (0–5)</label><input id="prReflux" class="detail-input" inputmode="numeric" value="${rec.reflux}"></div>
      <div class="field"><label>Bowel (0–5)</label><input id="prBowel" class="detail-input" inputmode="numeric" value="${rec.bowel}"></div>
    </div>
    <div class="field"><label>Notes</label><textarea id="prNotes" class="detail-input">${esc(rec.notes||'')}</textarea></div>
    <button class="primary wide" onclick="saveProgressToday()">Save today's record</button>
  </div>
  <div class="section-title"><h2>Recent records</h2></div>`;
  if(!body.records.length){ html += `<div class="notice info">No records yet.</div>`; }
  body.records.slice(0,14).forEach(r=>{
    html += `<div class="card history-card"><div class="history-top"><div><h3>${esc(r.date)}</h3><p>Wt ${r.weightKg||'—'}kg · Steps ${r.steps||'—'} · Bloat ${r.bloating} / Reflux ${r.reflux} / Bowel ${r.bowel}</p></div></div></div>`;
  });
  return html;
}
function saveProgressToday(){
  const today = localDateStr();
  upsertBodyRecord({
    date: today,
    weightKg: num(document.getElementById('prWeight').value, null),
    waistCm: num(document.getElementById('prWaist').value, null),
    steps: num(document.getElementById('prSteps').value, 0),
    hydrationMl: num(document.getElementById('prHydration').value, null),
    sleepHours: num(document.getElementById('prSleep').value, null),
    bloating: Math.max(0,Math.min(5, num(document.getElementById('prBloat').value,0))),
    reflux: Math.max(0,Math.min(5, num(document.getElementById('prReflux').value,0))),
    bowel: Math.max(0,Math.min(5, num(document.getElementById('prBowel').value,0))),
    notes: document.getElementById('prNotes').value
  });
  toast('Progress saved'); renderProgress();
}

function progressTrendsHtml(){
  const last7 = body.records.filter(r=>r.date >= localShift(localDateStr(),-6)&&r.date<=localDateStr());
  const prev7 = body.records.filter(r=>r.date < localShift(localDateStr(),-6) && r.date >= localShift(localDateStr(),-13));
  const w7 = avgWeight(last7), wPrev7 = avgWeight(prev7);
  const change = (w7!=null && wPrev7!=null) ? w7-wPrev7 : null;
  const mealsLast7 = nutrition.meals.filter(m=>m.date >= localShift(localDateStr(),-6)&&m.date<=localDateStr());
  const avgCalLast7 = mealsLast7.length ? mealsLast7.reduce((a,m)=>a+num(m.calories),0)/7 : 0;
  const avgProLast7 = mealsLast7.length ? mealsLast7.reduce((a,m)=>a+num(m.protein),0)/7 : 0;
  const sessions7 = training.sessions.filter(s=>s.finishedAt >= Date.now()-7*86400000).length;
  const streak = trainingStreak();

  let html = `<div class="section-title" style="margin-top:0"><h2>Streak &amp; activity</h2></div>
  <div class="grid3">
    <div class="stat"><strong>🔥 ${streak}</strong><span>day streak</span></div>
    <div class="stat"><strong>${training.sessions.length}</strong><span>workouts total</span></div>
    <div class="stat"><strong>${round1(hoursTrained())}</strong><span>hours trained</span></div>
  </div>
  <div class="section-title"><h2>Body &amp; nutrition</h2></div>
  <div class="grid3">
    <div class="stat"><strong>${w7!=null?round1(w7):'—'}</strong><span>7-day avg wt (kg)</span></div>
    <div class="stat"><strong>${change!=null?(change>=0?'+':'')+round1(change):'—'}</strong><span>vs prior 7d</span></div>
    <div class="stat"><strong>${sessions7}</strong><span>sessions / 7d</span></div>
  </div>
  <div class="grid3" style="margin-top:8px">
    <div class="stat"><strong>${Math.round(avgCalLast7)}</strong><span>avg kcal/day</span></div>
    <div class="stat"><strong>${round1(avgProLast7)}</strong><span>avg protein/day</span></div>
    <div class="stat"><strong>${body.records.length}</strong><span>records logged</span></div>
  </div>`;

  const sparkline = weightSparkline(body.records);
  const last = body.records.find(r=>r.weightKg!=null && r.weightKg!=='');
  let goalHtml = '';
  if(settings.goalWeightKg!=null && last){
    const diff = round1(Math.abs(num(last.weightKg)-settings.goalWeightKg));
    const dir = num(last.weightKg) > settings.goalWeightKg ? 'to lose' : (num(last.weightKg) < settings.goalWeightKg ? 'to gain' : 'atgoal');
    goalHtml = `<div class="fmeta" style="margin-top:8px">${dir==='atgoal' ? 'At goal weight' : (diff + ' kg ' + dir + ' reach your ' + settings.goalWeightKg + 'kg goal')}</div>`;
  }
  html += `<div class="section-title"><h2>Weight trend</h2></div>
  <div class="card" style="padding:14px">
    ${sparkline || '<div class="notice info">Log weight on at least 2 days to see a trend line.</div>'}
    ${goalHtml}
  </div>`;

  html += `<div class="section-title"><h2>Training calendar</h2></div>` + adherenceCalendarHtml(progressCalMonth);
  return html;
}
function weightSparkline(records){
  const pts = records
    .filter(r=>r.weightKg!=null && r.weightKg!=='')
    .map(r=>({date:r.date, w:num(r.weightKg)}))
    .sort((a,b)=> a.date<b.date?-1:(a.date>b.date?1:0))
    .slice(-30);
  if(pts.length<2) return null;
  const w=300,h=64,pad=6;
  const min = Math.min(...pts.map(p=>p.w)), max = Math.max(...pts.map(p=>p.w));
  const span = Math.max(0.5, max-min);
  const xs = pts.map((p,i)=> pad + (i/(pts.length-1))*(w-2*pad));
  const ys = pts.map(p=> h-pad - ((p.w-min)/span)*(h-2*pad));
  const path = xs.map((x,i)=>`${i===0?'M':'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  return `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="display:block">
    <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    <circle cx="${xs[xs.length-1]}" cy="${ys[ys.length-1]}" r="3.5" fill="var(--accent)"/>
    
  </svg>
  <div class="fmeta">${round1(pts[0].w)}kg → ${round1(pts[pts.length-1].w)}kg over last ${pts.length} logged day(s)</div>`;
}
// Adherence calendar. "Completed" = a session finished that day with 80%+
// of its sets marked done; "Partial" = a session finished with some sets
// done. There is no fixed weekly schedule in this app, so we never claim a
// day was "missed" -- only what was actually logged is shown.
function adherenceCalendarHtml(monthDate){
  const year = monthDate.getFullYear(), month = monthDate.getMonth();
  const startDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const todayStr = localDateStr();
  const byDate = {};
  training.sessions.forEach(s=>{
    const d = localDateStr(new Date(s.finishedAt));
    const ratio = s.totalSets>0 ? s.completedSets/s.totalSets : 0;
    if(byDate[d]==null || ratio>byDate[d]) byDate[d]=ratio;
  });
  const monthLabel = new Intl.DateTimeFormat(undefined,{month:'long',year:'numeric'}).format(monthDate);
  let cells = '';
  for(let i=0;i<startDow;i++) cells += `<div class="cal-cell empty"></div>`;
  for(let day=1; day<=daysInMonth; day++){
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const ratio = byDate[dateStr];
    const dotClass = ratio==null ? '' : (ratio>=0.8 ? 'completed' : 'partial');
    const isToday = dateStr===todayStr;
    cells += `<div class="cal-cell${isToday?' today':''}"><span>${day}</span>${dotClass?`<i class="cal-dot ${dotClass}"></i>`:''}</div>`;
  }
  return `<div class="card" style="padding:14px">
    <div class="cal-header">
      <button class="icon-btn" onclick="shiftProgressCalendar(-1)">‹</button>
      <b>${esc(monthLabel)}</b>
      <button class="icon-btn" onclick="shiftProgressCalendar(1)">›</button>
    </div>
    <div class="cal-grid cal-dow"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>
    <div class="cal-grid">${cells}</div>
    <div class="tag-row"><span class="pill"><i class="cal-dot completed"></i> Completed</span><span class="pill"><i class="cal-dot partial"></i> Partial</span></div>
  </div>`;
}
function shiftProgressCalendar(delta){
  progressCalMonth = new Date(progressCalMonth.getFullYear(), progressCalMonth.getMonth()+delta, 1);
  renderProgress();
}

function progressRecordsHtml(){
  const prs = personalRecords();
  const ach = achievementsList();
  const unlockedCount = ach.filter(a=>a.unlocked).length;
  let html = `<div class="section-title" style="margin-top:0"><h2>Personal records</h2><span>${prs.length} logged</span></div>`;
  if(!prs.length){ html += `<div class="notice info">No personal records yet — the heaviest logged load per exercise will appear here once you complete workouts.</div>`; }
  prs.slice(0,30).forEach(r=>{
    html += `<div class="card food-row" style="padding:12px 14px"><div><div class="fname">${esc(r.exerciseName)}</div><div class="fmeta">${fmtDate(r.date)}</div></div><span class="pill">${round1(r.load)} ${esc(r.unit||training.settings.unit)} × ${esc(r.reps||'—')}</span></div>`;
  });
  html += `<div class="section-title"><h2>Achievements</h2><span>${unlockedCount}/${ach.length}</span></div><div class="tag-row">`;
  ach.forEach(a=>{
    html += `<span class="pill ${a.unlocked?'unlocked':'locked'}">${a.unlocked?'✓':'🔒'} ${esc(a.label)}</span>`;
  });
  html += `</div>`;
  return html;
}
function achievementsList(){
  const streak = trainingStreak();
  const prs = personalRecords();
  return [
    {id:'welcome', label:'Welcome to Sculpt', unlocked:true},
    {id:'first_workout', label:'First workout logged', unlocked: training.sessions.length>=1},
    {id:'first_meal', label:'First meal logged', unlocked: nutrition.meals.length>=1},
    {id:'first_weight', label:'First weight logged', unlocked: body.records.some(r=>r.weightKg!=null && r.weightKg!=='')},
    {id:'streak_7', label:'7-day training streak', unlocked: streak>=7},
    {id:'ten_workouts', label:'10 workouts completed', unlocked: training.sessions.length>=10},
    {id:'custom_food', label:'Added a custom saved food', unlocked: foods.foods.some(f=>!String(f.id).startsWith('seed_'))},
    {id:'used_planner', label:'Ran the meal solver', unlocked: !!milestones.usedSolver},
    {id:'used_ai_parse', label:'Parsed a meal with AI', unlocked: !!milestones.usedAIParse},
    {id:'first_pr', label:'Logged a personal record', unlocked: prs.length>=1}
  ];
}

/* =========================================================================
   TODAY module — command center + deterministic Next Action
   ========================================================================= */
// Not persisted — resets on reload. Lets the Today screen offer a
// different next workout without committing to a schedule change.
let shuffledWorkoutId = null;

/* =========================================================================
   SETTINGS module
   ========================================================================= */
function renderSettings(){
  const el = document.getElementById('settingsScreen');
  el.innerHTML = `
    <div class="section-title"><h2>Targets</h2></div>
    <div class="card settings-card">
      <div class="row"><div class="field"><label>Calories (kcal)</label><input id="stCal" class="detail-input" inputmode="decimal" value="${settings.calorieTarget}"></div>
      <div class="field"><label>Protein (g)</label><input id="stPro" class="detail-input" inputmode="decimal" value="${settings.proteinTarget}"></div></div>
      <div class="row"><div class="field"><label>Carbs (g)</label><input id="stCarb" class="detail-input" inputmode="decimal" value="${settings.carbTarget}"></div>
      <div class="field"><label>Fat (g)</label><input id="stFat" class="detail-input" inputmode="decimal" value="${settings.fatTarget}"></div></div>
      <div class="row"><div class="field"><label>Steps</label><input id="stSteps" class="detail-input" inputmode="numeric" value="${settings.stepTarget}"></div>
      <div class="field"><label>Hydration (ml)</label><input id="stHydration" class="detail-input" inputmode="numeric" value="${settings.hydrationTargetMl}"></div></div>
      <div class="row"><div class="field"><label>Goal weight (kg, optional)</label><input id="stGoalWeight" class="detail-input" inputmode="decimal" value="${settings.goalWeightKg!=null?settings.goalWeightKg:''}"></div>
      <div class="field"><label>Unit</label><input class="detail-input" value="kg" disabled></div></div>
      <div class="field"><label>Usual bedtime (optional)</label><input id="stBed" class="detail-input" type="time" value="${esc(settings.bedtime||'')}"></div>
      <button class="primary wide" onclick="saveSettings()">Save targets</button>
    </div>
    <div class="section-title"><h2>Saved foods</h2></div>
    <div class="card settings-card">
      <p>${foods.foods.length} foods saved. Deterministic values are used for all macro math — AI parsing never overwrites a saved food.</p>
      <button class="secondary wide" onclick="showFoodManager()">Manage saved foods</button>
    </div>
    <div class="section-title"><h2>Backup</h2></div>
    <div class="card settings-card">
      <p>Export one unified backup covering training, nutrition, foods, body, settings and mobility. Import validates the schema and keeps a pre-import rollback snapshot. Legacy Sculpt v1 workout-only backups are also supported.</p>
      <div class="row"><button class="secondary" onclick="exportAll()">Export JSON</button><button class="secondary" onclick="document.getElementById('importFile').click()">Import JSON</button></div>
      <input id="importFile" type="file" accept="application/json" hidden onchange="importAll(this.files[0])">
      <button class="secondary wide" style="margin-top:8px" onclick="restoreRollback()">Restore pre-import snapshot</button>
    </div>
    <div class="section-title"><h2>Migration status</h2></div>
    <div class="card settings-card">
      <p>${localStorage.getItem(NS.migrated)==='true' ? 'Legacy data migration has run on this device.' : 'No legacy migration has run yet.'}
      ${migrationResult.ran ? ` This session imported ${migrationResult.sessionsCopied||0} workout session(s) and ${migrationResult.mealsCopied||0} legacy meal log(s).` : ''}</p>
      ${settings.legacyMigrationMeta ? `<p class="small">Legacy macro targets found: ${esc(JSON.stringify(settings.legacyMigrationMeta.importedTargets||{}))} (kept as history only — active defaults are 2350/190/240/70 unless you changed them above).</p>` : ''}
    </div>
    <div class="section-title"><h2>Reset</h2></div>
    <div class="card settings-card"><p>Resets current training, nutrition, foods, progress, settings and mobility on this device. Legacy keys and recovery snapshots are left untouched.</p><button class="danger-btn wide" onclick="clearAllData()">Reset current app data</button></div>
  `;
}
function saveSettings(){
  for(const id of ['stCal','stPro','stCarb','stFat','stSteps','stHydration']){const value=document.getElementById(id).value;if(value.trim()===''||!Number.isFinite(Number(value))||Number(value)<0){toast('Targets must be non-negative numbers');return;}}
  settings.calorieTarget = num(document.getElementById('stCal').value, settings.calorieTarget);
  settings.proteinTarget = Math.max(0,num(document.getElementById('stPro').value, settings.proteinTarget));
  settings.proteinWindows.forEach(w=>w.grams=round1(settings.proteinTarget/4));
  settings.carbTarget = num(document.getElementById('stCarb').value, settings.carbTarget);
  settings.fatTarget = num(document.getElementById('stFat').value, settings.fatTarget);
  settings.stepTarget = num(document.getElementById('stSteps').value, settings.stepTarget);
  settings.hydrationTargetMl = num(document.getElementById('stHydration').value, settings.hydrationTargetMl);
  const gw = document.getElementById('stGoalWeight').value.trim();
  settings.goalWeightKg = gw==='' ? null : num(gw, settings.goalWeightKg);
  settings.bedtime = document.getElementById('stBed').value;
  saveNS(NS.settings, settings);
  toast('Targets saved'); renderToday();if(planSubview==='pacing')renderPlan();
}
function showFoodManager(){
  let rows = foods.foods.map(f=>`<div class="food-row"><div><div class="fname">${esc(f.name)}</div><div class="fmeta">${f.basisQty}${esc(f.basisUnit)} · ${f.calories}kcal · ${f.protein}P/${f.carbs}C/${f.fat}F · GI:${esc(f.giTolerance)}</div></div>
    <div class="list-actions"><button class="icon-btn" onclick="editFoodPrompt('${esc(f.id)}')">Edit</button><button class="icon-btn" onclick="if(confirm('Delete this saved food?')){deleteFood('${esc(f.id)}');showFoodManager();}">Delete</button></div></div>`).join('');
  showModal(`<h3>Saved foods</h3><button class="primary wide" onclick="editFoodPrompt(null)">Add new food</button><div style="margin-top:10px">${rows||'<div class="small">No foods yet.</div>'}</div><button class="secondary wide" style="margin-top:12px" onclick="closeModal();renderSettings();">Close</button>`);
}
function editFoodPrompt(id){
  const f = id ? findFood(id) : {id:uid(), name:'', basisQty:100, basisUnit:'g', calories:0, protein:0, carbs:0, fat:0, source:'manual', pricePkr:0, priceQty:100, priceUnit:'g', giTolerance:'unknown', notes:''};
  showModal(`<h3>${id?'Edit':'Add'} saved food</h3>
    <div class="field"><label>Name</label><input id="fName" class="detail-input" value="${esc(f.name)}"></div>
    <div class="row"><div class="field"><label>Basis qty</label><input id="fBQty" class="detail-input" inputmode="decimal" value="${f.basisQty}"></div>
    <div class="field"><label>Basis unit</label><input id="fBUnit" class="detail-input" value="${esc(f.basisUnit)}"></div></div>
    <div class="row"><div class="field"><label>Calories</label><input id="fCal" class="detail-input" inputmode="decimal" value="${f.calories}"></div>
    <div class="field"><label>Protein g</label><input id="fPro" class="detail-input" inputmode="decimal" value="${f.protein}"></div></div>
    <div class="row"><div class="field"><label>Carbs g</label><input id="fCarb" class="detail-input" inputmode="decimal" value="${f.carbs}"></div>
    <div class="field"><label>Fat g</label><input id="fFat" class="detail-input" inputmode="decimal" value="${f.fat}"></div></div>
    <div class="field"><label>GI tolerance</label><select id="fGI" class="detail-input">
      ${['unknown','good','mixed','bad'].map(g=>`<option value="${g}" ${f.giTolerance===g?'selected':''}>${g}</option>`).join('')}
    </select></div>
    <div class="field"><label for="fEffort">Preparation steps (simple effort estimate)</label><input id="fEffort" class="detail-input" type="number" min="0" max="20" value="${f.prepSteps??1}"></div>
    <div class="field"><label>Notes</label><textarea id="fNotes" class="detail-input">${esc(f.notes||'')}</textarea></div>
    <button class="primary wide" onclick="saveFoodPrompt('${id?esc(id):''}')">Save food</button>`);
}
function saveFoodPrompt(existingId){
  const f = existingId ? {...findFood(existingId)} : {id:uid(), source:'manual', pricePkr:0, priceQty:100, priceUnit:'g'};
  f.name = document.getElementById('fName').value.trim() || 'Untitled food';
  f.basisQty = num(document.getElementById('fBQty').value, 100);
  f.basisUnit = document.getElementById('fBUnit').value.trim() || 'g';
  f.calories = num(document.getElementById('fCal').value, 0);
  f.protein = num(document.getElementById('fPro').value, 0);
  f.carbs = num(document.getElementById('fCarb').value, 0);
  f.fat = num(document.getElementById('fFat').value, 0);
  f.giTolerance = document.getElementById('fGI').value;
  f.notes = document.getElementById('fNotes').value;
  f.prepSteps=Math.max(0,Math.min(20,Number(document.getElementById('fEffort').value)||0));
  if(!(f.basisQty>0)||[f.calories,f.protein,f.carbs,f.fat].some(v=>v<0)){toast('Use a positive basis quantity and non-negative macros');return;}
  if(!existingId){ f.pricePkr = 0; f.priceQty = f.basisQty; f.priceUnit = f.basisUnit; }
  upsertFood(f); toast('Food saved'); showFoodManager();
}

/* =========================================================================
   Navigation, modal, toast
   ========================================================================= */
let currentScreen = 'today';
function showScreen(name){
  checkLocalDay();
  currentScreen = name;
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(name+'Screen').classList.add('active');
  document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active', b.dataset.screen===name));
  if(name==='today') renderToday();
  else if(name==='train') renderTrain();
  else if(name==='eat') renderEat();
  else if(name==='plan') renderPlan();
  else if(name==='progress') renderProgress();
  else if(name==='settings') renderSettings();
  window.scrollTo({top:0,behavior:'instant'});
}
document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>showScreen(b.dataset.screen)));
document.getElementById('timerStop').onclick=stopTimer;

document.getElementById('modalBackdrop').addEventListener('click',e=>{ if(e.target.id==='modalBackdrop') closeModal(); });
function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2000); }

function maybeInstallTip(){
  const standalone=window.navigator.standalone===true || window.matchMedia('(display-mode: standalone)').matches;
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  if(ios && !standalone && !sessionStorage.getItem('installTipShown')){
    sessionStorage.setItem('installTipShown','1');
    setTimeout(()=>toast('Tip: Add this to your Home Screen from Safari'),900);
  }
}
