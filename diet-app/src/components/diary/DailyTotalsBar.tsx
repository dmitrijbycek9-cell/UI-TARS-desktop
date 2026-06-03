import { Link } from 'react-router-dom';
import { Card, ProgressBar } from '@/components/ui';
import { t } from '@/i18n/de';
import { useProfileStore } from '@/stores/useProfileStore';
import type { DailyTotals } from '@/hooks/useDailyTotals';

export function DailyTotalsBar({ totals }: { totals: DailyTotals }) {
  const profile = useProfileStore((s) => s.profile);
  const consumed = Math.round(totals.nutrients.kcal);
  const target = profile?.targetKcal ?? 0;
  const burned = totals.burned;
  const remaining = target > 0 ? target - consumed + burned : 0;

  if (!profile) {
    return (
      <Card className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-slate-500">{t.diary.noProfileHint}</p>
        <Link
          to="/profil"
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
        >
          {t.diary.setupProfile}
        </Link>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-400">{t.diary.consumed}</p>
          <p className="text-2xl font-bold text-slate-900">
            {consumed}
            <span className="text-sm font-medium text-slate-400">
              {' '}
              / {target} kcal
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">{t.diary.remaining}</p>
          <p
            className={`text-xl font-bold ${
              remaining < 0 ? 'text-red-500' : 'text-brand-600'
            }`}
          >
            {remaining}
          </p>
        </div>
      </div>
      <ProgressBar value={consumed} max={target} />
      <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
        <Macro
          label={t.nutrients.protein}
          value={Math.round(totals.nutrients.protein)}
          target={profile.targetMacros.protein}
          color="sky"
        />
        <Macro
          label={t.nutrients.carbs}
          value={Math.round(totals.nutrients.carbs)}
          target={profile.targetMacros.carbs}
          color="amber"
        />
        <Macro
          label={t.nutrients.fat}
          value={Math.round(totals.nutrients.fat)}
          target={profile.targetMacros.fat}
          color="rose"
        />
      </div>
      {burned > 0 && (
        <p className="pt-1 text-center text-xs text-slate-400">
          🔥 {t.diary.burned}: {burned} kcal
        </p>
      )}
    </Card>
  );
}

function Macro({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: number;
  target: number;
  color: 'sky' | 'amber' | 'rose';
}) {
  return (
    <div>
      <p className="mb-1 font-medium text-slate-500">{label}</p>
      <ProgressBar value={value} max={target} color={color} />
      <p className="mt-1 text-slate-400">
        {value} / {target} g
      </p>
    </div>
  );
}
