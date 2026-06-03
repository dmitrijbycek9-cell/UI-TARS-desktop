import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Button, Card, Modal } from '@/components/ui';
import { t } from '@/i18n/de';
import { EXERCISES, EXERCISE_CATEGORIES } from '@/data/exercises';
import { roundTo } from '@/lib/nutrition';
import { useFitnessStore } from '@/stores/useFitnessStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { useUiStore } from '@/stores/useUiStore';
import type { Exercise } from '@/types';

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ExerciseLibrary({ dateKey }: { dateKey: string }) {
  const [cat, setCat] = useState<string>(EXERCISE_CATEGORIES[0]);
  const [active, setActive] = useState<Exercise | null>(null);

  const list = EXERCISES.filter((e) => e.category === cat);

  return (
    <Card className="space-y-3">
      <h2 className="font-semibold text-slate-700">{t.fitness2.exercises}</h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {EXERCISE_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={clsx(
              'whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition',
              cat === c
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {list.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setActive(ex)}
            className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left ring-1 ring-slate-100 active:scale-[0.99]"
          >
            <span className="text-2xl">{ex.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-700">{ex.name}</p>
              <p className="truncate text-xs text-slate-400">{ex.description}</p>
            </div>
            <span className="shrink-0 text-sm font-medium text-brand-600">
              {fmt(ex.durationSec)}
            </span>
          </button>
        ))}
      </div>

      {active && (
        <ExerciseTimer
          exercise={active}
          dateKey={dateKey}
          onClose={() => setActive(null)}
        />
      )}
    </Card>
  );
}

function ExerciseTimer({
  exercise,
  dateKey,
  onClose,
}: {
  exercise: Exercise;
  dateKey: string;
  onClose: () => void;
}) {
  const addWorkout = useFitnessStore((s) => s.addWorkout);
  const profile = useProfileStore((s) => s.profile);
  const showToast = useUiStore((s) => s.showToast);
  const weightKg = profile?.weightKg ?? 75;

  const [remaining, setRemaining] = useState(exercise.durationSec);
  const [running, setRunning] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer.current!);
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);

  const elapsed = exercise.durationSec - remaining;
  const done = remaining === 0;

  async function save() {
    const minutes = Math.max(1, Math.round(elapsed / 60));
    const kcal = roundTo(exercise.met * weightKg * (elapsed / 3600), 0);
    await addWorkout({
      dateKey,
      type: `${exercise.category}: ${exercise.name}`,
      durationMin: minutes,
      caloriesBurned: kcal,
    });
    showToast(t.fitness2.saved);
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={exercise.name}>
      <div className="space-y-4 text-center">
        <div className="text-6xl">{exercise.emoji}</div>
        <div className="text-5xl font-extrabold tabular-nums text-slate-900">
          {fmt(remaining)}
        </div>
        <p className="text-sm text-slate-500">{exercise.description}</p>

        {!done ? (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setRunning((r) => !r)}
            >
              {running ? `⏸ ${t.fitness2.pause}` : `▶ ${t.fitness2.resume}`}
            </Button>
            <Button variant="primary" className="flex-1" onClick={save}>
              {t.fitness2.finishEarly}
            </Button>
          </div>
        ) : (
          <Button className="w-full" onClick={save}>
            ✓ {t.fitness2.done}
          </Button>
        )}
      </div>
    </Modal>
  );
}
