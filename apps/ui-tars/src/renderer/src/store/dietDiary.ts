import { create } from 'zustand';
import dayjs from 'dayjs';
import {
  dietDiaryManager,
  type FoodEntry,
  type MealType,
} from '@renderer/db/dietDiary';

interface DietDiaryState {
  selectedDate: string;
  entries: FoodEntry[];
  loading: boolean;

  setSelectedDate: (date: string) => Promise<void>;
  loadEntries: (date: string) => Promise<void>;
  addEntry: (entry: Omit<FoodEntry, 'id' | 'addedAt'>) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
}

export const useDietDiaryStore = create<DietDiaryState>((set, get) => ({
  selectedDate: dayjs().format('YYYY-MM-DD'),
  entries: [],
  loading: false,

  setSelectedDate: async (date: string) => {
    set({ selectedDate: date });
    await get().loadEntries(date);
  },

  loadEntries: async (date: string) => {
    set({ loading: true });
    try {
      const entries = await dietDiaryManager.getEntriesForDate(date);
      set({ entries });
    } finally {
      set({ loading: false });
    }
  },

  addEntry: async (entry: Omit<FoodEntry, 'id' | 'addedAt'>) => {
    const updated = await dietDiaryManager.addEntry(entry);
    if (entry.date === get().selectedDate) {
      set({ entries: updated });
    }
  },

  deleteEntry: async (entryId: string) => {
    const { selectedDate } = get();
    const updated = await dietDiaryManager.deleteEntry(selectedDate, entryId);
    set({ entries: updated });
  },
}));

export type { FoodEntry, MealType };
