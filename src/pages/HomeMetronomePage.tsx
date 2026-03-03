import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ensureAudioRunning, getAudioContext } from '@/audio/audioContext';
import { MetronomeEngine } from '@/audio/metronomeEngine';
import { useAppStore } from '@/state/useAppStore';
import { isWakeLocked, releaseWakeLock, requestWakeLock } from '@/utils/wakeLock';

export default function HomeMetronomePage() {
  const bpm = useAppStore((s) => s.bpm);
  const status = useAppStore((s) => s.status);
  const volume = useAppStore((s) => s.volume);
  const keepAwakeDefault = useAppStore((s) => s.keepAwakeDefault);
  const setBpm = useAppStore((s) => s.setBpm);
  const nudgeBpm = useAppStore((s) => s.nudgeBpm);
  const setStatus = useAppStore((s) => s.setStatus);
  const setVolume = useAppStore((s) => s.setVolume);
  const tapTempo = useAppStore((s) => s.tapTempo);
  const clearTap = useAppStore((s) => s.clearTap);

  const engineRef = useRef<MetronomeEngine | null>(null);
  const [pulse, setPulse] = useState(false);
  const [wakeSupported] = useState(() => 'wakeLock' in navigator);

  const bpmDisplay = useMemo(() => String(bpm), [bpm]);

  useEffect(() => {
    // Keep engine in sync with BPM and volume.
    engineRef.current?.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    engineRef.current?.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    // Clean up wake lock on unmount.
    return () => {
      void releaseWakeLock();
    };
  }, []);

  useEffect(() => {
    // Re-request wake lock when tab becomes visible.
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
      engineRef.current = new MetronomeEngine(ac, { bpm, volume, accentEvery: 4 }, {
        onTickScheduled: (tick) => {
          // UI pulse scheduled close to the audio tick time.
          const now = ac.currentTime;
          const delayMs = Math.max(0, (tick.when - now) * 1000);
          window.setTimeout(() => {
            setPulse(true);
            window.setTimeout(() => setPulse(false), 70);
          }, delayMs);
        }
      });
    }

    engineRef.current.setBpm(bpm);
    engineRef.current.setVolume(volume);
    engineRef.current.start();
    setStatus('running');
    clearTap();

    if (keepAwakeDefault && wakeSupported) {
      await requestWakeLock();
    }
  };

  const stop = async () => {
    engineRef.current?.stop();
    setStatus('stopped');
    await releaseWakeLock();
  };

  const onTap = () => {
    // Ensure audio context is available; doesn't start metronome.
    void ensureAudioRunning();
    const nextBpm = tapTempo();
    if (nextBpm) setBpm(nextBpm);
  };

  const acState = useMemo(() => {
    const ac = (getAudioContext as any) ? getAudioContext() : null;
    return ac?.state ?? 'unknown';
  }, [status]);

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Quick Start Metronome</div>
            <div className="big">{bpmDisplay}</div>
            <div className="muted" style={{ marginTop: 6 }}>BPM</div>
          </div>

          <div style={{ display: 'grid', gap: 10, justifyItems: 'end' }}>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btnSmall" onClick={() => nudgeBpm(-1)}>-</button>
              <button className="btn btnSmall" onClick={() => nudgeBpm(+1)}>+</button>
              <button className="btn btnSmall" onClick={() => nudgeBpm(-5)}>-5</button>
              <button className="btn btnSmall" onClick={() => nudgeBpm(+5)}>+5</button>
            </div>

            {status === 'running' ? (
              <button className="btn btnDanger" onClick={() => void stop()}>Stop</button>
            ) : (
              <button className="btn btnPrimary" onClick={() => void start()}>Start</button>
            )}

            <button className="btn" onClick={onTap}>Tap tempo</button>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Volume</div>
          <input
            style={{ width: '100%' }}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </div>

        <div style={{ marginTop: 14 }} className="kpi">
          <div className="kpiBox">
            <div className="kpiLabel">Audio</div>
            <div className="kpiValue">{acState}</div>
          </div>
          <div className="kpiBox">
            <div className="kpiLabel">Keep awake</div>
            <div className="kpiValue">{wakeSupported ? (isWakeLocked() ? 'Locked' : (keepAwakeDefault ? 'Armed' : 'Off')) : 'Not supported'}</div>
          </div>
        </div>

        {/* Pulse indicator */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: 14,
            bottom: 14,
            width: 18,
            height: 18,
            borderRadius: 999,
            background: pulse ? 'var(--accent)' : 'rgba(255,255,255,0.18)',
            boxShadow: pulse ? '0 0 0 10px rgba(98, 208, 255, 0.10)' : 'none',
            transition: 'background 80ms linear, box-shadow 80ms linear'
          }}
        />
      </div>

      <div className="notice">
        <div style={{ fontWeight: 750, marginBottom: 6 }}>Phase 1 status</div>
        <div className="muted">
          You have a stable scheduler + tap tempo + wake lock. Advanced features, projects, recording, and analytics come next.
        </div>
      </div>

      <div className="row">
        <Link className="btn" to="/projects">Go to Projects</Link>
        <Link className="btn" to="/settings">Settings</Link>
      </div>
    </div>
  );
}
