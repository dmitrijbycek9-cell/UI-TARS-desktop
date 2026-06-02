import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '@/components/layout/PageHeader';
import { DateSwitcher } from '@/components/diary/DateSwitcher';
import { StepCounterCard } from '@/components/fitness/StepCounterCard';
import { WorkoutForm } from '@/components/fitness/WorkoutForm';
import { Button, Card, EmptyState } from '@/components/ui';
import { t } from '@/i18n/de';
import { db } from '@/db/db';
import { useFitnessStore } from '@/stores/useFitnessStore';
import { useUiStore } from '@/stores/useUiStore';
import type { Workout } from '@/types';

export default function FitnessPage() {
  const selectedDate = useUiStore((s) => s.selectedDate);
  const removeWorkout = useFitnessStore((s) => s.removeWorkout);
  const [formOpen, setFormOpen] = useState(false);

  const workouts = useLiveQuery(
    () => db.workouts.where('dateKey').equals(selectedDate).toArray(),
    [selectedDate],
    [] as Workout[],
  );

  const totalBurned = workouts.reduce((s, w) => s + w.caloriesBurned, 0);

  return (
    <div>
      <PageHeader title={t.fitness.title} />
      <div className="space-y-4 p-4">
        <Card className="!p-3">
          <DateSwitcher />
        </Card>

        <StepCounterCard dateKey={selectedDate} />

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">
              {t.fitness.workouts}
            </h2>
            {totalBurned > 0 && (
              <span className="text-sm text-slate-400">
                🔥 {totalBurned} kcal
              </span>
            )}
          </div>

          {workouts.length === 0 ? (
            <EmptyState icon="🏋️" title={t.common.none} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {workouts.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {w.type}
                    </p>
                    <p className="text-xs text-slate-400">
                      {w.durationMin} Min.{w.note ? ` · ${w.note}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-600">
                      {w.caloriesBurned} kcal
                    </span>
                    <button
                      onClick={() => removeWorkout(w.id)}
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
            onClick={() => setFormOpen(true)}
          >
            + {t.fitness.addWorkout}
          </Button>
        </Card>
      </div>

      <WorkoutForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        dateKey={selectedDate}
      />
    </div>
  );
}
