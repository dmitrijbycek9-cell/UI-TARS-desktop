import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import { router } from '@/routes/router';
import { seedDatabase } from '@/db/seed';
import { useProfileStore } from '@/stores/useProfileStore';

async function bootstrap() {
  // Kochbuch beim ersten Start anlegen und Profil laden
  await seedDatabase();
  await useProfileStore.getState().loadProfile();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );

  // Service Worker registrieren (Auto-Update)
  registerSW({ immediate: true });
}

bootstrap();
