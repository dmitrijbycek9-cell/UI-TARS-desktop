import { create } from 'zustand';
import { db } from '@/db/db';
import type { Recipe } from '@/types';

interface RecipeState {
  saveRecipe: (recipe: Recipe) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
}

export const useRecipeStore = create<RecipeState>(() => ({
  async saveRecipe(recipe) {
    await db.recipes.put(recipe);
  },
  async deleteRecipe(id) {
    await db.recipes.delete(id);
  },
}));
