# Gym Routine Builder

A zero-backend intake and starter-program generator for a gym front desk.

## What it does

- Captures member age, height, weight, training experience, weekly availability and goal.
- Supports toggles for low-back, shoulder, knee, hip, neck and elbow/wrist considerations.
- Includes a simple pre-exercise safety gate. If a red-flag item is selected, automated programming stops and the screen recommends professional review.
- Generates 2-, 3-, 4- or 5-day starter routines.
- Adjusts exercises using issue-specific substitutions.
- Uses RPE / reps-in-reserve rather than pretending to calculate safe starting loads from body weight.
- Adds cardio guidance and progression rules.
- Prints a clean A4 member handout.
- Saves profiles locally in the browser (`localStorage`).
- Supports JSON export/import for a local backup.

## Run locally

No build step is required.

Option 1: simply open `index.html` in a modern browser.

Option 2: run a tiny static server:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Put it on GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html`, `styles.css`, `app.js`, and `README.md` to the repository root.
3. In GitHub: **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose the `main` branch and `/ (root)` folder.
6. Save. GitHub will provide the public Pages URL.

## Privacy / production note

This version intentionally has **no server and no accounts**. Saved profiles stay in the browser on the device where they were entered. That is convenient for a prototype but it is **not a full member-management or medical-record system**.

Before using it across multiple gym devices or storing detailed health information, add authentication, encrypted server-side storage, role permissions, audit logs, backup/restore, and a privacy/data-retention policy appropriate to your jurisdiction.

## Programming philosophy

This app is intended to support a qualified gym professional, not replace clinical judgment. It does not diagnose injuries or prescribe rehabilitation. Starting resistance is guided by effort and technique rather than a formula based on body weight.
