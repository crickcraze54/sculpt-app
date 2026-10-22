# Sculpt 3

A vanilla static PWA with the existing Vercel `/api/nutrition-parse` endpoint. No application build or runtime package installation is required. Deploy the entire working directory's app files, including the JavaScript modules, CSS, icons, manifest and `program-source.md`.

Use a local HTTP server to preview, for example `python3 -m http.server 8765`. Service workers need localhost or HTTPS. The nutrition parser needs the existing server-side configuration; its key is never sent to the client. Manual nutrition, training, foods, history and mobility work offline after the shell is installed.

## Tests

Optional development dependencies only:

```sh
npm install
npm test
```

The suites use a DOM harness and mocked fetch/cache implementations. They do not replace real Safari, viewport, installation, audio, or background-lock testing. See `IMPLEMENTATION_REPORT.md` and `verification/test-results.txt` for the recorded checks and limits.

## Program source

`program-source.md` is a copy of the supplied Markdown. Regenerate the structured program with:

```sh
python3 scripts/build-program.py
```

The generator prints the actual session and weekly working-set totals. Combined lateral flexion and rotation are separate linked exercise rows; cervical posture holds are separate from hard sets. Deload rounding distributes odd sets within each session and retains every exercise.

Keep `legacy-ppl` stable. Bump the program ID/version if exercise prescriptions change in a future release. Bump the shell cache name in `service-worker.js` when shipping future application changes.

## Data

Existing v2 storage keys remain in use. Program selection, block start and theme are additive settings; mobility uses `sculpt.v3.mobility`. Original v1/legacy keys remain. `sculpt.v3.preMigration` holds the initial program migration snapshot. Validated imports use `sculpt.v2.rollback` plus an interrupted-write recovery journal. Export a JSON backup from Settings for portable recovery; browser storage belongs to that origin/device.

The source ZIP, sibling source documents and `sculpt-ppl-app.pre-v2` have not been edited. `checkpoints/pre-upgrade` contains the four original application files saved before this implementation.
