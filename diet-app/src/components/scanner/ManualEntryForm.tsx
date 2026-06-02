import { useState } from 'react';
import { Button, Field, Input } from '@/components/ui';
import { t } from '@/i18n/de';
import { saveManualProduct } from '@/lib/api/openFoodFacts';
import type { Nutrients, Product } from '@/types';

/** Fallback-Formular: Nährwerte (pro 100 g) manuell erfassen und als Produkt speichern. */
export function ManualEntryForm({
  barcode,
  onSaved,
}: {
  barcode: string;
  onSaved: (product: Product) => void;
}) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [per100g, setPer100g] = useState<Nutrients>({
    kcal: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
  });

  function update(key: keyof Nutrients, value: number) {
    setPer100g((p) => ({ ...p, [key]: value }));
  }

  async function handleSave() {
    if (!name.trim()) return;
    const product = await saveManualProduct(
      barcode,
      name.trim(),
      per100g,
      brand.trim() || undefined,
    );
    onSaved(product);
  }

  return (
    <div className="space-y-4">
      <Field label={t.product.productName}>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={`${t.product.brand} (${t.common.optional})`}>
        <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
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
            onChange={(e) => update('kcal', Number(e.target.value))}
          />
        </Field>
        <Field label={`${t.nutrients.protein} (g)`}>
          <Input
            type="number"
            inputMode="decimal"
            value={per100g.protein}
            onChange={(e) => update('protein', Number(e.target.value))}
          />
        </Field>
        <Field label={`${t.nutrients.carbs} (g)`}>
          <Input
            type="number"
            inputMode="decimal"
            value={per100g.carbs}
            onChange={(e) => update('carbs', Number(e.target.value))}
          />
        </Field>
        <Field label={`${t.nutrients.fat} (g)`}>
          <Input
            type="number"
            inputMode="decimal"
            value={per100g.fat}
            onChange={(e) => update('fat', Number(e.target.value))}
          />
        </Field>
      </div>
      <Button className="w-full" onClick={handleSave}>
        {t.common.save}
      </Button>
    </div>
  );
}
