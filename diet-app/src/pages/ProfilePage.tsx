import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, Field, Input, Select } from '@/components/ui';
import { t } from '@/i18n/de';
import { useProfileStore } from '@/stores/useProfileStore';
import { useUiStore } from '@/stores/useUiStore';
import { bmi, bmiCategory, type ProfileInput } from '@/lib/health';
import type { ActivityLevel, Goal, Sex } from '@/types';

const DEFAULTS: ProfileInput = {
  age: 30,
  sex: 'male',
  heightCm: 175,
  weightKg: 75,
  activity: 'moderate',
  goal: 'maintain',
  stepGoal: 10000,
};

const BMI_LABEL: Record<ReturnType<typeof bmiCategory>, string> = {
  under: t.bmiCategory.under,
  normal: t.bmiCategory.normal,
  over: t.bmiCategory.over,
  obese: t.bmiCategory.obese,
};

const BMI_COLOR: Record<ReturnType<typeof bmiCategory>, string> = {
  under: 'text-sky-600',
  normal: 'text-brand-600',
  over: 'text-amber-600',
  obese: 'text-red-600',
};

export default function ProfilePage() {
  const profile = useProfileStore((s) => s.profile);
  const saveProfile = useProfileStore((s) => s.saveProfile);
  const showToast = useUiStore((s) => s.showToast);

  const [form, setForm] = useState<ProfileInput>(() =>
    profile
      ? {
          age: profile.age,
          sex: profile.sex,
          heightCm: profile.heightCm,
          weightKg: profile.weightKg,
          activity: profile.activity,
          goal: profile.goal,
          stepGoal: profile.stepGoal,
        }
      : DEFAULTS,
  );

  function update<K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    await saveProfile(form);
    showToast(t.profile.saved);
  }

  const bmiValue = bmi(form.weightKg, form.heightCm);
  const cat = bmiCategory(bmiValue);

  return (
    <div>
      <PageHeader title={t.profile.title} />
      <div className="space-y-4 p-4">
        <Card className="space-y-4">
          <p className="text-sm font-semibold text-slate-500">
            {t.profile.yourValues}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.profile.age}>
              <Input
                type="number"
                inputMode="numeric"
                value={form.age}
                onChange={(e) => update('age', Number(e.target.value))}
              />
            </Field>
            <Field label={t.profile.sex}>
              <Select
                value={form.sex}
                onChange={(e) => update('sex', e.target.value as Sex)}
              >
                <option value="male">{t.sex.male}</option>
                <option value="female">{t.sex.female}</option>
              </Select>
            </Field>
            <Field label={t.profile.height}>
              <Input
                type="number"
                inputMode="numeric"
                value={form.heightCm}
                onChange={(e) => update('heightCm', Number(e.target.value))}
              />
            </Field>
            <Field label={t.profile.weight}>
              <Input
                type="number"
                inputMode="decimal"
                value={form.weightKg}
                onChange={(e) => update('weightKg', Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label={t.profile.activity}>
            <Select
              value={form.activity}
              onChange={(e) =>
                update('activity', e.target.value as ActivityLevel)
              }
            >
              {(Object.keys(t.activity) as ActivityLevel[]).map((key) => (
                <option key={key} value={key}>
                  {t.activity[key]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.profile.goal}>
            <Select
              value={form.goal}
              onChange={(e) => update('goal', e.target.value as Goal)}
            >
              {(Object.keys(t.goal) as Goal[]).map((key) => (
                <option key={key} value={key}>
                  {t.goal[key]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t.profile.stepGoal}>
            <Input
              type="number"
              inputMode="numeric"
              value={form.stepGoal}
              onChange={(e) => update('stepGoal', Number(e.target.value))}
            />
          </Field>
          <Button className="w-full" onClick={handleSave}>
            {t.profile.save}
          </Button>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-slate-500">
              {t.profile.bmi}
            </span>
            <span className={`text-2xl font-bold ${BMI_COLOR[cat]}`}>
              {bmiValue}{' '}
              <span className="text-sm font-medium">{BMI_LABEL[cat]}</span>
            </span>
          </div>

          {profile ? (
            <div className="grid grid-cols-2 gap-3">
              <Stat label={t.profile.bmr} value={`${profile.bmr} kcal`} />
              <Stat label={t.profile.tdee} value={`${profile.tdee} kcal`} />
              <Stat
                label={t.profile.targetKcal}
                value={`${profile.targetKcal} kcal`}
                highlight
              />
              <Stat
                label={t.profile.targetMacros}
                value={`E ${profile.targetMacros.protein} · K ${profile.targetMacros.carbs} · F ${profile.targetMacros.fat} g`}
              />
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              {t.profile.fillToCalculate}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 ${
        highlight ? 'bg-brand-50 ring-1 ring-brand-100' : 'bg-slate-50'
      }`}
    >
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-0.5 font-bold ${
          highlight ? 'text-brand-700' : 'text-slate-800'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
