import { create } from 'zustand';
import {
  dietDiaryManager,
  type DayData,
  type FoodEntry,
  type MealType,
} from '@renderer/db/dietDiary';

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function emptyDay(): DayData {
  return {
    meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
    water: 0,
    note: '',
  };
}

interface MacroTargets {
  p: number;
  k: number;
  f: number;
}

interface DietDiaryState {
  selectedDate: string;
  day: DayData;
  loading: boolean;
  macroTargets: MacroTargets;

  setSelectedDate: (date: string) => Promise<void>;
  loadDay: (date: string) => Promise<void>;
  addEntry: (meal: MealType, entry: Omit<FoodEntry, 'id'>) => Promise<void>;
  removeEntry: (meal: MealType, entryId: string) => Promise<void>;
  setWater: (count: number) => Promise<void>;
}

export const useDietDiaryStore = create<DietDiaryState>((set, get) => ({
  selectedDate: today(),
  day: emptyDay(),
  loading: false,
  macroTargets: { p: 150, k: 200, f: 65 },

  setSelectedDate: async (date: string) => {
    set({ selectedDate: date });
    await get().loadDay(date);
  },

  loadDay: async (date: string) => {
    set({ loading: true });
    try {
      const day = await dietDiaryManager.getDay(date);
      set({ day });
    } finally {
      set({ loading: false });
    }
  },

  addEntry: async (meal: MealType, entry: Omit<FoodEntry, 'id'>) => {
    const day = await dietDiaryManager.addEntry(
      get().selectedDate,
      meal,
      entry,
    );
    set({ day });
  },

  removeEntry: async (meal: MealType, entryId: string) => {
    const day = await dietDiaryManager.removeEntry(
      get().selectedDate,
      meal,
      entryId,
    );
    set({ day });
  },

  setWater: async (count: number) => {
    const day = await dietDiaryManager.setWater(get().selectedDate, count);
    set({ day });
  },
}));

export type { FoodEntry, MealType, DayData };
