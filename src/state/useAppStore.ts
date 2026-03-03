import { create } from 'zustand';

export type MetronomeStatus = 'stopped' | 'running';

type AppState = {
  bpm: number;
  status: MetronomeStatus;
  volume: number; // 0..1
  keepAwakeDefault: boolean;

  lastTapMs?: number;
  tapIntervalsMs: number[];

  setBpm: (bpm: number) => void;
  nudgeBpm: (delta: number) => void;
  setStatus: (status: MetronomeStatus) => void;
  setVolume: (v: number) => void;
  setKeepAwakeDefault: (v: boolean) => void;
  tapTempo: () => number | null;
  clearTap: () => void;
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const useAppStore = create<AppState>((set, get) => ({
  bpm: 120,
  status: 'stopped',
  volume: 0.8,
  keepAwakeDefault: true,

  tapIntervalsMs: [],

  setBpm: (bpm) => set({ bpm: clamp(Math.round(bpm), 20, 300) }),
  nudgeBpm: (delta) => set({ bpm: clamp(get().bpm + delta, 20, 300) }),
  setStatus: (status) => set({ status }),
  setVolume: (v) => set({ volume: clamp(v, 0, 1) }),
  setKeepAwakeDefault: (v) => set({ keepAwakeDefault: v }),

  tapTempo: () => {
    const now = performance.now();
    const lastTap = get().lastTapMs;

    // If user waited too long, restart tapping window.
    if (lastTap && now - lastTap > 2000) {
      set({ lastTapMs: now, tapIntervalsMs: [] });
      return null;
    }

    if (!lastTap) {
      set({ lastTapMs: now, tapIntervalsMs: [] });
      return null;
    }

    const interval = now - lastTap;
    const nextIntervals = [...get().tapIntervalsMs, interval].slice(-6); // last up to 6 intervals
    set({ lastTapMs: now, tapIntervalsMs: nextIntervals });

    if (nextIntervals.length < 2) return null;

    // Robust average: drop min and max if enough samples.
    const sorted = [...nextIntervals].sort((a, b) => a - b);
    const trimmed = sorted.length >= 4 ? sorted.slice(1, -1) : sorted;
    const avgMs = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    const bpm = 60000 / avgMs;
    return clamp(Math.round(bpm), 20, 300);
  },

  clearTap: () => set({ lastTapMs: undefined, tapIntervalsMs: [] })
}));
