import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { IngredientPicker } from '@/components/recipe/IngredientPicker';
import { NutritionTable } from '@/components/recipe/NutritionTable';
import { Button, Card, EmptyState, Field, Input } from '@/components/ui';
import { fileToCompressedDataUrl } from '@/lib/image';
import { t } from '@/i18n/de';
import {
  recipePerServing,
  recipeTotals,
  scaleNutrients,
} from '@/lib/nutrition';
import { useRecipeStore } from '@/stores/useRecipeStore';
import { useUiStore } from '@/stores/useUiStore';
import type { Ingredient, Recipe } from '@/types';

export default function RecipeBuilderPage() {
  const navigate = useNavigate();
  const saveRecipe = useRecipeStore((s) => s.saveRecipe);
  const showToast = useUiStore((s) => s.showToast);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [emoji, setEmoji] = useState('🍽️');
  const [videoUrl, setVideoUrl] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [servings, setServings] = useState(2);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const draft: Recipe = {
    id: 'draft',
    name,
    category,
    servings,
    ingredients,
    createdAt: 0,
  };

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImageUrl(await fileToCompressedDataUrl(file));
    } catch {
      showToast('Foto konnte nicht geladen werden.', 'error');
    }
  }

  function addIngredient(ing: Ingredient) {
    setIngredients((prev) => [...prev, ing]);
  }

  function removeIngredient(id: string) {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleSave() {
    if (!name.trim()) {
      showToast('Bitte einen Rezeptnamen angeben.', 'error');
      return;
    }
    if (ingredients.length === 0) {
      showToast('Bitte mindestens eine Zutat hinzufügen.', 'error');
      return;
    }
    const recipe: Recipe = {
      id: crypto.randomUUID(),
      name: name.trim(),
      category: category.trim() || undefined,
      emoji: emoji.trim() || '🍽️',
      videoUrl: videoUrl.trim() || undefined,
      imageUrl,
      servings: Math.max(1, servings),
      ingredients,
      createdAt: Date.now(),
    };
    await saveRecipe(recipe);
    showToast('Rezept gespeichert.');
    navigate(`/rezepte/${recipe.id}`);
  }

  return (
    <div>
      <PageHeader title={t.recipes.builderTitle} back />
      <div className="space-y-4 p-4">
        <Card className="space-y-3">
          <Field label={t.recipes.recipeName}>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`${t.recipes.category} (${t.common.optional})`}>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="z. B. Hauptgerichte"
              />
            </Field>
            <Field label={t.common.servings}>
              <Input
                type="number"
                inputMode="numeric"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
              />
            </Field>
            <Field label={t.recipes.emoji}>
              <Input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={4}
              />
            </Field>
            <div>
              <span className="mb-1 block text-sm font-medium text-slate-600">
                {t.recipes.photo}
              </span>
              <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                📷 {imageUrl ? '✓' : t.recipes.photoAdd}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhoto}
                />
              </label>
            </div>
          </div>
          <Field label={`${t.recipes.videoUrl} (${t.common.optional})`}>
            <Input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/..."
              inputMode="url"
            />
          </Field>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-slate-700">
            {t.recipes.ingredients}
          </h2>
          {ingredients.length === 0 ? (
            <EmptyState icon="🥕" title={t.recipes.noIngredients} />
          ) : (
            <ul className="mb-3 divide-y divide-slate-100">
              {ingredients.map((ing) => (
                <li
                  key={ing.id}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {ing.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {ing.amountG} g ·{' '}
                      {Math.round(
                        scaleNutrients(ing.per100g, ing.amountG).kcal,
                      )}{' '}
                      kcal
                    </p>
                  </div>
                  <button
                    onClick={() => removeIngredient(ing.id)}
                    className="rounded-full px-2 py-1 text-slate-300 hover:bg-red-50 hover:text-red-500"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          <IngredientPicker onAdd={addIngredient} />
        </Card>

        {ingredients.length > 0 && (
          <Card className="grid grid-cols-2 gap-4">
            <NutritionTable
              nutrients={recipeTotals(draft)}
              caption={t.common.total}
            />
            <NutritionTable
              nutrients={recipePerServing(draft)}
              caption={t.common.perServing}
            />
          </Card>
        )}

        <Button className="w-full" onClick={handleSave}>
          {t.recipes.saveRecipe}
        </Button>
      </div>
    </div>
  );
}
