import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import { router } from '@/routes/router';
import { seedDatabase } from '@/db/seed';
import { useProfileStore } from '@/stores/useProfileStore';

// Zuerst die App rendern, damit ein Fehler in DB/Seed niemals zu einem
// weißen Bildschirm führt. Initialisierung läuft danach im Hintergrund.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

void (async () => {
  try {
    await seedDatabase();
  } catch (err) {
    console.error('Seed fehlgeschlagen:', err);
  }
  try {
    await useProfileStore.getState().loadProfile();
  } catch (err) {
    console.error('Profil laden fehlgeschlagen:', err);
  }
})();

try {
  registerSW({ immediate: true });
} catch (err) {
  console.error('Service Worker konnte nicht registriert werden:', err);
}
