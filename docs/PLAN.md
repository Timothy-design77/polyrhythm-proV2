# Metronome Lab — Build Plan (Strict)

This plan is the source of truth. Work proceeds in order, phase by phase. Each phase ends with a user test gate.

## Phase 0 — Repo + PWA + GitHub Pages Deploy (TEST)
**Deliverables**
- Vite + React + TypeScript
- PWA manifest + service worker
- Routing skeleton: Home, Projects, Profiles, Settings, Session Review
- GitHub Actions workflow for GitHub Pages

**User test gate**
- Install as PWA on Android
- Works offline after first load
- Reload doesn’t white-screen

**Pass criteria**
- Offline shell loads
- No blank screen on refresh

---

## Phase 1 — Metronome Engine v1 (TEST)
**Deliverables**
- Web Audio lookahead scheduler (stable timing)
- Controls: BPM, Start/Stop, Tap Tempo
- Click sound (synth) + volume
- Keep-awake while running (toggle in settings)

**User test gate**
- 1, 5, 15 minute stability runs
- BPM changes don’t stutter
- Screen off/on behavior

**Pass criteria**
- No audible drift or double-trigger under interaction

---

## Phase 2 — Advanced Metronome Features (TEST)
- Time signatures + subdivisions + triplets
- Accent pattern editor
- Swing %
- Tempo ramps (linear + stepped)
- Polyrhythm engine
- Training modes: gap click, random mute
- Per-layer gain + per-layer delay offsets
- Section-level revert to preset + global revert

---

## Phase 3 — Presets + Projects + Sessions scaffolding (TEST)
- IndexedDB schema
- Presets
- Projects
- Sessions with timestamps
- Quick-start sessions attachable to projects
- Export/import JSON (no audio yet)

---

## Phase 4 — Recording (segmented) + Count-in (TEST)
- Mic permission flow
- MediaRecorder segmented audio storage (Opus WebM)
- Extended count-in (bars)
- Store segments in IndexedDB
- Playback

---

## Phase 5 — Analysis pipeline: gate + filters + onsets + features (TEST)
- AudioWorklet analyzer
- Gain, noise gate (dB), high-pass, band-pass
- Onset detection
- Store hit events + features

---

## Phase 6 — Latency calibration + manual offset (TEST)
- Loopback calibration mode
- Manual offset slider
- Persist per device

---

## Phase 7 — Analytics v1 (TEST)
- Grid generator (incl swing + ramps)
- Map hits to grid
- Timing histograms
- Drift over time
- Subdivision breakdown
- Best/worst tempo buckets

---

## Phase 8 — Instrument profiling + classification (TEST)
- Categories: kick, snare, closed hat, cymbal, tom, unknown
- Training: 10–50 hits per class
- KNN classifier + confidence
- Unknown threshold

---

## Phase 9 — Per-instrument analytics + groove + dynamics (TEST)
- Per-instrument timing
- Groove/swing metrics
- Dynamics consistency
- Polyrhythm-aware analysis

---

## Phase 10 — Export/import ZIP (with audio) + polish (TEST)
- ZIP export/import
- Storage UI + cleanup
- Performance view polish
- Error hardening
