# Binyamin Gym / כושר בנימין

Static staff intake and member routine application. No framework, runtime dependencies, cloud account or database is required.

## Run and test

With Node.js installed, run `npm start` and open http://127.0.0.1:4173. Run `npm test` for engine, persistence, validation, privacy and script-integrity checks. The local server binds only to this computer.

## Staff workflow

1. Complete intake and generate a routine.
2. Navigate workouts. Click an exercise or its Replace button to search recommended alternatives, adjust sets/reps/rest, and write coaching notes in English and Hebrew. Save change updates the current routine. Reset restores the original prescription, including after saving and reopening.
3. Save member retains intake, routine edits, language and active workout in this browser. If intake settings change, generate again to apply them to the routine; saving preserves the currently reviewed routine.
4. Copy member link shares the specific routine. Choose the language before copying. The member can change languages without seeing staff intake or editing controls.
5. Print routine opens the A4 preview, then Print / Save PDF invokes the browser print dialog. Each workout begins on its own page; general guidance follows separately. Use A4 and default scale. Very long custom notes may need an additional page rather than smaller text.
6. Members → Export backup prepares a JSON download and leaves a retry link. Import validates the entire backup before adding profiles. Existing profiles are retained; colliding IDs receive new IDs.

## Private and member-visible notes

Internal trainer notes and movement notes stay in staff storage and are excluded from member links and printouts. Use the separate Member coaching notes fields for public notes. Exercise coaching notes are also member-visible, with separate English/Hebrew fields. Existing internal notes are preserved without automatically publishing them.

New v4 links encode a routine snapshot in `#routine=`, avoiding sending the payload in HTTP requests. They contain name, goal, experience, schedule, prescriptions and member-facing guidance, without height, weight, sex, movement toggles or internal notes. Links are readable by anyone who has them and are snapshots: editing a routine requires sending a new link. Legacy v3 query links and v2/v3 fragment links remain supported. Old links cannot be retroactively stripped of information already encoded into them.

## Equipment catalog

All references are local, original equipment-only SVG drawings. They are diagrams of equipment categories, not photographs or exact machine/model identification. Every exercise reference opens a large modal. Replace defaults in `js/equipment-catalog.js` with entries keyed by exercise, for example:

```js
legPress: { src: './assets/equipment/leg-press.jpg', kind: 'photo' }
```

Put your gym's real photos in `assets/equipment/`. Keep image attribution in CREDITS.md when adding third-party media. The real local Binyamin Gym logo is retained.

## Source layout

- `index.html`: app shell and accessible forms
- `app.js`: rendering, exercise editor, member storage and UI events
- `js/exercise-catalog.js`: bilingual exercises and replacement families
- `js/equipment-catalog.js`: replaceable local equipment assets
- `js/routine-engine.js`: effort prescriptions, limitation substitutions and session sizing
- `js/translations.js`: bilingual labels and routine copy
- `js/sharing.js`: versioned routine snapshots and serialization
- `styles.css` / `print.css`: responsive screen layout and shared A4 preview/print rules
- `tests/regression.cjs`: repeatable regression checks

## Deployment

Continue deploying the repository root as a static site on Vercel (Other framework, no build command, root output directory) or GitHub Pages. No backend was added. Local testing tools and the pre-audit backup are excluded from Vercel uploads by .vercelignore. This work does not publish a deployment.

## Backup and verification

The original source is preserved in `backups/before-audit/`; no Git repository existed in the supplied folder. See QA.md for executed checks and remaining verification limits.

## Equipment photos

Product photos from the supplied equipment list are stored locally under assets/equipment. EQUIPMENT.md records mappings, inventory and pending questions; assets/equipment/inventory.json records the 26 equipment line items, quantities and source pages. Exact photos and fallback drawings are distinguished in the image viewer. The source is a quotation, so listed status does not assert delivery.

## Rest defaults and jump rope

New routines use 60 seconds of rest for rep ranges starting at 7 or above, and 90–120 seconds when the lower bound is 6 or below (including 5–8 and 6–10). Timed strength exercises default to 60 seconds; cardio and balance retain their own prescriptions. Explicit overrides and saved routines retain their rest values. Session estimates use the prescribed rest between sets. Jump rope is available in cardio preferences and swaps, with bilingual interval guidance and a local drawing. Knee, hip or low-back considerations substitute cycling during generation. Equipment availability remains pending confirmation.

## Rest timer and workout history

Each exercise now has Rest timer and Log sets controls in both staff and member views, in English and Hebrew. The timer uses the upper end of a prescribed rest range (90–120 sec starts at 120). It supports pause/resume, reset, +30 seconds and dismiss. Elapsed time uses a deadline so returning from an inactive tab corrects the display. Completion is visual; closing or reloading the page resets the timer. No background notification or sound is promised.

Log completed sets with session date, optional weight in kg, and actual reps or time (include units for timed sets). Blank sets are omitted. The latest saved result for the exercise appears across workout days. History & backup shows entries and supports deleting mistakes, exporting a JSON backup, and importing a backup for the same member. Imports merge new entries, skip exact duplicates and reject conflicting or invalid entries without changing stored history. Export includes a manual download link and can preserve damaged stored data for recovery.

History uses a separate localStorage key per member. New links carry the member's stable identifier, but never their workout results. This is device-local separation, not account authentication: anyone using the same browser and member link can see that member’s locally stored history. Logs do not sync to a trainer or another device, are not included in staff profile backups, and are excluded from printouts. Keep the same hosted site and browser and export backups before clearing data. Older links without an identifier group logs by member name and exercise layout; a newly generated link starts a separate history from those legacy links.

Implementation: js/tracking.js; regression coverage includes member isolation, shared identity, storage validation, import conflicts/deduplication, timer range parsing and deadline calculations.

## Cardio preferences and timed warm-ups

Every newly generated day includes the selected cardio preference, across all goals and session lengths. Existing movement-consideration substitutions still apply and are explained in the warm-up. A visible warm-up appears before the exercise list: easy preferred cardio, gentle movement preparation, and light practice sets. It takes 5 minutes for a 30-minute session and 8 minutes for longer sessions. The generator budgets warm-up, prescribed rest, exercise time, cardio and station transitions within the selected session length; timings remain estimates and manual edits can change the total. Navigation uses Day 1, Day 2, etc. (יום in Hebrew).

Existing saved routines and shared links are snapshots. Generate a new routine and send a new link to apply the new cardio programming.
