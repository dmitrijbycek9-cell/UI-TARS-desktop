import { describe, expect, it } from 'vitest';
import { mapNutriments } from './openFoodFacts';

describe('mapNutriments (Open Food Facts)', () => {
  it('liest direkte kcal pro 100 g', () => {
    const { nutrients, hasData } = mapNutriments({
      'energy-kcal_100g': 42,
      carbohydrates_100g: 10.6,
      sugars_100g: 10.6,
    });
    expect(hasData).toBe(true);
    expect(nutrients.kcal).toBe(42);
    expect(nutrients.sugars).toBe(10.6);
  });

  it('rechnet Energie aus kJ um, wenn keine kcal vorhanden (z. B. Getränke)', () => {
    const { nutrients } = mapNutriments({ energy_100g: 180 }); // generisch = kJ
    expect(nutrients.kcal).toBe(Math.round(180 / 4.184)); // ~43
  });

  it('rechnet Pro-Portion-Werte auf 100 ml hoch', () => {
    // Nur Serving-Werte vorhanden, Portion 330 ml
    const { nutrients, hasData } = mapNutriments(
      { 'energy-kcal_serving': 139, sugars_serving: 35 },
      330,
    );
    expect(hasData).toBe(true);
    expect(nutrients.kcal).toBe(Math.round((139 / 330) * 100)); // ~42
    expect(nutrients.sugars).toBeCloseTo((35 / 330) * 100, 1);
  });

  it('verarbeitet numerische Strings', () => {
    const { nutrients } = mapNutriments({ 'energy-kcal_100g': '55' });
    expect(nutrients.kcal).toBe(55);
  });

  it('meldet hasData=false, wenn keine Nährwerte hinterlegt sind', () => {
    const { nutrients, hasData } = mapNutriments({});
    expect(hasData).toBe(false);
    expect(nutrients.kcal).toBe(0);
  });
});
