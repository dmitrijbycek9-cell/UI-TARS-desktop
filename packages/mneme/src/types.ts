export type ProvenanceType =
  | 'user_statement'
  | 'agent_inference'
  | 'consolidation';

export interface Provenance {
  type: ProvenanceType;
  source: string;
  weight: number;
  timestamp: Date;
}

export interface ConfidenceScore {
  value: number;
  decayRate: number;
  lastVerified: Date;
}

/**
 * Discriminates the role of a memory. `episodic` is a normal interaction
 * memory; `config` is reserved for future self-improvement (worker prompts /
 * coordination rules stored as memories); `meta` is a consolidated insight.
 */
export type MemoryKind = 'episodic' | 'config' | 'meta';

export interface MemoryUnit {
  id: string;
  content: string;
  embedding: number[];
  agentId: string;
  sessionId: string;
  confidence: ConfidenceScore;
  provenance: Provenance[];
  createdAt: Date;
  lastAccessedAt: Date;
  energyScore: number;
  kind?: MemoryKind;
}

export interface TriStoreSearchResult {
  memory: MemoryUnit;
  vectorScore: number;
  graphScore: number;
  temporalScore: number;
  fusedScore: number;
}

export interface StoreSearchResult {
  memory: MemoryUnit;
  score: number;
}

export type EmbeddingFn = (text: string) => Promise<number[]>;

export interface MnemeConfig {
  dbPath: string;
  embeddingFn?: EmbeddingFn;
  embeddingDim?: number;
}
