import React from 'react';
import { RouteObject } from 'react-router-dom';
import HomeMetronomePage from '@/pages/HomeMetronomePage';
import ProjectsPage from '@/pages/ProjectsPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import SessionReviewPage from '@/pages/SessionReviewPage';
import ProfilesPage from '@/pages/ProfilesPage';
import SettingsPage from '@/pages/SettingsPage';

export const routes: RouteObject[] = [
  { path: '/', element: <HomeMetronomePage /> },
  { path: '/projects', element: <ProjectsPage /> },
  { path: '/projects/:projectId', element: <ProjectDetailPage /> },
  { path: '/sessions/:sessionId', element: <SessionReviewPage /> },
  { path: '/profiles', element: <ProfilesPage /> },
  { path: '/settings', element: <SettingsPage /> }
];
