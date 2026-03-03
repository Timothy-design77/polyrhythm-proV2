import React from 'react';
import { BrowserRouter, Link, useRoutes } from 'react-router-dom';
import { routes } from '@/app/routes';

function Shell() {
  const element = useRoutes(routes);
  return (
    <div>
      <header className="topbar">
        <Link to="/" className="brand">Metronome Lab</Link>
        <nav className="nav">
          <Link className="pill" to="/projects">Projects</Link>
          <Link className="pill" to="/profiles">Profiles</Link>
          <Link className="pill" to="/settings">Settings</Link>
        </nav>
      </header>
      <main className="container">{element}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Shell />
    </BrowserRouter>
  );
}
