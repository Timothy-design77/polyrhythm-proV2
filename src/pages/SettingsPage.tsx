import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/state/useAppStore';

export default function SettingsPage() {
  const keepAwakeDefault = useAppStore((s) => s.keepAwakeDefault);
  const setKeepAwakeDefault = useAppStore((s) => s.setKeepAwakeDefault);

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Settings</h2>
      <div className="kpi">
        <div className="kpiBox">
          <div className="kpiLabel">Keep screen awake while running</div>
          <div className="kpiValue">
            <label style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={keepAwakeDefault}
                onChange={(e) => setKeepAwakeDefault(e.target.checked)}
              />
              {keepAwakeDefault ? 'On' : 'Off'}
            </label>
          </div>
        </div>
      </div>

      <p className="muted" style={{ marginTop: 16 }}>
        Calibration, recording, analysis, export/import will be added in later phases.
      </p>
      <div style={{ marginTop: 14 }}>
        <Link className="btn btnSmall" to="/">Back to metronome</Link>
      </div>
    </div>
  );
}
