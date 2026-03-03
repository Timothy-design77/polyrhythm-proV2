import { create } from 'zustand';

export type MetronomeStatus = 'stopped' | 'running';
export type Subdivision = 'quarters' | '8ths' | 'triplets' | '16ths';

type AppState = {
  // Core
  bpm: number;
  status: MetronomeStatus;
  volume: number; // 0..1
  keepAwakeDefault: boolean;

  // Recording workflow (actual recording comes later)
  recordArmed: boolean;

  // Rhythm settings (UI now; more engine wiring in Phase 2)
  timeSigTop: number;      // e.g., 4 in 4/4
  timeSigBottom: 4 | 8 | 16;
  subdivision: Subdivision;
  swingEnabled: boolean;
  swingPercent: number;    // 0..75
  polyEnabled: boolean;
  polyA: number;
  polyB: number;

  lastTapMs?: number;
  tapIntervalsMs: number[];

  // Actions
  setBpm: (bpm: number) => void;
  nudgeBpm: (delta: number) => void;

  setStatus: (status: MetronomeStatus) => void;
  setVolume: (v: number) => void;
  setKeepAwakeDefault: (v: boolean) => void;
  setRecordArmed: (v: boolean) => void;

  setTimeSigTop: (v: number) => void;
  setTimeSigBottom: (v: 4 | 8 | 16) => void;
  setSubdivision: (v: Subdivision) => void;
  setSwingEnabled: (v: boolean) => void;
  setSwingPercent: (v: number) => void;
  setPolyEnabled: (v: boolean) => void;
  setPolyA: (v: number) => void;
  setPolyB: (v: number) => void;
  applyPolyPreset: (a: number, b: number) => void;

  tapTempo: () => number | null;
  clearTap: () => void;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const roundToStep = (n: number, step: number) => Math.round(n / step) * step;

export const useAppStore = create<AppState>((set, get) => ({
  bpm: 120,
  status: 'stopped',
  volume: 0.8,
  keepAwakeDefault: true,
  recordArmed: true,

  timeSigTop: 4,
  timeSigBottom: 4,
  subdivision: 'quarters',
  swingEnabled: false,
  swingPercent: 0,
  polyEnabled: false,
  polyA: 3,
  polyB: 2,

  tapIntervalsMs: [],

  setBpm: (bpm) => set({ bpm: clamp(roundToStep(bpm, 0.5), 20, 300) }),
  nudgeBpm: (delta) => set({ bpm: clamp(roundToStep(get().bpm + delta, 0.5), 20, 300) }),

  setStatus: (status) => set({ status }),
  setVolume: (v) => set({ volume: clamp(v, 0, 1) }),
  setKeepAwakeDefault: (v) => set({ keepAwakeDefault: v }),
  setRecordArmed: (v) => set({ recordArmed: v }),

  setTimeSigTop: (v) => set({ timeSigTop: clamp(Math.round(v), 1, 32) }),
  setTimeSigBottom: (v) => set({ timeSigBottom: v }),
  setSubdivision: (v) => set({ subdivision: v }),
  setSwingEnabled: (v) => set({ swingEnabled: v }),
  setSwingPercent: (v) => set({ swingPercent: clamp(v, 0, 75) }),
  setPolyEnabled: (v) => set({ polyEnabled: v }),
  setPolyA: (v) => set({ polyA: clamp(Math.round(v), 1, 32) }),
  setPolyB: (v) => set({ polyB: clamp(Math.round(v), 1, 32) }),
  applyPolyPreset: (a, b) => set({ polyEnabled: true, polyA: clamp(Math.round(a), 1, 32), polyB: clamp(Math.round(b), 1, 32) }),

  tapTempo: () => {
    const now = performance.now();
    const lastTap = get().lastTapMs;

    if (lastTap && now - lastTap > 2000) {
      set({ lastTapMs: now, tapIntervalsMs: [] });
      return null;
    }
    if (!lastTap) {
      set({ lastTapMs: now, tapIntervalsMs: [] });
      return null;
    }

    const interval = now - lastTap;
    const nextIntervals = [...get().tapIntervalsMs, interval].slice(-6);
    set({ lastTapMs: now, tapIntervalsMs: nextIntervals });

    if (nextIntervals.length < 2) return null;

    const sorted = [...nextIntervals].sort((a, b) => a - b);
    const trimmed = sorted.length >= 4 ? sorted.slice(1, -1) : sorted;
    const avgMs = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;

    const bpm = 60000 / avgMs;
    return clamp(roundToStep(bpm, 0.5), 20, 300);
  },

  clearTap: () => set({ lastTapMs: undefined, tapIntervalsMs: [] }),
}));
