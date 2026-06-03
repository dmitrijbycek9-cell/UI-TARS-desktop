import { createHashRouter } from 'react-router-dom';
import App from '@/App';
import DiaryPage from '@/pages/DiaryPage';
import ScannerPage from '@/pages/ScannerPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import RecipesPage from '@/pages/RecipesPage';
import RecipeBuilderPage from '@/pages/RecipeBuilderPage';
import RecipeDetailPage from '@/pages/RecipeDetailPage';
import FitnessPage from '@/pages/FitnessPage';
import ProfilePage from '@/pages/ProfilePage';
import WeightGaugePage from '@/pages/WeightGaugePage';

// HashRouter, damit die App auch unter einer Unteradresse (z. B. GitHub Pages)
// und beim Neuladen ohne Server-Konfiguration zuverlässig funktioniert.
export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <DiaryPage /> },
      { path: 'scan', element: <ScannerPage /> },
      { path: 'product/:barcode', element: <ProductDetailPage /> },
      { path: 'rezepte', element: <RecipesPage /> },
      { path: 'rezepte/neu', element: <RecipeBuilderPage /> },
      { path: 'rezepte/:id', element: <RecipeDetailPage /> },
      { path: 'fitness', element: <FitnessPage /> },
      { path: 'waage', element: <WeightGaugePage /> },
      { path: 'profil', element: <ProfilePage /> },
    ],
  },
]);
