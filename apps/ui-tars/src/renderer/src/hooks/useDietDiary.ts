import { useEffect } from 'react';
import { useDietDiaryStore, type MealType } from '@renderer/store/dietDiary';

export function useDietDiary() {
  const store = useDietDiaryStore();
  const {
    selectedDate,
    entries,
    loading,
    loadEntries,
    addEntry,
    deleteEntry,
    setSelectedDate,
  } = store;

  useEffect(() => {
    loadEntries(selectedDate);
  }, [selectedDate]);

  const totalCalories = entries.reduce(
    (sum, e) => sum + (e.calories * e.quantity) / 100,
    0,
  );
  const totalProtein = entries.reduce(
    (sum, e) => sum + ((e.protein ?? 0) * e.quantity) / 100,
    0,
  );
  const totalCarbs = entries.reduce(
    (sum, e) => sum + ((e.carbs ?? 0) * e.quantity) / 100,
    0,
  );
  const totalFat = entries.reduce(
    (sum, e) => sum + ((e.fat ?? 0) * e.quantity) / 100,
    0,
  );

  const byMeal = entries.reduce<Record<MealType, typeof entries>>(
    (acc, entry) => {
      if (!acc[entry.meal]) acc[entry.meal] = [];
      acc[entry.meal].push(entry);
      return acc;
    },
    { breakfast: [], lunch: [], dinner: [], snack: [] },
  );

  return {
    selectedDate,
    entries,
    loading,
    byMeal,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    setSelectedDate,
    addEntry,
    deleteEntry,
  };
}
