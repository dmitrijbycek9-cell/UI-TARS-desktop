import { get, set, keys, createStore } from 'idb-keyval';
import { v4 } from 'uuid';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodEntry {
  id: string;
  name: string;
  amount: number;
  cal: number;
  p: number;
  k: number;
  f: number;
}

export interface DayData {
  meals: Record<MealType, FoodEntry[]>;
  water: number;
  note: string;
}

function emptyDay(): DayData {
  return {
    meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
    water: 0,
    note: '',
  };
}

const dietStore = createStore('ui_tars_diet_db', 'days');

export class DietDiaryManager {
  async getDay(date: string): Promise<DayData> {
    return (await get<DayData>(date, dietStore)) ?? emptyDay();
  }

  async saveDay(date: string, day: DayData): Promise<void> {
    await set(date, day, dietStore);
  }

  async addEntry(
    date: string,
    meal: MealType,
    entry: Omit<FoodEntry, 'id'>,
  ): Promise<DayData> {
    const day = await this.getDay(date);
    day.meals[meal] = [...day.meals[meal], { ...entry, id: v4() }];
    await this.saveDay(date, day);
    return day;
  }

  async removeEntry(
    date: string,
    meal: MealType,
    entryId: string,
  ): Promise<DayData> {
    const day = await this.getDay(date);
    day.meals[meal] = day.meals[meal].filter((e) => e.id !== entryId);
    await this.saveDay(date, day);
    return day;
  }

  async setWater(date: string, count: number): Promise<DayData> {
    const day = await this.getDay(date);
    day.water = count;
    await this.saveDay(date, day);
    return day;
  }

  async getAllDates(): Promise<string[]> {
    return (await keys(dietStore)) as string[];
  }
}

export const dietDiaryManager = new DietDiaryManager();
