export class ClickSynth {
  private readonly ac: AudioContext;
  private readonly master: GainNode;

  constructor(ac: AudioContext) {
    this.ac = ac;
    this.master = ac.createGain();
    this.master.gain.value = 0.8;
    this.master.connect(ac.destination);
  }

  setVolume(v: number) {
    this.master.gain.setTargetAtTime(v, this.ac.currentTime, 0.01);
  }

  /**
   * Schedule a click at an absolute AudioContext time.
   */
  click(when: number, strength: number = 1) {
    // Oscillator click: short sine burst with quick envelope.
    const osc = this.ac.createOscillator();
    const gain = this.ac.createGain();

    // A snappy click is mostly transient; we do a short burst.
    const freq = strength >= 0.9 ? 1760 : 1320;
    osc.frequency.setValueAtTime(freq, when);
    osc.type = 'sine';

    // Envelope
    const peak = 0.9 * strength;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.03);

    osc.connect(gain);
    gain.connect(this.master);

    osc.start(when);
    osc.stop(when + 0.04);
  }
}
