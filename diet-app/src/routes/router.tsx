import { createBrowserRouter } from 'react-router-dom';
import App from '@/App';
import DiaryPage from '@/pages/DiaryPage';
import ScannerPage from '@/pages/ScannerPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import RecipesPage from '@/pages/RecipesPage';
import RecipeBuilderPage from '@/pages/RecipeBuilderPage';
import RecipeDetailPage from '@/pages/RecipeDetailPage';
import FitnessPage from '@/pages/FitnessPage';
import ProfilePage from '@/pages/ProfilePage';

export const router = createBrowserRouter([
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
      { path: 'profil', element: <ProfilePage /> },
    ],
  },
]);
