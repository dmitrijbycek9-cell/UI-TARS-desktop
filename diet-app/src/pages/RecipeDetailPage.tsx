import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '@/components/layout/PageHeader';
import { NutritionTable } from '@/components/recipe/NutritionTable';
import { Button, Card, Field, Input, Select, Spinner } from '@/components/ui';
import { t } from '@/i18n/de';
import { db } from '@/db/db';
import {
  gramsPerServing,
  recipePerServing,
  recipeTotals,
  scaleNutrients,
} from '@/lib/nutrition';
import { useDiaryStore } from '@/stores/useDiaryStore';
import { useRecipeStore } from '@/stores/useRecipeStore';
import { useUiStore } from '@/stores/useUiStore';
import type { MealType } from '@/types';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function RecipeDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const addRecipeServing = useDiaryStore((s) => s.addRecipeServing);
  const deleteRecipe = useRecipeStore((s) => s.deleteRecipe);
  const selectedDate = useUiStore((s) => s.selectedDate);
  const showToast = useUiStore((s) => s.showToast);

  const [servings, setServings] = useState(1);
  const [meal, setMeal] = useState<MealType>('lunch');

  const recipe = useLiveQuery(() => db.recipes.get(id), [id]);

  if (recipe === undefined) {
    return (
      <div>
        <PageHeader title={t.recipes.title} back />
        <div className="flex justify-center p-10">
          <Spinner />
        </div>
      </div>
    );
  }

  if (recipe === null) {
    return (
      <div>
        <PageHeader title={t.recipes.title} back />
        <p className="p-4 text-slate-500">Rezept nicht gefunden.</p>
      </div>
    );
  }

  async function handleAddToDiary() {
    if (!recipe) return;
    await addRecipeServing(recipe, servings, meal, selectedDate);
    showToast(t.product.saved);
    navigate('/');
  }

  async function handleDelete() {
    if (!recipe) return;
    await deleteRecipe(recipe.id);
    showToast('Rezept gelöscht.', 'info');
    navigate('/rezepte');
  }

  return (
    <div>
      <PageHeader title={recipe.name} back subtitle={recipe.category} />
      <div className="space-y-4 p-4">
        <Card className="!p-0 overflow-hidden">
          <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-brand-100 to-emerald-50 text-7xl">
            {recipe.imageUrl ? (
              <img
                src={recipe.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{recipe.emoji ?? '🍽️'}</span>
            )}
          </div>
          {(recipe.description || recipe.videoUrl) && (
            <div className="space-y-3 p-4">
              {recipe.description && (
                <p className="text-sm text-slate-600">{recipe.description}</p>
              )}
              {recipe.videoUrl && (
                <a
                  href={recipe.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-100"
                >
                  🎬 {t.recipes.watchVideo}
                </a>
              )}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-2 font-semibold text-slate-700">
            {t.recipes.ingredients}{' '}
            <span className="text-sm font-normal text-slate-400">
              ({recipe.servings} {t.common.servings}, ~{gramsPerServing(recipe)}{' '}
              g/{t.common.portion})
            </span>
          </h2>
          <ul className="divide-y divide-slate-100">
            {recipe.ingredients.map((ing) => (
              <li
                key={ing.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-slate-700">{ing.name}</span>
                <span className="text-slate-400">
                  {ing.amountG} g ·{' '}
                  {Math.round(scaleNutrients(ing.per100g, ing.amountG).kcal)} kcal
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="grid grid-cols-2 gap-4">
          <NutritionTable
            nutrients={recipeTotals(recipe)}
            caption={t.common.total}
          />
          <NutritionTable
            nutrients={recipePerServing(recipe)}
            caption={t.common.perServing}
          />
        </Card>

        <Card className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t.common.servings}>
              <Input
                type="number"
                inputMode="decimal"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
              />
            </Field>
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
          </div>
          <Button className="w-full" onClick={handleAddToDiary}>
            {t.recipes.addServing}
          </Button>
        </Card>

        {!recipe.isSeed && (
          <Button variant="danger" className="w-full" onClick={handleDelete}>
            {t.recipes.deleteRecipe}
          </Button>
        )}
      </div>
    </div>
  );
}
