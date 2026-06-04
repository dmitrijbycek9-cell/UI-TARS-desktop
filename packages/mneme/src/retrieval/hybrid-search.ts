import { VectorStore } from '../stores/vector-store.js';
import { GraphStore } from '../stores/graph-store.js';
import { TemporalStore } from '../stores/temporal-store.js';
import { EmbeddingFn, MemoryUnit, TriStoreSearchResult } from '../types.js';
import { reciprocalRankFusion } from './ranking.js';

export interface HybridSearchOptions {
  k?: number;
  agentId?: string;
}

export class HybridSearch {
  constructor(
    private readonly vectorStore: VectorStore,
    private readonly graphStore: GraphStore,
    private readonly temporalStore: TemporalStore,
    private readonly embedFn: EmbeddingFn,
  ) {}

  async search(
    query: string,
    memories: MemoryUnit[],
    options: HybridSearchOptions = {},
  ): Promise<TriStoreSearchResult[]> {
    const k = options.k ?? 5;
    const agentId = options.agentId ?? '';

    if (memories.length === 0) return [];

    const queryEmbedding = await this.embedFn(query);
    const recentIds = memories.slice(0, 10).map((m) => m.id);

    const [vectorResults, graphResults, temporalResults] = await Promise.all([
      Promise.resolve(this.vectorStore.search(queryEmbedding, memories, k * 2)),
      Promise.resolve(this.graphStore.search(recentIds, memories, k * 2)),
      Promise.resolve(this.temporalStore.search(agentId, k * 2)),
    ]);

    return reciprocalRankFusion(
      vectorResults,
      graphResults,
      temporalResults,
      60,
    ).slice(0, k);
  }
}
