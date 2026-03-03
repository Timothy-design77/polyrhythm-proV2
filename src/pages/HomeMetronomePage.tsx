import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ensureAudioRunning, getAudioContext } from '@/audio/audioContext';
import { MetronomeEngine } from '@/audio/metronomeEngine';
import { useAppStore } from '@/state/useAppStore';
import { isWakeLocked, releaseWakeLock, requestWakeLock } from '@/utils/wakeLock';

type ScrubState = {
  active: boolean;
  pointerId: number | null;
  startY: number;
  startBpm: number;
};

export default function HomeMetronomePage() {
  const bpm = useAppStore((s) => s.bpm);
  const status = useAppStore((s) => s.status);
  const volume = useAppStore((s) => s.volume);
  const keepAwakeDefault = useAppStore((s) => s.keepAwakeDefault);
  const recordArmed = useAppStore((s) => s.recordArmed);

  const setBpm = useAppStore((s) => s.setBpm);
  const nudgeBpm = useAppStore((s) => s.nudgeBpm);
  const setStatus = useAppStore((s) => s.setStatus);
  const setVolume = useAppStore((s) => s.setVolume);
  const tapTempo = useAppStore((s) => s.tapTempo);
  const clearTap = useAppStore((s) => s.clearTap);
  const setRecordArmed = useAppStore((s) => s.setRecordArmed);

  const engineRef = useRef<MetronomeEngine | null>(null);
  const [pulse, setPulse] = useState(false);
  const [wakeSupported] = useState(() => 'wakeLock' in navigator);

  const scrubRef = useRef<ScrubState>({ active: false, pointerId: null, startY: 0, startBpm: 120 });
  const holdTimerRef = useRef<number | null>(null);

  const bpmDisplay = useMemo(() => String(bpm.toFixed(1)).replace(/\.0$/, ''), [bpm]);

  useEffect(() => {
    engineRef.current?.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    engineRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    return () => {
      void releaseWakeLock();
      if (holdTimerRef.current) window.clearInterval(holdTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const onVis = async () => {
      if (document.visibilityState === 'visible' && status === 'running' && keepAwakeDefault && wakeSupported) {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [status, keepAwakeDefault, wakeSupported]);

  const start = async () => {
    const ac = await ensureAudioRunning();

    if (!engineRef.current) {
      engineRef.current = new MetronomeEngine(
        ac,
        { bpm, volume, accentEvery: 4 },
        {
          onTickScheduled: (tick) => {
            const now = ac.currentTime;
            const delayMs = Math.max(0, (tick.when - now) * 1000);
            window.setTimeout(() => {
              setPulse(true);
              window.setTimeout(() => setPulse(false), 70);
            }, delayMs);
          },
        }
      );
    }

    engineRef.current.setBpm(bpm);
    engineRef.current.setVolume(volume);
    engineRef.current.start();
    setStatus('running');
    clearTap();

    if (keepAwakeDefault && wakeSupported) {
      await requestWakeLock();
    }

    // Note: actual recording will be wired in Phase 4.
    // recordArmed is already front-and-center so the workflow feels right.
  };

  const stop = async () => {
    engineRef.current?.stop();
    setStatus('stopped');
    await releaseWakeLock();
  };

  const onTap = () => {
    void ensureAudioRunning();
    const nextBpm = tapTempo();
    if (nextBpm) setBpm(nextBpm);
  };

  const acState = useMemo(() => {
    const ac = (getAudioContext as any) ? getAudioContext() : null;
    return ac?.state ?? 'unknown';
  }, [status]);

  const startHold = (delta: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    nudgeBpm(delta);
    if (holdTimerRef.current) window.clearInterval(holdTimerRef.current);
    holdTimerRef.current = window.setInterval(() => nudgeBpm(delta), 110);
  };

  const stopHold = () => {
    if (holdTimerRef.current) {
      window.clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const onScrubDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    scrubRef.current = {
      active: true,
      pointerId: e.pointerId,
      startY: e.clientY,
      startBpm: bpm,
    };
  };

  const onScrubMove = (e: React.PointerEvent) => {
    if (!scrubRef.current.active) return;
    if (scrubRef.current.pointerId !== e.pointerId) return;

    // sensitivity: ~20px = 1 BPM (rounded to 0.5 in store)
    const dy = e.clientY - scrubRef.current.startY;
    const next = scrubRef.current.startBpm + (-dy * 0.05);
    setBpm(next);
  };

  const onScrubUp = () => {
    scrubRef.current.active = false;
    scrubRef.current.pointerId = null;
  };

  return (
    <div className="home">
      <div className="homeStack">
        <div className="homeHeader">
          <div>
            <div className="muted">Quick Start</div>
            <div className="homeTitle">Metronome</div>
          </div>

          <div className="homeHeaderRight">
            <button
              className={'pillBtn ' + (recordArmed ? 'pillOn' : '')}
              onClick={() => setRecordArmed(!recordArmed)}
              aria-pressed={recordArmed}
              title="Arm recording (capture arrives in Phase 4)"
            >
              {recordArmed ? '● Record' : 'Record'}
            </button>

            <Link className="pillBtn" to="/settings">
              Settings
            </Link>
          </div>
        </div>

        <div className="card homeCard">
          <div
            className={'bpmBox ' + (pulse ? 'bpmPulse' : '')}
            style={{ touchAction: 'none' }}
            onPointerDown={onScrubDown}
            onPointerMove={onScrubMove}
            onPointerUp={onScrubUp}
            onPointerCancel={onScrubUp}
          >
            <div className="bpmLabel">BPM</div>
            <div className="bpmValue">{bpmDisplay}</div>
            <div className="bpmHint">Drag up/down to scrub • 0.5 BPM precision • Tap tempo below</div>
          </div>

          <div className="tempoSlider">
            <input
              className="range"
              type="range"
              min={20}
              max={300}
              step={0.5}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              aria-label="Tempo slider"
            />
            <div className="tempoSliderMeta">
              <span className="muted">20</span>
              <span className="muted">300</span>
            </div>
          </div>

          <div className="grid3">
            <button className="btn btnBig" onPointerDown={startHold(-0.5)} onPointerUp={stopHold} onPointerCancel={stopHold} onPointerLeave={stopHold}>
              −0.5
            </button>
            <button className="btn btnBig" onClick={onTap}>
              Tap
            </button>
            <button className="btn btnBig" onPointerDown={startHold(+0.5)} onPointerUp={stopHold} onPointerCancel={stopHold} onPointerLeave={stopHold}>
              +0.5
            </button>
          </div>

          <div className="grid2">
            <button className="btn" onPointerDown={startHold(-5)} onPointerUp={stopHold} onPointerCancel={stopHold} onPointerLeave={stopHold}>
              −5
            </button>
            <button className="btn" onPointerDown={startHold(+5)} onPointerUp={stopHold} onPointerCancel={stopHold} onPointerLeave={stopHold}>
              +5
            </button>
          </div>

          <div className="ctaStack">
            {status === 'running' ? (
              <button className="btn btnBig btnDanger btnWide" onClick={() => void stop()}>
                Stop
              </button>
            ) : (
              <button className="btn btnBig btnPrimary btnWide" onClick={() => void start()}>
                {recordArmed ? 'Start Session' : 'Start Metronome'}
              </button>
            )}

            <div className="kpiBox">
              <div className="kpiLabel">Volume</div>
              <input
                className="range"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="Volume"
              />
            </div>

            <div className="kpi">
              <div className="kpiBox">
                <div className="kpiLabel">Audio state</div>
                <div className="kpiValue">{acState}</div>
              </div>
              <div className="kpiBox">
                <div className="kpiLabel">Keep awake</div>
                <div className="kpiValue">
                  {wakeSupported ? (isWakeLocked() ? 'Locked' : keepAwakeDefault ? 'Armed' : 'Off') : 'Not supported'}
                </div>
              </div>
            </div>

            <div className="grid2">
              <Link className="btn btnWide" to="/projects">
                Projects
              </Link>
              <Link className="btn btnWide" to="/profiles">
                Profiles
              </Link>
            </div>

            <div className="muted tiny">
              Recording capture + analysis get wired in Phase 4+. UI is record-first now so it won’t require a redesign later.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
