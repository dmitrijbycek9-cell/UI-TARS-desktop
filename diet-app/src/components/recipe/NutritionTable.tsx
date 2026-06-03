import { t } from '@/i18n/de';
import type { Nutrients } from '@/types';

const ROWS: { key: keyof Nutrients; unit: string; indent?: boolean }[] = [
  { key: 'carbs', unit: 'g' },
  { key: 'sugars', unit: 'g', indent: true },
  { key: 'protein', unit: 'g' },
  { key: 'fat', unit: 'g' },
  { key: 'saturatedFat', unit: 'g', indent: true },
  { key: 'fiber', unit: 'g' },
  { key: 'salt', unit: 'g' },
];

export function NutritionTable({
  nutrients,
  caption,
}: {
  nutrients: Nutrients;
  caption?: string;
}) {
  return (
    <div>
      {caption && (
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          {caption}
        </p>
      )}
      <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
        <span className="font-semibold text-slate-700">{t.nutrients.kcal}</span>
        <span className="text-lg font-bold text-brand-600">
          {Math.round(nutrients.kcal)} kcal
        </span>
      </div>
      <dl className="mt-2 space-y-1.5 text-sm">
        {ROWS.map((row) => {
          const value = nutrients[row.key];
          if (value === undefined) return null;
          return (
            <div
              key={row.key}
              className="flex items-center justify-between"
            >
              <dt
                className={
                  row.indent ? 'pl-3 text-slate-400' : 'text-slate-600'
                }
              >
                {t.nutrients[row.key as keyof typeof t.nutrients]}
              </dt>
              <dd className="font-medium text-slate-700">
                {value} {row.unit}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
