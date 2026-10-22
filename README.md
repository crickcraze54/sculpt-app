# Sculpt 4 — AI-first nutrition

The completed vanilla training PWA is retained. Eat and Plan now call one Gemini serverless endpoint; training, mobility, progress, history, calculations and themes stay local. No frontend build step is required.

## Run and deploy

Serve the directory on localhost for the static PWA, or deploy the project to Vercel with its `/api` directory. Install dependencies with `npm ci`; Vercel installs the server-only `@google/genai` package. The Google SDK is not imported by the browser or included in the offline shell.

Configure `GEMINI_API_KEY` **only in the server/Vercel environment**, then redeploy. Do not paste a key into an HTML/JavaScript file, a client setting, a backup or a terminal command argument. The old OpenAI key is no longer used.

`lib/nutrition-service.cjs` contains the single model constant. The requested model is `gemini-3.8-flash`; there is no silent model fallback. The installed official SDK is pinned to 1.19.0 because its package was available in this sandbox's cache; its local types support `generateContent`, `responseJsonSchema`, and `abortSignal`. A newer SDK could not be downloaded here because registry DNS is restricted.

Routes:

- `POST /api/nutrition-ai` accepts `{action,input,mode,context}`.
- `/api/nutrition-parse` forwards current requests; old `{text}` requests get an explicit upgrade/reload message.

Supported actions: `parseMeal`, `generateDailyPlan`, `solveNextMeal`, `generateProteinPacing`, `suggestSubstitution`, `analyzeDay`, `generateBudgetPlan`.

## Use

In Eat, type English or Roman Urdu, analyze, inspect estimated items/assumptions, and log once. Adjust quantities or use Less/More. Optional nutrition corrections are remembered locally; exact packaged values can be marked as your supplied label. Plan uses the remaining day and real profile/workout context, not a food database. Generated meals can be logged, adjusted or swapped directly.

In Settings, complete Nutrition Profile. New Progress weights are picked up automatically. Existing calorie/macronutrient targets migrate as **Custom** and remain unchanged. Choose **Auto** explicitly to use Mifflin–St Jeor, configurable activity and goal adjustment. Protein uses body weight, usually 1.6 g/kg (1.8 for non-economical fat loss), with a configurable 1.6–2.0 rule or manual override. Auto overrides stay pinned when weight changes.

Budget preferences are economical/moderate/flexible with optional PKR budgets. AI costs are optional estimates, never verified live market prices. No price or serving library maintenance is needed.

Offline, training/mobility/progress and previous nutrition remain available; drafts survive navigation/reload and AI actions explain the internet requirement. History can be edited/duplicated without AI. Gemini estimates require internet.

## Automated verification

```sh
npm test
```

The suites include actual client → handler → mocked Google SDK → validated response → client logging, empty saved databases, profile/target math, pacing/time changes, cache behavior, corrections, import rollback and completed-training regressions. Mocks do **not** prove provider connectivity or real Gemini estimates.

## Required live smoke test

In the configured server environment:

```sh
npm run test:live
```

Or point `SCULPT_SMOKE_URL` to the deployed HTTPS `/api/nutrition-ai` endpoint, then run the same command. That URL needs no client API key. The script sends all four requested examples and validates item-level nutrition with the same schema. It never prints credentials. Without a configured server key or deployment URL it exits with code 2 and explicitly reports **LIVE GEMINI NOT TESTED**.

See `NUTRITION_AI_REPORT.md` and `verification/nutrition-tests.txt`. Real Safari visuals, installed updates, audio/background behavior and live Gemini still need verification where noted.

## Data and source

Existing v2 keys, historical meals, saved-food/saved-meal records, prices, GI labels and completed training data remain. New nutrition profile/mode/overrides are additive settings. Local AI cache, drafts and corrections live inside nutrition storage. Portable backup schema is 4, with legacy v1/v2/v3 restore support and validation before commit. `sculpt.v4.preNutritionAI` is the first nutrition migration snapshot. Existing migration/import snapshots and recovery journal behavior remain.

The immutable sibling rollback copy has not been touched. `checkpoints/pre-ai-nutrition` preserves the working app before this task. Training program/source data have not changed. `program-source.md` remains the offline source; `python3 scripts/build-program.py` regenerates its structured training data if needed. Bump the shell cache name for future deployments.
