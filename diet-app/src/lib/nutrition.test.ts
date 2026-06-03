import { describe, expect, it } from 'vitest';
import {
  makeIngredient,
  recipePerServing,
  recipeTotals,
  scaleNutrients,
  sumNutrients,
} from './nutrition';
import type { Recipe } from '@/types';

describe('scaleNutrients', () => {
  it('skaliert pro-100-g-Werte auf Gramm', () => {
    const scaled = scaleNutrients(
      { kcal: 200, carbs: 10, protein: 20, fat: 5 },
      50,
    );
    expect(scaled.kcal).toBe(100);
    expect(scaled.carbs).toBe(5);
    expect(scaled.protein).toBe(10);
    expect(scaled.fat).toBe(2.5);
  });
});

describe('sumNutrients', () => {
  it('summiert mehrere Nährwerte', () => {
    const total = sumNutrients([
      { kcal: 100, carbs: 10, protein: 5, fat: 2 },
      { kcal: 50, carbs: 5, protein: 3, fat: 1 },
    ]);
    expect(total.kcal).toBe(150);
    expect(total.carbs).toBe(15);
  });
});

describe('Rezept-Berechnung', () => {
  const recipe: Recipe = {
    id: 'r1',
    name: 'Test',
    servings: 2,
    createdAt: 0,
    ingredients: [
      makeIngredient('A', 200, { kcal: 100, carbs: 10, protein: 5, fat: 2 }),
      makeIngredient('B', 100, { kcal: 200, carbs: 20, protein: 10, fat: 4 }),
    ],
  };

  it('Gesamtnährwerte = Summe der Zutaten', () => {
    const totals = recipeTotals(recipe);
    // A: 200g -> kcal 200; B: 100g -> kcal 200 => 400
    expect(totals.kcal).toBe(400);
  });

  it('pro Portion = Gesamt / servings', () => {
    const per = recipePerServing(recipe);
    expect(per.kcal).toBe(200);
  });
});
