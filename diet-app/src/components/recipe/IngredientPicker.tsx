import { useMemo, useState } from 'react';
import { Button, Field, Input } from '@/components/ui';
import { t } from '@/i18n/de';
import { COMMON_FOODS } from '@/data/cookbook';
import { makeIngredient } from '@/lib/nutrition';
import type { Ingredient, Nutrients } from '@/types';

/** Sucht gängige Lebensmittel oder erfasst eine eigene Zutat (pro 100 g). */
export function IngredientPicker({
  onAdd,
}: {
  onAdd: (ingredient: Ingredient) => void;
}) {
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [grams, setGrams] = useState(100);
  const [per100g, setPer100g] = useState<Nutrients>({
    kcal: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
  });

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return COMMON_FOODS.filter((f) => f.name.toLowerCase().includes(q)).slice(
      0,
      8,
    );
  }, [query]);

  function add() {
    if (!name.trim()) return;
    onAdd(makeIngredient(name.trim(), grams, per100g));
    setName('');
    setGrams(100);
    setPer100g({ kcal: 0, carbs: 0, protein: 0, fat: 0 });
    setQuery('');
  }

  return (
    <div className="space-y-3">
      <Field label="Zutat suchen">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="z. B. Hähnchenbrust, Reis …"
        />
      </Field>
      {matches.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {matches.map((f) => (
            <button
              key={f.name}
              onClick={() => onAdd(makeIngredient(f.name, 100, f.per100g))}
              className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700 ring-1 ring-brand-100"
            >
              + {f.name}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-slate-50 p-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          Eigene Zutat (pro 100 g)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Field label={t.common.name}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label={`${t.common.amount} (g)`}>
            <Input
              type="number"
              inputMode="numeric"
              value={grams}
              onChange={(e) => setGrams(Number(e.target.value))}
            />
          </Field>
          <Field label="kcal">
            <Input
              type="number"
              inputMode="decimal"
              value={per100g.kcal}
              onChange={(e) =>
                setPer100g((p) => ({ ...p, kcal: Number(e.target.value) }))
              }
            />
          </Field>
          <Field label="Eiweiß (g)">
            <Input
              type="number"
              inputMode="decimal"
              value={per100g.protein}
              onChange={(e) =>
                setPer100g((p) => ({ ...p, protein: Number(e.target.value) }))
              }
            />
          </Field>
          <Field label="KH (g)">
            <Input
              type="number"
              inputMode="decimal"
              value={per100g.carbs}
              onChange={(e) =>
                setPer100g((p) => ({ ...p, carbs: Number(e.target.value) }))
              }
            />
          </Field>
          <Field label="Fett (g)">
            <Input
              type="number"
              inputMode="decimal"
              value={per100g.fat}
              onChange={(e) =>
                setPer100g((p) => ({ ...p, fat: Number(e.target.value) }))
              }
            />
          </Field>
        </div>
        <Button variant="secondary" className="mt-3 w-full" onClick={add}>
          {t.recipes.addIngredient}
        </Button>
      </div>
    </div>
  );
}
