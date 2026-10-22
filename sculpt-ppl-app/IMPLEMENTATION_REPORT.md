# Sculpt 3 implementation and verification

Implemented in the existing working app, retaining vanilla JavaScript and the Vercel nutrition endpoint. There is no application build step and no runtime dependency on npm, a CDN, external fonts, or an animation framework.

**Status:** implementation and automated DOM/logic/cache verification completed. Real-browser visual rendering, live API connectivity, and installed-iPhone verification remain unverified. This is not a claim that every production/device behavior has been tested.

## Files changed

| File | Change |
| --- | --- |
| `index.html` | Local script/style entry points, theme before paint, interrupted-import recovery, eight screens, accessible local SVG navigation and timer controls. |
| `manifest.webmanifest` | Updated description and designed theme/splash colors; existing app scope/start URL/icons retained. |
| `service-worker.js` | New shell cache, network-first documents, offline fallback, bounded static caching, safe activation/update behavior. |
| `api/nutrition-parse.js` | Removed raw upstream response-body logging; existing server-side API architecture and deterministic client food resolution retained. |

## Files added

Application:

- `app.js` — extracted existing food, nutrition, progress, pricing, solver, timer and base settings behavior; obsolete replaced functions removed.
- `core.js` — independently testable validation, solver scores, progression-block, ramp, deload and asymmetry utilities.
- `storage.js` — additive program migration, v1/v2/v3 imports, snapshots, validation, transactional rollback and recovery journal.
- `upgrade.js` — versioned training, local scheduling, warm-ups, ramps, execution, progression, volume, mobility, evidence/safety, theme and accessibility integration.
- `theme.css` — component styles, light/dark tokens, responsive refinements, safe areas, focus and reduced motion.
- `program-data.js` — structured source-derived program, routine, tests and references.
- `program-source.md` — untouched-content copy of the supplied sibling Markdown for offline reference and reproducible extraction.

Development and handoff:

- `.gitignore`
- `package.json`
- `package-lock.json`
- `README.md`
- `scripts/build-program.py`
- `tests/regression.cjs`
- `tests/acceptance.cjs`
- `tests/flows.cjs`
- `tests/training-flows.cjs`
- `tests/service-worker.cjs`
- `tests/run.cjs`
- `tests/static-checks.cjs`
- `verification/test-results.txt`
- `verification/test-results-los-angeles.txt`
- `verification/static-checks.txt`
- `IMPLEMENTATION_REPORT.md`

Implementation checkpoint, copied before editing:

- `checkpoints/pre-upgrade/index.html`
- `checkpoints/pre-upgrade/manifest.webmanifest`
- `checkpoints/pre-upgrade/service-worker.js`
- `checkpoints/pre-upgrade/nutrition-parse.js`

Git metadata was empty/unavailable in this environment, so a file checkpoint was used. No writes were made to `sculpt-ppl-app.pre-v2`, the sibling Markdown, the original ZIP, or `Macro_Tracker.html.txt`. Icon files were retained.

## Migration and data integrity

Existing `sculpt.v2.training`, `.nutrition`, `.foods`, `.body`, `.settings` and `.milestones` remain the active storage namespaces. Old keys are not removed. Program selection, theme and block dates are additive settings. Mobility uses `sculpt.v3.mobility`.

On the first program migration:

1. Save `sculpt.v3.preMigration` before tagging/selecting the new program.
2. Tag unversioned historical and active sessions `legacy-ppl`.
3. Preserve historical entries, loads, reps, setup and notes; preserve a valid active workout.
4. Select `complete-hypertrophy-6day-v1` by default, with a device-local block start date. An existing program/theme preference is respected.
5. Mark migration completion so it is idempotent.

A resumed legacy workout stays a legacy workout. It is not replaced with a new-program session. Training history resolves the matching program instead of looking up every session in the latest exercise list.

Schema 3 backups include training, nutrition, foods/prices/GI labels, body/progress, settings/program selection, milestones and mobility records/tests. No API secret or interval handle is exported. Valid v1 workout backups and v2 unified backups are supported. Imports validate the incoming structure, normalize/migrate, validate again, snapshot, journal, commit and rerender. Invalid payloads do not write state. A simulated write failure restored both memory and persistent keys. An interrupted journal was recovered before state loaded on reopen.

Malformed existing storage is retained and loading pauses with a protection message; it is not silently replaced with empty defaults. Tests used isolated realistic fixtures: the user's actual Safari/localStorage profile is not accessible from this environment.

## Training implementation and calculated totals

| Day | Session | Normal working sets | Deload working sets |
| --- | --- | ---: | ---: |
| Monday | Push A | 26 | 13 |
| Tuesday | Pull A | 28 | 14 |
| Wednesday | Legs A | 25 | 13 |
| Thursday | Push B | 25 | 13 |
| Friday | Pull B | 31 | 16 |
| Saturday | Legs B | 27 | 14 |
| Sunday | Rest + Mobility | 0 | 0 |
| **Week** | | **162** | **83** |

These numbers come from the exercise list. The source's manually written session/weekly totals are not used. Normal-week exercise counts are not trimmed to fit phase summary tables.

The source's combined Pull B item is two lateral-flexion sets plus two isometric-rotation sets, displayed as linked separate rows. Deep cervical flexor posture holds begin in week 3 and remain outside hard-set totals. Ramps, daily warm-ups and mobility are also excluded from working volume and PRs.

Odd set counts in deloads are rounded across the session, keeping all exercises and producing approximately half the session's original total. The screen suggests ~60% previous working load and RIR 4; actual loads remain user-entered.

The generator retains source exercise order, names, doses, primary/secondary labels, D/I tags, rationale, setup, ROM, breathing, ramp and error text. Explicit cross-references are resolved. Source D/I tags override conflicting audit-table labels; no new standalone exercises are invented for structures the source does not assign their own slot.

## Bug fixes

| Requested bug | Implemented behavior | Verification |
| --- | --- | --- |
| Saved-food unit | Food change refreshes basis quantity, compatible unit choices and default unit. | PASS: Hydropure → Mass Gainer → 65 g logs 248 kcal. |
| Seven identical solver modes | Separate scoring objectives, normalized weighted macro errors, stronger overage penalties, real compatible PKR pricing, food-count/prep-step effort, saved meals and GI ranking. | PASS: seven different first options with varied fixtures; deterministic repeats. |
| Missing prices treated as zero | Missing/nonpositive/incompatible prices display missing status and are excluded from Cheapest. | PASS: unpriced whey never enters Cheapest. |
| Empty-shell backup import | Nested schemas and primitive types checked before writes. | PASS: empty and malformed v2/v3 structures rejected without state/key changes. |
| Midnight rollover | Date rechecked for logging, navigation, workout start/finish, visibility and a lightweight rollover check. | PASS: open at 23:59 and submit at 00:01 logs to new local day. |
| Calorie-ring collision | CSS conic rings; no shared SVG paint IDs. | PASS: generated states at 0%, 50%, 100% and over target; browser pixel rendering unverified. |
| Protein windows | Target save recalculates four windows as target/4. | PASS: 140 → 35 g, 200 → 50 g. |
| Old PWA shell trapped in cache | Network-first HTML, versioned shell, explicit update checks and controller handling. | PASS in cache simulation; installed-device update unverified. |
| Parser error ambiguity | Offline, HTTP, unavailable server, invalid response, unrecognized meal and unmatched saved food have separate messages. A request timeout prevents indefinite pending state. | PASS with mocked responses, including matched-food logging; live server/provider not called. |
| Unsafe iPhone sticky header/nav | Safe-area padding on app/header/nav; reserved space for floating timer. | CSS inspected; actual device geometry unverified. |
| Invalid RIR persisted | Strict finite integer 0–5; load/reps must be non-negative; neck RIR ≥3. | PASS: -1, 6, abc rejected; existing historical text is not rewritten. |
| Missing Eat date navigation | Previous/next, date picker, Today chip and explicit historical-logging checkbox. New entries otherwise go to today. | PASS: historical placement and return to today. |
| No automatic rest | Completing a working set starts that exercise's rest; pause/resume/+30/skip/reset, timestamp persistence and visible expiry. | PASS: prescribed 150 s trigger and catch-up after simulated suspension. |

The >50-rep confirmation remains. Existing meal edit, duplicate, copy-to-today and delete flows remain and passed DOM interaction tests.

## New functionality

| Feature | Status |
| --- | --- |
| Versioned legacy/new programs | Implemented; legacy active/history preserved. |
| Device-local six-day schedule and Sunday mobility | Implemented; train-another-session always available. |
| Session header, calculated totals, estimated duration and completion | Implemented. Duration is an estimate. |
| Exact daily general/joint warm-ups | Implemented, checkable, collapsible, with timed-drill controls. |
| Exercise-specific ramps and load tiers | Implemented separately from working logs, with editable intended loads and rounded suggestions. |
| HOW panels | Implemented with textual muscles, rationale, setup, ROM, breathing, ramp, error and available substitutions. |
| Set formats and notes | Reps, per-side reps, bodyweight, distance and isometric seconds where prescribed; exercise and per-set notes. |
| Previous performance | Same program/exercise and matching position where possible; matching repeated exercises can resolve across sessions. |
| Double progression | All working sets, same load and target RIR required; small movements allow extended rep progression. Advice never changes load automatically. |
| Neck training | External load locked through week 8; later loading only flexion/extension, rotation isometric, lateral work unloaded; stop signals shown. |
| Wrist/forearm coverage | Wrist flexors/extensors, brachioradialis, curls and carry-specific contribution retained. |
| 16-week block | All phases, week 9/14 deloads, complete/start-block controls and retained history. |
| Deficit mode | Guidance and confirmed removal of final uncompleted sets from the final two exercises only, for that session. No master prescription mutation. |
| Weekly region volume | Completed working sets, including active session; direct/weighted indirect/effective exposure, logged-day frequency and planned comparison. Explicit 1/.5/.25 weights only. Legacy muscle weights are not invented retroactively. |
| Full/quick mobility | All 13 source drills and exact five-drill quick selection; timers, sides/sets and daily completion. |
| Mobility tests | Ten tests, date/left/right/unit/notes, per-test four-week reminders, safe asymmetry and >10% prior-measurement regression flags. No structural/injury diagnosis generated. |
| Meal timing | Timestamp-only contextual guidance, no calorie-based meal-size classification or medical clearance; quiet removal after 3 h. |
| Evidence & Safety | Compact expandable source sections, grades, correction on partials, stop signals, substitution ladder and original links; complete source available offline. |
| Today command centre | Training first, then calories/macros, weight trend, steps, mobility, hydration and GI/recovery. |
| Progress | Existing weight/waist/steps/GI/sleep/notes/hydration preserved; averages, trends and history retained. |
| Food pricing and effort | Serving/protein/calorie costs, GI labels, entered prices and simple preparation-step metadata. |
| Backup/recovery | Validated portable backups, migration snapshot, pre-import rollback and interrupted-import recovery. |

## Design changes

System-first font stack; tabular numerals; disciplined type/spacing and shared cards, fields, buttons, chips and local SVG icons. Calm green accent, designed light/dark palettes, tokenized surfaces/text/borders, System/Light/Dark preferences, theme chosen before first paint and theme-color updates.

Motion is restrained to short screen/set transitions and progress fills, with reduced-motion overrides. Touch controls generally target 44–48 px, fields use iPhone-friendly 16 px text, focus is visible, form labels are associated, disclosure state is exposed, and modal keyboard focus is contained. No muscle illustration was added; complete textual region names remain the primary representation.

## Tests run

Automated commands ran successfully in **Asia/Karachi** and **America/Los_Angeles** timezones:

```sh
TZ=Asia/Karachi JSDOM_PATH=/tmp/sculpt-test/node_modules/jsdom npm test
TZ=America/Los_Angeles JSDOM_PATH=/tmp/sculpt-test/node_modules/jsdom npm test
```

`JSDOM_PATH` points to the temporary test dependency installation used in this sandbox. On a normal development machine, `npm install` then `npm test` uses the declared development dependency; no environment override is needed. Lockfile generation succeeded offline from the package cache. An online registry refresh encountered sandbox DNS restrictions.

| Suite/check | Result |
| --- | --- |
| Phase-1 DOM regression suite | PASS |
| Acceptance suite: 27 groups, including all six source sessions | PASS |
| Preservation/parser/date/timer/transaction/theme flows | PASS |
| Training execution: deload/load suggestions, deficit confirmation, bodyweight, neck, cross-session previous performance and PR exclusions | PASS |
| Service-worker network/cache/update simulation | PASS |
| JavaScript syntax and local asset existence | PASS |
| Theme text/button contrast calculation | PASS for sampled core tokens; not a full visual accessibility audit |
| Actual browser launch | BLOCKED by sandbox restrictions |
| Local HTTP preview server | BLOCKED: socket creation returned Operation not permitted |
| Real 390/430/desktop screenshot and overflow checks | NOT VERIFIED |
| Live OpenAI/Vercel request | NOT RUN; no credential/provider call needed for mocked regression tests |

Full successful suite output is in `verification/test-results.txt` and `verification/test-results-los-angeles.txt`. Static checks are in `verification/static-checks.txt`.

## Remaining limitations and explicit source decisions

- Visual CSS, overflow, actual contrast in every rendered state, keyboard/screen-reader behavior and safe-area geometry need a real browser pass. DOM tests do not render pixels.
- Installed iPhone cache replacement, launch appearance, audio permission/playback, and lock/background timer return need real-device testing. Timestamp catch-up logic is verified; background audio/notifications are not promised. Vibration is not used.
- The live parser endpoint/provider connection was not exercised. Its architecture and server-only secret use remain unchanged; client success/error paths were tested with fixtures.
- The deterministic solver searches a bounded pool of up to 10 candidate foods with up to 3 foods and discrete servings. It is transparent and strategy-specific, not a mathematical guarantee of a global optimum over the whole food database.
- The source's “13-minute” and “6-minute” labels do not match fully timed doses when every prescribed set and side is included. Labels are retained with a visible note; no stretch dose is silently shortened.
- Normal-week sets and exercise RIR follow individual prescriptions, not conflicting phase/session summary tables. The phase names do not silently rewrite ordinary-week prescriptions.
- Deficit confirmation offers the source's first reduction (two final sets), which is not represented as a complete 20% reduction. Further reductions remain the user's decision.
- For fields omitted by the source, no technique is invented. Explicit “as Legs A/Push A” references resolve to the original instructions. Missing rationale is identified as not separately specified.
- The app and offline reference preserve the author's evidence categories; this implementation does not independently endorse every medical/biomechanical statement in the document.

## Real-iPhone verification checklist

1. Open at 390 px and 430 px, then installed standalone; scroll an active workout under the status bar/Dynamic Island. Check the bottom nav and timer clear the home indicator.
2. Open Today, Train, Eat, Plan, Progress, Settings, Mobility and Evidence/Safety in both themes; change System appearance, reload, and check launch flash, fields, rings and charts.
3. Complete a working set, pause/resume/add 30/reset/skip; lock or background the phone, return after expiry, and check the visible result and optional sound after a user gesture.
4. Install/use offline, including history, foods, manual logging, training and mobility. Confirm natural-language parsing explains the connection requirement.
5. Deploy over an older installed version, reopen/reload normally, and confirm the new index and shell replace the old cache while local records remain.
6. Use keyboard/VoiceOver and inspect long exercise names, HOW disclosures, per-set notes, date selection and modal focus.

The verification skill guided tracing the data boundaries. No external messages or publication/deployment actions were performed.
