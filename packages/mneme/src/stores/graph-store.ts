import { DatabaseSync } from 'node:sqlite';
import { BaseStore } from './base-store.js';
import { MemoryUnit, StoreSearchResult } from '../types.js';

interface EdgeRow {
  from_id: string;
  to_id: string;
  relation: string;
  weight: number;
}

export class GraphStore extends BaseStore {
  constructor(db: DatabaseSync) {
    super(db);
  }

  initialize(): void {
    if (this.initialized) return;
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mneme_graph (
        from_id TEXT NOT NULL,
        to_id TEXT NOT NULL,
        relation TEXT NOT NULL DEFAULT 'related',
        weight REAL NOT NULL DEFAULT 1.0,
        PRIMARY KEY (from_id, to_id, relation)
      )
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_graph_from ON mneme_graph (from_id)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_graph_to ON mneme_graph (to_id)
    `);
    this.initialized = true;
  }

  addEdge(
    fromId: string,
    toId: string,
    relation = 'related',
    weight = 1.0,
  ): void {
    const stmt = this.db.prepare(
      `INSERT INTO mneme_graph (from_id, to_id, relation, weight) VALUES (?, ?, ?, ?)
       ON CONFLICT(from_id, to_id, relation) DO UPDATE SET weight = excluded.weight`,
    );
    stmt.run(fromId, toId, relation, weight);
  }

  removeEdgesForNode(id: string): void {
    this.db
      .prepare('DELETE FROM mneme_graph WHERE from_id = ? OR to_id = ?')
      .run(id, id);
  }

  /**
   * Returns memories that are graph-neighbors of recently accessed memories
   * in the candidate set. Score = sum of incoming edge weights.
   */
  search(
    recentIds: string[],
    candidates: MemoryUnit[],
    k: number,
  ): StoreSearchResult[] {
    if (recentIds.length === 0 || candidates.length === 0) return [];

    const placeholders = recentIds.map(() => '?').join(',');
    const rows = this.db
      .prepare(
        `SELECT from_id, to_id, relation, weight FROM mneme_graph
         WHERE from_id IN (${placeholders}) OR to_id IN (${placeholders})`,
      )
      .all(...recentIds, ...recentIds) as EdgeRow[];

    const scoreMap = new Map<string, number>();
    for (const edge of rows) {
      const neighborId = recentIds.includes(edge.from_id)
        ? edge.to_id
        : edge.from_id;
      scoreMap.set(neighborId, (scoreMap.get(neighborId) ?? 0) + edge.weight);
    }

    const idSet = new Set(candidates.map((m) => m.id));
    const scored: StoreSearchResult[] = [];
    for (const [id, score] of scoreMap) {
      const memory = candidates.find((m) => m.id === id);
      if (memory && idSet.has(id)) {
        scored.push({ memory, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }
}
