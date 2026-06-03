import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'node:path';

// SINGLEFILE=1 bündelt die gesamte App in eine einzige index.html (JS/CSS
// eingebettet). Das umgeht MIME-Probleme von Datei-CDNs (raw.githack &amp; Co.),
// weil keine separate .js-Datei mehr geladen werden muss.
const singleFile = process.env.SINGLEFILE === '1';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Relativer Pfad beim Build, damit die App auch unter einer Unteradresse
  // (z. B. https://user.github.io/Repo/) ohne Anpassung läuft.
  base: command === 'build' ? './' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        scope: './',
        start_url: './',
        id: './',
        name: 'Ernährungs-Tagebuch',
        short_name: 'Diät',
        description:
          'Essens-Tagebuch, Barcode-Scanner, Kochbuch, Körperindex & Fitness – alles lokal auf deinem Gerät.',
        lang: 'de',
        dir: 'ltr',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0f172a',
        theme_color: '#16a34a',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/world\.openfoodfacts\.org\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'off-api',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/images\.openfoodfacts\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'off-images',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
    ...(singleFile ? [viteSingleFile()] : []),
  ],
  server: {
    port: 5173,
    host: true,
  },
}));
