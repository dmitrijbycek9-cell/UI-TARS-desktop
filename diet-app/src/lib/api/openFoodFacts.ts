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
  'serving_quantity',
].join(',');

const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 Tage

interface OffNutriments {
  ['energy-kcal_100g']?: number;
  ['energy-kj_100g']?: number;
  ['carbohydrates_100g']?: number;
  ['sugars_100g']?: number;
  ['proteins_100g']?: number;
  ['fat_100g']?: number;
  ['saturated-fat_100g']?: number;
  ['fiber_100g']?: number;
  ['salt_100g']?: number;
}

interface OffResponse {
  status: number;
  product?: {
    product_name?: string;
    product_name_de?: string;
    brands?: string;
    image_front_small_url?: string;
    serving_quantity?: number | string;
    nutriments?: OffNutriments;
  };
}

function mapNutriments(n: OffNutriments): Nutrients {
  let kcal = n['energy-kcal_100g'];
  if (kcal === undefined && n['energy-kj_100g'] !== undefined) {
    kcal = n['energy-kj_100g'] / 4.184;
  }
  return {
    kcal: roundTo(kcal ?? 0, 0),
    carbs: roundTo(n['carbohydrates_100g'] ?? 0, 1),
    sugars: roundTo(n['sugars_100g'] ?? 0, 1),
    protein: roundTo(n['proteins_100g'] ?? 0, 1),
    fat: roundTo(n['fat_100g'] ?? 0, 1),
    saturatedFat: roundTo(n['saturated-fat_100g'] ?? 0, 1),
    fiber: roundTo(n['fiber_100g'] ?? 0, 1),
    salt: roundTo(n['salt_100g'] ?? 0, 2),
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
  const serving =
    typeof p.serving_quantity === 'string'
      ? parseFloat(p.serving_quantity)
      : p.serving_quantity;

  const product: Product = {
    barcode,
    name: p.product_name_de || p.product_name || `Produkt ${barcode}`,
    brand: p.brands?.split(',')[0]?.trim() || undefined,
    imageUrl: p.image_front_small_url || undefined,
    per100g: mapNutriments(p.nutriments ?? {}),
    defaultPortionG:
      serving && !Number.isNaN(serving) && serving > 0 ? serving : undefined,
    source: 'off',
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
    fetchedAt: Date.now(),
  };
  await db.products.put(product);
  return product;
}
