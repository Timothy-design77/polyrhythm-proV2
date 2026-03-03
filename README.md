# Metronome Lab (PWA)

Local-only metronome + (future) session recording and drumming accuracy analytics.

## Phase implemented in this snapshot
- **Phase 0**: PWA scaffold + routing + GitHub Pages workflow
- **Phase 1**: Stable metronome engine (lookahead scheduling) + tap tempo + volume + wake lock

## Requirements
- Node.js 20+

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Deploy (GitHub Pages)
1. Push to a GitHub repo on the `main` branch.
2. In GitHub repo settings: **Pages → Build and deployment** should use **GitHub Actions**.
3. The workflow `.github/workflows/deploy.yml` builds and deploys automatically.

## Install on Android (Chrome)
1. Open the deployed URL in Chrome.
2. Chrome menu → **Add to Home screen** (or Install app).
3. Launch from the icon.

## User test gate (Phase 0 + 1)
On your Galaxy Z Fold:
- Install as PWA
- After first load, enable airplane mode and reopen (offline shell should load)
- Run metronome for 1, 5, 15 minutes:
  - No audible drift
  - BPM changes don’t stutter
  - Screen off/on doesn’t break audio (you may need to tap once to resume)

If any of those fail, report exactly what happened (and approx BPM + duration).
