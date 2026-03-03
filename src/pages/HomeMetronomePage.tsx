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

  // Hold accel for ▲/▼
  const holdTimerRef = useRef<number | null>(null);
  const holdStartRef = useRef<number>(0);
  const holdDirRef = useRef<1 | -1>(1);

  // Keypad modal
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [keypadValue, setKeypadValue] = useState<string>('');

  const bpmDisplay = useMemo(() => String(bpm.toFixed(1)).replace(/\.0$/, ''), [bpm]);

  useEffect(() => {
    engineRef.current?.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    engineRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    return () => {
      stopHold();
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

  function startHold(dir: 1 | -1) {
    return (e: React.PointerEvent) => {
      e.preventDefault();
      stopHold();
      holdDirRef.current = dir;
      holdStartRef.current = performance.now();

      const tick = () => {
        const t = performance.now() - holdStartRef.current;
        let step = 0.5;
        if (t > 2400) step = 20;
        else if (t > 1800) step = 10;
        else if (t > 1000) step = 5;
        else if (t > 600) step = 2;
        else if (t > 300) step = 1;
        nudgeBpm(holdDirRef.current * step);
      };

      tick();
      holdTimerRef.current = window.setInterval(tick, 110);
    };
  }

  function stopHold() {
    if (holdTimerRef.current) {
      window.clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function jump(delta: number) {
    nudgeBpm(delta);
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
        <div style={{ marginTop: 6, fontSize: 90, fontWeight: 900, letterSpacing: -2, lineHeight: 0.95, fontVariantNumeric: 'tabular-nums' as any }}>
          {bpmDisplay}
        </div>
        <div style={{ marginTop: 10 }} className="glassLabel">
          ▲/▼ tap or hold to fly • Jump buttons • Keypad exact entry
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

      <div className="stack">
        <button className="glassBtn" onPointerDown={startHold(+1)} onPointerUp={stopHold} onPointerCancel={stopHold} onPointerLeave={stopHold}>
          ▲ Tempo Up
        </button>

        <button className="glassBtn" onClick={onTapTempo}>
          Tap Tempo
        </button>

        <button className="glassBtn" onPointerDown={startHold(-1)} onPointerUp={stopHold} onPointerCancel={stopHold} onPointerLeave={stopHold}>
          ▼ Tempo Down
        </button>
      </div>

      <div className="glass glassPanel">
        <div className="glassLabel" style={{ fontWeight: 900, marginBottom: 10 }}>Jump</div>

        <button className="glassBtn glassBtnSmall glassBtnPrimary" onClick={openKeypad}>
          Set BPM (Keypad)
        </button>

        <div style={{ height: 10 }} />
        <div className="grid3">
          <button className="glassBtn glassBtnSmall" onClick={() => jump(-50)}>-50</button>
          <button className="glassBtn glassBtnSmall" onClick={() => jump(-25)}>-25</button>
          <button className="glassBtn glassBtnSmall" onClick={() => jump(-10)}>-10</button>
        </div>

        <div style={{ height: 10 }} />
        <div className="grid3">
          <button className="glassBtn glassBtnSmall" onClick={() => jump(+10)}>+10</button>
          <button className="glassBtn glassBtnSmall" onClick={() => jump(+25)}>+25</button>
          <button className="glassBtn glassBtnSmall" onClick={() => jump(+50)}>+50</button>
        </div>
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
