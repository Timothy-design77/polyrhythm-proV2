import React from 'react';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import { routes } from '@/app/routes';

function Shell() {
  const element = useRoutes(routes);
  return (
    <div className="appGlassBg">
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
