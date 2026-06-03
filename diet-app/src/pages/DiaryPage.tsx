import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateSwitcher } from '@/components/diary/DateSwitcher';
import { DailyTotalsBar } from '@/components/diary/DailyTotalsBar';
import { AddEntryModal } from '@/components/diary/AddEntryModal';
import { Card } from '@/components/ui';
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
                      {entry.photo && (
                        <img
                          src={entry.photo}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-slate-200"
                        />
                      )}
                      <div className="min-w-0 flex-1">
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

              <div className="flex gap-2 pt-1">
                <Link
                  to={`/scan?meal=${meal}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-brand-50 py-2.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-100 active:scale-[0.98]"
                >
                  📷 {t.diary.scan}
                </Link>
                <button
                  onClick={() => setModalMeal(meal)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 active:scale-[0.98]"
                >
                  ✏️ {t.diary.entry}
                </button>
              </div>
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
