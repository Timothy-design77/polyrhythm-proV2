export type Tick = {
  /** beat index since start (0-based) */
  beat: number;
  /** time in AudioContext seconds when this tick was scheduled */
  when: number;
};

export type SchedulerConfig = {
  bpm: number;
  accentEvery?: number; // e.g. 4 for 4/4 downbeat accent
};

export type SchedulerCallbacks = {
  onScheduledTick?: (tick: Tick) => void;
};

export class LookaheadScheduler {
  private readonly ac: AudioContext;
  private readonly scheduleAheadTimeSec: number;
  private readonly intervalMs: number;
  private timer: number | null = null;

  private cfg: SchedulerConfig;
  private beat: number = 0;
  private nextNoteTime: number = 0;
  private callbacks: SchedulerCallbacks;

  private scheduleFn: (when: number, strength: number) => void;

  constructor(opts: {
    ac: AudioContext;
    config: SchedulerConfig;
    scheduleAheadTimeSec?: number;
    intervalMs?: number;
    scheduleFn: (when: number, strength: number) => void;
    callbacks?: SchedulerCallbacks;
  }) {
    this.ac = opts.ac;
    this.cfg = opts.config;
    this.scheduleFn = opts.scheduleFn;
    this.callbacks = opts.callbacks ?? {};
    this.scheduleAheadTimeSec = opts.scheduleAheadTimeSec ?? 0.1;
    this.intervalMs = opts.intervalMs ?? 25;
  }

  updateConfig(partial: Partial<SchedulerConfig>) {
    this.cfg = { ...this.cfg, ...partial };
  }

  start() {
    if (this.timer !== null) return;
    this.beat = 0;
    // Start slightly in the future to avoid scheduling in the past.
    this.nextNoteTime = this.ac.currentTime + 0.05;

    this.timer = window.setInterval(() => this.schedulerLoop(), this.intervalMs);
  }

  stop() {
    if (this.timer === null) return;
    window.clearInterval(this.timer);
    this.timer = null;
  }

  private schedulerLoop() {
    const secondsPerBeat = 60.0 / Math.max(20, Math.min(300, this.cfg.bpm));
    while (this.nextNoteTime < this.ac.currentTime + this.scheduleAheadTimeSec) {
      const accentEvery = this.cfg.accentEvery ?? 4;
      const isAccent = accentEvery > 0 && this.beat % accentEvery === 0;
      const strength = isAccent ? 1 : 0.7;

      this.scheduleFn(this.nextNoteTime, strength);
      this.callbacks.onScheduledTick?.({ beat: this.beat, when: this.nextNoteTime });

      this.nextNoteTime += secondsPerBeat;
      this.beat += 1;
    }
  }
}
