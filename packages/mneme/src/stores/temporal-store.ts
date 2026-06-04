import { DatabaseSync } from 'node:sqlite';
import { BaseStore } from './base-store.js';
import { MemoryUnit, StoreSearchResult } from '../types.js';

interface MemoryRow {
  id: string;
  content: string;
  agent_id: string;
  session_id: string;
  created_at: number;
  last_accessed_at: number;
  energy_score: number;
  confidence_json: string;
  provenance_json: string;
}

export class TemporalStore extends BaseStore {
  constructor(db: DatabaseSync) {
    super(db);
  }

  initialize(): void {
    if (this.initialized) return;
    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec('PRAGMA foreign_keys = ON');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mneme_memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_accessed_at INTEGER NOT NULL,
        energy_score REAL NOT NULL DEFAULT 100.0,
        confidence_json TEXT NOT NULL,
        provenance_json TEXT NOT NULL DEFAULT '[]'
      )
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_memories_agent ON mneme_memories (agent_id)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_memories_session ON mneme_memories (session_id)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_memories_created ON mneme_memories (created_at DESC)
    `);
    this.initialized = true;
  }

  insert(memory: MemoryUnit): void {
    const stmt = this.db.prepare(`
      INSERT INTO mneme_memories
        (id, content, agent_id, session_id, created_at, last_accessed_at,
         energy_score, confidence_json, provenance_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content = excluded.content,
        last_accessed_at = excluded.last_accessed_at,
        energy_score = excluded.energy_score,
        confidence_json = excluded.confidence_json,
        provenance_json = excluded.provenance_json
    `);
    stmt.run(
      memory.id,
      memory.content,
      memory.agentId,
      memory.sessionId,
      memory.createdAt.getTime(),
      memory.lastAccessedAt.getTime(),
      memory.energyScore,
      JSON.stringify(memory.confidence),
      JSON.stringify(memory.provenance),
    );
  }

  getById(id: string): MemoryUnit | null {
    const row = this.db
      .prepare('SELECT * FROM mneme_memories WHERE id = ?')
      .get(id) as MemoryRow | undefined;
    return row ? this.rowToMemory(row) : null;
  }

  getAll(agentId?: string): MemoryUnit[] {
    const rows = agentId
      ? (this.db
          .prepare(
            'SELECT * FROM mneme_memories WHERE agent_id = ? ORDER BY created_at DESC',
          )
          .all(agentId) as MemoryRow[])
      : (this.db
          .prepare('SELECT * FROM mneme_memories ORDER BY created_at DESC')
          .all() as MemoryRow[]);
    return rows.map((r) => this.rowToMemory(r));
  }

  updateAccessed(id: string): void {
    this.db
      .prepare('UPDATE mneme_memories SET last_accessed_at = ? WHERE id = ?')
      .run(Date.now(), id);
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM mneme_memories WHERE id = ?').run(id);
  }

  /**
   * Returns memories ordered by recency (most recent = highest score).
   * Score decays exponentially: score = 1 / (1 + age_in_hours)
   */
  search(agentId: string, k: number): StoreSearchResult[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM mneme_memories
         WHERE agent_id = ?
         ORDER BY last_accessed_at DESC
         LIMIT ?`,
      )
      .all(agentId, k * 3) as MemoryRow[];

    const now = Date.now();
    const scored: StoreSearchResult[] = rows.map((row) => {
      const ageHours = (now - row.last_accessed_at) / 3_600_000;
      const score = 1 / (1 + ageHours);
      return { memory: this.rowToMemory(row), score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }

  private rowToMemory(row: MemoryRow): MemoryUnit {
    return {
      id: row.id,
      content: row.content,
      embedding: [],
      agentId: row.agent_id,
      sessionId: row.session_id,
      createdAt: new Date(row.created_at),
      lastAccessedAt: new Date(row.last_accessed_at),
      energyScore: row.energy_score,
      confidence: JSON.parse(row.confidence_json),
      provenance: JSON.parse(row.provenance_json),
    };
  }
}
