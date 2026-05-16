import { get, set, del, keys, createStore } from 'idb-keyval';
import { v4 } from 'uuid';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodEntry {
  id: string;
  date: string;
  meal: MealType;
  productName: string;
  barcode?: string;
  quantity: number;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  addedAt: number;
}

const dietStore = createStore('ui_tars_diet_db', 'food_entries');

export class DietDiaryManager {
  async getEntriesForDate(date: string): Promise<FoodEntry[]> {
    return (await get<FoodEntry[]>(date, dietStore)) ?? [];
  }

  async addEntry(
    entry: Omit<FoodEntry, 'id' | 'addedAt'>,
  ): Promise<FoodEntry[]> {
    const entries = await this.getEntriesForDate(entry.date);
    const newEntry: FoodEntry = { ...entry, id: v4(), addedAt: Date.now() };
    const updated = [...entries, newEntry];
    await set(entry.date, updated, dietStore);
    return updated;
  }

  async deleteEntry(date: string, entryId: string): Promise<FoodEntry[]> {
    const entries = await this.getEntriesForDate(date);
    const updated = entries.filter((e) => e.id !== entryId);
    if (updated.length === 0) {
      await del(date, dietStore);
    } else {
      await set(date, updated, dietStore);
    }
    return updated;
  }

  async getAllDates(): Promise<string[]> {
    return (await keys(dietStore)) as string[];
  }
}

export const dietDiaryManager = new DietDiaryManager();
