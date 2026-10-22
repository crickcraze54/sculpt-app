# Sculpt 4 — AI-first nutrition implementation

Implemented in the existing vanilla PWA. The training program, Mobility, Progress, rest-timer implementation and source content are retained. No build step was introduced.

## Files changed

- `app.js`: removed the old Saved Food/Saved Meal logger, food manager, pricing UI, deterministic solver UI and old parser workflow. Retained local historical logs and recovery controls; integrated nutrition settings.
- `core.js`: retained training and backup validation; removed obsolete food-solver scoring; accepts validated schema 4 nutrition.
- `storage.js`: additive AI nutrition migration and schema 4 export/import through the existing validated transactional restore.
- `index.html`: loads the local nutrition modules and styles.
- `upgrade.js`: removed obsolete Eat/Plan wrappers and updated About/privacy wording. Training execution logic is unchanged.
- `service-worker.js`: new versioned shell including the local nutrition files; API requests remain uncached.
- `api/nutrition-parse.js`: compatibility route to the unified nutrition handler. Obsolete `{text}` requests receive an explicit upgrade/reload response.
- `package.json`, `package-lock.json`: version 4.0.0, official server-side Google SDK and live-test command.
- `README.md`: setup, privacy, arithmetic, migration and test instructions.
- `tests/regression.cjs`, `tests/acceptance.cjs`, `tests/flows.cjs`, `tests/run.cjs`, `tests/service-worker.cjs`, `tests/static-checks.cjs`: updated nutrition expectations while retaining training/data-integrity regressions.

`manifest.webmanifest`, `theme.css`, `tests/training-flows.cjs`, `program-data.js`, `program-source.md` and training-source Markdown were not changed by this nutrition task. The immutable sibling rollback, original ZIP and Macro Tracker source were not modified.

## Files added

- `nutrition-core.js`: shared pure arithmetic, profile/schema validation, migrations, local fact matching and cache hashing.
- `nutrition.js`: AI-first Eat/Plan/profile UI, requests, drafts, confirmations, adjustments, logging, caching and context integration.
- `nutrition.css`: nutrition components using the existing theme and safe-area design.
- `lib/nutrition-service.cjs`: single server-side Gemini service, action/strategy instructions, request sanitization, structured output, validation and safe errors.
- `api/nutrition-ai.js`: unified serverless endpoint.
- `scripts/live-nutrition-smoke.cjs`: real provider/deployment smoke test, without mocked responses.
- `tests/nutrition-core.cjs`, `tests/nutrition-api.cjs`, `tests/nutrition-ui.cjs`, `tests/nutrition-fixtures.cjs`: arithmetic, contract, integration and explicitly synthetic provider fixtures.
- `NUTRITION_AI_REPORT.md`: this report.
- `verification/nutrition-tests.txt`, `verification/nutrition-live-smoke.txt`, `verification/nutrition-browser-check.txt`, `verification/nutrition-timezone-los-angeles.txt`, `verification/nutrition-service-worker-final.txt`, `verification/nutrition-static-final.txt`: verification evidence.

Additional implementation checkpoint: `checkpoints/pre-ai-nutrition/` contains the original `app.js`, `core.js`, `index.html`, `manifest.webmanifest`, `package.json`, `package-lock.json`, `service-worker.js`, `storage.js`, `theme.css`, `upgrade.js`, `api/nutrition-parse.js` and seven existing test files (`acceptance`, `flows`, `regression`, `run`, `service-worker`, `static-checks`, `training-flows`, all `.cjs`). Git was unavailable in this working directory; no Git commit was possible. Dependency installation also creates ignored `node_modules/`.

## Old UI removed

Saved Food dropdowns, Saved Meals management, Food Pricing/Save Price, manual serving database setup, local food-candidate solver and the old pricing/solver/protein tab structure are removed from the normal Eat, Plan and Settings experience. Existing saved records remain in storage and portable backups. The new screens do not depend on those records.

## Gemini integration

- Model: `gemini-3.8-flash`, centralized in `lib/nutrition-service.cjs`. No silent fallback.
- Environment variable: `GEMINI_API_KEY`, server-side only.
- Official SDK: `@google/genai`, pinned to 1.19.0. This version was available in the local package cache and supports `responseJsonSchema` and `abortSignal`; restricted registry DNS prevented downloading the current package. The SDK is not loaded by the browser or offline shell.
- Main route: `POST /api/nutrition-ai` with `{action,input,mode,context}`.
- Compatibility route: `/api/nutrition-parse`.
- Actions: `parseMeal`, `generateDailyPlan`, `solveNextMeal`, `generateProteinPacing`, `suggestSubstitution`, `analyzeDay`, `generateBudgetPlan`.
- Seven distinct server-owned strategies: Fit Remaining Macros, Cheapest, Highest Protein, Low Effort, Pre Workout, Post Workout and GI Friendly. They generate food with Gemini; they do not rank a fixed local database.

Responses use an explicit JSON schema with individual item portions, nutrition, confidence and assumptions. JavaScript sums all item nutrition. Invalid structured responses receive one correction attempt, then an error; no malformed result is logged. Supplied compatible packaged-label facts and local corrections override estimated values. Costs are optional and visibly labeled estimates rather than verified market prices.

Server context includes profile, newest Progress weight, real consumed and remaining macros, logged meals, local date/time, feeding allocations, today's active/completed workout, weekly schedule, block, deficit flag, planned workout time, preferences, triggers and general budget. Remaining macros, pacing and budget arithmetic are recomputed on the server rather than trusting submitted remaining totals. The client cannot replace the server's system instruction.

Errors distinguish offline/network problems, missing key, quota/rate limits, access configuration, model unavailable, provider unavailable and invalid output. Typed input survives failures. No credentials or raw provider errors are logged or returned. The old OpenAI integration is removed from active API code.

## Automatic targets

Existing calorie and all macro targets migrate unchanged as **Custom**. Auto requires an explicit selection.

Mifflin–St Jeor BMR: `10 × weightKg + 6.25 × heightCm − 5 × age + 5` for male or `−161` for female. Multiply by the configurable activity factor. Default goal adjustment is −300 kcal for fat loss, 0 for maintenance/recomposition, +200 for lean gain. Round the resulting calorie target to 25 kcal. A manual final calorie override remains pinned when weight changes. Missing required data preserves usable existing targets and displays a setup card. The calculator supports adults 18–100; no automatic estimate is made when the formula's required sex field is unspecified. [Original energy equation](https://pubmed.ncbi.nlm.nih.gov/2305711/).

Protein defaults to `weightKg × 1.6 g/kg`; moderate/flexible-budget fat loss defaults to 1.8, while economical preference retains 1.6. The user can select 1.6–2.0 or override grams directly. Height does not influence protein arithmetic. These are transparent app planning rules, not individually measured requirements. [Protein evidence](https://pubmed.ncbi.nlm.nih.gov/28698222/).

Newest non-future Progress weight always takes precedence over the optional profile fallback. Auto fat starts at 25% of target energy and carbohydrates fill the remainder. Target calculations are local, never generated by Gemini.

Protein pacing uses remaining protein, local time, usual bedtime, preferred meal count and logged feeding occasions (entries within 45 minutes are grouped). It reduces remaining windows in the evening; allocations sum to remaining protein. Reaching protein does not erase remaining meal opportunities for calories. Workout context informs optional Gemini timing ideas. These are adjustable planning estimates, not a compulsory feeding schedule.

## Nutrition migration and data integrity

The migration is additive and idempotent. Profile, mode, overrides and last strategy live in settings. AI results, creation timestamps, nutrition/context hashes, drafts and learned corrections live in nutrition storage. The first migration stores `sculpt.v4.preNutritionAI`. Existing keys, saved foods/meals/prices, GI labels, historical nutrition and all training data remain.

Backup schema is now 4; validated legacy backups remain supported. Imports validate before writing, snapshot prior state, migrate, validate again, then commit through the existing recovery journal. Bad nested structures, malformed caches/corrections and secret fields are rejected. Existing active workouts/history are preserved.

AI calls occur only after explicit actions. Tab changes, renders, arithmetic and target updates do not call Gemini. Cached results persist across tab switches/reloads, expire and are invalidated by nutrition/profile/weight/target or material workout changes, time bucket or explicit refresh. At most eight results and 100 learned corrections are retained. Local fact memory uses normalized exact names plus compatible units; it is not a semantic model and may need a fresh correction for a differently named food.

## Tests and verification

**PASS:** `npm test` completed all nine suites. The nutrition UI integration also passed under `TZ=America/Los_Angeles`, including midnight and historical-date placement. The final expanded service-worker and credential/static checks passed separately after adding their assertions. See the verification files above.

Coverage includes:

- Empty Saved Foods AND Saved Meals: DOM → real handler → mocked Google SDK → validated preview → one-tap logging → updated totals/remaining/pacing.
- Seven distinct strategy prompts with actual remaining macros and individual preferences.
- Remaining-day planning, budget planning, timing ideas, daily review, contextual swaps and one-tap Plan logging.
- No calls on renders/tab changes/cache hits; meal/profile/material training changes invalidate context. Plan logging preserves an unsubmitted Eat draft.
- Item corrections remembered and reapplied without a food database; deterministic label scaling.
- Mifflin arithmetic, protein rules, latest-weight lookup, Custom preservation, pinned Auto overrides and profile-form saving.
- Evening pacing, local midnight confirmation and deliberate historical logging.
- Offline and quota errors preserve typed text; invalid provider data retries once and fails safely.
- Legacy migration/backup roundtrip, malformed import rejection, rollback after simulated storage failure and interrupted-import recovery.
- Training/source acceptance, active workout/history, neck locks, warm-up/ramp exclusions, deloads, timers, Mobility and theme regressions.
- Service-worker network-first navigation, stale shell refresh, offline fallback, old-cache cleanup and API exclusion.
- Syntax, local assets, source SHA-256, sampled theme contrast and safe-area/reduced-motion CSS presence.

These provider responses are explicitly **mocked**. The four requested English/Roman Urdu/biryani/Hydropure texts are covered as API contracts, not proof of actual Gemini interpretation.

**Live Gemini: NOT TESTED.** There is no `GEMINI_API_KEY` in this process and no deployment URL was supplied. `npm run test:live` was executed and exited 2 with that explicit limitation. Run it in the configured server environment, or set `SCULPT_SMOKE_URL` to the deployed HTTPS `/api/nutrition-ai` endpoint. It submits all four required inputs to the real handler/provider and validates the results without printing credentials.

**Browser pixels and real iPhone: NOT VERIFIED.** Local HTTP listening was denied by the sandbox and browser launch was blocked. DOM integration tests are not screenshots. Check 390px/430px/desktop overflow, Safari forms, light/dark appearance, installed PWA cache update, safe areas, audio permission and timer behavior during device lock on an actual browser/device. Existing training implementation remains unchanged, but those device behaviors cannot be certified here.

## Remaining limitations and deployment

Configure the server key and redeploy before using AI analysis/planning. No deployment was performed in this task. Model access/quota and real estimate quality still require the live test. Restaurant oil, vague portions, supplements without supplied labels and prices remain uncertain estimates requiring review. Known-fact matching is deliberately conservative; optional legacy facts improve compatible matches without being mandatory. The SDK pin should be reviewed when registry access is available.

Offline supports training, progress, mobility, prior nutrition, draft retention and editing/duplicating history. New AI estimates and generated plans require internet; there is no offline language model or hidden local-food requirement.

**Features that require Saved Foods or Saved Meals: NONE.**
