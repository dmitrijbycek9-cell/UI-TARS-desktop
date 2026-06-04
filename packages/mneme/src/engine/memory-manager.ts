import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { VectorStore } from '../stores/vector-store.js';
import { GraphStore } from '../stores/graph-store.js';
import { TemporalStore } from '../stores/temporal-store.js';
import { HybridSearch } from '../retrieval/hybrid-search.js';
import { createProvenance } from './provenance.js';
import {
  ConfidenceScore,
  EmbeddingFn,
  MemoryUnit,
  MnemeConfig,
  TriStoreSearchResult,
} from '../types.js';

export interface StoreInput {
  content: string;
  agentId: string;
  sessionId: string;
  relatedIds?: string[];
  confidence?: Partial<ConfidenceScore>;
}

export interface RetrieveOptions {
  k?: number;
}

export class MemoryManager {
  private readonly db: DatabaseSync;
  private readonly vectorStore: VectorStore;
  private readonly graphStore: GraphStore;
  private readonly temporalStore: TemporalStore;
  private readonly hybridSearch: HybridSearch;
  private readonly embedFn: EmbeddingFn;

  constructor(config: MnemeConfig) {
    this.db = new DatabaseSync(config.dbPath);
    this.embedFn = config.embeddingFn ?? noopEmbedding;

    this.vectorStore = new VectorStore(this.db);
    this.graphStore = new GraphStore(this.db);
    this.temporalStore = new TemporalStore(this.db);
    this.hybridSearch = new HybridSearch(
      this.vectorStore,
      this.graphStore,
      this.temporalStore,
      this.embedFn,
    );

    this.vectorStore.initialize();
    this.graphStore.initialize();
    this.temporalStore.initialize();
  }

  async store(input: StoreInput): Promise<MemoryUnit> {
    const id = randomUUID();
    const now = new Date();
    const embedding = await this.embedFn(input.content);

    const memory: MemoryUnit = {
      id,
      content: input.content,
      embedding,
      agentId: input.agentId,
      sessionId: input.sessionId,
      createdAt: now,
      lastAccessedAt: now,
      energyScore: 100,
      confidence: {
        value: input.confidence?.value ?? 0.9,
        decayRate: input.confidence?.decayRate ?? 0.01,
        lastVerified: input.confidence?.lastVerified ?? now,
      },
      provenance: [createProvenance('user_statement', input.sessionId, 1.0)],
    };

    this.temporalStore.insert(memory);
    this.vectorStore.upsert(id, embedding);

    if (input.relatedIds) {
      for (const relId of input.relatedIds) {
        this.graphStore.addEdge(id, relId, 'related', 1.0);
      }
    }

    return memory;
  }

  async retrieve(
    query: string,
    options: RetrieveOptions = {},
  ): Promise<TriStoreSearchResult[]> {
    const allMemories = this.temporalStore.getAll();
    return this.hybridSearch.search(query, allMemories, options);
  }

  async retrieveForAgent(
    query: string,
    agentId: string,
    options: RetrieveOptions = {},
  ): Promise<TriStoreSearchResult[]> {
    const memories = this.temporalStore.getAll(agentId);
    return this.hybridSearch.search(query, memories, { ...options, agentId });
  }

  getById(id: string): MemoryUnit | null {
    const memory = this.temporalStore.getById(id);
    if (memory) {
      this.temporalStore.updateAccessed(id);
    }
    return memory;
  }

  delete(id: string): void {
    this.temporalStore.delete(id);
    this.vectorStore.delete(id);
    this.graphStore.removeEdgesForNode(id);
  }

  close(): void {
    try {
      this.db.close();
    } catch {
      // already closed
    }
  }
}

async function noopEmbedding(text: string): Promise<number[]> {
  const hash = Buffer.from(text).reduce((acc, byte) => acc + byte, 0);
  return Array.from({ length: 8 }, (_, i) => Math.sin(hash + i));
}
