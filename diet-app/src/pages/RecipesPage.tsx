import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { clsx } from 'clsx';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, EmptyState, Input } from '@/components/ui';
import { t } from '@/i18n/de';
import { db } from '@/db/db';
import { RECIPE_CATEGORIES } from '@/data/cookbook';
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
            className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/25"
          >
            + Neu
          </Link>
        }
      />
      <div className="p-4">
        <div className="mb-4 flex rounded-2xl bg-slate-200/70 p-1 text-sm font-semibold">
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
        'flex-1 rounded-xl py-2 transition',
        active ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500',
      )}
    >
      {children}
    </button>
  );
}

function Cookbook({ recipes }: { recipes: Recipe[] }) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string>('all');

  const categories = useMemo(() => {
    const fromData = new Set<string>(RECIPE_CATEGORIES);
    recipes.forEach((r) => r.category && fromData.add(r.category));
    return ['all', ...fromData];
  }, [recipes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((r) => {
      const matchCat = cat === 'all' || r.category === cat;
      const matchQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.tags?.some((tag) => tag.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [recipes, query, cat]);

  return (
    <div>
      <div className="mb-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.recipes.search}
        />
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={clsx(
              'whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition',
              cat === c
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200',
            )}
          >
            {c === 'all' ? t.recipes.all : c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🍳" title={t.recipes.noResults} />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
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
        <div className="space-y-2.5">
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
    <Link to={`/rezepte/${recipe.id}`} className="block">
      <Card className="flex items-center gap-3 !p-3 transition active:scale-[0.99]">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-100 to-emerald-50 text-3xl ring-1 ring-brand-100">
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
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-bold text-slate-800">{recipe.name}</p>
            {recipe.videoUrl && <span title="Koch-Video">🎬</span>}
          </div>
          {recipe.category && (
            <p className="text-xs font-medium text-brand-600">
              {recipe.category}
            </p>
          )}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map((tag) => (
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
          <p className="text-lg font-extrabold text-brand-600">{kcal}</p>
          <p className="text-[10px] text-slate-400">kcal/Port.</p>
        </div>
      </Card>
    </Link>
  );
}
