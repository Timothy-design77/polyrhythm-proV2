import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ensureAudioRunning } from '@/audio/audioContext';
import { MetronomeEngine } from '@/audio/metronomeEngine';
import { useAppStore } from '@/state/useAppStore';
import { requestWakeLock, releaseWakeLock } from '@/utils/wakeLock';
import './home.css';

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

type HoldState = {
  active: boolean;
  pointerId: number | null;
  startX: number;
  startY: number;
  startBpm: number;
  moved: boolean;
  holdStarted: boolean;
  holdStartTime: number;
  holdDelayTimer: number | null;
  intervalTimer: number | null;
  dir: 1 | -1;
};

type TapState = {
  active: boolean;
  pointerId: number | null;
  startX: number;
  startY: number;
  moved: boolean;
};

const MOVE_CANCEL_PX = 10;

export default function HomeMetronomePage() {
  const bpm = useAppStore((s) => s.bpm);
  const status = useAppStore((s) => s.status);
  const volume = useAppStore((s) => s.volume);
  const keepAwakeDefault = useAppStore((s) => s.keepAwakeDefault);
  const recordArmed = useAppStore((s) => s.recordArmed);
  const timeSigTop = useAppStore((s) => s.timeSigTop);

  const setStatus = useAppStore((s) => s.setStatus);
  const setVolume = useAppStore((s) => s.setVolume);
  const setRecordArmed = useAppStore((s) => s.setRecordArmed);
  const nudgeBpm = useAppStore((s) => s.nudgeBpm);
  const tapTempo = useAppStore((s) => s.tapTempo);
  const setBpm = useAppStore((s) => s.setBpm);
  const clearTap = useAppStore((s) => s.clearTap);

  const engineRef = useRef<MetronomeEngine | null>(null);

  const bpmDisplay = useMemo(() => String(bpm.toFixed(1)).replace(/\.0$/, ''), [bpm]);

  // ▲/▼ hold-safe state
  const holdRef = useRef<HoldState>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    startBpm: 120,
    moved: false,
    holdStarted: false,
    holdStartTime: 0,
    holdDelayTimer: null,
    intervalTimer: null,
    dir: 1,
  });

  // Safe tap state for jump buttons
  const tapRef = useRef<TapState>({
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    moved: false,
  });

  // Keypad modal
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [keypadValue, setKeypadValue] = useState<string>('');

  useEffect(() => {
    engineRef.current?.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    engineRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    return () => {
      cancelHold(false);
      void releaseWakeLock();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    const ac = await ensureAudioRunning();
    if (!engineRef.current) {
      engineRef.current = new MetronomeEngine(ac, { bpm, volume, accentEvery: clamp(timeSigTop, 1, 32) });
    }
    engineRef.current.setBpm(bpm);
    engineRef.current.setVolume(volume);
    engineRef.current.start();
    setStatus('running');
    clearTap();

    if (keepAwakeDefault && 'wakeLock' in navigator) {
      await requestWakeLock();
    }
  }

  async function stop() {
    engineRef.current?.stop();
    setStatus('stopped');
    await releaseWakeLock();
  }

  function onTapTempo() {
    void ensureAudioRunning();
    const next = tapTempo();
    if (next) setBpm(next);
  }

  // -------- Hold-safe ▲/▼ behavior (tap=0.5, hold ramps; scroll cancels + reverts) --------
  function cancelHold(revert: boolean) {
    const s = holdRef.current;
    if (s.holdDelayTimer) window.clearTimeout(s.holdDelayTimer);
    if (s.intervalTimer) window.clearInterval(s.intervalTimer);
    s.holdDelayTimer = null;
    s.intervalTimer = null;

    if (revert) setBpm(s.startBpm);

    s.active = false;
    s.pointerId = null;
    s.moved = false;
    s.holdStarted = false;
    s.holdStartTime = 0;
  }

  function startHold(dir: 1 | -1) {
    return (e: React.PointerEvent) => {
      e.preventDefault();

      const s = holdRef.current;
      cancelHold(false);

      s.active = true;
      s.pointerId = e.pointerId;
      s.startX = e.clientX;
      s.startY = e.clientY;
      s.startBpm = bpm;
      s.moved = false;
      s.holdStarted = false;
      s.dir = dir;

      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      // Delay starting hold so a scroll doesn't trigger anything
      s.holdDelayTimer = window.setTimeout(() => {
        // only start if still active and not moved
        if (!s.active || s.moved) return;
        s.holdStarted = true;
        s.holdStartTime = performance.now();

        const tick = () => {
          const t = performance.now() - s.holdStartTime;
          // ramp to fast changes
          let step = 0.5;
          if (t > 2400) step = 20;
          else if (t > 1800) step = 10;
          else if (t > 1000) step = 5;
          else if (t > 600) step = 2;
          else if (t > 300) step = 1;
          nudgeBpm(s.dir * step);
        };

        tick();
        s.intervalTimer = window.setInterval(tick, 110);
      }, 220);
    };
  }

  function onHoldMove(e: React.PointerEvent) {
    const s = holdRef.current;
    if (!s.active || s.pointerId !== e.pointerId) return;

    const dx = Math.abs(e.clientX - s.startX);
    const dy = Math.abs(e.clientY - s.startY);
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
      s.moved = true;
      // If hold already started (or about to), cancel and revert (prevents scroll changing BPM)
      cancelHold(true);
    }
  }

  function onHoldUp(e: React.PointerEvent) {
    const s = holdRef.current;
    if (!s.active || s.pointerId !== e.pointerId) return;

    // If user didn't move and hold didn't start, treat as tap
    if (!s.moved && !s.holdStarted) {
      nudgeBpm(s.dir * 0.5);
    }
    cancelHold(false);
  }

  // -------- Safe taps for Jump buttons (no action if user scrolls) --------
  function safeTapStart(e: React.PointerEvent) {
    tapRef.current = { active: true, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, moved: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function safeTapMove(e: React.PointerEvent) {
    const s = tapRef.current;
    if (!s.active || s.pointerId !== e.pointerId) return;
    const dx = Math.abs(e.clientX - s.startX);
    const dy = Math.abs(e.clientY - s.startY);
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) s.moved = true;
  }

  function safeTapEnd(action: () => void) {
    return (e: React.PointerEvent) => {
      const s = tapRef.current;
      if (!s.active || s.pointerId !== e.pointerId) return;
      if (!s.moved) action();
      tapRef.current.active = false;
      tapRef.current.pointerId = null;
    };
  }

  function openKeypad() {
    setKeypadValue(bpm.toFixed(1).replace(/\.0$/, ''));
    setKeypadOpen(true);
  }

  function appendDigit(d: string) {
    setKeypadValue((v) => {
      if (v === '0') return d;
      if (v.length >= 6) return v;
      return v + d;
    });
  }
  function appendDot() {
    setKeypadValue((v) => {
      if (v.includes('.')) return v;
      if (v.length === 0) return '0.';
      return v + '.';
    });
  }
  function backspace() {
    setKeypadValue((v) => v.slice(0, -1));
  }
  function clearAll() {
    setKeypadValue('');
  }
  function setFromKeypad() {
    const num = Number.parseFloat(keypadValue);
    if (!Number.isFinite(num)) return;
    setBpm(clamp(num, 20, 300));
    setKeypadOpen(false);
  }

  return (
    <div className="homeScroll">
      <div className="glass glassGloss center" style={{ padding: 18, borderRadius: 28 }}>
        <div className="glassLabel">BPM</div>
        <div style={{ marginTop: 6, fontSize: 88, fontWeight: 900, letterSpacing: -2, lineHeight: 0.95, fontVariantNumeric: 'tabular-nums' as any }}>
          {bpmDisplay}
        </div>
        <div style={{ marginTop: 10 }} className="glassLabel">
          ▲/▼ tap or hold • Jump • Keypad exact entry (scroll won’t trigger BPM changes)
        </div>
      </div>

      {status === 'running' ? (
        <button className="glassBtn glassBtnDanger" onClick={() => void stop()}>
          Stop
        </button>
      ) : (
        <button className="glassBtn glassBtnPrimary" onClick={() => void start()}>
          {recordArmed ? 'Start Session' : 'Start Metronome'}
        </button>
      )}

      <button className={'glassBtn ' + (recordArmed ? 'glassBtnOn' : '')} onClick={() => setRecordArmed(!recordArmed)} aria-pressed={recordArmed}>
        {recordArmed ? '● Recording Armed' : 'Record (arm)'}
      </button>

      {/* Compact Set + Jump moved UP (right here) */}
      <div className="glass glassPanel">
        <div className="glassRow" style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 900 }}>Tempo Set</div>
          <div className="glassLabel">Quick + exact</div>
        </div>

        <button
          className="glassBtn glassBtnSmall glassBtnPrimary"
          onPointerDown={safeTapStart}
          onPointerMove={safeTapMove}
          onPointerUp={safeTapEnd(openKeypad)}
          onPointerCancel={() => (tapRef.current.active = false)}
        >
          Set BPM (Keypad)
        </button>

        <div style={{ height: 10 }} />
        <div className="grid3">
          {[-50, -25, -10].map((d) => (
            <button
              key={d}
              className="glassBtn glassBtnSmall"
              onPointerDown={safeTapStart}
              onPointerMove={safeTapMove}
              onPointerUp={safeTapEnd(() => nudgeBpm(d))}
              onPointerCancel={() => (tapRef.current.active = false)}
            >
              {d}
            </button>
          ))}
        </div>
        <div style={{ height: 10 }} />
        <div className="grid3">
          {[+10, +25, +50].map((d) => (
            <button
              key={d}
              className="glassBtn glassBtnSmall"
              onPointerDown={safeTapStart}
              onPointerMove={safeTapMove}
              onPointerUp={safeTapEnd(() => nudgeBpm(d))}
              onPointerCancel={() => (tapRef.current.active = false)}
            >
              +{d}
            </button>
          ))}
        </div>
      </div>

      {/* Tempo controls */}
      <div className="stack">
        <button
          className="glassBtn"
          onPointerDown={startHold(+1)}
          onPointerMove={onHoldMove}
          onPointerUp={onHoldUp}
          onPointerCancel={() => cancelHold(true)}
          onPointerLeave={() => cancelHold(false)}
        >
          ▲ Tempo Up
        </button>

        <button className="glassBtn" onClick={onTapTempo}>
          Tap Tempo
        </button>

        <button
          className="glassBtn"
          onPointerDown={startHold(-1)}
          onPointerMove={onHoldMove}
          onPointerUp={onHoldUp}
          onPointerCancel={() => cancelHold(true)}
          onPointerLeave={() => cancelHold(false)}
        >
          ▼ Tempo Down
        </button>
      </div>

      <div className="glass glassPanel">
        <div className="glassRow">
          <div className="glassLabel">Volume</div>
          <div className="glassLabel">{Math.round(volume * 100)}%</div>
        </div>
        <input className="glassRange" type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
      </div>

      <div className="stack" style={{ marginTop: 4 }}>
        <Link className="glassBtn" to="/projects">Projects</Link>
        <Link className="glassBtn" to="/settings">Settings</Link>
      </div>

      {keypadOpen && (
        <div className="modalBackdrop" onClick={() => setKeypadOpen(false)}>
          <div className="modalCard glassGloss" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 14 }}>
              <div className="glassRow">
                <div className="glassLabel">Set BPM</div>
                <button className="glassBtn glassBtnSmall" style={{ width: 'auto', padding: '10px 12px' }} onClick={() => setKeypadOpen(false)}>
                  Close
                </button>
              </div>
            </div>

            <div style={{ padding: 14, paddingTop: 0 }}>
              <div className="keypadDisplay">{keypadValue.length ? keypadValue : '—'}</div>
              <div className="glassLabel" style={{ marginTop: 10, textAlign: 'center' }}>Range 20–300 • 0.5 precision</div>
            </div>

            <div className="keypadGrid">
              {['1','2','3','4','5','6','7','8','9'].map((d) => (
                <button key={d} className="glassBtn glassBtnSmall" onClick={() => appendDigit(d)}>{d}</button>
              ))}
              <button className="glassBtn glassBtnSmall" onClick={appendDot}>.</button>
              <button className="glassBtn glassBtnSmall" onClick={() => appendDigit('0')}>0</button>
              <button className="glassBtn glassBtnSmall" onClick={backspace}>⌫</button>
            </div>

            <div className="keypadActions">
              <button className="glassBtn glassBtnSmall" onClick={clearAll}>Clear</button>
              <button className="glassBtn glassBtnSmall glassBtnPrimary" onClick={setFromKeypad}>Set</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
