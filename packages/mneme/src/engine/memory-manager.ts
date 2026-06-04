import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { VectorStore } from '../stores/vector-store.js';
import { GraphStore } from '../stores/graph-store.js';
import { TemporalStore } from '../stores/temporal-store.js';
import { HybridSearch } from '../retrieval/hybrid-search.js';
import { createProvenance } from './provenance.js';
import { applyReinforcement, EnergyEvent } from './energy.js';
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

  /**
   * Apply a reinforcement event to a memory's energy (Whitepaper §4.2).
   * `retrieved`/`cited` also bump the access timestamp.
   */
  reinforce(id: string, event: EnergyEvent): void {
    const memory = this.temporalStore.getById(id);
    if (!memory) return;
    this.temporalStore.updateEnergy(
      id,
      applyReinforcement(memory.energyScore, event),
    );
    if (event === 'retrieved' || event === 'cited') {
      this.temporalStore.updateAccessed(id);
    }
  }

  // --- Forgetting primitives (used by the ForgettingWorker) ---

  /** All active (non-archived) memories, optionally scoped to an agent. */
  listActive(agentId?: string): MemoryUnit[] {
    return this.temporalStore.getAll(agentId);
  }

  /** Overwrite the energy score of an active memory. */
  setEnergy(id: string, energy: number): void {
    this.temporalStore.updateEnergy(id, energy);
  }

  /** Archive a memory into cold storage and drop it from active indexes. */
  archive(id: string): void {
    this.temporalStore.moveToCold(id);
    this.vectorStore.delete(id);
    this.graphStore.removeEdgesForNode(id);
  }

  /** Permanently delete cold-storage memories below an energy threshold. */
  purgeCold(threshold: number): number {
    const candidates = this.temporalStore.getColdBelowEnergy(threshold);
    for (const memory of candidates) {
      this.temporalStore.deleteCold(memory.id);
    }
    return candidates.length;
  }

  /** Restore an archived memory back into the active store (re-embeds it). */
  async restore(id: string): Promise<MemoryUnit | null> {
    const memory = this.temporalStore.restore(id);
    if (!memory) return null;
    const embedding = await this.embedFn(memory.content);
    this.vectorStore.upsert(id, embedding);
    return memory;
  }

  getColdStats(): { count: number } {
    return this.temporalStore.getColdStats();
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
