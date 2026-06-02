import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button, Card, Field, Input, ProgressBar } from '@/components/ui';
import { t } from '@/i18n/de';
import { db } from '@/db/db';
import { stepsToKm } from '@/lib/steps';
import { isMotionSupported, useStepCounter } from '@/hooks/useStepCounter';
import { useFitnessStore } from '@/stores/useFitnessStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { useUiStore } from '@/stores/useUiStore';

export function StepCounterCard({ dateKey }: { dateKey: string }) {
  const profile = useProfileStore((s) => s.profile);
  const setSteps = useFitnessStore((s) => s.setSteps);
  const showToast = useUiStore((s) => s.showToast);
  const { running, sessionSteps, error, start, stop } = useStepCounter();

  const heightCm = profile?.heightCm ?? 175;
  const weightKg = profile?.weightKg ?? 75;
  const goal = profile?.stepGoal ?? 10000;

  const record = useLiveQuery(() => db.steps.get(dateKey), [dateKey]);
  const storedSteps = record?.steps ?? 0;
  const [manualSteps, setManualSteps] = useState('');

  // Live-Schritte der Session in die Tagessumme schreiben
  useEffect(() => {
    if (running && sessionSteps > 0) {
      setSteps(dateKey, storedSteps + sessionSteps, goal, heightCm, weightKg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionSteps]);

  const total = storedSteps;
  const km = stepsToKm(total, heightCm);
  const kcal = record?.caloriesBurned ?? 0;

  async function saveManual() {
    const n = Number(manualSteps);
    if (!Number.isFinite(n) || n < 0) return;
    await setSteps(dateKey, n, goal, heightCm, weightKg);
    setManualSteps('');
    showToast('Schritte gespeichert.');
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-400">{t.fitness.steps}</p>
          <p className="text-3xl font-bold text-slate-900">
            {total.toLocaleString('de-DE')}
            <span className="text-sm font-medium text-slate-400">
              {' '}
              / {goal.toLocaleString('de-DE')}
            </span>
          </p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <p>🚶 {km} km</p>
          <p>🔥 {kcal} kcal</p>
        </div>
      </div>
      <ProgressBar value={total} max={goal} />

      {isMotionSupported() ? (
        <>
          {running ? (
            <Button variant="danger" className="w-full" onClick={stop}>
              ⏸ {t.fitness.stopCounter} ({sessionSteps})
            </Button>
          ) : (
            <Button className="w-full" onClick={start}>
              ▶ {t.fitness.startCounter}
            </Button>
          )}
          <p className="text-center text-xs text-slate-400">
            {t.fitness.stepHint}
          </p>
        </>
      ) : (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs text-amber-700">
          {t.fitness.stepDesktopHint}
        </p>
      )}

      {error && (
        <p className="text-center text-xs text-red-500">{error}</p>
      )}

      <div className="flex items-end gap-2">
        <Field label={t.fitness.addStepsManual}>
          <Input
            type="number"
            inputMode="numeric"
            value={manualSteps}
            onChange={(e) => setManualSteps(e.target.value)}
            placeholder={String(total)}
          />
        </Field>
        <Button variant="secondary" onClick={saveManual}>
          {t.common.save}
        </Button>
      </div>
    </Card>
  );
}
