# Binyamin Gym audit verification — 9 September 2026

## Completed

- Baseline app run locally; desktop clipping and fragile remote references observed before changes.
- Original source backup retained at backups/before-audit (the supplied folder contained no .git directory).
- Final Node regression suite: 12,288 combinations covering all four goals, three experience levels, 2–5 days, 30/45/60/75-minute sessions, and all 64 limitation combinations. Checks workout counts, supported exercise choices, no automatically duplicated exercises, and valid prescriptions.
- Engine regression: edit → save → restore → reset, v4 encode/decode, bilingual notes, warm-up preservation, private intake exclusion, corrupt-input rejection, bodyweight-independent programming, local storage round trip, legacy v2/v3 payloads and unique function definitions.
- Final browser Scenario A: male, beginner, 3 days, general fitness, no limitations.
- Final browser Scenario B: female, beginner, 3 days, fat loss, knee consideration; bike cardio and appropriate alternatives checked.
- Final browser Scenario C: male, intermediate, 4 days, muscle gain, low-back and shoulder considerations; supported choices and leg-curl substitution checked.
- For A/B/C: generated; visited every workout; replaced an exercise; changed sets, rest and English/Hebrew coaching notes; saved; switched language; copied and opened the exact link; verified member-only mode and edited prescription; opened/closed equipment enlargement.
- A separate edit test also changed reps to 10–12. Saved routine restoration retained that prescription and Hebrew note. Reset returned the generated choice.
- Shared routine loaded on localhost separately from the staff origin 127.0.0.1, demonstrating independence from that origin's local storage. Actual second hardware device/incognito was not used.
- Same-tab navigation between different member fragments tested after adding hash-change loading.
- Staff and member layouts checked at actual widths of 1440, 1024, 768, 390 and 360 pixels. No horizontal document overflow; active routine images loaded. Representative desktop, tablet and phone screenshots visually inspected.
- Hebrew RTL, translated units and isolated left-to-right number ranges checked, including the A4 preview.
- Five-day / 75-minute / all-limitations program and long bilingual name tested in the UI. Two-day / 30-minute program generated with no optional name or notes and every day navigated.
- Malformed member link showed a bilingual error screen without exposing staff intake.
- Valid backup import added a member without removing existing profiles. Invalid import preserved existing records and displayed an error.
- Export prepares a JSON Blob download with a dated filename and persistent retry link. The in-app browser did not report a download event, so saved-file completion was not verified.
- A4 preview tested for all three scenarios, using the actual print stylesheet. Each workout included name, logo, prescriptions and progression; measured content heights were 853–957 CSS pixels within 1031 available pixels (273 mm). General guidance follows on a separate page. Native browser PDF pagination/physical printing was not verified because this browser surface did not expose the native print dialog.
- No browser console errors in the final A/B/C run and the independent-origin shared test.

## Known limits and next work

- Equipment references are generic, original, local drawings. Replace them with the gym's actual machine photographs and names before member rollout.
- Links are self-contained snapshots and may be long. Previously sent links do not update or revoke themselves. Legacy links may already contain data encoded by older versions.
- Custom notes are authored separately in each language; no automatic translation service was added.
- Session sizing uses a conservative time estimate, not measured individual pacing. Trainers still review and adjust the plan.
- Very long manual notes can require additional printed pages. Text is not automatically shrunk.
- Finish a regular-browser check of PDF output and backup file downloads before rollout. No production deployment was performed.
- Suggested next feature after real equipment photos: simple member workout completion and recorded loads, retaining the existing effort-based progression approach.

## Repeat

Run npm test. Run npm start for the local app. No packages need installation.

## Supplied equipment import — 9 September 2026

- Extracted 23 distinct product JPGs and recorded 26 equipment line items from the supplied five-page PDF. Matched images using PDF image positions and visual inspection of pages 1–3. Reassembled the four-tile dumbbell image.
- Regression suite passes all 12,288 generated combinations and saved/edit/share compatibility checks, plus inventory provenance and pending-equipment fallback checks.
- Browser: loaded saved QA Final A with existing custom prescription intact; enlarged chest press photo displays the correct model and source description.
- Existing Hebrew QA Final C member link renders the new photos. At 390 px, the row-machine photo dialog loads correctly without horizontal overflow.
- Hebrew A4 screen preview: 14 product-photo instances across the routine, no broken visible images. No browser errors. Native PDF output was not checked in this pass.
- Items absent from the PDF remain available pending confirmation, as explicitly requested by the user.

## Timer and local workout logs — 15 September 2026

- Added regression checks for member history isolation, stable identity through sharing, stored results, import validation/duplicates/conflicts and timer deadline calculations. Full suite passes (including 12,288 routine combinations).
- Browser: generated QA Timer Logs; logged two completed sets, 25 kg × 10 and 25 kg × 9. Last-session result displayed.
- Started 60-second timer, observed countdown, paused, added time and reset. Timer buttons remain stable between ticks.
- Saved member and opened newly copied member link; results were visible on the same origin/browser. Reload preserved them.
- Hebrew log dialog checked at 390 × 844: no horizontal overflow; date and both set fields visible.
- Valid log import added a chest-press entry and retained original leg-press results; another member’s backup was rejected with both entries intact. Export prepared a named JSON download link; native download completion was not exercised.
- Print preview hides tracking controls/history. No browser errors observed. Timer uses an on-page completion message; background/closed-browser notifications and timer persistence are not implemented.

## Cardio, warm-up and day labels — 16 September 2026

- Full regression suite passed, including 12,288 existing generation combinations and 18,432 additional cardio preference/goal/experience/duration/limitation combinations.
- Each generated day retains one cardio block using the selected preference or its existing limitation substitution, at least three strength exercises, and an estimated duration including warm-up and transitions no greater than the chosen session length.
- Warm-up English/Hebrew content includes the selected cardio; shared-link round trip preserves the instructions. Day labels checked in both languages.
- Visual browser check was blocked by automatic approval review due to an account usage limit; updated screen/print layout has not been visually verified in this pass.

## Completed visual follow-up — 16 September 2026

- Desktop at 1440 px: generated a 30-minute general-fitness program with jump rope. Day tabs and the step-by-step 5-minute warm-up displayed correctly; jump rope remained in the routine.
- Shared member view at 390 px Hebrew and 360 px English: inspected screenshots, confirmed warm-up and Day navigation, no horizontal page overflow or broken visible images.
- Generated a 75-minute, five-day muscle-building program with elliptical. All five days included elliptical and an 8-minute warm-up.
- English/Hebrew A4 screen previews revealed excess spacing after adding the warm-up. Reduced print-only spacing while keeping exercise text at 10–11 pt. All five tested day contents now fit inside the 273 mm content area: approximately 1006 px English and 990 px Hebrew, within 1032 px.
- Inspected printed-page endings, cardio and progression. Tracking controls remained hidden. Browser console contained no errors.
- This completes browser visual and in-app print-preview checks. Native Save as PDF output and physical printing were not tested.

## Activity-based starting workload — 16 September 2026

- Renamed intake field and saved summaries. Canonical values: inactive, one_two, three_four, five_plus; legacy low/moderate/high map to inactive/one_two/three_four. Missing values default to one_two. Existing routine snapshots and manual edits remain intact until explicitly regenerated.
- Inactive: at most four strength exercises, main lifts capped at two sets/accessories at one, RPE 6–7, warm-up extended by two minutes (7 at 30-minute duration, otherwise 10). Main cardio capped at 3/4/5/6 minutes for 30/45/60/75-minute sessions; easy intervals and introductory 2–3-week progression.
- One_two: main sets capped at three; accessory sets reduced by one (minimum one); no muscle-gain bonus accessory; cardio 80% of standard rounded down, minimum three minutes. Standard warm-up.
- Three_four and five_plus retain normal goal/experience/day/duration workload; five_plus adds no volume. New/returning members selecting 4–5 days also receive introductory set caps, at most five strength exercises and recovery guidance.
- Existing age, movement substitutions, duration budgeting and strength minimums remain. Warm-up is included in duration; shorter starter sessions intentionally do not fill all available time.
- Fresh Jump Rope selection reproduced successfully on the supplied live Vercel URL before these changes. Added prominent per-day cardio summary, explicit substitution wording, and a pending-intake-changes notice. Existing knee/hip/low-back substitutions remain. No claim that a fresh-selection disappearance was reproduced.
- Browser cases A–D generated successfully with Jump Rope: A inactive/new/5/fatloss/45: 4 strength exercises with 1–2 sets, 10-minute warm-up, 4-minute main cardio; B one_two/new/3/general/60: 6 strength exercises with 1–2 sets, 8-minute warm-up, 6-minute cardio; C three_four/some/4/muscle/60: 6–7 strength exercises with 3 sets, 8-minute warm-up/cardio; D five_plus/some/2/strength/60: 6 strength exercises with 4/4/4/3/2/2 sets, 8-minute warm-up/cardio.
- Browser saved/reloaded D with custom leg-press sets and five_plus retained. Saved summaries show new labels for old profiles. Pending-settings warning appeared before regeneration and cleared afterward.
- Shared inactive routine retained Hebrew guidance and Jump Rope at 390 px; no horizontal page overflow. No browser console errors observed.
- Longer C A4 preview initially overflowed; tightened print-only row spacing. Maximum content measured 1018 px English and 1002 px Hebrew, within the 1032 px available. Screenshots inspected. Native Save as PDF/physical printing not exercised.
- Automated suite includes 12,288 additional activity/experience/goal/day/duration/age/limitation combinations, legacy mappings, workload comparisons and saved/share round trips, in addition to all earlier regression checks.

## Equipment synchronization — 16 September 2026

- Jump rope added to supplemental inventory with honest user-requested provenance, separate from the 26 PDF items. Its engine entry and drawing already existed.
- Cardio intake options, generator lookup, warm-up preference lookup and replacement family now derive from CARDIO_OPTIONS. Stable profile values retained.
- New checks cover every exercise: bilingual equipment labels, explicit image mapping, existing asset files and membership in replacement families. Cardio catalog coverage and supplemental rope mapping are asserted. Full regression suite passed.
- Browser generated routines for walking, bike, elliptical, rower and jump rope; each matched the selection. Jump-rope enlarged illustration loaded successfully.
