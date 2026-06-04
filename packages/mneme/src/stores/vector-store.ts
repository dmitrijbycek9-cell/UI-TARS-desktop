import { DatabaseSync } from 'node:sqlite';
import { BaseStore } from './base-store.js';
import { MemoryUnit, StoreSearchResult } from '../types.js';

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
    normA += (a[i] ?? 0) ** 2;
    normB += (b[i] ?? 0) ** 2;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

interface VectorRow {
  id: string;
  embedding_json: string;
}

export class VectorStore extends BaseStore {
  constructor(db: DatabaseSync) {
    super(db);
  }

  initialize(): void {
    if (this.initialized) return;
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mneme_vectors (
        id TEXT PRIMARY KEY,
        embedding_json TEXT NOT NULL
      )
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_mneme_vectors_id ON mneme_vectors (id)
    `);
    this.initialized = true;
  }

  upsert(id: string, embedding: number[]): void {
    const stmt = this.db.prepare(
      `INSERT INTO mneme_vectors (id, embedding_json) VALUES (?, ?)
       ON CONFLICT(id) DO UPDATE SET embedding_json = excluded.embedding_json`,
    );
    stmt.run(id, JSON.stringify(embedding));
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM mneme_vectors WHERE id = ?').run(id);
  }

  search(
    queryEmbedding: number[],
    memories: MemoryUnit[],
    k: number,
  ): StoreSearchResult[] {
    if (memories.length === 0) return [];

    const embeddingMap = new Map<string, number[]>();
    const rows = this.db
      .prepare('SELECT id, embedding_json FROM mneme_vectors')
      .all() as VectorRow[];
    for (const row of rows) {
      embeddingMap.set(row.id, JSON.parse(row.embedding_json) as number[]);
    }

    const scored: StoreSearchResult[] = [];
    for (const memory of memories) {
      const embedding = embeddingMap.get(memory.id);
      if (!embedding) continue;
      const score = cosineSimilarity(queryEmbedding, embedding);
      scored.push({ memory, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }
}
