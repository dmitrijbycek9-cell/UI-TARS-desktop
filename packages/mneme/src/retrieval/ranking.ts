import {
  MemoryUnit,
  StoreSearchResult,
  TriStoreSearchResult,
} from '../types.js';

/**
 * Reciprocal Rank Fusion: score = Σ 1/(k + rank_i) across all stores.
 * k=60 is the standard constant from the original RRF paper.
 */
export function reciprocalRankFusion(
  vectorResults: StoreSearchResult[],
  graphResults: StoreSearchResult[],
  temporalResults: StoreSearchResult[],
  k = 60,
): TriStoreSearchResult[] {
  const fusedMap = new Map<
    string,
    {
      memory: MemoryUnit;
      vectorScore: number;
      graphScore: number;
      temporalScore: number;
      fusedScore: number;
    }
  >();

  function applyStore(
    results: StoreSearchResult[],
    field: 'vectorScore' | 'graphScore' | 'temporalScore',
  ) {
    results.forEach((r, rank) => {
      const existing = fusedMap.get(r.memory.id) ?? {
        memory: r.memory,
        vectorScore: 0,
        graphScore: 0,
        temporalScore: 0,
        fusedScore: 0,
      };
      existing[field] = r.score;
      existing.fusedScore += 1 / (k + rank + 1);
      fusedMap.set(r.memory.id, existing);
    });
  }

  applyStore(vectorResults, 'vectorScore');
  applyStore(graphResults, 'graphScore');
  applyStore(temporalResults, 'temporalScore');

  const results = Array.from(fusedMap.values()) as TriStoreSearchResult[];
  results.sort((a, b) => b.fusedScore - a.fusedScore);
  return results;
}
