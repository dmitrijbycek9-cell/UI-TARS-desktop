import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateSwitcher } from '@/components/diary/DateSwitcher';
import { DailyTotalsBar } from '@/components/diary/DailyTotalsBar';
import { AddEntryModal } from '@/components/diary/AddEntryModal';
import { Button, Card } from '@/components/ui';
import { t } from '@/i18n/de';
import { db } from '@/db/db';
import { useUiStore } from '@/stores/useUiStore';
import { useDiaryStore } from '@/stores/useDiaryStore';
import { useDailyTotals } from '@/hooks/useDailyTotals';
import type { DiaryEntry, MealType } from '@/types';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '🍽️',
  dinner: '🌙',
  snack: '🍎',
};

export default function DiaryPage() {
  const selectedDate = useUiStore((s) => s.selectedDate);
  const totals = useDailyTotals(selectedDate);
  const removeEntry = useDiaryStore((s) => s.removeEntry);
  const [modalMeal, setModalMeal] = useState<MealType | null>(null);

  const entries = useLiveQuery(
    () => db.diaryEntries.where('dateKey').equals(selectedDate).toArray(),
    [selectedDate],
    [] as DiaryEntry[],
  );

  const byMeal = (meal: MealType) =>
    entries.filter((e) => e.meal === meal);

  return (
    <div>
      <PageHeader title={t.diary.title} />
      <div className="space-y-4 p-4">
        <Card className="!p-3">
          <DateSwitcher />
        </Card>

        <DailyTotalsBar totals={totals} />

        {MEALS.map((meal) => {
          const mealEntries = byMeal(meal);
          const mealKcal = Math.round(
            mealEntries.reduce((s, e) => s + e.nutrients.kcal, 0),
          );
          return (
            <Card key={meal} className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-semibold text-slate-700">
                  <span>{MEAL_ICONS[meal]}</span>
                  {t.meals[meal]}
                </h2>
                <span className="text-sm text-slate-400">{mealKcal} kcal</span>
              </div>

              {mealEntries.length === 0 ? (
                <p className="py-1 text-sm text-slate-300">{t.common.none}</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {mealEntries.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-2 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-700">
                          {entry.label}
                        </p>
                        <p className="text-xs text-slate-400">
                          {entry.amountG > 0 && `${entry.amountG} g · `}
                          E {entry.nutrients.protein} · K {entry.nutrients.carbs}{' '}
                          · F {entry.nutrients.fat} g
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-600">
                          {Math.round(entry.nutrients.kcal)}
                        </span>
                        <button
                          onClick={() => removeEntry(entry.id)}
                          className="rounded-full px-2 py-1 text-slate-300 hover:bg-red-50 hover:text-red-500"
                          aria-label={t.common.delete}
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <Button
                variant="ghost"
                className="w-full justify-start text-brand-600"
                onClick={() => setModalMeal(meal)}
              >
                + {t.common.add}
              </Button>
            </Card>
          );
        })}
      </div>

      <AddEntryModal
        open={modalMeal !== null}
        onClose={() => setModalMeal(null)}
        dateKey={selectedDate}
        defaultMeal={modalMeal ?? 'breakfast'}
      />
    </div>
  );
}
