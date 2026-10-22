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
let foods = loadNS(NS.foods, ()=>({foods:[]}));
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

// Returns scale factor (qty relative to the food's basis), or null if the
// requested unit is not compatible with the food's basis unit (in which
// case the caller must fall back to manual entry — we never guess).

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

/* =========================================================================
   PLAN module — pricing + local economic meal solver (no network calls)
   ========================================================================= */
// Plan is rendered by nutrition.js.



// Bounded brute-force solver. The saved-food list is small by design (spec:
// up to ~200 foods), so we pre-filter to a small candidate pool per mode,
// then enumerate combinations of 1–3 foods across a handful of serving
// multipliers. No network calls — deterministic, local only.

// it.qty is always expressed in the food's basisUnit. Returns cost in PKR,
// or NaN when priceUnit isn't compatible with basisUnit (never guessed).

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
    ${nutritionSettingsHtml()}
    <div class="section-title"><h2>Steps & recovery</h2></div>
    <div class="card settings-card"><div class="row"><label class="field">Step target<input id="stSteps" class="detail-input" type="number" min="0" value="${settings.stepTarget}"></label><label class="field">Hydration target (ml)<input id="stHydration" class="detail-input" type="number" min="0" value="${settings.hydrationTargetMl}"></label></div><label class="field">Goal weight (kg, optional)<input id="stGoalWeight" class="detail-input" type="number" min="1" value="${settings.goalWeightKg??''}"></label><button class="secondary wide" onclick="saveRecoverySettings()">Save steps & recovery</button></div>
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
