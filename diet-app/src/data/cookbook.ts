import type { Ingredient, Nutrients, Recipe } from '@/types';

/**
 * Kleine Nährwert-Bibliothek gängiger Zutaten (Werte pro 100 g/ml, gerundet).
 * Quelle: typische Durchschnittswerte – dienen als Startdaten fürs Kochbuch.
 */
const FOODS: Record<string, Nutrients> = {
  Haferflocken: { kcal: 372, carbs: 59, sugars: 1, protein: 13, fat: 7, fiber: 10 },
  Milch: { kcal: 64, carbs: 5, sugars: 5, protein: 3.4, fat: 3.6 },
  Apfel: { kcal: 52, carbs: 14, sugars: 10, protein: 0.3, fat: 0.2, fiber: 2.4 },
  Banane: { kcal: 89, carbs: 23, sugars: 12, protein: 1.1, fat: 0.3, fiber: 2.6 },
  Honig: { kcal: 304, carbs: 82, sugars: 82, protein: 0.3, fat: 0 },
  Naturjoghurt: { kcal: 61, carbs: 5, sugars: 5, protein: 3.5, fat: 3.3 },
  Magerquark: { kcal: 67, carbs: 4, sugars: 4, protein: 12, fat: 0.3 },
  Ei: { kcal: 155, carbs: 1.1, sugars: 1, protein: 13, fat: 11 },
  Vollkornbrot: { kcal: 247, carbs: 41, sugars: 3, protein: 9, fat: 3.4, fiber: 7 },
  Butter: { kcal: 717, carbs: 0.6, sugars: 0.6, protein: 0.9, fat: 81 },
  Olivenöl: { kcal: 884, carbs: 0, sugars: 0, protein: 0, fat: 100 },
  Hähnchenbrust: { kcal: 165, carbs: 0, sugars: 0, protein: 31, fat: 3.6 },
  Hackfleisch: { kcal: 250, carbs: 0, sugars: 0, protein: 26, fat: 17 },
  Lachs: { kcal: 208, carbs: 0, sugars: 0, protein: 20, fat: 13 },
  Thunfisch: { kcal: 116, carbs: 0, sugars: 0, protein: 26, fat: 1 },
  Reis: { kcal: 130, carbs: 28, sugars: 0, protein: 2.7, fat: 0.3 },
  Nudeln: { kcal: 158, carbs: 31, sugars: 1, protein: 6, fat: 0.9 },
  Kartoffeln: { kcal: 77, carbs: 17, sugars: 0.8, protein: 2, fat: 0.1, fiber: 2.2 },
  Tomaten: { kcal: 18, carbs: 3.9, sugars: 2.6, protein: 0.9, fat: 0.2 },
  Tomatensoße: { kcal: 35, carbs: 6, sugars: 5, protein: 1.5, fat: 0.5 },
  Zwiebel: { kcal: 40, carbs: 9, sugars: 4.2, protein: 1.1, fat: 0.1 },
  Paprika: { kcal: 31, carbs: 6, sugars: 4.2, protein: 1, fat: 0.3 },
  Gurke: { kcal: 15, carbs: 3.6, sugars: 1.7, protein: 0.7, fat: 0.1 },
  Salat: { kcal: 15, carbs: 2.9, sugars: 0.8, protein: 1.4, fat: 0.2 },
  Möhren: { kcal: 41, carbs: 10, sugars: 4.7, protein: 0.9, fat: 0.2, fiber: 2.8 },
  Brokkoli: { kcal: 34, carbs: 7, sugars: 1.7, protein: 2.8, fat: 0.4, fiber: 2.6 },
  Spinat: { kcal: 23, carbs: 3.6, sugars: 0.4, protein: 2.9, fat: 0.4 },
  Käse: { kcal: 350, carbs: 1.3, sugars: 0.5, protein: 25, fat: 27 },
  Mozzarella: { kcal: 280, carbs: 3, sugars: 1, protein: 22, fat: 22 },
  Feta: { kcal: 264, carbs: 4, sugars: 4, protein: 14, fat: 21 },
  Linsen: { kcal: 116, carbs: 20, sugars: 1.8, protein: 9, fat: 0.4, fiber: 8 },
  Kichererbsen: { kcal: 164, carbs: 27, sugars: 5, protein: 9, fat: 2.6, fiber: 8 },
  Kidneybohnen: { kcal: 127, carbs: 23, sugars: 0.3, protein: 9, fat: 0.5, fiber: 7 },
  Quinoa: { kcal: 120, carbs: 21, sugars: 0.9, protein: 4.4, fat: 1.9, fiber: 2.8 },
  Mais: { kcal: 86, carbs: 19, sugars: 3.2, protein: 3.3, fat: 1.2 },
  Avocado: { kcal: 160, carbs: 9, sugars: 0.7, protein: 2, fat: 15, fiber: 7 },
  Erdnussbutter: { kcal: 588, carbs: 20, sugars: 9, protein: 25, fat: 50 },
  Beeren: { kcal: 57, carbs: 14, sugars: 10, protein: 0.7, fat: 0.3, fiber: 2.4 },
  Mandeln: { kcal: 579, carbs: 22, sugars: 4, protein: 21, fat: 50, fiber: 12 },
  Couscous: { kcal: 112, carbs: 23, sugars: 0.1, protein: 3.8, fat: 0.2 },
  Schinken: { kcal: 145, carbs: 1, sugars: 1, protein: 21, fat: 6 },
  Champignons: { kcal: 22, carbs: 3.3, sugars: 2, protein: 3.1, fat: 0.3 },
};

function ing(name: string, amountG: number): Ingredient {
  const per100g = FOODS[name];
  if (!per100g) throw new Error(`Unbekannte Zutat im Kochbuch: ${name}`);
  return { id: `seed-ing-${name}-${amountG}`, name, amountG, per100g };
}

interface SeedDef {
  id: string;
  name: string;
  category: string;
  description: string;
  tags: string[];
  servings: number;
  ingredients: [string, number][];
}

const SEED_DEFS: SeedDef[] = [
  {
    id: 'seed-apfel-haferbrei',
    name: 'Apfel-Haferbrei',
    category: 'Frühstück',
    description: 'Warmer Haferbrei mit Apfel und einem Hauch Honig.',
    tags: ['vegetarisch', 'frühstück'],
    servings: 1,
    ingredients: [['Haferflocken', 60], ['Milch', 250], ['Apfel', 120], ['Honig', 10]],
  },
  {
    id: 'seed-beeren-quark',
    name: 'Beeren-Quark',
    category: 'Frühstück',
    description: 'Eiweißreicher Quark mit frischen Beeren.',
    tags: ['vegetarisch', 'high-protein'],
    servings: 1,
    ingredients: [['Magerquark', 250], ['Beeren', 100], ['Honig', 10]],
  },
  {
    id: 'seed-couscous-salat',
    name: 'Couscous-Salat',
    category: 'Salate',
    description: 'Leichter Couscous-Salat mit Gemüse und Feta.',
    tags: ['vegetarisch'],
    servings: 2,
    ingredients: [['Couscous', 200], ['Gurke', 100], ['Tomaten', 150], ['Feta', 80], ['Olivenöl', 15]],
  },
  {
    id: 'seed-dal-linsen',
    name: 'Dal aus roten Linsen',
    category: 'Eintöpfe',
    description: 'Würziges Linsen-Dal mit Möhren und Zwiebeln.',
    tags: ['vegan', 'high-protein'],
    servings: 3,
    ingredients: [['Linsen', 250], ['Möhren', 150], ['Zwiebel', 100], ['Tomatensoße', 200], ['Olivenöl', 15]],
  },
  {
    id: 'seed-eieromelett',
    name: 'Eier-Omelett mit Gemüse',
    category: 'Frühstück',
    description: 'Fluffiges Omelett mit Paprika und Champignons.',
    tags: ['vegetarisch', 'low-carb', 'high-protein'],
    servings: 1,
    ingredients: [['Ei', 150], ['Paprika', 80], ['Champignons', 60], ['Käse', 30], ['Olivenöl', 10]],
  },
  {
    id: 'seed-feta-salat',
    name: 'Griechischer Feta-Salat',
    category: 'Salate',
    description: 'Frischer Salat mit Gurke, Tomate und Feta.',
    tags: ['vegetarisch', 'low-carb'],
    servings: 2,
    ingredients: [['Salat', 100], ['Gurke', 150], ['Tomaten', 200], ['Feta', 100], ['Olivenöl', 20]],
  },
  {
    id: 'seed-gemuese-curry',
    name: 'Gemüse-Curry mit Kichererbsen',
    category: 'Hauptgerichte',
    description: 'Cremiges Curry mit Brokkoli und Kichererbsen.',
    tags: ['vegan'],
    servings: 3,
    ingredients: [['Kichererbsen', 250], ['Brokkoli', 200], ['Möhren', 150], ['Tomatensoße', 200], ['Reis', 180]],
  },
  {
    id: 'seed-haehnchen-reis',
    name: 'Hähnchen mit Reis & Brokkoli',
    category: 'Hauptgerichte',
    description: 'Klassiker für den Muskelaufbau – mager und sättigend.',
    tags: ['high-protein'],
    servings: 2,
    ingredients: [['Hähnchenbrust', 300], ['Reis', 200], ['Brokkoli', 200], ['Olivenöl', 15]],
  },
  {
    id: 'seed-italienische-pasta',
    name: 'Italienische Tomaten-Pasta',
    category: 'Hauptgerichte',
    description: 'Einfache Pasta mit Tomatensoße und Käse.',
    tags: ['vegetarisch'],
    servings: 2,
    ingredients: [['Nudeln', 250], ['Tomatensoße', 250], ['Käse', 50], ['Olivenöl', 10]],
  },
  {
    id: 'seed-joghurt-bowl',
    name: 'Joghurt-Bowl mit Mandeln',
    category: 'Frühstück',
    description: 'Joghurt mit Banane, Beeren und knackigen Mandeln.',
    tags: ['vegetarisch'],
    servings: 1,
    ingredients: [['Naturjoghurt', 200], ['Banane', 100], ['Beeren', 80], ['Mandeln', 20]],
  },
  {
    id: 'seed-kartoffel-spinat',
    name: 'Kartoffel-Spinat-Pfanne',
    category: 'Hauptgerichte',
    description: 'Herzhafte Pfanne mit Kartoffeln, Spinat und Ei.',
    tags: ['vegetarisch'],
    servings: 2,
    ingredients: [['Kartoffeln', 400], ['Spinat', 200], ['Ei', 100], ['Olivenöl', 15]],
  },
  {
    id: 'seed-lachs-quinoa',
    name: 'Lachs mit Quinoa',
    category: 'Hauptgerichte',
    description: 'Omega-3-reicher Lachs auf lockerem Quinoa.',
    tags: ['high-protein'],
    servings: 2,
    ingredients: [['Lachs', 250], ['Quinoa', 180], ['Brokkoli', 200], ['Olivenöl', 15]],
  },
  {
    id: 'seed-mediterrane-bowl',
    name: 'Mediterrane Bowl',
    category: 'Bowls',
    description: 'Bunte Bowl mit Couscous, Kichererbsen und Gemüse.',
    tags: ['vegan'],
    servings: 2,
    ingredients: [['Couscous', 180], ['Kichererbsen', 150], ['Paprika', 120], ['Tomaten', 100], ['Olivenöl', 15]],
  },
  {
    id: 'seed-nudelsalat',
    name: 'Nudelsalat mit Gemüse',
    category: 'Salate',
    description: 'Sommerlicher Nudelsalat mit Paprika und Mais.',
    tags: ['vegetarisch'],
    servings: 3,
    ingredients: [['Nudeln', 250], ['Paprika', 120], ['Mais', 100], ['Tomaten', 120], ['Olivenöl', 20]],
  },
  {
    id: 'seed-omelett-schinken',
    name: 'Omelett mit Schinken & Käse',
    category: 'Frühstück',
    description: 'Sättigendes Omelett mit Schinken und Käse.',
    tags: ['low-carb', 'high-protein'],
    servings: 1,
    ingredients: [['Ei', 150], ['Schinken', 50], ['Käse', 40], ['Olivenöl', 10]],
  },
  {
    id: 'seed-pfannkuchen',
    name: 'Protein-Pfannkuchen',
    category: 'Frühstück',
    description: 'Pfannkuchen aus Haferflocken, Ei und Banane.',
    tags: ['vegetarisch', 'high-protein'],
    servings: 1,
    ingredients: [['Haferflocken', 60], ['Ei', 100], ['Banane', 100], ['Milch', 50]],
  },
  {
    id: 'seed-quinoa-salat',
    name: 'Quinoa-Salat mit Avocado',
    category: 'Salate',
    description: 'Proteinreicher Quinoa-Salat mit cremiger Avocado.',
    tags: ['vegan', 'high-protein'],
    servings: 2,
    ingredients: [['Quinoa', 180], ['Avocado', 120], ['Tomaten', 120], ['Mais', 80], ['Olivenöl', 15]],
  },
  {
    id: 'seed-rind-bohnen-chili',
    name: 'Rind-Bohnen-Chili',
    category: 'Eintöpfe',
    description: 'Würziges Chili con Carne mit Kidneybohnen.',
    tags: ['high-protein'],
    servings: 4,
    ingredients: [['Hackfleisch', 400], ['Kidneybohnen', 250], ['Mais', 150], ['Tomatensoße', 300], ['Zwiebel', 100]],
  },
  {
    id: 'seed-spaghetti-bolognese',
    name: 'Spaghetti Bolognese',
    category: 'Hauptgerichte',
    description: 'Klassische Bolognese mit Hackfleisch.',
    tags: ['high-protein'],
    servings: 3,
    ingredients: [['Nudeln', 300], ['Hackfleisch', 300], ['Tomatensoße', 300], ['Zwiebel', 100], ['Olivenöl', 15]],
  },
  {
    id: 'seed-thunfisch-salat',
    name: 'Thunfisch-Salat',
    category: 'Salate',
    description: 'Leichter Salat mit Thunfisch, Mais und Bohnen.',
    tags: ['high-protein', 'low-carb'],
    servings: 2,
    ingredients: [['Thunfisch', 150], ['Salat', 100], ['Mais', 100], ['Kidneybohnen', 100], ['Olivenöl', 15]],
  },
  {
    id: 'seed-ueberbackene-kartoffeln',
    name: 'Überbackene Kartoffeln',
    category: 'Hauptgerichte',
    description: 'Kartoffeln mit Käse überbacken.',
    tags: ['vegetarisch'],
    servings: 2,
    ingredients: [['Kartoffeln', 500], ['Käse', 100], ['Naturjoghurt', 100]],
  },
  {
    id: 'seed-vollkornbrot-avocado',
    name: 'Vollkornbrot mit Avocado & Ei',
    category: 'Frühstück',
    description: 'Avocadobrot mit pochiertem Ei.',
    tags: ['vegetarisch'],
    servings: 1,
    ingredients: [['Vollkornbrot', 80], ['Avocado', 80], ['Ei', 100]],
  },
  {
    id: 'seed-wok-gemuese',
    name: 'Wok-Gemüse mit Hähnchen',
    category: 'Hauptgerichte',
    description: 'Schnelles Wok-Gericht mit viel Gemüse.',
    tags: ['high-protein', 'low-carb'],
    servings: 2,
    ingredients: [['Hähnchenbrust', 250], ['Paprika', 150], ['Brokkoli', 150], ['Möhren', 100], ['Olivenöl', 15]],
  },
  {
    id: 'seed-xxl-fitness-bowl',
    name: 'XXL-Fitness-Bowl',
    category: 'Bowls',
    description: 'Sättigende Bowl mit Hähnchen, Reis und Avocado.',
    tags: ['high-protein'],
    servings: 1,
    ingredients: [['Hähnchenbrust', 200], ['Reis', 150], ['Avocado', 80], ['Mais', 60], ['Tomaten', 80]],
  },
  {
    id: 'seed-yufka-haehnchen',
    name: 'Yufka-Wrap mit Hähnchen',
    category: 'Hauptgerichte',
    description: 'Gefüllter Wrap mit Hähnchen, Salat und Joghurt.',
    tags: ['high-protein'],
    servings: 1,
    ingredients: [['Vollkornbrot', 100], ['Hähnchenbrust', 150], ['Salat', 50], ['Naturjoghurt', 50], ['Tomaten', 60]],
  },
  {
    id: 'seed-zucchini-pasta',
    name: 'Zucchini-Käse-Pasta',
    category: 'Hauptgerichte',
    description: 'Cremige Pasta mit Champignons und Käse.',
    tags: ['vegetarisch'],
    servings: 2,
    ingredients: [['Nudeln', 250], ['Champignons', 150], ['Käse', 60], ['Milch', 100], ['Olivenöl', 10]],
  },
];

// Passende Symbole je Gericht (Bild-Platzhalter, offline & schnell)
const EMOJI_BY_ID: Record<string, string> = {
  'seed-apfel-haferbrei': '🥣',
  'seed-beeren-quark': '🫐',
  'seed-couscous-salat': '🥗',
  'seed-dal-linsen': '🍲',
  'seed-eieromelett': '🍳',
  'seed-feta-salat': '🥗',
  'seed-gemuese-curry': '🍛',
  'seed-haehnchen-reis': '🍗',
  'seed-italienische-pasta': '🍝',
  'seed-joghurt-bowl': '🥣',
  'seed-kartoffel-spinat': '🥔',
  'seed-lachs-quinoa': '🐟',
  'seed-mediterrane-bowl': '🥙',
  'seed-nudelsalat': '🥗',
  'seed-omelett-schinken': '🍳',
  'seed-pfannkuchen': '🥞',
  'seed-quinoa-salat': '🥑',
  'seed-rind-bohnen-chili': '🌶️',
  'seed-spaghetti-bolognese': '🍝',
  'seed-thunfisch-salat': '🥗',
  'seed-ueberbackene-kartoffeln': '🧀',
  'seed-vollkornbrot-avocado': '🥑',
  'seed-wok-gemuese': '🥘',
  'seed-xxl-fitness-bowl': '💪',
  'seed-yufka-haehnchen': '🌯',
  'seed-zucchini-pasta': '🍝',
};

const CATEGORY_EMOJI: Record<string, string> = {
  Frühstück: '🥣',
  Salate: '🥗',
  Bowls: '🥙',
  Hauptgerichte: '🍽️',
  Eintöpfe: '🍲',
};

/** Link zu Koch-Videos: YouTube-Suche zum Gericht (immer aktuell verfügbar). */
function cookingVideoUrl(name: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    name + ' Rezept',
  )}`;
}

export const COOKBOOK: Recipe[] = SEED_DEFS.map((def) => ({
  id: def.id,
  name: def.name,
  category: def.category,
  description: def.description,
  tags: def.tags,
  emoji: EMOJI_BY_ID[def.id] ?? CATEGORY_EMOJI[def.category] ?? '🍽️',
  videoUrl: cookingVideoUrl(def.name),
  servings: def.servings,
  isSeed: true,
  createdAt: 0,
  ingredients: def.ingredients.map(([name, amount]) => ing(name, amount)),
}));

/** Alle Rezept-Kategorien (für Filter-Chips). */
export const RECIPE_CATEGORIES = [
  ...new Set(SEED_DEFS.map((d) => d.category)),
];

/** Häufige Einzel-Lebensmittel für die manuelle Schnell-Erfassung & Zutatensuche. */
export const COMMON_FOODS = Object.entries(FOODS).map(([name, per100g]) => ({
  name,
  per100g,
}));
