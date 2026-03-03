import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from "node:url";

/**
 * BASE_PATH is set in GitHub Actions to `/<repoName>/` for GitHub Pages.
 * Locally it defaults to '/'.
 */
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
resolve: {
  alias: {
    "@": fileURLToPath(new URL("./src", import.meta.url)),
  },
},
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Metronome Lab',
        short_name: 'Metronome',
        description: 'Pro metronome + local session recording and analytics (Phase 0-1).',
        theme_color: '#111111',
        background_color: '#111111',
        display: 'standalone',
        scope: base,
        start_url: base,
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        navigateFallback: base + 'index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
});
