import { ClickSynth } from '@/audio/clickSynth';
import { LookaheadScheduler, Tick } from '@/audio/scheduler';

export type MetronomeEngineConfig = {
  bpm: number;
  volume: number;
  accentEvery?: number;
};

export type MetronomeEngineCallbacks = {
  onTickScheduled?: (tick: Tick) => void;
};

export class MetronomeEngine {
  private readonly ac: AudioContext;
  private readonly synth: ClickSynth;
  private readonly scheduler: LookaheadScheduler;

  constructor(ac: AudioContext, initial: MetronomeEngineConfig, cb?: MetronomeEngineCallbacks) {
    this.ac = ac;
    this.synth = new ClickSynth(ac);
    this.synth.setVolume(initial.volume);

    this.scheduler = new LookaheadScheduler({
      ac,
      config: { bpm: initial.bpm, accentEvery: initial.accentEvery ?? 4 },
      scheduleFn: (when, strength) => this.synth.click(when, strength),
      callbacks: {
        onScheduledTick: (tick) => cb?.onTickScheduled?.(tick)
      }
    });
  }

  setBpm(bpm: number) {
    this.scheduler.updateConfig({ bpm });
  }

  setVolume(v: number) {
    this.synth.setVolume(v);
  }

  setAccentEvery(n: number) {
    this.scheduler.updateConfig({ accentEvery: n });
  }

  start() {
    this.scheduler.start();
  }

  stop() {
    this.scheduler.stop();
  }
}
