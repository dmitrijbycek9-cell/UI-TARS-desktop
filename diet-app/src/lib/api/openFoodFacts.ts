import { db } from '@/db/db';
import type { Nutrients, Product } from '@/types';
import { roundTo } from '@/lib/nutrition';

const API_BASE = 'https://world.openfoodfacts.org/api/v2/product';
const FIELDS = [
  'product_name',
  'product_name_de',
  'brands',
  'image_front_small_url',
  'nutriments',
  'nutrition_data_per',
  'serving_quantity',
].join(',');

const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 Tage

// OFF liefert je Nährwert mehrere Schlüssel (_100g, _serving, _value ...).
type OffNutriments = Record<string, number | string | undefined>;

interface OffResponse {
  status: number;
  product?: {
    product_name?: string;
    product_name_de?: string;
    brands?: string;
    image_front_small_url?: string;
    serving_quantity?: number | string;
    nutrition_data_per?: string;
    nutriments?: OffNutriments;
  };
}

function num(value: number | string | undefined): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

/**
 * Liest einen Nährwert als „pro 100 g/ml". Reihenfolge:
 * 1. direkter _100g-Wert
 * 2. aus dem _serving-Wert über die Portionsgröße hochgerechnet
 * Gibt undefined zurück, wenn OFF dazu nichts hinterlegt hat.
 */
function per100(
  n: OffNutriments,
  base: string,
  servingG?: number,
): number | undefined {
  const direct = num(n[`${base}_100g`]);
  if (direct !== undefined) return direct;
  const serving = num(n[`${base}_serving`]);
  if (serving !== undefined && servingG && servingG > 0) {
    return (serving / servingG) * 100;
  }
  return undefined;
}

/** Energie in kcal pro 100 g/ml – berücksichtigt kcal, kJ und generisches energy (kJ). */
function energyPer100(
  n: OffNutriments,
  servingG?: number,
): number | undefined {
  const kcal = per100(n, 'energy-kcal', servingG);
  if (kcal !== undefined) return kcal;
  const kj =
    per100(n, 'energy-kj', servingG) ?? per100(n, 'energy', servingG);
  if (kj !== undefined) return kj / 4.184;
  return undefined;
}

/** Wandelt OFF-Nährwerte um und meldet, ob überhaupt Angaben vorhanden sind. */
export function mapNutriments(
  n: OffNutriments,
  servingG?: number,
): { nutrients: Nutrients; hasData: boolean } {
  const kcal = energyPer100(n, servingG);
  const carbs = per100(n, 'carbohydrates', servingG);
  const sugars = per100(n, 'sugars', servingG);
  const protein = per100(n, 'proteins', servingG);
  const fat = per100(n, 'fat', servingG);
  const saturatedFat = per100(n, 'saturated-fat', servingG);
  const fiber = per100(n, 'fiber', servingG);
  const salt = per100(n, 'salt', servingG);

  // „Daten vorhanden", wenn mindestens Energie oder ein Makro hinterlegt ist
  const hasData =
    kcal !== undefined ||
    carbs !== undefined ||
    protein !== undefined ||
    fat !== undefined ||
    sugars !== undefined;

  return {
    nutrients: {
      kcal: roundTo(kcal ?? 0, 0),
      carbs: roundTo(carbs ?? 0, 1),
      sugars: roundTo(sugars ?? 0, 1),
      protein: roundTo(protein ?? 0, 1),
      fat: roundTo(fat ?? 0, 1),
      saturatedFat: roundTo(saturatedFat ?? 0, 1),
      fiber: roundTo(fiber ?? 0, 1),
      salt: roundTo(salt ?? 0, 2),
    },
    hasData,
  };
}

export class ProductNotFoundError extends Error {
  constructor(public barcode: string) {
    super(`Produkt ${barcode} nicht gefunden`);
    this.name = 'ProductNotFoundError';
  }
}

/**
 * Liefert ein Produkt: erst aus dem lokalen Cache, sonst von Open Food Facts.
 * Erfolgreiche Treffer werden in IndexedDB gecacht (offline wiederverwendbar).
 * Wirft ProductNotFoundError, wenn das Produkt nicht existiert.
 */
export async function getProduct(barcode: string): Promise<Product> {
  const cached = await db.products.get(barcode);
  const fresh =
    cached && Date.now() - cached.fetchedAt < CACHE_MAX_AGE_MS;
  if (fresh) return cached;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/${encodeURIComponent(barcode)}.json?fields=${FIELDS}`);
  } catch (err) {
    // Offline o. Ä.: falls vorhanden, gib (auch veralteten) Cache-Eintrag zurück
    if (cached) return cached;
    throw err;
  }

  if (!res.ok) {
    if (cached) return cached;
    throw new Error(`Open Food Facts antwortete mit ${res.status}`);
  }

  const data = (await res.json()) as OffResponse;
  if (data.status !== 1 || !data.product) {
    if (cached) return cached;
    throw new ProductNotFoundError(barcode);
  }

  const p = data.product;
  const serving = num(p.serving_quantity);
  const servingG = serving && serving > 0 ? serving : undefined;
  const { nutrients, hasData } = mapNutriments(p.nutriments ?? {}, servingG);

  const product: Product = {
    barcode,
    name: p.product_name_de || p.product_name || `Produkt ${barcode}`,
    brand: p.brands?.split(',')[0]?.trim() || undefined,
    imageUrl: p.image_front_small_url || undefined,
    per100g: nutrients,
    defaultPortionG: servingG,
    source: 'off',
    hasNutrition: hasData,
    fetchedAt: Date.now(),
  };

  await db.products.put(product);
  return product;
}

/** Speichert ein manuell erfasstes Produkt im Cache. */
export async function saveManualProduct(
  barcode: string,
  name: string,
  per100g: Nutrients,
  brand?: string,
  defaultPortionG?: number,
): Promise<Product> {
  const product: Product = {
    barcode,
    name,
    brand,
    per100g,
    defaultPortionG,
    source: 'manual',
    hasNutrition: true,
    fetchedAt: Date.now(),
  };
  await db.products.put(product);
  return product;
}
