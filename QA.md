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
