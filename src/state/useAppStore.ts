import { create } from 'zustand';

export type MetronomeStatus = 'stopped' | 'running';

type AppState = {
  bpm: number;
  status: MetronomeStatus;
  volume: number; // 0..1
  keepAwakeDefault: boolean;

  // UI: “record-first” workflow (actual recording arrives in Phase 4)
  recordArmed: boolean;

  lastTapMs?: number;
  tapIntervalsMs: number[];

  setBpm: (bpm: number) => void;
  nudgeBpm: (delta: number) => void;
  setStatus: (status: MetronomeStatus) => void;
  setVolume: (v: number) => void;
  setKeepAwakeDefault: (v: boolean) => void;
  setRecordArmed: (v: boolean) => void;

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
  recordArmed: true, // record-forward default per your preference
  tapIntervalsMs: [],

  setBpm: (bpm) => set({ bpm: clamp(roundToStep(bpm, 0.5), 20, 300) }),
  nudgeBpm: (delta) => set({ bpm: clamp(roundToStep(get().bpm + delta, 0.5), 20, 300) }),

  setStatus: (status) => set({ status }),
  setVolume: (v) => set({ volume: clamp(v, 0, 1) }),
  setKeepAwakeDefault: (v) => set({ keepAwakeDefault: v }),
  setRecordArmed: (v) => set({ recordArmed: v }),

  tapTempo: () => {
    const now = performance.now();
    const lastTap = get().lastTapMs;

    // Restart window if user paused too long
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

    // Robust average: drop min/max if enough samples
    const sorted = [...nextIntervals].sort((a, b) => a - b);
    const trimmed = sorted.length >= 4 ? sorted.slice(1, -1) : sorted;
    const avgMs = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;

    const bpm = 60000 / avgMs;
    return clamp(roundToStep(bpm, 0.5), 20, 300);
  },

  clearTap: () => set({ lastTapMs: undefined, tapIntervalsMs: [] }),
}));
