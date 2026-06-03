import { useMemo, useState } from 'react';
import { Button, Field, Input, Modal, Select } from '@/components/ui';
import { t } from '@/i18n/de';
import { COMMON_FOODS } from '@/data/cookbook';
import { scaleNutrients } from '@/lib/nutrition';
import { fileToCompressedDataUrl } from '@/lib/image';
import { useDiaryStore } from '@/stores/useDiaryStore';
import { useUiStore } from '@/stores/useUiStore';
import type { MealType, Nutrients } from '@/types';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function AddEntryModal({
  open,
  onClose,
  dateKey,
  defaultMeal,
}: {
  open: boolean;
  onClose: () => void;
  dateKey: string;
  defaultMeal: MealType;
}) {
  const addEntry = useDiaryStore((s) => s.addEntry);
  const showToast = useUiStore((s) => s.showToast);

  const [meal, setMeal] = useState<MealType>(defaultMeal);
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [grams, setGrams] = useState(100);
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [per100g, setPer100g] = useState<Nutrients>({
    kcal: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
  });

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPhoto(await fileToCompressedDataUrl(file));
    } catch {
      showToast('Foto konnte nicht geladen werden.', 'error');
    }
  }

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return COMMON_FOODS.filter((f) => f.name.toLowerCase().includes(q)).slice(
      0,
      6,
    );
  }, [query]);

  function pickFood(food: (typeof COMMON_FOODS)[number]) {
    setName(food.name);
    setPer100g(food.per100g);
    setQuery('');
  }

  function updateMacro(key: keyof Nutrients, value: number) {
    setPer100g((p) => ({ ...p, [key]: value }));
  }

  const preview = scaleNutrients(per100g, grams);

  async function handleAdd() {
    if (!name.trim()) {
      showToast('Bitte einen Namen angeben.', 'error');
      return;
    }
    await addEntry({
      dateKey,
      meal,
      label: name.trim(),
      source: 'manual',
      amountG: grams,
      nutrients: preview,
      photo,
    });
    showToast(t.product.saved);
    onClose();
    // Felder zurücksetzen
    setName('');
    setGrams(100);
    setPhoto(undefined);
    setPer100g({ kcal: 0, carbs: 0, protein: 0, fat: 0 });
  }

  return (
    <Modal open={open} onClose={onClose} title={t.diary.addManualTitle}>
      <div className="space-y-4">
        <Field label={t.diary.chooseMeal}>
          <Select
            value={meal}
            onChange={(e) => setMeal(e.target.value as MealType)}
          >
            {MEALS.map((m) => (
              <option key={m} value={m}>
                {t.meals[m]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Lebensmittel suchen" hint="Aus gängigen Lebensmitteln wählen">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="z. B. Apfel, Reis, Ei …"
          />
        </Field>
        {matches.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {matches.map((f) => (
              <button
                key={f.name}
                onClick={() => pickFood(f)}
                className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700 ring-1 ring-brand-100"
              >
                {f.name} · {f.per100g.kcal} kcal
              </button>
            ))}
          </div>
        )}

        <Field label={t.common.name}>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {t.product.manualTitle}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`${t.nutrients.kcal} (kcal)`}>
            <Input
              type="number"
              inputMode="decimal"
              value={per100g.kcal}
              onChange={(e) => updateMacro('kcal', Number(e.target.value))}
            />
          </Field>
          <Field label={`${t.nutrients.protein} (g)`}>
            <Input
              type="number"
              inputMode="decimal"
              value={per100g.protein}
              onChange={(e) => updateMacro('protein', Number(e.target.value))}
            />
          </Field>
          <Field label={`${t.nutrients.carbs} (g)`}>
            <Input
              type="number"
              inputMode="decimal"
              value={per100g.carbs}
              onChange={(e) => updateMacro('carbs', Number(e.target.value))}
            />
          </Field>
          <Field label={`${t.nutrients.fat} (g)`}>
            <Input
              type="number"
              inputMode="decimal"
              value={per100g.fat}
              onChange={(e) => updateMacro('fat', Number(e.target.value))}
            />
          </Field>
        </div>

        <Field label={`${t.common.amount} (${t.common.grams})`}>
          <Input
            type="number"
            inputMode="numeric"
            value={grams}
            onChange={(e) => setGrams(Number(e.target.value))}
          />
        </Field>

        <div>
          <span className="mb-1 block text-sm font-medium text-slate-600">
            {t.diary.photo} ({t.common.optional})
          </span>
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">
              📷 {photo ? t.diary.photoChange : t.diary.photoAdd}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhoto}
              />
            </label>
            {photo && (
              <img
                src={photo}
                alt=""
                className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200"
              />
            )}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
          Ergibt{' '}
          <span className="font-bold text-brand-600">
            {Math.round(preview.kcal)} kcal
          </span>{' '}
          · E {preview.protein} g · K {preview.carbs} g · F {preview.fat} g
        </div>

        <Button className="w-full" onClick={handleAdd}>
          {t.common.add}
        </Button>
      </div>
    </Modal>
  );
}
