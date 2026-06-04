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
