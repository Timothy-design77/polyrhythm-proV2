# Metronome Lab — Detailed Blueprint (Source of Truth)

This document defines the end-state architecture and implementation rules for the full app (all phases). It is written so a new engineer can pick up the repo with zero context.

## Product
- Local-only, offline-capable **PWA** running in Chrome on Android.
- Quick-start metronome home. Projects optional and reachable in ≤3 actions.
- Pro features: odd meters, subdivisions, swing, tempo ramps, programmable accents, polyrhythms, training modes.
- Differentiator: record drumming, detect hits, classify into instrument categories using learned profiles, and produce timing/groove/dynamics analytics.

## Defaults
- Target sample rate: **48kHz** (use device default; resample in analysis if needed).
- Recording storage format: **Opus in WebM** segments.
- Keep awake: enabled during metronome/recording by default (toggleable).

## Stack
- TypeScript, React, Vite
- Web Audio API scheduling (lookahead)
- AudioWorklet for gating/onsets/features
- IndexedDB for storage

## Storage Model (IndexedDB)
Object stores (planned): settings, presets, projects, sessions, audioSegments, hitEvents, profiles, analytics.

Key idea: "unlimited" recording via fixed-size **segments** stored as Blobs.

## Audio Engine
- Lookahead scheduler (25ms interval, 100ms lookahead)
- Schedule clicks by absolute `AudioContext.currentTime`
- UI visuals subscribe to scheduled ticks; UI never drives timing.

## Recording
- `getUserMedia` with auto processing disabled (echoCancellation/noiseSuppression/autoGainControl false)
- `MediaRecorder` produces `audio/webm;codecs=opus` blobs
- Segment rotation every ~20s (configurable)

## Analysis Pipeline
Mic stream → Gain + HPF + optional BandPass → AudioWorklet:
- Noise gate (dB threshold with hysteresis)
- Onset detection (energy derivative or spectral flux)
- Feature extraction (compact 30–60 length vector)

Store hitEvents: tMs, amp proxy, feature vector.

## Calibration
Loopback calibration: play click → record mic → detect click onsets → median offset + stdev.
Manual offset slider added to effective offset.

## Classification
Instrument categories: kick, snare, hihat_closed, cymbal, tom, unknown.
Training: 10–50 hits per class.
Classifier v1: weighted KNN + confidence; below threshold => unknown.

## Analytics
- Map hits to expected grid (metronome and polyrhythm aware)
- Timing: bias, std dev, percentiles, histograms
- Drift: windowed mean error
- Groove: swing ratio metrics
- Dynamics: per-instrument amplitude consistency
- Best/worst tempo buckets

## UX Rules
- Performance view: large controls, minimal clutter.
- Every advanced panel supports “Revert to preset” per section + global.
- Data export/import: ZIP containing manifest.json + audio blobs.

## Phases
See `docs/PLAN.md`.
