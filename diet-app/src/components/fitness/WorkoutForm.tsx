import { useState } from 'react';
import { Button, Field, Input, Modal, Select } from '@/components/ui';
import { t } from '@/i18n/de';
import { WORKOUT_TYPES, workoutCalories } from '@/lib/steps';
import { useFitnessStore } from '@/stores/useFitnessStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { useUiStore } from '@/stores/useUiStore';

export function WorkoutForm({
  open,
  onClose,
  dateKey,
}: {
  open: boolean;
  onClose: () => void;
  dateKey: string;
}) {
  const addWorkout = useFitnessStore((s) => s.addWorkout);
  const profile = useProfileStore((s) => s.profile);
  const showToast = useUiStore((s) => s.showToast);

  const [type, setType] = useState(WORKOUT_TYPES[0]);
  const [duration, setDuration] = useState(30);
  const [note, setNote] = useState('');
  const [manualKcal, setManualKcal] = useState('');

  const weightKg = profile?.weightKg ?? 75;
  const autoKcal = workoutCalories(type, duration, weightKg);
  const kcal = manualKcal ? Number(manualKcal) : autoKcal;

  async function handleAdd() {
    await addWorkout({
      dateKey,
      type,
      durationMin: duration,
      caloriesBurned: kcal,
      note: note.trim() || undefined,
    });
    showToast('Training hinzugefügt.');
    onClose();
    setDuration(30);
    setNote('');
    setManualKcal('');
  }

  return (
    <Modal open={open} onClose={onClose} title={t.fitness.addWorkout}>
      <div className="space-y-4">
        <Field label={t.fitness.workoutType}>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {WORKOUT_TYPES.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t.fitness.duration}>
          <Input
            type="number"
            inputMode="numeric"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </Field>
        <Field
          label={t.fitness.caloriesBurned}
          hint={`${t.fitness.autoCalc}: ${autoKcal} kcal`}
        >
          <Input
            type="number"
            inputMode="numeric"
            value={manualKcal}
            onChange={(e) => setManualKcal(e.target.value)}
            placeholder={String(autoKcal)}
          />
        </Field>
        <Field label={`${t.fitness.note} (${t.common.optional})`}>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Button className="w-full" onClick={handleAdd}>
          {t.common.add} · {kcal} kcal
        </Button>
      </div>
    </Modal>
  );
}
