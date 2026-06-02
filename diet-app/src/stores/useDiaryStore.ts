import { create } from 'zustand';
import { db } from '@/db/db';
import type {
  DiaryEntry,
  DiarySource,
  MealType,
  Nutrients,
  Product,
  Recipe,
} from '@/types';
import { recipePerServing, scaleNutrients } from '@/lib/nutrition';

interface AddEntryArgs {
  dateKey: string;
  meal: MealType;
  label: string;
  source: DiarySource;
  refId?: string;
  amountG: number;
  nutrients: Nutrients;
}

interface DiaryState {
  addEntry: (args: AddEntryArgs) => Promise<void>;
  addProduct: (
    product: Product,
    grams: number,
    meal: MealType,
    dateKey: string,
  ) => Promise<void>;
  addRecipeServing: (
    recipe: Recipe,
    servings: number,
    meal: MealType,
    dateKey: string,
  ) => Promise<void>;
  removeEntry: (id: string) => Promise<void>;
}

export const useDiaryStore = create<DiaryState>(() => ({
  async addEntry(args) {
    const entry: DiaryEntry = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      ...args,
    };
    await db.diaryEntries.add(entry);
  },
  async addProduct(product, grams, meal, dateKey) {
    await db.diaryEntries.add({
      id: crypto.randomUUID(),
      dateKey,
      meal,
      label: product.brand ? `${product.name} (${product.brand})` : product.name,
      source: 'product',
      refId: product.barcode,
      amountG: grams,
      nutrients: scaleNutrients(product.per100g, grams),
      createdAt: Date.now(),
    });
  },
  async addRecipeServing(recipe, servings, meal, dateKey) {
    const per = recipePerServing(recipe);
    const factor = servings;
    const nutrients: Nutrients = {
      kcal: Math.round(per.kcal * factor),
      carbs: Math.round((per.carbs ?? 0) * factor),
      sugars: Math.round((per.sugars ?? 0) * factor),
      protein: Math.round((per.protein ?? 0) * factor),
      fat: Math.round((per.fat ?? 0) * factor),
      saturatedFat: Math.round((per.saturatedFat ?? 0) * factor),
      fiber: Math.round((per.fiber ?? 0) * factor),
      salt: Math.round((per.salt ?? 0) * factor * 10) / 10,
    };
    await db.diaryEntries.add({
      id: crypto.randomUUID(),
      dateKey,
      meal,
      label: `${recipe.name} (${servings} ${servings === 1 ? 'Portion' : 'Portionen'})`,
      source: 'recipe',
      refId: recipe.id,
      amountG: 0,
      nutrients,
      createdAt: Date.now(),
    });
  },
  async removeEntry(id) {
    await db.diaryEntries.delete(id);
  },
}));
