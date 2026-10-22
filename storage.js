/* Additive migrations and validated transactional backup restore. */
const MOBILITY_KEY='sculpt.v3.mobility';
let mobility=loadNS(MOBILITY_KEY,()=>({records:[],tests:[]}));
function snapshotForRollback(){return JSON.parse(JSON.stringify({training,nutrition,foods,body,settings,milestones,mobility}));}
function normalizeImported(data){
 let next=JSON.parse(JSON.stringify(data));
 if(!next.schemaVersion&&Array.isArray(next.sessions)&&next.settings){
  next={schemaVersion:2,...snapshotForRollback(),training:{sessions:next.sessions,active:next.active||null,settings:next.settings}};
 }
 SculptCore.validateBackup(next);
 next.settings={...defaultSettings(),...next.settings};
 next.milestones={...defaultMilestones(),...next.milestones};
 next.mobility=next.mobility||{records:[],tests:[]};
 next.training.settings={unit:'kg',...next.training.settings};
 tagLegacySessions(next.training);next.training.sessions.sort((a,b)=>b.finishedAt-a.finishedAt);
 for(const session of [...next.training.sessions,...(next.training.active?[next.training.active]:[])]){
  const source=session.programId==='legacy-ppl'?PROGRAMS['legacy-ppl']:SCULPT_PROGRAM;
  const workout=source.sessions[session.workoutId];
  if(!workout)throw new Error('Invalid session workout '+session.workoutId);
  const ids=new Set(workout.exercises.map(e=>e.id));
  for(const id of Object.keys(session.entries))if(!ids.has(id))throw new Error('Invalid exercise ID '+id+' for '+workout.name);
  // An active session must contain all exercises to remain resumable.
  if(session===next.training.active)for(const id of ids)if(!session.entries[id])throw new Error('Active session is missing exercise '+id);
 }

 next.settings.theme=next.settings.theme||'system';
 next.settings.activeProgram=next.settings.activeProgram||SCULPT_PROGRAM.id;
 next.settings.blockStartedOn=next.settings.blockStartedOn||localDateStr();
 NutritionCore.migrateState(next);
 next.schemaVersion=4;
 SculptCore.validateBackup(next);return next;
}
function tagLegacySessions(t){
 [...t.sessions,...(t.active?[t.active]:[])].forEach(s=>{
  if(!s.programId){s.programId='legacy-ppl';s.programVersion=1;}
  if(s.programId==='legacy-ppl'&&!['pushA','pullA','pushB','pullB'].includes(s.workoutId))throw new Error('Unknown legacy workout '+s.workoutId);
  if(!s.sessionId)s.sessionId=s.workoutId;
  if(!s.sessionName)s.sessionName=s.programId==='legacy-ppl'?PROGRAM[s.workoutId]?.name:SCULPT_PROGRAM.sessions[s.workoutId]?.name;
  if(!s.scheduledDate)s.scheduledDate=localDateStr(new Date(s.startedAt));
 });
}
function installState(next){({training,nutrition,foods,body,settings,milestones,mobility}=next);}
function importPayload(data,{keepRollback=true}={}){
 const next=normalizeImported(data); // Validate all nested data before any persistent write.
 const previous=snapshotForRollback();
 const keys=[...Object.values(NS),MOBILITY_KEY,'sculpt.v2.rollback'];
 const raw=Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)]));
 try{
  localStorage.setItem('sculpt.v3.importJournal',JSON.stringify(raw));
  if(keepRollback)localStorage.setItem('sculpt.v2.rollback',JSON.stringify(previous));
  installState(next);saveAll();saveNS(MOBILITY_KEY,mobility);
  applyTheme();renderToday();renderTrain();renderEat();renderPlan();renderProgress();renderSettings();
  localStorage.removeItem('sculpt.v3.importJournal');
 }catch(error){
  installState(previous);
  let restored=true;for(const [key,value] of Object.entries(raw)){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}catch(e){restored=false;}}
  if(restored)try{localStorage.removeItem('sculpt.v3.importJournal');}catch(e){}
  try{applyTheme();showScreen(currentScreen);}catch(e){}
  throw error;
 }
 return next;
}
function importAll(file){if(!file)return;const reader=new FileReader();reader.onload=()=>{try{importPayload(JSON.parse(reader.result));toast('Backup imported');}catch(e){alert('Import rejected: '+e.message);}};reader.onerror=()=>alert('Could not read backup file');reader.readAsText(file);}
function exportAll(){
 const data={schemaVersion:4,exportedAt:new Date().toISOString(),...snapshotForRollback()};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`sculpt-backup-${localDateStr()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function restoreRollback(){const raw=localStorage.getItem('sculpt.v2.rollback');if(!raw){toast('No pre-import snapshot available');return;}try{importPayload({schemaVersion:3,...JSON.parse(raw)},{keepRollback:false});toast('Snapshot restored');}catch(e){alert('Snapshot rejected: '+e.message);}}
function migrateProgram(){
 if(!localStorage.getItem('sculpt.v3.programMigration')){
  // Snapshot before tagging or choosing the new program. Legacy keys remain intact.
  saveNS('sculpt.v3.preMigration',snapshotForRollback());
  tagLegacySessions(training);
  settings.activeProgram=settings.activeProgram||SCULPT_PROGRAM.id;
  settings.blockStartedOn=settings.blockStartedOn||localDateStr();
  settings.theme=settings.theme||'system';
  settings.proteinWindows.forEach(w=>w.grams=round1(settings.proteinTarget/4));
  saveAll();saveNS(MOBILITY_KEY,mobility);saveNS('sculpt.v3.programMigration',true);
 }
}
