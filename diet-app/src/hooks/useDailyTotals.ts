import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import { sumNutrients, EMPTY_NUTRIENTS } from '@/lib/nutrition';
import type { Nutrients } from '@/types';

export interface DailyTotals {
  nutrients: Nutrients;
  burned: number; // verbrannte kcal (Workouts + Schritte)
}

/** Reaktive Tagessummen (Nährwerte aus dem Tagebuch + verbrannte Kalorien). */
export function useDailyTotals(dateKey: string): DailyTotals {
  return (
    useLiveQuery(async () => {
      const [entries, workouts, stepRec] = await Promise.all([
        db.diaryEntries.where('dateKey').equals(dateKey).toArray(),
        db.workouts.where('dateKey').equals(dateKey).toArray(),
        db.steps.get(dateKey),
      ]);
      const nutrients = sumNutrients(entries.map((e) => e.nutrients));
      const workoutKcal = workouts.reduce((s, w) => s + w.caloriesBurned, 0);
      const stepKcal = stepRec?.caloriesBurned ?? 0;
      return { nutrients, burned: workoutKcal + stepKcal };
    }, [dateKey]) ?? { nutrients: { ...EMPTY_NUTRIENTS }, burned: 0 }
  );
}
