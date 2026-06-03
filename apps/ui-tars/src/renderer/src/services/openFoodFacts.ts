export interface ProductInfo {
  barcode: string;
  name: string;
  caloriesPer100g: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
}

function parseNutriments(
  nutriments: Record<string, unknown>,
): Omit<ProductInfo, 'barcode' | 'name'> {
  return {
    caloriesPer100g: Number(
      nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0,
    ),
    proteinPer100g:
      nutriments['proteins_100g'] != null
        ? Number(nutriments['proteins_100g'])
        : undefined,
    carbsPer100g:
      nutriments['carbohydrates_100g'] != null
        ? Number(nutriments['carbohydrates_100g'])
        : undefined,
    fatPer100g:
      nutriments['fat_100g'] != null
        ? Number(nutriments['fat_100g'])
        : undefined,
  };
}

export async function fetchProductByBarcode(
  barcode: string,
): Promise<ProductInfo | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  const product = data.product;
  return {
    barcode,
    name: product.product_name || product.generic_name || barcode,
    ...parseNutriments(product.nutriments ?? {}),
  };
}

export async function searchProducts(query: string): Promise<ProductInfo[]> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.products ?? [])
    .filter((p: Record<string, unknown>) => p.product_name && p.nutriments)
    .map((p: Record<string, unknown>) => ({
      barcode: String(p.code ?? ''),
      name: String(p.product_name ?? ''),
      ...parseNutriments((p.nutriments as Record<string, unknown>) ?? {}),
    }));
}
