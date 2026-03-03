# User Testing — Phase 0 + Phase 1

## 0) Build & Deploy (GitHub Pages)
1. Create a GitHub repo (any name).
2. Upload the project contents to the repo root.
3. Push to `main`.
4. In GitHub: Settings → Pages → Build and deployment → select **GitHub Actions**.
5. Wait for workflow `Deploy to GitHub Pages` to finish.
6. Open the deployed Pages URL in **Chrome on Android**.

## 1) Install as PWA
- Chrome menu → Install app / Add to Home screen.
- Launch from the new icon.

## 2) Offline shell test
1. Open app once while online.
2. Turn on airplane mode.
3. Close app completely.
4. Reopen from icon.

**Pass**: app loads UI (Home screen) without a blank screen.

## 3) Audio timing stability test
Run each of these:
- 120 BPM for 1 minute
- 120 BPM for 5 minutes
- 120 BPM for 15 minutes

During the run:
- Tap +/- BPM multiple times
- Tap tempo a few times
- Lock screen for ~10 seconds and unlock

**Pass**:
- No drift you can hear
- No double-click / flams caused by UI actions
- Audio returns after unlock (if it pauses, a single tap anywhere + Start should recover)

## 4) Report back
Send:
- Deployed URL (optional)
- What failed (if anything)
- Approx BPM
- What you were doing when it failed (tap tempo? locking screen? etc.)
