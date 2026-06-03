import type { Ingredient, Nutrients, Recipe } from '@/types';

export const EMPTY_NUTRIENTS: Nutrients = {
  kcal: 0,
  carbs: 0,
  sugars: 0,
  protein: 0,
  fat: 0,
  saturatedFat: 0,
  fiber: 0,
  salt: 0,
};

const NUTRIENT_KEYS: (keyof Nutrients)[] = [
  'kcal',
  'carbs',
  'sugars',
  'protein',
  'fat',
  'saturatedFat',
  'fiber',
  'salt',
];

/** Skaliert Pro-100-g-Werte auf eine konkrete Menge in Gramm. */
export function scaleNutrients(per100g: Nutrients, grams: number): Nutrients {
  const factor = grams / 100;
  const result = {} as Nutrients;
  for (const key of NUTRIENT_KEYS) {
    const value = per100g[key];
    if (value !== undefined) {
      result[key] = roundTo(value * factor, 1);
    }
  }
  return result;
}

/** Summiert mehrere Nährwert-Objekte (absolute Werte). */
export function sumNutrients(items: Nutrients[]): Nutrients {
  const result: Nutrients = { ...EMPTY_NUTRIENTS };
  for (const item of items) {
    for (const key of NUTRIENT_KEYS) {
      result[key] = (result[key] ?? 0) + (item[key] ?? 0);
    }
  }
  for (const key of NUTRIENT_KEYS) {
    result[key] = roundTo(result[key] ?? 0, 1);
  }
  return result;
}

/** Gesamtnährwerte eines Rezepts (Summe aller Zutaten). */
export function recipeTotals(recipe: Recipe): Nutrients {
  return sumNutrients(
    recipe.ingredients.map((ing) => scaleNutrients(ing.per100g, ing.amountG)),
  );
}

/** Nährwerte pro Portion eines Rezepts. */
export function recipePerServing(recipe: Recipe): Nutrients {
  const totals = recipeTotals(recipe);
  const servings = Math.max(1, recipe.servings);
  const result = {} as Nutrients;
  for (const key of NUTRIENT_KEYS) {
    const value = totals[key];
    if (value !== undefined) {
      result[key] = roundTo(value / servings, 1);
    }
  }
  return result;
}

/** Gesamtgewicht eines Rezepts in Gramm. */
export function recipeWeightG(recipe: Recipe): number {
  return recipe.ingredients.reduce((sum, ing) => sum + ing.amountG, 0);
}

export function gramsPerServing(recipe: Recipe): number {
  return roundTo(recipeWeightG(recipe) / Math.max(1, recipe.servings), 0);
}

export function makeIngredient(
  name: string,
  amountG: number,
  per100g: Nutrients,
  sourceBarcode?: string,
): Ingredient {
  return {
    id: crypto.randomUUID(),
    name,
    amountG,
    per100g,
    sourceBarcode,
  };
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
