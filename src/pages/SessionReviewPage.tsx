import React from 'react';
import { Link, useParams } from 'react-router-dom';

export default function SessionReviewPage() {
  const { sessionId } = useParams();
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Session Review</h2>
      <p className="muted">Phase 0-1 placeholder. Session ID: {sessionId}</p>
      <div style={{ marginTop: 14 }}>
        <Link className="btn btnSmall" to="/">Back to metronome</Link>
      </div>
    </div>
  );
}
