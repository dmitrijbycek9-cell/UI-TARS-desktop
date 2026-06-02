import type { Nutrients, Recipe } from '@/types';
import { recipePerServing } from './nutrition';

export interface Suggestion {
  recipe: Recipe;
  perServing: Nutrients;
  fitScore: number; // niedriger = passt besser zum Restbudget
}

/**
 * Schlägt Rezepte vor, deren Portion gut ins verbleibende Kalorienbudget passt.
 * @param recipes  alle verfügbaren Rezepte
 * @param remainingKcal  noch verfügbare Kalorien für heute
 */
export function suggestRecipes(
  recipes: Recipe[],
  remainingKcal: number,
): Suggestion[] {
  if (remainingKcal <= 0) return [];

  const suggestions: Suggestion[] = recipes
    .map((recipe) => {
      const perServing = recipePerServing(recipe);
      return { recipe, perServing, fitScore: 0 };
    })
    // nur Rezepte, deren Portion nicht weit über dem Budget liegt
    .filter((s) => s.perServing.kcal > 0 && s.perServing.kcal <= remainingKcal * 1.15)
    .map((s) => ({
      ...s,
      // bevorzuge Portionen, die das Budget gut ausfüllen (40–100 %)
      fitScore: Math.abs(remainingKcal * 0.7 - s.perServing.kcal),
    }))
    .sort((a, b) => a.fitScore - b.fitScore);

  return suggestions.slice(0, 6);
}
