import type {
  ActivityLevel,
  Goal,
  MacroTargets,
  Sex,
  UserProfile,
} from '@/types';
import { roundTo } from './nutrition';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

export interface ProfileInput {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  stepGoal: number;
}

/** Body-Mass-Index. */
export function bmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  if (heightM <= 0) return 0;
  return roundTo(weightKg / (heightM * heightM), 1);
}

export type BmiCategory = 'under' | 'normal' | 'over' | 'obese';

export function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return 'under';
  if (value < 25) return 'normal';
  if (value < 30) return 'over';
  return 'obese';
}

/** Grundumsatz nach Mifflin-St Jeor. */
export function bmr(input: ProfileInput): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age;
  const adjusted = input.sex === 'male' ? base + 5 : base - 161;
  return Math.max(0, roundTo(adjusted, 0));
}

/** Gesamtumsatz (Total Daily Energy Expenditure). */
export function tdee(input: ProfileInput): number {
  return roundTo(bmr(input) * ACTIVITY_MULTIPLIERS[input.activity], 0);
}

/** Ziel-Kalorien je nach Vorhaben (Defizit/Erhalt/Überschuss). */
export function targetKcal(input: ProfileInput): number {
  const total = tdee(input);
  const base = bmr(input);
  switch (input.goal) {
    case 'lose':
      return Math.max(base, roundTo(total - 500, 0));
    case 'gain':
      return roundTo(total + 300, 0);
    case 'maintain':
    default:
      return total;
  }
}

/** Makro-Verteilung 30 % Eiweiß / 40 % KH / 30 % Fett (in Gramm). */
export function macroTargets(kcal: number): MacroTargets {
  return {
    protein: Math.round((kcal * 0.3) / 4),
    carbs: Math.round((kcal * 0.4) / 4),
    fat: Math.round((kcal * 0.3) / 9),
  };
}

/** Berechnet alle abgeleiteten Werte und erzeugt das vollständige Profil-Objekt. */
export function computeProfile(input: ProfileInput): UserProfile {
  const kcal = targetKcal(input);
  return {
    id: 'me',
    ...input,
    bmr: bmr(input),
    tdee: tdee(input),
    targetKcal: kcal,
    targetMacros: macroTargets(kcal),
    updatedAt: Date.now(),
  };
}
