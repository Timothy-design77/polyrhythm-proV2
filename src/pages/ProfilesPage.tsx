import React from 'react';
import { Link } from 'react-router-dom';

export default function ProfilesPage() {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Profiles</h2>
      <p className="muted">Phase 0-1: placeholder. Instrument profiling arrives in Phase 8.</p>
      <div style={{ marginTop: 14 }}>
        <Link className="btn btnSmall" to="/">Back to metronome</Link>
      </div>
    </div>
  );
}
