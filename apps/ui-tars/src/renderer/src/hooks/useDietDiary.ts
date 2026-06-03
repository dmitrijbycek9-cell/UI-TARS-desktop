import { useEffect } from 'react';
import { useDietDiaryStore, type MealType } from '@renderer/store/dietDiary';

export function useDietDiary() {
  const store = useDietDiaryStore();
  const {
    selectedDate,
    day,
    loading,
    macroTargets,
    loadDay,
    addEntry,
    removeEntry,
    setWater,
    setSelectedDate,
  } = store;

  useEffect(() => {
    loadDay(selectedDate);
  }, [selectedDate]);

  const allEntries = (
    Object.values(day.meals) as (typeof day.meals)[MealType][]
  ).flat();

  const totals = allEntries.reduce(
    (acc, e) => ({
      cal: acc.cal + e.cal,
      p: acc.p + e.p,
      k: acc.k + e.k,
      f: acc.f + e.f,
    }),
    { cal: 0, p: 0, k: 0, f: 0 },
  );

  return {
    selectedDate,
    day,
    loading,
    macroTargets,
    totals,
    byMeal: day.meals,
    water: day.water,
    setSelectedDate,
    addEntry,
    removeEntry,
    setWater,
  };
}
