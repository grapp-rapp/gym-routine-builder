# Binyamin Gym — Member Program Builder

A static, privacy-friendly gym onboarding and starter-program tool built for Binyamin Gym.

## What it does

- Member intake: age, height, weight, experience, goals and activity level
- Movement-consideration toggles for low back, shoulder, knee, hip, neck and elbow/wrist
- Safety-screen gate for symptoms/restrictions that should stop automatic programming
- Generates 2–5 day starter routines
- Goal-aware sets, reps, rest and cardio guidance
- Conservative exercise substitutions when movement considerations are selected
- Day-by-day routine view instead of one long tiny page
- English / Hebrew toggle for the member-facing routine
- Binyamin Gym branding and logo
- Equipment illustrations and equipment labels beside each exercise
- A4 printing with one workout day per page
- Self-contained member share links for phone viewing
- Trainer exercise editor: click any exercise, review intake-filtered alternatives, replace it, or reset to the generated choice
- Manual exercise swaps carry through to printing and member share links
- Saved member profiles can retain trainer-edited routines in this browser
- Local browser profile storage and JSON backup/import

## Privacy

Saved profiles stay in the browser's local storage.

The **Copy member link** feature does not send the raw intake profile to a server. The routine is encoded in the URL hash. The shared payload intentionally excludes height, weight, specific injury/issue toggles, issue notes and red-flag answers. Anyone who receives the link can still view the routine, so treat the link as private.

A future server-backed version could use short links, member accounts, editable plans and centralized syncing.

## Equipment images

This version includes generic equipment illustrations (machine, cable, dumbbell, treadmill, bike, etc.). When the gym's final equipment list is known, the exercise data can be mapped to actual photos of the exact machines used at Binyamin Gym.

## Deploy to Vercel

The project is fully static. Point Vercel at the repository root; no build command is required.

## Deploy to GitHub Pages

1. Create a GitHub repository.
2. Upload the project files to the repository root.
3. Open **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`.

## Files

- `index.html` — application shell and intake form
- `styles.css` — app UI, responsive design, Hebrew/RTL and print styling
- `app.js` — programming engine, translations, sharing and local member storage
- `assets/binyamin-gym-logo.png` — Binyamin Gym logo

## Important

This tool is for fitness-programming support. It is not medical diagnosis or treatment. Members who trigger the safety screen should be reviewed by an appropriately qualified professional before an automatic routine is prescribed.
