import React from 'react';
import { Link, useParams } from 'react-router-dom';

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Project</h2>
      <p className="muted">Phase 0-1 placeholder. Project ID: {projectId}</p>
      <div style={{ marginTop: 14 }}>
        <Link className="btn btnSmall" to="/projects">Back to Projects</Link>
      </div>
    </div>
  );
}
