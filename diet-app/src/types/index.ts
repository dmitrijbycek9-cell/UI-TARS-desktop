/** Nährwerte. Bei Produkten/Zutaten "pro 100 g/ml"; bei Tagebuch-Einträgen absolute Werte. */
export interface Nutrients {
  kcal: number;
  carbs: number;
  sugars?: number;
  protein: number;
  fat: number;
  saturatedFat?: number;
  fiber?: number;
  salt?: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Product {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  per100g: Nutrients;
  defaultPortionG?: number;
  source: 'off' | 'manual';
  fetchedAt: number;
}

export type DiarySource = 'product' | 'recipe' | 'manual';

export interface DiaryEntry {
  id: string;
  dateKey: string; // 'YYYY-MM-DD'
  meal: MealType;
  label: string;
  source: DiarySource;
  refId?: string; // barcode oder recipeId
  amountG: number;
  nutrients: Nutrients; // absolute Werte für diesen Eintrag
  createdAt: number;
}

export interface Ingredient {
  id: string;
  name: string;
  amountG: number;
  per100g: Nutrients; // Snapshot, damit Rezept stabil bleibt
  sourceBarcode?: string;
}

export interface Recipe {
  id: string;
  name: string;
  category?: string;
  description?: string;
  tags?: string[];
  ingredients: Ingredient[];
  servings: number;
  isSeed?: boolean;
  createdAt: number;
}

export type Sex = 'male' | 'female';
export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'veryActive';
export type Goal = 'lose' | 'maintain' | 'gain';

export interface MacroTargets {
  carbs: number;
  protein: number;
  fat: number;
}

export interface UserProfile {
  id: 'me';
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  stepGoal: number;
  // abgeleitet & gecacht:
  bmr: number;
  tdee: number;
  targetKcal: number;
  targetMacros: MacroTargets;
  updatedAt: number;
}

export interface Workout {
  id: string;
  dateKey: string;
  type: string;
  durationMin: number;
  caloriesBurned: number;
  note?: string;
  createdAt: number;
}

export interface StepRecord {
  dateKey: string;
  steps: number;
  goal: number;
  caloriesBurned: number;
  updatedAt: number;
}
