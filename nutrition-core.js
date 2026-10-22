/* Pure nutrition arithmetic and schemas shared by the browser and server. No credentials. */
(function (root) {
  'use strict';
  const MACROS = ['calories', 'protein', 'carbs', 'fat'];
  const MODES = ['Fit Remaining Macros', 'Cheapest', 'Highest Protein', 'Low Effort', 'Pre Workout', 'Post Workout', 'GI Friendly'];
  const ACTIONS = ['parseMeal', 'generateDailyPlan', 'solveNextMeal', 'generateProteinPacing', 'suggestSubstitution', 'analyzeDay', 'generateBudgetPlan'];
  const PROFILE_DEFAULTS = {
    sex: '', age: null, heightCm: null, fallbackWeightKg: null, goal: 'maintenance',
    activityLevel: 'moderate', activityMultiplier: 1.55, trainingFrequency: 6,
    dietaryPreferences: 'Practical Pakistani foods', foodsAvoided: '', allergies: '',
    giTriggers: '', giConsiderations: 'Reflux / hiatal hernia considerations: manageable portions, individual tolerance and meal-to-training timing.',
    budgetPreference: 'moderate', dailyBudgetPkr: null, monthlyBudgetPkr: null,
    preferredMeals: 4, bedtime: '', workoutTime: '', location: 'Pakistan',
    goalAdjustment: null, proteinPerKg: null
  };
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const finite = (v, lo = 0, hi = Infinity) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
  const round = n => Math.round(n * 10) / 10;
  function fail(ok, name) { if (!ok) throw new Error('Invalid ' + name); }
  function text(v, name, max = 1200) { fail(typeof v === 'string' && v.length <= max, name); }
  function key(name) { return String(name).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
  function unit(u) {
    const n = key(u);
    if (['g', 'gram', 'grams'].includes(n)) return ['g', 1];
    if (['kg', 'kilogram', 'kilograms'].includes(n)) return ['g', 1000];
    if (['ml', 'millilitre', 'millilitres', 'milliliter', 'milliliters'].includes(n)) return ['ml', 1];
    if (['l', 'litre', 'liter', 'litres', 'liters'].includes(n)) return ['ml', 1000];
    if (['piece', 'pieces', 'egg', 'eggs', 'roti', 'rotis', 'naan', 'naans'].includes(n)) return ['piece', 1];
    return [n.replace(/s$/, ''), 1];
  }
  function sumItems(items) {
    return Object.fromEntries(MACROS.map(m => [m, round(items.reduce((n, i) => n + i[m], 0))]));
  }
  function scaleItem(item, quantity) {
    fail(finite(quantity, 0.01, 10000), 'portion quantity');
    const factor = quantity / item.quantity;
    const result = { ...item, quantity: round(quantity), estimatedGrams: item.estimatedGrams === null ? null : round(item.estimatedGrams * factor) };
    MACROS.forEach(m => result[m] = round(item[m] * factor));
    return result;
  }
  function latestWeight(records, fallback, date) {
    const record = records.filter(r => r.date <= date && finite(r.weightKg, 1, 700)).slice().sort((a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0))[0];
    return record ? { kg: record.weightKg, date: record.date, source: 'Progress' } : { kg: finite(fallback, 1, 700) ? fallback : null, date: null, source: 'Profile fallback' };
  }
  function targets(profile, weightKg, overrides = {}) {
    const p = { ...PROFILE_DEFAULTS, ...profile };
    const ready = ['male', 'female'].includes(p.sex) && finite(p.age, 18, 100) && finite(p.heightCm, 100, 250) && finite(weightKg, 1, 700);
    const bmr = ready ? 10 * weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161) : null;
    const maintenance = bmr === null ? null : Math.round(bmr * p.activityMultiplier);
    const adjustment = p.goalAdjustment ?? (p.goal === 'fat-loss' ? -300 : p.goal === 'lean-gain' ? 200 : 0);
    const rate = p.proteinPerKg ?? (p.goal === 'fat-loss' && p.budgetPreference !== 'economical' ? 1.8 : 1.6);
    const autoCalories = maintenance === null ? null : Math.max(0, Math.round((maintenance + adjustment) / 25) * 25);
    const autoProtein = finite(weightKg, 1, 700) ? Math.round(weightKg * rate) : null;
    const calories = overrides.calories ?? autoCalories;
    const protein = overrides.protein ?? autoProtein;
    const fat = calories === null ? null : Math.round(calories * 0.25 / 9);
    const carbs = calories === null || protein === null ? null : Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
    return { bmr, maintenance, adjustment, rate, autoCalories, autoProtein, calories, protein, carbs, fat, ready };
  }
  function pacing({ target, consumed, meals, preferredMeals = 4, now, bedtime = '23:00' }) {
    const remaining = Math.max(0, round(target - consumed));
    const groups = [];
    meals.slice().sort((a, b) => a.ts - b.ts).forEach(meal => {
      if (!groups.length || meal.ts - groups.at(-1) > 45 * 60000) groups.push(meal.ts);
    });
    const minutes = now.getHours() * 60 + now.getMinutes();
    const [h, m] = (bedtime || '23:00').split(':').map(Number);
    let bed = h * 60 + m;
    if (bed < 12 * 60 && minutes >= 12 * 60) bed += 24 * 60;
    const timeSlots = bed < minutes ? 0 : Math.max(1, Math.ceil((bed - minutes) / 120));
    const count = Math.max(0, Math.min(6, preferredMeals - groups.length, timeSlots));
    const proteinWindows = remaining > 0 ? Math.min(count, Math.max(1, Math.floor(remaining / 15))) : 0;
    const weights = Array.from({ length: proteinWindows }, (_, i) => Math.max(0.8, 1.1 - i * 0.1));
    const total = weights.reduce((a, b) => a + b, 0);
    let allocated = 0;
    const windows = weights.map((weight, i) => {
      const grams = i === proteinWindows - 1 ? round(remaining - allocated) : Math.round(remaining * weight / total);
      allocated += grams;
      const at = Math.round(minutes + i * Math.max(60, (bed - minutes) / Math.max(1, proteinWindows)));
      return { label: i === 0 ? 'Next meal' : i === proteinWindows - 1 ? 'Later / evening' : 'Following meal', protein: grams, time: String(Math.floor(at / 60) % 24).padStart(2, '0') + ':' + String(at % 60).padStart(2, '0') };
    });
    return { target, consumed, remaining, mealsLogged: groups.length, mealsRemaining: count, windows };
  }
  function budget(profile, now) {
    const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return { preference: profile.budgetPreference, dailyPkr: profile.dailyBudgetPkr ?? (profile.monthlyBudgetPkr !== null ? Math.round(profile.monthlyBudgetPkr / days) : null), monthlyPkr: profile.monthlyBudgetPkr, source: profile.dailyBudgetPkr !== null ? 'daily preference' : profile.monthlyBudgetPkr !== null ? 'monthly budget / calendar days' : 'general preference' };
  }
  function stable(value) {
    if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
    if (object(value)) return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
    return JSON.stringify(value);
  }
  function hash(value) {
    const str = stable(value); let a = 2166136261;
    for (let i = 0; i < str.length; i++) { a ^= str.charCodeAt(i); a = Math.imul(a, 16777619); }
    return (a >>> 0).toString(16);
  }
  function validateProfile(p) {
    fail(object(p), 'nutritionProfile');
    fail(['', 'male', 'female', 'unspecified'].includes(p.sex), 'profile.sex');
    fail(['fat-loss', 'maintenance', 'lean-gain'].includes(p.goal), 'profile.goal');
    for (const field of ['age', 'heightCm', 'fallbackWeightKg', 'dailyBudgetPkr', 'monthlyBudgetPkr', 'proteinPerKg']) if (p[field] !== null) fail(finite(p[field]), 'profile.' + field);
    if (p.age !== null) fail(finite(p.age, 18, 100), 'profile.age (adult calculator: 18–100)');
    if (p.heightCm !== null) fail(finite(p.heightCm, 100, 250), 'profile.heightCm');
    if (p.fallbackWeightKg !== null) fail(finite(p.fallbackWeightKg, 1, 700), 'profile.weight');
    if (p.proteinPerKg !== null) fail(finite(p.proteinPerKg, 1.6, 2.0), 'profile.proteinPerKg');
    if (p.goalAdjustment !== null) fail(finite(p.goalAdjustment, -800, 800), 'profile.goalAdjustment');
    fail(finite(p.activityMultiplier, 1.1, 2.5), 'profile.activityMultiplier');
    fail(Number.isInteger(p.trainingFrequency) && finite(p.trainingFrequency, 0, 7), 'profile.trainingFrequency');
    fail(Number.isInteger(p.preferredMeals) && finite(p.preferredMeals, 1, 6), 'profile.preferredMeals');
    fail(['economical', 'moderate', 'flexible'].includes(p.budgetPreference), 'profile.budgetPreference');
    for (const field of ['activityLevel', 'dietaryPreferences', 'foodsAvoided', 'allergies', 'giTriggers', 'giConsiderations', 'location']) text(p[field], 'profile.' + field, 600);
    for (const field of ['bedtime', 'workoutTime']) fail(p[field] === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(p[field]), 'profile.' + field);
    return p;
  }
  const string = max => ({ type: 'string', maxLength: max });
  const number = max => ({ type: 'number', minimum: 0, maximum: max });
  const nullableNumber = max => ({ anyOf: [number(max), { type: 'null' }] });
  const itemSchema = {
    type: 'object', additionalProperties: false,
    properties: { name: string(160), quantity: { type: 'number', minimum: 0.01, maximum: 10000 }, unit: string(40), estimatedGrams: nullableNumber(20000), calories: { ...number(20000), description: 'kcal for the entire stated quantity, not per unit or per 100g' }, protein: { ...number(2000), description: 'protein grams for the entire stated quantity' }, carbs: { ...number(3000), description: 'carbohydrate grams for the entire stated quantity' }, fat: { ...number(2000), description: 'fat grams for the entire stated quantity' }, confidence: { type: 'string', enum: ['high', 'medium', 'low'] }, assumption: string(500) }
  };
  itemSchema.required = Object.keys(itemSchema.properties);
  const mealSchema = {
    type: 'object', additionalProperties: false,
    properties: { mealName: string(160), items: { type: 'array', minItems: 1, maxItems: 20, items: itemSchema }, reason: string(500), suggestedTime: string(60), estimatedCostPkr: nullableNumber(1000000), costAssumption: string(300) }
  };
  mealSchema.required = Object.keys(mealSchema.properties);
  function responseSchema(action) {
    const count = ['analyzeDay', 'generateProteinPacing'].includes(action) ? 0 : ['parseMeal', 'solveNextMeal', 'suggestSubstitution'].includes(action) ? 1 : 6;
    return { type: 'object', additionalProperties: false, properties: {
      status: { type: 'string', enum: ['ready', 'needs_clarification'] }, question: string(400),
      meals: { type: 'array', minItems: 0, maxItems: count, items: mealSchema }, summary: string(500), tips: { type: 'array', minItems: 0, maxItems: 3, items: string(300) }
    }, required: ['status', 'question', 'meals', 'summary', 'tips'] };
  }
  function validateSchema(v, schema, name = 'response') {
    if (schema.anyOf) { fail(schema.anyOf.some(s => { try { validateSchema(v, s, name); return true; } catch (_) { return false; } }), name); return; }
    if (schema.type === 'null') { fail(v === null, name); return; }
    if (schema.type === 'object') {
      fail(object(v), name); fail(Object.keys(v).every(k => k in schema.properties), name + '.unexpectedField');
      schema.required.forEach(k => fail(k in v, name + '.' + k));
      Object.entries(v).forEach(([k, value]) => validateSchema(value, schema.properties[k], name + '.' + k));
    } else if (schema.type === 'array') {
      fail(Array.isArray(v) && v.length >= schema.minItems && v.length <= schema.maxItems, name);
      v.forEach((x, i) => validateSchema(x, schema.items, name + '[' + i + ']'));
    } else if (schema.type === 'string') {
      text(v, name, schema.maxLength || 1200); if (schema.enum) fail(schema.enum.includes(v), name);
    } else if (schema.type === 'number') fail(finite(v, schema.minimum, schema.maximum), name);
  }
  function validateMeal(meal) {
    validateSchema(meal, mealSchema, 'meal'); fail(meal.mealName.trim().length > 0, 'meal.name');
    meal.items.forEach(i => fail(i.name.trim() && i.unit.trim(), 'item.name/unit'));
    fail(sumItems(meal.items).calories > 0, 'meal nutrition estimate'); return meal;
  }
  function validateResponse(result, action) {
    fail(ACTIONS.includes(action), 'action'); validateSchema(result, responseSchema(action));
    if (result.status === 'needs_clarification') { fail(result.question.trim().length > 0 && result.meals.length === 0, 'clarification'); return result; }
    if (!['analyzeDay', 'generateProteinPacing'].includes(action)) fail(result.meals.length > 0, 'meal list');
    result.meals.forEach(validateMeal); return result;
  }
  function rejectSecrets(value) {
    if (Array.isArray(value)) value.forEach(rejectSecrets);
    else if (object(value)) Object.entries(value).forEach(([k, v]) => { fail(!/^(?:[a-z]+_API_KEY|apiKey|api_key|authorization|secret)$/i.test(k), 'secret field'); rejectSecrets(v); });
  }
  function migrateState(data) {
    const n = data.nutrition, s = data.settings;
    if (s.aiNutritionVersion !== 1) {
      s.nutritionProfile = { ...PROFILE_DEFAULTS, bedtime: s.bedtime || '', ...s.nutritionProfile };
      s.nutritionTargetMode = s.nutritionTargetMode || 'custom';
      s.nutritionOverrides = s.nutritionOverrides || { calories: null, protein: null };
      n.aiNutritionCache = n.aiNutritionCache || []; n.foodCorrections = n.foodCorrections || [];
      n.aiDrafts = n.aiDrafts || { mealText: '', askText: '' }; s.aiNutritionVersion = 1;
    }
    return data;
  }
  function validateStorage(data) {
    rejectSecrets(data);
    const n = data.nutrition, s = data.settings;
    if (data.schemaVersion === 4 || s.aiNutritionVersion !== undefined) {
      fail(s.aiNutritionVersion === 1, 'AI nutrition version'); validateProfile(s.nutritionProfile);
      fail(['auto', 'custom'].includes(s.nutritionTargetMode), 'nutritionTargetMode');
      if(s.nutritionLastMode!==undefined)fail(MODES.includes(s.nutritionLastMode),'nutritionLastMode');
      fail(object(s.nutritionOverrides), 'nutritionOverrides');
      for (const field of ['calories', 'protein']) fail(s.nutritionOverrides[field] === null || finite(s.nutritionOverrides[field], 0, field === 'calories' ? 15000 : 1000), 'override.' + field);
      fail(Array.isArray(n.aiNutritionCache) && n.aiNutritionCache.length <= 8, 'aiNutritionCache');
      n.aiNutritionCache.forEach(c => {
        fail(object(c) && ACTIONS.includes(c.action) && finite(c.createdAt), 'AI cache entry');
        fail(/^[a-z0-9_-]{1,160}$/i.test(c.id), 'cache.id');
        if(c.originalMeal !== undefined)validateMeal(c.originalMeal);
        for (const field of ['id', 'cacheKey', 'nutritionStateHash', 'contextHash', 'input', 'mode']) text(c[field], 'cache.' + field, field === 'input' ? 1800 : 200);
        validateResponse(c.result, c.action);
      });
      fail(Array.isArray(n.foodCorrections) && n.foodCorrections.length <= 100, 'foodCorrections');
      n.foodCorrections.forEach(c => {
        fail(object(c), 'correction'); text(c.name, 'correction.name', 160); text(c.unit, 'correction.unit', 40);
        fail(finite(c.basisQty, 0.01, 10000) && finite(c.updatedAt), 'correction.basis');
        MACROS.forEach(m => fail(finite(c[m], 0, 20000), 'correction.' + m));
        fail(['user-correction', 'label'].includes(c.source), 'correction.source');
      });
      fail(object(n.aiDrafts), 'nutrition drafts'); for (const field of ['mealText', 'askText']) text(n.aiDrafts[field], 'draft.' + field, 1800);
      n.meals.forEach(m => { if (m.items !== undefined) { fail(Array.isArray(m.items) && m.items.length <= 20 && m.items.length > 0, 'logged meal.items'); m.items.forEach(i => validateSchema(i, itemSchema, 'logged item')); } });
    }
    return data;
  }
  function applyFacts(meal, facts) {
    return { ...meal, items: meal.items.map(item => {
      const fact = facts.find(f => key(f.name) === key(item.name) && unit(f.unit)[0] === unit(item.unit)[0]);
      if (!fact) return { ...item };
      const factor = item.quantity * unit(item.unit)[1] / (fact.basisQty * unit(fact.unit)[1]);
      return { ...item, ...Object.fromEntries(MACROS.map(m => [m, round(fact[m] * factor)])), confidence: fact.source === 'label' ? 'high' : item.confidence, assumption: ((fact.source === 'label' ? 'Uses your supplied packaged label.' : 'Uses your previous local correction.') + (item.assumption && !/^Uses your (supplied|previous)/.test(item.assumption) ? ' ' + item.assumption : '')).slice(0, 500) };
    }) };
  }
  const api = { MACROS, MODES, ACTIONS, PROFILE_DEFAULTS, sumItems, scaleItem, latestWeight, targets, pacing, budget, stable, hash, key, unit, validateProfile, responseSchema, validateMeal, validateResponse, validateStorage, rejectSecrets, migrateState, applyFacts };
  root.NutritionCore = api; if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
