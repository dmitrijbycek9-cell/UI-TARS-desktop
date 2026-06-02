import { db } from './db';
import { COOKBOOK } from '@/data/cookbook';

/**
 * Schreibt das eingebaute Kochbuch beim ersten Start in die Datenbank.
 * Idempotent: läuft nur, wenn noch keine Seed-Rezepte existieren.
 */
export async function seedDatabase(): Promise<void> {
  const existingSeeds = await db.recipes
    .filter((r) => r.isSeed === true)
    .count();
  if (existingSeeds > 0) return;

  await db.recipes.bulkPut(COOKBOOK);
}
