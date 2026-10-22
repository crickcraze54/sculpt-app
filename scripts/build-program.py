"""Reproducible extraction from the user's authoritative Markdown. No dependencies."""
import json,re,pathlib,hashlib,sys
root=pathlib.Path(__file__).resolve().parents[1]
src=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else root/'program-source.md'
text=src.read_text()
def clean(s):return re.sub(r'[*_]', '',s).replace('\\~','~').strip()
sections={m.group(1):m.group(2) for m in re.finditer(r'^## ([^\n]+)\n(.*?)(?=^## |\Z)',text,re.M|re.S)}
normalize={'clavicular pec':'upper/clavicular pec','mid-trap':'mid traps','upper trapezius':'upper traps','upper trap':'upper traps','lower trapezius':'lower traps','lower trap':'lower traps','rear delt':'posterior delt','sternocleidomastoid':'neck flexors','SCM':'neck flexors','cervical extensors':'neck extensors','wrist and finger flexors':'wrist flexors','longus':'adductor longus','brevis':'adductor brevis','medial head':'triceps lateral/medial contribution','triceps lateral and medial heads':'triceps lateral/medial contribution','triceps lateral head':'triceps lateral/medial contribution','long head':'triceps long head','long head triceps':'triceps long head','erectors':'spinal erectors','lat':'lat extension','latissimus dorsi':'lat extension','hamstrings':'hamstrings hip extension','gastrocnemius medial head':'gastrocnemius','lateral head':'gastrocnemius','upper gluteus maximus':'gluteus maximus','rectus abdominis, lower portion':'rectus abdominis','neck mass generally':'lateral cervical musculature'}
def region(s,exname):
 s=clean(s).strip(' ,')
 if s.startswith('latissimus dorsi, adduction'):return 'lat adduction'
 if s.startswith('latissimus dorsi, ') and 'extension' in s:return 'lat extension'
 if s.startswith('hamstrings, ') and 'knee' in s:return 'hamstrings knee flexion'
 if s.startswith('hamstrings, ') and ('hip' in s):return 'hamstrings hip extension'
 if s in ['biceps femoris long head','short head','semitendinosus','semimembranosus']:return 'hamstrings knee flexion'
 return normalize.get(s,s)
def tags(s,name):
 out=[]
 # Split only after each D/I marker, preserving commas in anatomical labels.
 for m in re.finditer(r'(.*?)\*\(([DI])\)\*(?:,\s*|$)',s):
  r=region(m.group(1),name)
  if r and r not in [x['muscle'] for x in out]:out.append({'muscle':r,'kind':m.group(2)})
 return out
sessions={}
for label,key in [('Push A','pushA'),('Pull A','pullA'),('Legs A','legsA'),('Push B','pushB'),('Pull B','pullB'),('Legs B','legsB')]:
 heading=next(k for k in sections if k.startswith(label+' —'))
 sec=sections[heading]
 prefix=sec.split('### 1.')[0]
 gen=re.search(r'\*General \((\d+) min\)\.\* (.+)',prefix)
 drills=re.findall(r'^\d+\. (.+)',prefix,re.M)
 exercises=[]
 for m in re.finditer(r'^### (\d+)\. ([^\n]+)\n(.*?)(?=^### |\*\*Session total|\Z)',sec,re.M|re.S):
  n,name,body=m.groups();line=next(x for x in body.splitlines() if '×' in x)
  fields={f.group(1).lower():clean(f.group(2)) for f in re.finditer(r'^- \*\*(.+?):\*\* (.+)',body,re.M)}
  rawfields={f.group(1).lower():f.group(2) for f in re.finditer(r'^- \*\*(.+?):\*\* (.+)',body,re.M)}
  dose=re.search(r'^(\d+) × (\d+)(?:[–-](\d+))?',line)
  rir=re.search(r'RIR (\d+)(?:[–-](\d+))?',line)
  rest=re.search(r'rest (\d+)(?:[–-](\d+))? s',line)
  tt=tags(rawfields.get('primary',''),name)+tags(rawfields.get('secondary',''),name)
  direct=list(dict.fromkeys(t['muscle'] for t in tt if t['kind']=='D'))
  indirect=list(dict.fromkeys(t['muscle'] for t in tt if t['kind']=='I' and t['muscle'] not in direct))
  ex={'id':key+'-'+n,'comparisonId':re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-'),'name':name,'sets':int(dose[1]),'repMin':int(dose[2]),'repMax':int(dose[3] or dose[2]),'rirMin':int(rir[1]) if rir else 3,'rirMax':int(rir[2] or rir[1]) if rir else 3,'restSeconds':int(rest[2] or rest[1]),'prescription':clean(line),'primaryMuscles':[region(clean(x),name) for x in re.split(r'\*\([DI]\)\*,?\s*',rawfields.get('primary','')) if clean(x)],'secondaryMuscles':[region(clean(x),name) for x in re.split(r'\*\([DI]\)\*,?\s*',rawfields.get('secondary','')) if clean(x)],'directContributions':[{'muscle':r,'weight':1} for r in direct],'indirectContributions':[{'muscle':r,'weight':(.25 if (r=='anterior delt' and 'Flat machine' in name) or (r=='gastrocnemius' and name=='Seated leg curl') else .5)} for r in indirect],'why':fields.get('why','Not separately specified in the source.'),'setup':fields.get('setup',fields.get('setup/rom/breathing',fields.get('setup/rom',''))),'rom':fields.get('rom',''),'breathing':fields.get('breathing',''),'ramp':fields.get('ramp','none.'),'commonError':fields.get('error',''),'setType':'per-side reps' if re.search(r'per leg|per side|/side',line) else 'reps','unilateral':bool(re.search(r'per leg|per side|/side|single.arm',line+' '+name,re.I)),'herniaNotes':fields.get('breathing',''),'alternatives':[],'sourceSection':heading,'sourceNumber':int(n)}
  if ex['unilateral']:ex['setType']='per-side reps'
  if key=='pushB' and n in ['2','9'] or key=='pullB' and n=='6':
   ex['setTypes']=['reps','bodyweight']
   if key=='pushB' and n=='9':ex['setType']='bodyweight'
  # Resolve explicit cross-references without inventing cues.
  ref=None
  if key=='legsB' and n in ['7','8']:ref=sessions['legsA']['exercises'][5 if n=='7' else 7]
  if ref:
   for k in ['setup','rom','breathing','commonError']:
    if not ex[k] or ex[k].startswith('as Legs A'):ex[k]=ref[k]
  if key=='pushB' and n=='3':ex['setup']=sessions['pushA']['exercises'][0]['setup']
  if key=='pushB' and n in ['5','8']:ex['setup']=sessions['pushA']['exercises'][4 if n=='5' else 5]['setup']
  if key=='pullB' and n=='10':
   ex['name']='Neck lateral flexion';ex['sets']=2;ex['repMin']=ex['repMax']=10;ex['rirMin']=ex['rirMax']=3;ex['setType']='per-side reps';ex['prescription']='2 × 10/side @ RIR 3 · rest 45 s'
   exercises.append(ex)
   rot={**ex,'id':key+'-10-rotation','name':'Neck isometric rotation hold','comparisonId':'neck-isometric-rotation-hold','sets':2,'repMin':15,'repMax':15,'setType':'isometric hold','prescription':'2 × 15 s/side · submaximal · rest 45 s','loadLocked':True,'directContributions':[{'muscle':'lateral cervical musculature','weight':1}],'indirectContributions':[]}
   exercises.append(rot);continue
  if key=='legsB' and n=='9':ex['setTypes']=['per-side reps','distance'];ex['distanceMetres']=30;ex['contributionsBySetType']={'per-side reps':{'direct':[{'muscle':'obliques','weight':1}],'indirect':[]},'distance':{'direct':ex['directContributions'],'indirect':ex['indirectContributions']+[{'muscle':'wrist flexors','weight':.5}]}}
  for sentence in re.split(r'(?<=[.!?])\s+', ' '.join([ex['why'],ex['breathing'],ex['setup']])):
   if re.search(r'substitut|instead',sentence,re.I):ex['alternatives'].append(sentence)
  exercises.append(ex)
 # Balance odd prescriptions across the session so the total is approximately half,
 # while keeping every exercise. Higher-priority odd slots receive the rounded-up set.
 deload_target=(sum(ex['sets'] for ex in exercises)+1)//2
 for ex in exercises:ex['deloadSets']=max(1,ex['sets']//2)
 remaining=deload_target-sum(ex['deloadSets'] for ex in exercises)
 for ex in exercises:
  if remaining>0 and ex['sets']%2:
   ex['deloadSets']+=1;remaining-=1
 sessions[key]={'id':key,'name':label,'focus':heading.split(' — ')[1],'generalWarmup':{'name':gen[2],'seconds':int(gen[1])*60},'warmup':[{'id':key+'-warm-'+str(i+1),'name':clean(d),'seconds':int(re.search(r'(\d+)(?:–\d+)? s(?:econds)?\b',d)[1]) if re.search(r'(\d+)(?:–\d+)? s(?:econds)?\b',d) and not re.search(r'reps.*s each',d) else 0} for i,d in enumerate(drills)],'exercises':exercises}
# Small flexor endurance holds are prescribed separately as posture work from week 3, not hard sets.
program={'id':'complete-hypertrophy-6day-v1','version':1,'name':'Complete Hypertrophy · 6-Day PPL','sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'sessions':sessions,'neckGuidance':clean(sections['Direct neck training']),'sourceNotes':'Individual exercise prescriptions override conflicting session and weekly summaries. Combined lateral flexion/rotation is shown as two linked rows, 2 sets each. Deep cervical flexor holds are separate endurance work from week 3; excluded from hard-set totals.'}
routine=[]
for row in re.findall(r'^\| (\d+) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|$',text,re.M):
 n,name,kind,dose,target=row
 routine.append({'id':'mob-'+n,'name':name,'type':kind,'dose':dose,'target':target,'quick':n in ['2','5','8','9','12']})
tests=[]
for row in re.findall(r'^\| ([^|]+) \| ([^|]+) \| ([^|]+) \|([^|]*)\|$',sections['Assessing mobility progress'],re.M):
 name,how,good,notes=[x.strip() for x in row]
 if name in ['Test','---']:continue
 tests.append({'id':'test-'+str(len(tests)+1),'name':name,'how':how,'reference':good,'notes':notes,'unit':'cm' if name=='Ankle dorsiflexion' else 'degrees' if name not in ['Shoulder flexion','Thoracic extension','Hip flexor length'] else 'score (0=no, 1=yes)'})
reference={k:clean(v) for k,v in sections.items() if k in ['Evidence grading','Hiatal hernia modifications','Daily mobility routine — 13 minutes','Assessing mobility progress','12–16 week progression']}
(root/'program-data.js').write_text('/* Generated from program-source.md by scripts/build-program.py. */\nwindow.SCULPT_PROGRAM = '+json.dumps(program,ensure_ascii=False,indent=2)+';\nwindow.SCULPT_MOBILITY = '+json.dumps({'routine':routine,'tests':tests,'reference':reference},ensure_ascii=False,indent=2)+';\n')
print({k:sum(e['sets'] for e in s['exercises']) for k,s in sessions.items()})
print('Weekly hard sets:',sum(e['sets'] for s in sessions.values() for e in s['exercises']))
