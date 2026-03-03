import React from 'react';
import { Link } from 'react-router-dom';

export default function ProjectsPage() {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Projects</h2>
      <p className="muted">Phase 0-1: placeholder. Projects will be built in Phase 3.</p>
      <div className="notice">
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Goal</div>
        <div className="muted">Home → Projects → Select (≤ 3 actions).</div>
      </div>
      <div style={{ marginTop: 14 }}>
        <Link className="btn btnSmall" to="/">Back to metronome</Link>
      </div>
    </div>
  );
}
