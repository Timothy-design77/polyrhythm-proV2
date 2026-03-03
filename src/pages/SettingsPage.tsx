import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/state/useAppStore';

function Stepper({
  label,
  value,
  onDec,
  onInc,
}: {
  label: string;
  value: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="glass glassPanel">
      <div className="glassRow">
        <div className="glassLabel">{label}</div>
        <div style={{ fontWeight: 900 }}>{value}</div>
      </div>
      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button className="glassBtn glassBtnSmall" onClick={onDec}>−</button>
        <button className="glassBtn glassBtnSmall" onClick={onInc}>+</button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const timeSigTop = useAppStore((s) => s.timeSigTop);
  const timeSigBottom = useAppStore((s) => s.timeSigBottom);
  const setTimeSigTop = useAppStore((s) => s.setTimeSigTop);
  const setTimeSigBottom = useAppStore((s) => s.setTimeSigBottom);

  const subdivision = useAppStore((s) => s.subdivision);
  const setSubdivision = useAppStore((s) => s.setSubdivision);

  const swingEnabled = useAppStore((s) => s.swingEnabled);
  const setSwingEnabled = useAppStore((s) => s.setSwingEnabled);
  const swingPercent = useAppStore((s) => s.swingPercent);
  const setSwingPercent = useAppStore((s) => s.setSwingPercent);

  const polyEnabled = useAppStore((s) => s.polyEnabled);
  const setPolyEnabled = useAppStore((s) => s.setPolyEnabled);
  const polyA = useAppStore((s) => s.polyA);
  const polyB = useAppStore((s) => s.polyB);
  const setPolyA = useAppStore((s) => s.setPolyA);
  const setPolyB = useAppStore((s) => s.setPolyB);
  const applyPolyPreset = useAppStore((s) => s.applyPolyPreset);

  return (
    <div className="homeScroll">
      <div className="glass glassGloss" style={{ padding: 16, borderRadius: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.2 }}>Settings</div>
        <div className="glassLabel" style={{ marginTop: 6 }}>
          Rhythm settings are laid out for speed. Time signature already affects accents now. Subdivision/swing/polyrhythm wiring lands in Phase 2.
        </div>
      </div>

      {/* RHYTHM */}
      <div className="glass glassPanel">
        <div style={{ fontWeight: 900, marginBottom: 10 }}>Rhythm</div>

        <div className="glassLabel">Time Signature (accents)</div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Stepper
            label="Top"
            value={String(timeSigTop)}
            onDec={() => setTimeSigTop(timeSigTop - 1)}
            onInc={() => setTimeSigTop(timeSigTop + 1)}
          />
          <div className="glass glassPanel">
            <div className="glassRow">
              <div className="glassLabel">Bottom</div>
              <div style={{ fontWeight: 900 }}>{timeSigBottom}</div>
            </div>
            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[4, 8, 16].map((v) => (
                <button
                  key={v}
                  className={'glassBtn glassBtnSmall ' + (timeSigBottom === v ? 'glassBtnPrimary' : '')}
                  onClick={() => setTimeSigBottom(v as 4 | 8 | 16)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ height: 14 }} />

        <div className="glassLabel">Subdivision (UI ready)</div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {(['quarters','8ths','triplets','16ths'] as const).map((s) => (
            <button
              key={s}
              className={'glassBtn glassBtnSmall ' + (subdivision === s ? 'glassBtnPrimary' : '')}
              onClick={() => setSubdivision(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ height: 14 }} />

        <div className="glassRow">
          <div className="glassLabel">Swing (UI ready)</div>
          <button className={'glassBtn glassBtnSmall ' + (swingEnabled ? 'glassBtnOn' : '')} style={{ width: 'auto', padding: '10px 12px' }} onClick={() => setSwingEnabled(!swingEnabled)}>
            {swingEnabled ? 'On' : 'Off'}
          </button>
        </div>
        <input className="glassRange" type="range" min={0} max={75} step={1} value={swingPercent} onChange={(e) => setSwingPercent(Number(e.target.value))} />

        <div style={{ height: 14 }} />

        <div className="glassRow">
          <div className="glassLabel">Polyrhythm (A:B) (UI ready)</div>
          <button className={'glassBtn glassBtnSmall ' + (polyEnabled ? 'glassBtnOn' : '')} style={{ width: 'auto', padding: '10px 12px' }} onClick={() => setPolyEnabled(!polyEnabled)}>
            {polyEnabled ? 'On' : 'Off'}
          </button>
        </div>

        <div style={{ marginTop: 10 }} className="glassLabel">Quick presets</div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            [3,2],[4,3],[5,4],
            [7,4],[5,3],[7,5],
          ].map(([a,b]) => (
            <button key={`${a}:${b}`} className="glassBtn glassBtnSmall" onClick={() => applyPolyPreset(a, b)}>
              {a}:{b}
            </button>
          ))}
        </div>

        <div style={{ height: 10 }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Stepper label="A pulses" value={String(polyA)} onDec={() => setPolyA(polyA - 1)} onInc={() => setPolyA(polyA + 1)} />
          <Stepper label="B pulses" value={String(polyB)} onDec={() => setPolyB(polyB - 1)} onInc={() => setPolyB(polyB + 1)} />
        </div>
      </div>

      {/* OTHER SETTINGS (scaffold now; we’ll wire up as phases progress) */}
      <div className="glass glassPanel">
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Sound</div>
        <div className="glassLabel">Per-layer volumes, accents, delays will live here (Phase 2+).</div>
      </div>

      <div className="glass glassPanel">
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Training</div>
        <div className="glassLabel">Gap click, random mute, count-in will live here (Phase 2+).</div>
      </div>

      <div className="glass glassPanel">
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Calibration</div>
        <div className="glassLabel">Loopback calibration + manual offset arrives Phase 6.</div>
      </div>

      <div className="glass glassPanel">
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Data</div>
        <div className="glassLabel">Export/import + storage tools arrive Phase 10.</div>
      </div>

      <Link className="glassBtn" to="/">
        Back
      </Link>
    </div>
  );
}
