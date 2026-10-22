/* AI-first Eat and Plan. Logs/targets/arithmetic are local; estimates are server-side. */
const N = NutritionCore;
const AI_ENDPOINT = '/api/nutrition-ai';
let aiBusy = null;
let nutritionMessage = '';
let planMode = N.MODES.includes(settings.nutritionLastMode) ? settings.nutritionLastMode : N.MODES[0];
let mealPreview = null;
let editingMealId = null;
let dateBeingLogged = null;
let aiPendingController = null;

function initializeNutritionAI() {
  if (settings.aiNutritionVersion !== 1) {
    const rawSnapshot = { schemaVersion: 3, ...snapshotForRollback() };
    if (!localStorage.getItem('sculpt.v4.preNutritionAI')) saveNS('sculpt.v4.preNutritionAI', rawSnapshot);
    N.migrateState({ nutrition, settings });
    N.validateStorage({ schemaVersion: 4, nutrition, settings });
    saveNS(NS.nutrition, nutrition); saveNS(NS.settings, settings);
  }
}
function nutritionProfile() { return settings.nutritionProfile; }
function nutritionWeight() { return N.latestWeight(body.records, nutritionProfile().fallbackWeightKg, localDateStr()); }
function targetEstimate() { return N.targets(nutritionProfile(), nutritionWeight().kg, settings.nutritionTargetMode === 'auto' ? settings.nutritionOverrides : {}); }
function syncNutritionTargets() {
  initializeNutritionAI();
  if (settings.nutritionTargetMode !== 'auto') return;
  const estimate = targetEstimate();
  const next = {};
  if (estimate.calories !== null) next.calorieTarget = estimate.calories;
  if (estimate.protein !== null) next.proteinTarget = estimate.protein;
  if (estimate.carbs !== null) next.carbTarget = estimate.carbs;
  if (estimate.fat !== null) next.fatTarget = estimate.fat;
  if (Object.entries(next).some(([k, v]) => settings[k] !== v)) {
    Object.assign(settings, next); saveNS(NS.settings, settings);
  }
}
function currentNutritionTotals(date = localDateStr()) {
  syncNutritionTargets();
  const eaten = sumMacros(mealsForDate(date));
  const targets = { calories: settings.calorieTarget, protein: settings.proteinTarget, carbs: settings.carbTarget, fat: settings.fatTarget };
  const remaining = Object.fromEntries(N.MACROS.map(m => [m, round1(targets[m] - eaten[m])]));
  return { eaten, targets, remaining };
}
function currentProteinPacing() {
  syncNutritionTargets();
  const p = nutritionProfile(), meals = mealsForDate(localDateStr());
  return N.pacing({ target: settings.proteinTarget, consumed: sumMacros(meals).protein, meals, preferredMeals: p.preferredMeals, now: new Date(), bedtime: p.bedtime || settings.bedtime });
}
function knownNutritionFacts(all = false) {
  // Optional legacy facts improve a matching product; an empty store is fully supported.
  const legacy = (foods.foods || []).filter(f => !String(f.id).startsWith('seed_') && f.basisQty > 0 && f.name.length <= 160 && f.basisUnit.length <= 40 && N.MACROS.every(m => Number.isFinite(f[m]) && f[m] <= 20000)).map(f => ({ name: f.name, unit: f.basisUnit, basisQty: f.basisQty, calories: f.calories, protein: f.protein, carbs: f.carbs, fat: f.fat, source: f.source === 'label' ? 'label' : 'user-correction', updatedAt: 0 }));
  const facts = [...nutrition.foodCorrections.slice().sort((a, b) => b.updatedAt - a.updatedAt), ...legacy];
  const seen = new Set();
  return facts.filter(f => { const k = N.key(f.name) + '|' + N.unit(f.unit)[0]; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, all ? 1000 : 30);
}
function nutritionTrainingContext() {
  const date = localDateStr(), p = selectedProgram(), id = scheduledId();
  const sessions = training.sessions.filter(s => localDateStr(new Date(s.finishedAt)) === date && s.completedSets > 0);
  const active = training.active;
  const plannedTime = nutritionProfile().workoutTime;
  const mins = new Date().getHours() * 60 + new Date().getMinutes();
  const planned = plannedTime ? plannedTime.split(':').map(Number) : null;
  return {
    programName: active ? sessionProgram(active).name : p.name,
    sessionName: active ? sessionWorkout(active).name : id ? p.sessions[id].name : 'Rest + Mobility',
    completed: sessions.length > 0, inProgress: !!active,
    weekNumber: currentWeek(), block: weekBlock(), calorieDeficitMode: settings.deficitMode === true,
    weeklySchedule: p.id === 'legacy-ppl' ? 'Legacy rotating PPL; next scheduled session: ' + (id ? p.sessions[id].name : 'Rest') : 'Monday Push A; Tuesday Pull A; Wednesday Legs A; Thursday Push B; Friday Pull B; Saturday Legs B; Sunday Rest + Mobility',
    completedSessionsToday: sessions.map(s => s.sessionName || sessionWorkout(s).name),
    completedWorkingSets: active ? completedSets(active) : sessions.reduce((n, s) => n + s.completedSets, 0),
    plannedTime, minutesUntilWorkout: planned && !sessions.length ? planned[0] * 60 + planned[1] - mins : null
  };
}
function buildNutritionContext(originalMeal = null) {
  const { eaten, targets, remaining } = currentNutritionTotals();
  const now = new Date(), p = nutritionProfile();
  return {
    profile: { ...p, currentWeightKg: nutritionWeight().kg },
    today: {
      date: localDateStr(now), localTime: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'),
      targets, consumed: eaten, remaining,
      meals: mealsForDate(localDateStr()).slice(-40).map(m => ({ name: String(m.name).slice(0, 160), time: m.time || '', ts: m.ts, calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat })),
      pacing: currentProteinPacing()
    },
    training: nutritionTrainingContext(), budget: N.budget(p, now), facts: knownNutritionFacts(), ...(originalMeal ? { originalMeal } : {})
  };
}
function contextFingerprint(context = buildNutritionContext()) {
  const nutritionStateHash = N.hash({ date: context.today.date, targets: context.today.targets, consumed: context.today.consumed, meals: context.today.meals });
  const [hour, minute] = context.today.localTime.split(':').map(Number);
  const trainingHash = { ...context.training, minutesUntilWorkout: context.training.minutesUntilWorkout === null ? null : Math.floor(context.training.minutesUntilWorkout / 15) };
  const contextHash = N.hash({ profile: context.profile, training: trainingHash, mealsRemaining: context.today.pacing.mealsRemaining, budget: context.budget, facts: context.facts, originalMeal: context.originalMeal || null, timeBucket: hour * 2 + Math.floor(minute / 30) });
  return { nutritionStateHash, contextHash };
}
function aiCacheKey(action, input, mode, context = buildNutritionContext()) {
  const fingerprint = contextFingerprint(context);
  return { ...fingerprint, cacheKey: N.hash({ action, input, mode, ...fingerprint }) };
}
function cachedAI(action, input = '', mode = planMode) {
  const key = aiCacheKey(action, input, mode).cacheKey;
  return nutrition.aiNutritionCache.find(c => c.cacheKey === key && Date.now() - c.createdAt < 24 * 3600000) || null;
}
function aiEntry(id) { return nutrition.aiNutritionCache.find(c => c.id === id); }
function currentAIEntry(action, input = '', mode = planMode) { return cachedAI(action, input, mode); }
function saveNutritionDraft(field, value) {
  nutrition.aiDrafts[field] = value.slice(0, 1800); saveNS(NS.nutrition, nutrition);
}
function aiFeedback() {
  return nutritionMessage ? `<div class="notice info ai-feedback" role="status">${esc(nutritionMessage)}</div>` : '';
}
function paintNutrition() {
  if (currentScreen === 'eat') renderEat();
  else if (currentScreen === 'plan') renderPlan();
}
function setNutritionMessage(message) { nutritionMessage = message; paintNutrition(); }
async function requestNutrition(action, input = '', mode = planMode, options = {}) {
  if (aiBusy) { setNutritionMessage('An AI request is already running. Your text is kept.'); return null; }
  if (!navigator.onLine) { setNutritionMessage(action === 'parseMeal' ? 'AI meal analysis requires internet. Your text is kept; retry when online.' : 'AI planning requires internet. Logged meals and targets are available offline.'); return null; }
  checkLocalDay();
  const context = buildNutritionContext(options.originalMeal || null), fingerprint = aiCacheKey(action, input, mode, context);
  const cached = !options.refresh && nutrition.aiNutritionCache.find(c => c.cacheKey === fingerprint.cacheKey && Date.now() - c.createdAt < 24 * 3600000);
  if (cached) { nutritionMessage = cached.result.status === 'needs_clarification' ? 'Unable to estimate confidently: ' + cached.result.question : ''; if (action === 'parseMeal') showParsedPreview(cached); paintNutrition(); return cached; }
  const destination = options.destination || localDateStr();
  aiBusy = action; nutritionMessage = ''; aiPendingController = new AbortController();
  const timeout = setTimeout(() => aiPendingController?.abort(), 55000);
  paintNutrition();
  try {
    const response = await fetch(AI_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, input, mode, context }), signal: aiPendingController.signal, cache: 'no-store' });
    let payload;
    try { payload = await response.json(); } catch (_) { throw new Error('Invalid server response. Nothing was logged; your entry is kept.'); }
    if (!response.ok) throw new Error(payload?.error && typeof payload.error.message === 'string' ? payload.error.message : `Nutrition server failure (HTTP ${response.status}). Your entry is kept.`);
    if (payload.action !== action) throw new Error('Invalid Gemini response: action mismatch. Nothing was logged.');
    N.validateResponse(payload.result, action);
    payload.result.meals=payload.result.meals.map(meal=>N.applyFacts(meal,knownNutritionFacts(true)));
    payload.result.meals.forEach(N.validateMeal);
    const current = aiCacheKey(action, input, mode, buildNutritionContext(options.originalMeal || null));
    if (current.cacheKey !== fingerprint.cacheKey) throw new Error('Your meals, profile, time or workout changed during analysis. Retry with the updated context; your text is kept.');
    const entry = { id: 'ai_' + uid(), action, input, mode, createdAt: Date.now(), ...fingerprint, result: payload.result, ...(options.originalMeal ? { originalMeal: JSON.parse(JSON.stringify(options.originalMeal)) } : {}) };
    nutrition.aiNutritionCache = [entry, ...nutrition.aiNutritionCache.filter(c => c.cacheKey !== entry.cacheKey)].slice(0, 8);
    saveNS(NS.nutrition, nutrition);
    if (action === 'parseMeal') { dateBeingLogged = destination; showParsedPreview(entry); }
    if (payload.result.status === 'needs_clarification') nutritionMessage = 'Unable to estimate confidently: ' + payload.result.question;
    if (action === 'solveNextMeal') { milestones.usedSolver = true; saveNS(NS.milestones, milestones); }
    return entry;
  } catch (e) {
    nutritionMessage = !navigator.onLine ? 'AI meal analysis requires internet. Your text is kept.' : e.name === 'AbortError' ? 'AI nutrition took too long. Retry without losing your entry.' : /^Invalid /.test(e.message) ? 'Invalid Gemini/server response. Nothing was logged; retry or clarify the portion.' : e instanceof TypeError ? 'AI nutrition server is unreachable. Retry without losing your entry.' : e.message;
    return null;
  } finally { clearTimeout(timeout); aiBusy = null; aiPendingController = null; paintNutrition(); }
}
function showParsedPreview(entry) {
  if (entry.result.status !== 'ready' || nutrition.aiDrafts.mealText.trim()!==entry.input) return;
  const id = entry.id + '-0';
  if (nutrition.meals.some(m => m.aiResponseId === id)) return;
  mealPreview = { meal: JSON.parse(JSON.stringify(entry.result.meals[0])), responseId: id, origin: 'parseMeal', inputText:entry.input, date: dateBeingLogged || mealDestination(), original: JSON.parse(JSON.stringify(entry.result.meals[0])) };
}
function analyzeMealText(refresh = false) {
  const text = nutrition.aiDrafts.mealText.trim();
  if (!text) { setNutritionMessage('Describe what you ate first.'); return; }
  editingMealId = null; dateBeingLogged = mealDestination();
  return requestNutrition('parseMeal', text, N.MODES[0], { refresh, destination: dateBeingLogged });
}
function remainingHtml() {
  const { remaining } = currentNutritionTotals();
  return `<div class="card hero nutrition-remaining"><span class="eyebrow">Remaining today</span><h2>${Math.round(remaining.calories).toLocaleString()} <small>kcal</small></h2><p>${round1(remaining.protein)} P · ${round1(remaining.carbs)} C · ${round1(remaining.fat)} F</p><p class="small">Negative values indicate targets already exceeded.</p></div>`;
}
function pacingHtml() {
  const pace = currentProteinPacing();
  return `<div class="card settings-card"><div class="history-top"><h3>Protein pacing</h3><span class="pill">${pace.mealsRemaining} likely meals left</span></div><p>${pace.target} g target · ${round1(pace.consumed)} g eaten · ${pace.remaining} g left</p>${pace.windows.length ? `<div class="protein-windows">${pace.windows.map(slot => `<div><span class="small">${esc(slot.label)} · ~${slot.time}</span><strong>~${slot.protein} g</strong></div>`).join('')}</div>` : `<p class="small">${pace.remaining === 0 ? 'Protein target reached.' : 'No usual feeding windows remain. If you are still eating, ask for a practical next meal; no late feeding is forced.'}</p>`}<p class="small">Local allocation from remaining protein, meal count, time and bedtime. AI can add food/timing ideas without changing the arithmetic.</p></div>`;
}
function setupCard() {
  const p = nutritionProfile(), weight = nutritionWeight();
  if (p.age && p.heightCm && ['male', 'female'].includes(p.sex) && weight.kg) return '';
  return `<div class="notice info setup-card"><strong>Complete nutrition setup</strong><p class="small">Add age, height, sex and goal${weight.kg ? '' : ', plus a weight in Progress'}. Your existing targets and AI meal logging remain usable.</p><button class="secondary" onclick="showScreen('settings')">Complete setup</button></div>`;
}
function nutritionDateNav() {
  return `<div class="date-nav"><button class="icon-btn" aria-label="Previous nutrition day" onclick="shiftEatDate(-1)">‹</button><label class="date-chip">${eatDate === localDateStr() ? 'Today' : 'Viewing history'}<input type="date" value="${esc(eatDate)}" aria-label="Nutrition date" onchange="chooseEatDate(this.value)"></label><button class="icon-btn" aria-label="Next nutrition day" onclick="shiftEatDate(1)">›</button><button class="icon-btn" onclick="chooseEatDate(localDateStr())">Today</button></div>`;
}
function renderEat() {
  checkLocalDay(); syncNutritionTargets();
  const { eaten } = currentNutritionTotals(eatDate);
  const meals = mealsForDate(eatDate).slice().sort((a, b) => a.ts - b.ts);
  let html = `<div class="section-title page-title"><h2>Eat</h2><span>Estimates, then one-tap logging</span></div>${nutritionDateNav()}<div class="card settings-card nutrition-summary"><div>${calorieRing(eaten.calories, settings.calorieTarget)}<p class="small center">${Math.round(eaten.calories)} / ${settings.calorieTarget} kcal</p></div><div class="macro-summary">${macroLine('Protein', eaten.protein, settings.proteinTarget, 'var(--protein)')}${macroLine('Carbs', eaten.carbs, settings.carbTarget, 'var(--carbs)')}${macroLine('Fat', eaten.fat, settings.fatTarget, 'var(--fat)')}</div></div>${setupCard()}`;
  if (eatDate !== localDateStr()) html += `<div class="notice">Viewing ${esc(eatDate)}. Analysis logs to today unless you choose otherwise.<label class="warm-row"><input type="checkbox" ${historicalLogging ? 'checked' : ''} onchange="historicalLogging=this.checked"> Intentionally log to ${esc(eatDate)}</label></div>`;
  html += `<div class="card settings-card meal-composer"><label class="eyebrow" for="aiMealText">What did you eat?</label><textarea id="aiMealText" class="detail-input" maxlength="1800" placeholder="3 eggs, 2 rotis and chai&#10;Chicken biryani, about one full plate&#10;Hydropure scoop with water + banana" oninput="saveNutritionDraft('mealText',this.value)">${esc(nutrition.aiDrafts.mealText)}</textarea><button class="primary wide" data-nutrition-action="parse" ${aiBusy ? 'disabled' : ''}>${aiBusy === 'parseMeal' ? 'Analyzing…' : 'Analyze with AI'}</button><p class="small">English or Roman Urdu. AI estimates portions and nutrition; you review before anything is logged.</p></div>${aiFeedback()}`;
  if (!mealPreview && nutrition.aiDrafts.mealText.trim()) {
    const cached = cachedAI('parseMeal', nutrition.aiDrafts.mealText.trim(), N.MODES[0]);
    if (cached) showParsedPreview(cached);
  }
  if (mealPreview) html += mealPreviewHtml();
  html += `<div class="section-title"><h2>${eatDate === localDateStr() ? "Today's meals" : 'Meals · ' + esc(eatDate)}</h2><span>${meals.length} logged</span></div>`;
  html += meals.length ? meals.map(m => `<div class="card settings-card"><span class="small">${esc(m.time || '')}</span><h3>${esc(m.name)}</h3><p>${Math.round(m.calories)} kcal · ${round1(m.protein)}P · ${round1(m.carbs)}C · ${round1(m.fat)}F</p>${m.source === 'gemini-estimate' ? '<span class="pill">Estimated nutrition</span>' : ''}<div class="list-actions"><button class="icon-btn" data-nutrition-action="edit" data-id="${esc(m.id)}">Edit</button><button class="icon-btn" data-nutrition-action="duplicate" data-id="${esc(m.id)}">Duplicate today</button><button class="icon-btn" data-nutrition-action="delete" data-id="${esc(m.id)}">Delete</button></div></div>`).join('') : '<div class="notice info">No meals logged for this date.</div>';
  if (eatDate === localDateStr()) html += pacingHtml() + reviewHtml();
  document.getElementById('eatScreen').innerHTML = html; labelControls(document.getElementById('eatScreen'));
}
function mealPreviewHtml() {
  const meal = mealPreview.meal, totals = N.sumItems(meal.items);
  const confidence = meal.items.some(i => i.confidence === 'low') ? 'Low' : meal.items.some(i => i.confidence === 'medium') ? 'Medium' : 'High';
  return `<div class="card settings-card ai-meal-preview"><div class="history-top"><h3>${esc(meal.mealName)}</h3><span class="pill">Confidence: ${confidence}</span></div><p class="meal-total">${Math.round(totals.calories)} kcal <span>${totals.protein}P · ${totals.carbs}C · ${totals.fat}F</span></p>${meal.items.map((item, i) => `<div class="estimate-item"><div><strong>${esc(item.name)}</strong><p class="small">${round1(item.quantity)} ${esc(item.unit)}${item.estimatedGrams === null ? '' : ' · approx. ' + round1(item.estimatedGrams) + ' g'} · ${Math.round(item.calories)} kcal</p>${item.assumption ? `<p class="small">${esc(item.assumption)}</p>` : ''}</div></div>`).join('')}<div class="row"><button class="secondary" data-nutrition-action="portion" data-factor="0.8">Less</button><button class="secondary" data-nutrition-action="portion" data-factor="1">About right</button><button class="secondary" data-nutrition-action="portion" data-factor="1.2">More</button></div><div class="row" style="margin-top:10px"><button class="primary" data-nutrition-action="confirm-log">${editingMealId ? 'Save changes' : 'Log meal'}</button><button class="secondary" data-nutrition-action="adjust">Adjust</button><button class="icon-btn" data-nutrition-action="dismiss-preview">Dismiss</button></div><p class="small">${editingMealId ? 'Editing an existing log; its date and timestamp stay unchanged.' : 'Will log to ' + esc(mealPreview.date)}. Totals are summed locally from the items.</p></div>`;
}

function generatedMealCard(entry, meal, index) {
  const responseId = entry.id + '-' + index, logged = nutrition.meals.some(m => m.aiResponseId === responseId);
  const totals = N.sumItems(meal.items);
  return `<article class="card settings-card planned-meal"><span class="eyebrow">${esc(meal.suggestedTime || 'Next meal')}</span><h3>${esc(meal.mealName)}</h3><p>${meal.items.map(i => `${round1(i.quantity)} ${esc(i.unit)} ${esc(i.name)}`).join(' · ')}</p><p class="meal-total">${Math.round(totals.calories)} kcal <span>${totals.protein}P · ${totals.carbs}C · ${totals.fat}F</span></p><p class="small">${esc(meal.reason)}</p>${meal.estimatedCostPkr === null ? '' : `<p class="small">Estimated cost: Rs ${round1(meal.estimatedCostPkr)}${meal.costAssumption ? ' · ' + esc(meal.costAssumption) : ''}. Not a verified live market price.</p>`}<details><summary>Portions & assumptions</summary>${meal.items.map(i => `<p class="small">${esc(i.name)} · ${esc(i.confidence)} confidence · ${esc(i.assumption || 'AI nutrition estimate')}</p>`).join('')}</details><div class="row"><button class="primary" data-nutrition-action="log-plan" data-id="${entry.id}" data-index="${index}" ${logged ? 'disabled' : ''}>${logged ? 'Logged' : 'Log this meal'}</button><button class="secondary" data-nutrition-action="review-plan" data-id="${entry.id}" data-index="${index}">Adjust</button><button class="secondary" data-nutrition-action="swap" data-id="${entry.id}" data-index="${index}" ${aiBusy ? 'disabled' : ''}>Swap</button></div></article>`;
}
function generatedResult(entry) {
  if (!entry) return '';
  if (entry.result.status === 'needs_clarification') return `<div class="notice info">Unable to estimate confidently: ${esc(entry.result.question)}</div>`;
  return (entry.result.summary ? `<p class="small ai-summary">${esc(entry.result.summary)}</p>` : '') + entry.result.meals.map((m, i) => generatedMealCard(entry, m, i)).join('') + entry.result.tips.map(t => `<p class="small">${esc(t)}</p>`).join('') + `<p class="small">Generated ${new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · kept locally until context changes</p>`;
}
function reviewHtml() {
  const entry = currentAIEntry('analyzeDay', '', N.MODES[0]);
  return `<div class="card settings-card"><div class="history-top"><h3>AI Daily Review</h3><button class="icon-btn" data-nutrition-action="review-day" ${aiBusy ? 'disabled' : ''}>${aiBusy === 'analyzeDay' ? 'Reviewing…' : 'Review now'}</button></div>${entry ? `<p>${esc(entry.result.summary || entry.result.question)}</p>${entry.result.tips.map(t => `<p class="small">${esc(t)}</p>`).join('')}` : '<p class="small">A short on-demand review using what you have actually logged.</p>'}</div>`;
}
function renderPlan() {
  checkLocalDay(); syncNutritionTargets();
  const daily = currentAIEntry('generateDailyPlan', '', N.MODES[0]);
  const next = currentAIEntry('solveNextMeal', nutrition.aiDrafts.askText.trim(), planMode);
  const budget = currentAIEntry('generateBudgetPlan', '', N.MODES[0]);
  const pacing = currentAIEntry('generateProteinPacing', '', N.MODES[0]);
  let html = `<div class="section-title page-title"><h2>Plan</h2><span>${esc(todayLong())}</span></div>${remainingHtml()}${setupCard()}${aiFeedback()}<div class="card settings-card"><h3>Today's plan</h3><p>What should you eat for the rest of today?</p><button class="primary wide" data-nutrition-action="daily-plan" ${aiBusy ? 'disabled' : ''}>${aiBusy === 'generateDailyPlan' ? 'Planning…' : daily ? 'Refresh rest-of-day plan' : 'Generate rest of day'}</button><p class="small">Uses logged meals, remaining macros, local time, your workout, preferences, triggers and budget.</p></div>${generatedResult(daily)}<div class="section-title"><h2>Next meal</h2></div><div class="strategy-grid">${N.MODES.map(mode => `<button class="${mode === planMode ? 'primary' : 'secondary'}" data-nutrition-action="solve" data-mode="${mode}" ${aiBusy ? 'disabled' : ''}>${esc(mode)}</button>`).join('')}</div><div class="card settings-card"><label for="askSculpt" class="eyebrow">Ask Sculpt</label><textarea id="askSculpt" class="detail-input" maxlength="1800" placeholder="What can I eat under 600 calories with 40g protein?&#10;I have chicken, eggs and roti at home.&#10;Aaj desi khana chahiye, shake nahi." oninput="saveNutritionDraft('askText',this.value)">${esc(nutrition.aiDrafts.askText)}</textarea><button class="primary wide" data-nutrition-action="ask" ${aiBusy ? 'disabled' : ''}>${aiBusy === 'solveNextMeal' ? 'Thinking…' : 'What should I eat?'}</button></div>${generatedResult(next)}${next?'<button class="secondary wide" data-nutrition-action="refresh-next">Refresh next meal</button>':''}${pacingHtml()}${pacing ? `<div class="notice info">${esc(pacing.result.summary)}${pacing.result.tips.map(t => `<p class="small">${esc(t)}</p>`).join('')}</div>` : ''}<details class="card settings-card"><summary>AI tools</summary><div class="tool-grid"><button class="secondary" data-nutrition-action="pacing-tips" ${aiBusy ? 'disabled' : ''}>Protein timing & food ideas</button><button class="secondary" data-nutrition-action="budget-plan" ${aiBusy ? 'disabled' : ''}>AI Budget Planning</button></div><p class="small">Budget: ${esc(nutritionProfile().budgetPreference)}${N.budget(nutritionProfile(), new Date()).dailyPkr !== null ? ' · approximately Rs ' + N.budget(nutritionProfile(), new Date()).dailyPkr + '/day preference' : ''}. Change general preferences in Nutrition Settings; no ingredient prices are needed.</p></details>${generatedResult(budget)}${reviewHtml()}`;
  // A swap is tied to its original meal; display the latest valid replacement separately.
  const swap = nutrition.aiNutritionCache.find(c => c.action === 'suggestSubstitution' && c.nutritionStateHash === contextFingerprint().nutritionStateHash && Date.now() - c.createdAt < 3600000 && c.contextHash === aiCacheKey(c.action, c.input, c.mode, buildNutritionContext(c.originalMeal || null)).contextHash);
  if (swap) html += `<div class="section-title"><h2>Replacement meal</h2></div>${generatedResult(swap)}`;
  document.getElementById('planScreen').innerHTML = html; labelControls(document.getElementById('planScreen'));
}
function logNutritionMeal(meal, responseId, date = localDateStr(), editId = null) {
  N.validateMeal(meal);
  if (!editId && responseId && nutrition.meals.some(m => m.aiResponseId === responseId)) { toast('This meal is already logged'); return false; }
  const clearAnalyzedDraft=mealPreview?.origin==='parseMeal' && mealPreview.responseId===responseId && nutrition.aiDrafts.mealText.trim()===mealPreview.inputText;
  const now = new Date(), totals = N.sumItems(meal.items);
  if (editId) {
    const index = nutrition.meals.findIndex(m => m.id === editId); if (index < 0) throw new Error('Meal no longer exists.');
    nutrition.meals[index] = { ...nutrition.meals[index], name: meal.mealName, ...totals, items: JSON.parse(JSON.stringify(meal.items)), notes: nutrition.meals[index].notes || '', estimatedCostPkr: meal.estimatedCostPkr };
  } else {
    const destination = date === localDateStr() ? localDateStr() : date;
    nutrition.meals.push({ id: uid(), ts: now.getTime(), date: destination, time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), name: meal.mealName, ...totals, items: JSON.parse(JSON.stringify(meal.items)), source: 'gemini-estimate', notes: '', aiResponseId: responseId || null, estimatedCostPkr: meal.estimatedCostPkr });
  }
  saveNS(NS.nutrition, nutrition);
  mealPreview = null; editingMealId = null; nutritionMessage = '';
  if (clearAnalyzedDraft) { nutrition.aiDrafts.mealText = ''; saveNS(NS.nutrition, nutrition); }
  renderToday(); paintNutrition(); toast(editId ? 'Meal updated' : 'Meal logged'); return true;
}
function confirmMealPreview() {
  if (!mealPreview) return;
  checkLocalDay();
  let date = mealPreview.date;
  if (!editingMealId && dateBeingLogged === calendarDay && date !== localDateStr()) date = localDateStr();
  // A preview analyzed before midnight follows today's default destination on confirmation.
  if (!editingMealId && !historicalLogging) date = localDateStr();
  logNutritionMeal(mealPreview.meal, mealPreview.responseId, date, editingMealId);
}
function logPlanMeal(id, index) {
  const entry = aiEntry(id); if (!entry || !entry.result.meals[index]) return;
  const nowFingerprint = contextFingerprint(buildNutritionContext(entry.originalMeal || null));
  if (entry.nutritionStateHash !== nowFingerprint.nutritionStateHash || entry.contextHash !== nowFingerprint.contextHash) { setNutritionMessage('Your context has changed. Generate an updated suggestion before logging this meal.'); return; }
  logNutritionMeal(entry.result.meals[index], entry.id + '-' + index);
}
function reviewPlanMeal(id, index) {
  const entry = aiEntry(id); if (!entry?.result.meals[index]) return;
  mealPreview = { meal: JSON.parse(JSON.stringify(entry.result.meals[index])), original: JSON.parse(JSON.stringify(entry.result.meals[index])), responseId: entry.id + '-' + index, origin: 'plan', date: localDateStr() };
  editingMealId = null; showScreen('eat');
}
function duplicateNutritionMeal(id) {
  const old = nutrition.meals.find(m => m.id === id); if (!old) return;
  const now = new Date(); nutrition.meals.push({ ...JSON.parse(JSON.stringify(old)), id: uid(), ts: now.getTime(), date: localDateStr(now), time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), aiResponseId: null });
  saveNS(NS.nutrition, nutrition); nutritionMessage = ''; renderToday(); paintNutrition(); toast('Duplicated to today');
}
function editNutritionMeal(id) {
  const old = nutrition.meals.find(m => m.id === id); if (!old) return;
  const item = { name: old.name, quantity: 1, unit: 'meal', estimatedGrams: null, calories: old.calories, protein: old.protein, carbs: old.carbs, fat: old.fat, confidence: 'medium', assumption: 'Existing historical meal; original aggregate nutrition retained.' };
  const meal = { mealName: old.name, items: old.items ? JSON.parse(JSON.stringify(old.items)) : [item], reason: '', suggestedTime: old.time || '', estimatedCostPkr: old.estimatedCostPkr ?? null, costAssumption: '' };
  editingMealId = id; mealPreview = { meal, original: JSON.parse(JSON.stringify(meal)), responseId: null, origin: 'history', date: old.date }; renderEat(); showAdjustMeal();
}
function showAdjustMeal() {
  if (!mealPreview) return;
  const m = mealPreview.meal;
  showModal(`<h3>Adjust estimate</h3><label class="field">Meal name<input id="adjustMealName" class="detail-input" value="${esc(m.mealName)}"></label>${m.items.map((item, i) => `<div class="estimate-adjust"><strong>${esc(item.name)}</strong><div class="row"><label class="field">Quantity (0 = omit)<input id="adjustQty${i}" class="detail-input" type="number" min="0" max="10000" step="0.1" value="${item.quantity}"></label><div class="field"><label>Unit</label><div class="detail-input">${esc(item.unit)}</div></div></div><details><summary>Correct nutrition for this shown portion</summary><div class="grid">${N.MACROS.map(macro => `<label class="field">${macro}<input class="detail-input" data-macro-index="${i}" data-macro="${macro}" type="number" min="0" step="0.1" value="${item[macro]}"></label>`).join('')}</div><label class="warm-row"><input id="exactLabel${i}" type="checkbox"> These are exact packaged-label values I supplied</label><p class="small">Nutrition edits are remembered locally for this food and compatible unit. Portion changes alone do not create a new food fact.</p></details></div>`).join('')}<button class="primary wide" data-nutrition-action="save-adjust">Use adjusted estimate</button>`);
}
function saveAdjustedMeal() {
  if (!mealPreview) return;
  try {
    const before = mealPreview.meal, corrections = [];
    const items = before.items.map((item, i) => {
      const rawQuantity=document.getElementById('adjustQty' + i).value;
      if(!rawQuantity.trim())throw new Error('Enter a quantity, or 0 to omit an item.');
      const quantity = Number(rawQuantity);
      if(quantity===0)return null;
      const scaled = N.scaleItem(item, quantity);
      let changed = false;
      N.MACROS.forEach(m => {
        const raw = document.querySelector(`[data-macro-index="${i}"][data-macro="${m}"]`).value;
        const value = Number(raw);
        if (!raw.trim() || !Number.isFinite(value) || value < 0 || value > 20000) throw new Error('Use finite non-negative nutrition values.');
        // Untouched macro fields scale with quantity; edits represent the new shown portion.
        if (value !== item[m]) { changed = true; scaled[m] = value; }
      });
      const exact = document.getElementById('exactLabel' + i).checked;
      if (changed || exact) corrections.push({ name: item.name, unit: item.unit, basisQty: quantity, ...Object.fromEntries(N.MACROS.map(m => [m, scaled[m]])), source: exact ? 'label' : 'user-correction', updatedAt: Date.now() });
      if (changed) scaled.assumption = 'Nutrition adjusted by you for this portion.';
      if (exact) { scaled.confidence = 'high'; scaled.assumption = 'Exact packaged label supplied by you.'; }
      return scaled;
    }).filter(Boolean);
    const meal = { ...before, mealName: document.getElementById('adjustMealName').value.trim() || before.mealName, items };
    N.validateMeal(meal);
    const previousCorrections = nutrition.foodCorrections;
    const next = [...previousCorrections];
    corrections.forEach(c => { const i = next.findIndex(f => N.key(f.name) === N.key(c.name) && N.unit(f.unit)[0] === N.unit(c.unit)[0]); if (i >= 0) next[i] = c; else next.unshift(c); });
    nutrition.foodCorrections = next.slice(0, 100); mealPreview.meal = meal;
    saveNS(NS.nutrition, nutrition); closeModal(); renderEat();
  } catch (e) { toast(e.message); }
}
function scaleMealPreview(factor) {
  if (!mealPreview || factor === 1) return;
  try { mealPreview.meal.items = mealPreview.meal.items.map(i => N.scaleItem(i, i.quantity * factor)); renderEat(); } catch (e) { toast(e.message); }
}
function swapMeal(id, index) {
  const entry = aiEntry(id), meal = entry?.result.meals[index]; if (!meal) return;
  showModal(`<h3>Swap ${esc(meal.mealName)}</h3><label class="field">What should change?<select id="swapPreference" class="detail-input">${['Cheaper', 'More protein', 'Less volume', 'More carbs', 'Lower fat', 'Easier digestion', 'Vegetarian', 'Different Pakistani food'].map(v => `<option>${v}</option>`).join('')}</select></label><button class="primary wide" data-nutrition-action="confirm-swap" data-id="${id}" data-index="${index}" ${aiBusy ? 'disabled' : ''}>Generate one replacement</button>`);
}

function nutritionSettingsHtml() {
  syncNutritionTargets();
  const p = nutritionProfile(), weight = nutritionWeight(), estimate = targetEstimate(), auto = settings.nutritionTargetMode === 'auto';
  const input = (id, label, value, type = 'text', attrs = '') => `<label class="field">${label}<input id="${id}" class="detail-input" type="${type}" value="${esc(value ?? '')}" ${attrs}></label>`;
  const area = (id, label, value) => `<label class="field">${label}<textarea id="${id}" class="detail-input" maxlength="600">${esc(value)}</textarea></label>`;
  const select = (id, label, value, options) => `<label class="field">${label}<select id="${id}" class="detail-input">${options.map(([v, text]) => `<option value="${v}" ${String(v) === String(value) ? 'selected' : ''}>${text}</option>`).join('')}</select></label>`;
  const missing = !p.age || !p.heightCm || !['male', 'female'].includes(p.sex) || !weight.kg;
  return `<div class="section-title"><h2>Nutrition profile</h2><span>${missing ? 'Setup incomplete' : 'Ready'}</span></div><div class="card settings-card"><h3>Current weight: ${weight.kg ? round1(weight.kg) + ' kg' : 'not logged'}</h3><p class="small">Source: ${esc(weight.source)}${weight.date ? ' · ' + (weight.date === localDateStr() ? 'today' : esc(weight.date)) : ' · add a Progress weight to use it automatically'}</p>${weight.source !== 'Progress' ? input('npWeight', 'Weight fallback (kg, only if Progress has none)', p.fallbackWeightKg, 'number', 'min="1" max="700" step="0.1"') : ''}<div class="grid">${select('npSex', 'Sex used by the energy formula', p.sex, [['', 'Select'], ['male', 'Male'], ['female', 'Female'], ['unspecified', 'Prefer not to specify (custom calories)']])}${input('npAge', 'Age', p.age, 'number', 'min="18" max="100"')}${input('npHeight', 'Height (cm)', p.heightCm, 'number', 'min="100" max="250"')}${select('npGoal', 'Goal', p.goal, [['fat-loss', 'Fat loss'], ['maintenance', 'Maintenance / recomposition'], ['lean-gain', 'Lean gain']])}</div><details ${missing ? 'open' : ''}><summary>Activity, meals & preferences</summary>${select('npActivity', 'General activity', p.activityLevel, [['sedentary', 'Mostly seated'], ['light', 'Light activity'], ['moderate', 'Moderate activity'], ['high', 'High activity'], ['very-high', 'Very high activity'], ['custom', 'Custom multiplier']])}${input('npMultiplier', 'Activity multiplier (configurable)', p.activityMultiplier, 'number', 'min="1.1" max="2.5" step="0.025"')}${input('npTraining', 'Training sessions per week', p.trainingFrequency, 'number', 'min="0" max="7"')}${input('npMeals', 'Preferred meals per day', p.preferredMeals, 'number', 'min="1" max="6"')}<div class="row">${input('npBedtime', 'Typical bedtime', p.bedtime, 'time')}${input('npWorkout', 'Usual workout time (optional)', p.workoutTime, 'time')}</div>${input('npLocation', 'Food location context', p.location)}${area('npDiet', 'Dietary preferences', p.dietaryPreferences)}${area('npAvoid', 'Foods avoided', p.foodsAvoided)}${area('npAllergies', 'Allergies, if any', p.allergies)}${area('npTriggers', 'Known GI / reflux food triggers', p.giTriggers)}${area('npGI', 'GI / reflux considerations', p.giConsiderations)}</details><details><summary>AI Budget Planning preferences</summary>${select('npBudget', 'Budget preference', p.budgetPreference, [['economical', 'Economical'], ['moderate', 'Moderate'], ['flexible', 'Flexible']])}${input('npDailyBudget', 'Optional daily budget (PKR)', p.dailyBudgetPkr, 'number', 'min="0"')}${input('npMonthlyBudget', 'Optional monthly food budget (PKR)', p.monthlyBudgetPkr, 'number', 'min="0"')}<p class="small">A daily preference takes priority; otherwise the monthly budget is divided by calendar days. AI costs are estimates, never verified live market prices.</p></details></div><div class="section-title"><h2>Nutrition targets</h2><span>${auto ? 'Auto targets' : 'Custom targets · preserved'}</span></div><div class="card settings-card">${select('npTargetMode', 'Target mode', settings.nutritionTargetMode, [['custom', 'Custom targets'], ['auto', 'Auto targets']])}${auto && !estimate.ready && settings.nutritionOverrides.calories===null?'<p class="notice info">Auto calories await complete formula inputs. Your current stored calorie target is retained until then.</p>':''}<div class="nutrition-target-estimate"><div><span>Estimated maintenance</span><strong>${estimate.maintenance === null ? 'Complete profile' : estimate.maintenance + ' kcal'}</strong></div><div><span>Current target</span><strong>${settings.calorieTarget} kcal</strong></div><div><span>Goal adjustment</span><strong>${estimate.adjustment >= 0 ? '+' : ''}${estimate.adjustment} kcal</strong></div></div><div id="customTargetsFields" ${auto ? 'hidden' : ''}><div class="grid">${input('stCal', 'Custom calories', settings.calorieTarget, 'number', 'min="0" max="15000"')}${input('stPro', 'Custom protein (g)', settings.proteinTarget, 'number', 'min="0" max="1000"')}${input('stCarb', 'Custom carbs (g)', settings.carbTarget, 'number', 'min="0" max="3000"')}${input('stFat', 'Custom fat (g)', settings.fatTarget, 'number', 'min="0" max="1000"')}</div></div><div id="autoTargetsFields" ${auto ? '' : 'hidden'}>${input('npCalorieOverride', 'Calorie target override (blank = auto)', settings.nutritionOverrides.calories, 'number', 'min="0" max="15000"')}${input('npProteinOverride', 'Protein target override (blank = auto)', settings.nutritionOverrides.protein, 'number', 'min="0" max="1000"')}${select('npGkg', 'Protein rule', p.proteinPerKg ?? '', [['', 'Goal / budget based (1.6 or 1.8 g/kg)'], ['1.6', '1.6 g/kg'], ['1.8', '1.8 g/kg'], ['2', '2.0 g/kg']])}${input('npAdjustment', 'Goal adjustment override (kcal, optional)', p.goalAdjustment, 'number', 'min="-800" max="800"')}</div><p><strong>Protein target: ${settings.proteinTarget} g/day</strong></p><p class="small">${auto && settings.nutritionOverrides.protein === null && weight.kg ? `Based on ${weight.kg} kg × ${estimate.rate} g/kg = ${estimate.autoProtein} g. Height is not used in protein arithmetic.` : 'Custom target is kept until you explicitly switch to Auto (or clear an Auto override).'}</p><details><summary>How automatic targets work</summary><p class="small">Mifflin–St Jeor: 10 × kg + 6.25 × cm − 5 × age + 5 (male) or −161 (female). Multiply by activity, then apply the goal adjustment. Default adjustment: −300 fat loss, 0 maintenance, +200 lean gain; calories round to 25 kcal. These are starting estimates to calibrate against your trend.</p><p class="small">Protein defaults to 1.6 g/kg, or 1.8 during fat loss with a moderate/flexible budget. Economical preference keeps 1.6; you may choose 1.6–2.0 or a practical override. Auto fat starts at 25% of calories, with carbs filling the remainder. The fat-loss adjustment and allocation are app planning rules, not an individually measured requirement.</p><p class="small"><a href="https://pubmed.ncbi.nlm.nih.gov/2305711/" target="_blank" rel="noopener noreferrer">Energy equation</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/28698222/" target="_blank" rel="noopener noreferrer">Protein evidence</a></p></details><button class="primary wide" data-nutrition-action="save-profile">Save profile & targets</button><p class="small">Existing targets remain Custom after migration. Auto overrides stay pinned when weight changes. AI receives relevant profile and day context only when you request it; it never calculates these targets.</p></div><div class="card settings-card"><h3>Learned nutrition corrections</h3><p class="small">${nutrition.foodCorrections.length} local correction(s). Adjust an AI estimate or supply exact packaged-label values in its Adjust panel. No food database setup is required.</p><button class="secondary" data-nutrition-action="reset-memory">Forget learned corrections & AI cache</button></div>`;
}
function updateTargetModeFields() {
  const auto = document.getElementById('npTargetMode').value === 'auto';
  document.getElementById('customTargetsFields').hidden = auto; document.getElementById('autoTargetsFields').hidden = !auto;
}
function saveNutritionProfile() {
  try {
    const get = id => document.getElementById(id)?.value;
    const optional = (id, fallback = null) => { const raw = get(id); if (raw === undefined) return fallback; if (!raw.trim()) return null; const n = Number(raw); if (!Number.isFinite(n)) throw new Error('Use a valid number for ' + id); return n; };
    const previous = nutritionProfile();
    const p = { ...previous, sex: get('npSex'), age: optional('npAge'), heightCm: optional('npHeight'), fallbackWeightKg: optional('npWeight', previous.fallbackWeightKg), goal: get('npGoal'), activityLevel: get('npActivity'), activityMultiplier: optional('npMultiplier'), trainingFrequency: optional('npTraining'), preferredMeals: optional('npMeals'), bedtime: get('npBedtime'), workoutTime: get('npWorkout'), location: get('npLocation'), dietaryPreferences: get('npDiet'), foodsAvoided: get('npAvoid'), allergies: get('npAllergies'), giTriggers: get('npTriggers'), giConsiderations: get('npGI'), budgetPreference: get('npBudget'), dailyBudgetPkr: optional('npDailyBudget'), monthlyBudgetPkr: optional('npMonthlyBudget'), proteinPerKg: optional('npGkg'), goalAdjustment: optional('npAdjustment') };
    N.validateProfile(p);
    const mode = get('npTargetMode');
    const overrides = { calories: optional('npCalorieOverride'), protein: optional('npProteinOverride') };
    const next = { ...settings, nutritionProfile: p, nutritionTargetMode: mode, nutritionOverrides: overrides, bedtime: p.bedtime };
    if (mode === 'custom') for (const [field, id] of [['calorieTarget', 'stCal'], ['proteinTarget', 'stPro'], ['carbTarget', 'stCarb'], ['fatTarget', 'stFat']]) { const value = optional(id); if (value === null || value < 0) throw new Error('Enter non-negative custom targets.'); next[field] = value; }
    N.validateStorage({ schemaVersion: 4, nutrition, settings: next });
    settings = next; saveNS(NS.settings, settings); syncNutritionTargets(); renderSettings(); renderToday(); nutritionMessage = ''; toast('Nutrition profile saved');
  } catch (e) { toast(e.message); }
}
function saveRecoverySettings() {
  const steps = Number(document.getElementById('stSteps').value), hydration = Number(document.getElementById('stHydration').value), raw = document.getElementById('stGoalWeight').value;
  if (!Number.isFinite(steps) || steps < 0 || !Number.isFinite(hydration) || hydration < 0 || (raw && (!Number.isFinite(Number(raw)) || Number(raw) <= 0))) { toast('Use valid non-negative recovery targets'); return; }
  settings.stepTarget = steps; settings.hydrationTargetMl = hydration; settings.goalWeightKg = raw ? Number(raw) : null;
  saveNS(NS.settings, settings); renderToday(); toast('Recovery settings saved');
}
async function nutritionClick(event) {
  const button = event.target.closest('[data-nutrition-action]'); if (!button || button.disabled) return;
  const action = button.dataset.nutritionAction, id = button.dataset.id, index = Number(button.dataset.index || 0);
  try {
    if (action === 'parse') await analyzeMealText();
    else if (action === 'daily-plan') await requestNutrition('generateDailyPlan', '', N.MODES[0], { refresh: true });
    else if (action === 'solve' || action === 'ask') { if (action === 'solve') { planMode = button.dataset.mode; settings.nutritionLastMode=planMode; saveNS(NS.settings,settings); } await requestNutrition('solveNextMeal', nutrition.aiDrafts.askText.trim(), planMode); }
    else if (action === 'refresh-next') await requestNutrition('solveNextMeal', nutrition.aiDrafts.askText.trim(), planMode,{refresh:true});
    else if (action === 'budget-plan') await requestNutrition('generateBudgetPlan', '', N.MODES[0]);
    else if (action === 'pacing-tips') await requestNutrition('generateProteinPacing', '', N.MODES[0]);
    else if (action === 'review-day') await requestNutrition('analyzeDay', '', N.MODES[0], { refresh: true });
    else if (action === 'log-plan') logPlanMeal(id, index);
    else if (action === 'review-plan') reviewPlanMeal(id, index);
    else if (action === 'confirm-log') confirmMealPreview();
    else if (action === 'adjust') showAdjustMeal();
    else if (action === 'save-adjust') saveAdjustedMeal();
    else if (action === 'portion') scaleMealPreview(Number(button.dataset.factor));
    else if (action === 'dismiss-preview') { mealPreview = null; editingMealId = null; nutrition.aiDrafts.mealText = ''; saveNS(NS.nutrition, nutrition); renderEat(); }
    else if (action === 'edit') editNutritionMeal(id);
    else if (action === 'duplicate') duplicateNutritionMeal(id);
    else if (action === 'delete' && confirm('Delete this meal log?')) { deleteMeal(id); renderToday(); paintNutrition(); }
    else if (action === 'save-profile') saveNutritionProfile();
    else if (action === 'swap') swapMeal(id, index);
    else if (action === 'confirm-swap') { const originalMeal = aiEntry(id)?.result.meals[index]; if (!originalMeal) return; const preference = document.getElementById('swapPreference').value; closeModal(); await requestNutrition('suggestSubstitution', preference, N.MODES[0], { originalMeal, refresh: true }); }
    else if (action === 'reset-memory' && confirm('Forget learned food corrections and AI results? Logged meals and legacy data stay intact.')) { nutrition.foodCorrections = []; nutrition.aiNutritionCache = []; saveNS(NS.nutrition, nutrition); renderSettings(); toast('Learned corrections cleared'); }
  } catch (e) { setNutritionMessage(e.message || 'Nutrition action failed. Nothing was logged.'); }
}
document.addEventListener('click', nutritionClick);
document.addEventListener('change', event => {
  if (event.target.id === 'npTargetMode') updateTargetModeFields();
  if (event.target.id === 'npMultiplier') document.getElementById('npActivity').value='custom';
  if (event.target.id === 'npActivity') { const value = { sedentary: 1.2, light: 1.375, moderate: 1.55, high: 1.725, 'very-high': 1.9 }[event.target.value]; if (value) document.getElementById('npMultiplier').value = value; }
});
const previousTodayRenderer = renderToday;
renderToday = function () { syncNutritionTargets(); previousTodayRenderer(); };
const previousBodyUpsert = upsertBodyRecord;
upsertBodyRecord = function (record) { previousBodyUpsert(record); syncNutritionTargets(); };
const previousImportPayload = importPayload;
importPayload = function (...args) {
  const preview = mealPreview, edit = editingMealId;
  mealPreview = null; editingMealId = null;
  try { const result = previousImportPayload(...args); aiPendingController?.abort(); syncNutritionTargets(); return result; }
  catch (e) { mealPreview = preview; editingMealId = edit; throw e; }
};
initializeNutritionAI(); syncNutritionTargets();
