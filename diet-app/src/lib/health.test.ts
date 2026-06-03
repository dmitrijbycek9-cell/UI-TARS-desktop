import { describe, expect, it } from 'vitest';
import {
  bmi,
  bmiCategory,
  bmr,
  computeProfile,
  macroTargets,
  targetKcal,
  tdee,
  type ProfileInput,
} from './health';

const male: ProfileInput = {
  age: 30,
  sex: 'male',
  heightCm: 180,
  weightKg: 80,
  activity: 'moderate',
  goal: 'maintain',
  stepGoal: 10000,
};

describe('bmi', () => {
  it('berechnet den BMI korrekt', () => {
    expect(bmi(80, 180)).toBe(24.7);
  });
  it('kategorisiert korrekt', () => {
    expect(bmiCategory(17)).toBe('under');
    expect(bmiCategory(22)).toBe('normal');
    expect(bmiCategory(27)).toBe('over');
    expect(bmiCategory(32)).toBe('obese');
  });
});

describe('Mifflin-St Jeor', () => {
  it('BMR für Männer = base + 5', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(bmr(male)).toBe(1780);
  });
  it('BMR für Frauen = base - 161', () => {
    expect(bmr({ ...male, sex: 'female' })).toBe(1780 - 5 - 161);
  });
});

describe('TDEE & Ziele', () => {
  it('TDEE = BMR * Aktivität', () => {
    expect(tdee(male)).toBe(Math.round(1780 * 1.55));
  });
  it('Abnehmen zieht 500 kcal ab', () => {
    expect(targetKcal({ ...male, goal: 'lose' })).toBe(tdee(male) - 500);
  });
  it('Zunehmen addiert 300 kcal', () => {
    expect(targetKcal({ ...male, goal: 'gain' })).toBe(tdee(male) + 300);
  });
});

describe('Makros', () => {
  it('teilt Kalorien in 30/40/30 auf', () => {
    const m = macroTargets(2000);
    expect(m.protein).toBe(150); // 2000*0.3/4
    expect(m.carbs).toBe(200); // 2000*0.4/4
    expect(m.fat).toBe(67); // 2000*0.3/9 = 66.6 -> 67
  });
});

describe('computeProfile', () => {
  it('erzeugt alle abgeleiteten Werte', () => {
    const p = computeProfile(male);
    expect(p.bmr).toBe(1780);
    expect(p.targetKcal).toBe(tdee(male));
    expect(p.targetMacros.protein).toBeGreaterThan(0);
  });
});
