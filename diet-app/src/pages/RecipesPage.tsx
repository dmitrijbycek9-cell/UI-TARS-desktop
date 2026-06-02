import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { clsx } from 'clsx';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, EmptyState } from '@/components/ui';
import { t } from '@/i18n/de';
import { db } from '@/db/db';
import { recipePerServing } from '@/lib/nutrition';
import { suggestRecipes } from '@/lib/suggestions';
import { useProfileStore } from '@/stores/useProfileStore';
import { useUiStore } from '@/stores/useUiStore';
import { useDailyTotals } from '@/hooks/useDailyTotals';
import type { Recipe } from '@/types';

type Tab = 'cookbook' | 'suggestions';

export default function RecipesPage() {
  const [tab, setTab] = useState<Tab>('cookbook');
  const recipes = useLiveQuery(
    () => db.recipes.orderBy('name').toArray(),
    [],
    [] as Recipe[],
  );

  return (
    <div>
      <PageHeader
        title={t.recipes.title}
        action={
          <Link
            to="/rezepte/neu"
            className="rounded-xl bg-brand-600 px-3 py-2 text-sm font-semibold text-white"
          >
            + {t.recipes.newRecipe}
          </Link>
        }
      />
      <div className="p-4">
        <div className="mb-4 flex rounded-xl bg-slate-200 p-1 text-sm font-medium">
          <TabBtn active={tab === 'cookbook'} onClick={() => setTab('cookbook')}>
            {t.recipes.cookbook}
          </TabBtn>
          <TabBtn
            active={tab === 'suggestions'}
            onClick={() => setTab('suggestions')}
          >
            {t.recipes.suggestions}
          </TabBtn>
        </div>

        {tab === 'cookbook' ? (
          <Cookbook recipes={recipes} />
        ) : (
          <Suggestions recipes={recipes} />
        )}
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex-1 rounded-lg py-1.5 transition',
        active ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500',
      )}
    >
      {children}
    </button>
  );
}

function Cookbook({ recipes }: { recipes: Recipe[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, Recipe[]>();
    for (const r of recipes) {
      const letter = r.name[0]?.toUpperCase() ?? '#';
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(r);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'de'));
  }, [recipes]);

  if (recipes.length === 0) {
    return <EmptyState icon="🍳" title={t.common.none} />;
  }

  return (
    <div className="space-y-5">
      {grouped.map(([letter, items]) => (
        <div key={letter}>
          <h2 className="mb-2 text-sm font-bold text-brand-600">{letter}</h2>
          <div className="space-y-2">
            {items.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Suggestions({ recipes }: { recipes: Recipe[] }) {
  const profile = useProfileStore((s) => s.profile);
  const selectedDate = useUiStore((s) => s.selectedDate);
  const totals = useDailyTotals(selectedDate);

  if (!profile) {
    return (
      <EmptyState icon="🎯" title={t.recipes.noSuggestions}>
        <Link to="/profil" className="text-brand-600 underline">
          {t.diary.setupProfile}
        </Link>
      </EmptyState>
    );
  }

  const remaining =
    profile.targetKcal - Math.round(totals.nutrients.kcal) + totals.burned;
  const suggestions = suggestRecipes(recipes, remaining);

  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">
        {t.recipes.suggestionsHint}{' '}
        <span className="font-semibold text-brand-600">
          {Math.max(0, remaining)} kcal
        </span>
      </p>
      {suggestions.length === 0 ? (
        <EmptyState icon="🍽️" title={t.recipes.noSuggestions} />
      ) : (
        <div className="space-y-2">
          {suggestions.map((s) => (
            <RecipeCard
              key={s.recipe.id}
              recipe={s.recipe}
              kcalOverride={Math.round(s.perServing.kcal)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecipeCard({
  recipe,
  kcalOverride,
}: {
  recipe: Recipe;
  kcalOverride?: number;
}) {
  const kcal = kcalOverride ?? Math.round(recipePerServing(recipe).kcal);
  return (
    <Link to={`/rezepte/${recipe.id}`}>
      <Card className="flex items-center justify-between gap-3 transition hover:ring-brand-200">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-slate-800">
              {recipe.name}
            </p>
            {recipe.isSeed && (
              <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-600">
                {t.recipes.seedBadge}
              </span>
            )}
          </div>
          {recipe.description && (
            <p className="truncate text-xs text-slate-400">
              {recipe.description}
            </p>
          )}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {recipe.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="font-bold text-brand-600">{kcal}</p>
          <p className="text-[10px] text-slate-400">kcal/{t.common.portion}</p>
        </div>
      </Card>
    </Link>
  );
}
