import React, { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ensureAudioRunning } from '@/audio/audioContext';
import { MetronomeEngine } from '@/audio/metronomeEngine';
import { useAppStore } from '@/state/useAppStore';
import { requestWakeLock, releaseWakeLock } from '@/utils/wakeLock';
import './home.css';

export default function HomeMetronomePage() {
  const bpm = useAppStore((s) => s.bpm);
  const status = useAppStore((s) => s.status);
  const volume = useAppStore((s) => s.volume);
  const keepAwakeDefault = useAppStore((s) => s.keepAwakeDefault);
  const recordArmed = useAppStore((s) => s.recordArmed);

  const setStatus = useAppStore((s) => s.setStatus);
  const setVolume = useAppStore((s) => s.setVolume);
  const setRecordArmed = useAppStore((s) => s.setRecordArmed);
  const nudgeBpm = useAppStore((s) => s.nudgeBpm);
  const tapTempo = useAppStore((s) => s.tapTempo);
  const setBpm = useAppStore((s) => s.setBpm);
  const clearTap = useAppStore((s) => s.clearTap);

  const engineRef = useRef<MetronomeEngine | null>(null);

  const holdTimerRef = useRef<number | null>(null);
  const holdStartRef = useRef<number>(0);
  const holdDirRef = useRef<1 | -1>(1);

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
      engineRef.current = new MetronomeEngine(ac, { bpm, volume, accentEvery: 4 });
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
        // Tap = 0.5 BPM, hold accelerates to 5 BPM
        let step = 0.5;
        if (t > 1400) step = 5;
        else if (t > 900) step = 2;
        else if (t > 450) step = 1;
        nudgeBpm(holdDirRef.current * step);
      };

      tick();
      holdTimerRef.current = window.setInterval(tick, 120);
    };
  }

  function stopHold() {
    if (holdTimerRef.current) {
      window.clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  return (
    <div className="homeScroll">
      {/* Nothing above the BPM block */}
      <div className="glass glassGloss center" style={{ padding: 18, borderRadius: 28 }}>
        <div className="glassLabel">BPM</div>
        <div style={{ marginTop: 6, fontSize: 90, fontWeight: 900, letterSpacing: -2, lineHeight: 0.95, fontVariantNumeric: 'tabular-nums' as any }}>
          {bpmDisplay}
        </div>
        <div style={{ marginTop: 10 }} className="glassLabel">
          No swipe controls. Use ▲/▼ (tap or hold) • 0.5 BPM precision • Tap Tempo
        </div>
      </div>

      {/* Start/Stop: full width */}
      {status === 'running' ? (
        <button className="glassBtn glassBtnDanger" onClick={() => void stop()}>
          Stop
        </button>
      ) : (
        <button className="glassBtn glassBtnPrimary" onClick={() => void start()}>
          {recordArmed ? 'Start Session' : 'Start Metronome'}
        </button>
      )}

      {/* Record: directly below Start */}
      <button className={'glassBtn ' + (recordArmed ? 'glassBtnOn' : '')} onClick={() => setRecordArmed(!recordArmed)} aria-pressed={recordArmed}>
        {recordArmed ? '● Recording Armed' : 'Record (arm)'}
      </button>

      {/* Tempo controls: vertical buttons only */}
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

      {/* Volume: horizontal bar (allowed) */}
      <div className="glass glassPanel">
        <div className="glassRow">
          <div className="glassLabel">Volume</div>
          <div className="glassLabel">{Math.round(volume * 100)}%</div>
        </div>
        <input className="glassRange" type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
      </div>

      {/* Scroll down: Projects + Settings at bottom */}
      <div className="stack" style={{ marginTop: 4 }}>
        <Link className="glassBtn" to="/projects">
          Projects
        </Link>
        <Link className="glassBtn" to="/settings">
          Settings
        </Link>
      </div>
    </div>
  );
}
