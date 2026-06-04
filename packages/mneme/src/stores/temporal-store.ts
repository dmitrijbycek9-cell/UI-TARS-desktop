import { DatabaseSync } from 'node:sqlite';
import { BaseStore } from './base-store.js';
import { MemoryKind, MemoryUnit, StoreSearchResult } from '../types.js';

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
  kind: string;
}

const COLUMNS =
  'id, content, agent_id, session_id, created_at, last_accessed_at, energy_score, confidence_json, provenance_json, kind';

export class TemporalStore extends BaseStore {
  constructor(db: DatabaseSync) {
    super(db);
  }

  initialize(): void {
    if (this.initialized) return;
    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec('PRAGMA foreign_keys = ON');
    // Active memories.
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
        provenance_json TEXT NOT NULL DEFAULT '[]',
        kind TEXT NOT NULL DEFAULT 'episodic'
      )
    `);
    // Cold storage: archived low-energy memories, kept fully (reversible).
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS mneme_cold_storage (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_accessed_at INTEGER NOT NULL,
        energy_score REAL NOT NULL DEFAULT 0.0,
        confidence_json TEXT NOT NULL,
        provenance_json TEXT NOT NULL DEFAULT '[]',
        kind TEXT NOT NULL DEFAULT 'episodic',
        archived_at INTEGER NOT NULL
      )
    `);
    this.db.exec(
      `CREATE INDEX IF NOT EXISTS idx_memories_agent ON mneme_memories (agent_id)`,
    );
    this.db.exec(
      `CREATE INDEX IF NOT EXISTS idx_memories_session ON mneme_memories (session_id)`,
    );
    this.db.exec(
      `CREATE INDEX IF NOT EXISTS idx_memories_created ON mneme_memories (created_at DESC)`,
    );
    this.db.exec(
      `CREATE INDEX IF NOT EXISTS idx_memories_energy ON mneme_memories (energy_score)`,
    );
    this.initialized = true;
  }

  insert(memory: MemoryUnit): void {
    const stmt = this.db.prepare(`
      INSERT INTO mneme_memories
        (id, content, agent_id, session_id, created_at, last_accessed_at,
         energy_score, confidence_json, provenance_json, kind)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        content = excluded.content,
        last_accessed_at = excluded.last_accessed_at,
        energy_score = excluded.energy_score,
        confidence_json = excluded.confidence_json,
        provenance_json = excluded.provenance_json,
        kind = excluded.kind
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
      memory.kind ?? 'episodic',
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

  updateEnergy(id: string, energy: number): void {
    this.db
      .prepare('UPDATE mneme_memories SET energy_score = ? WHERE id = ?')
      .run(energy, id);
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM mneme_memories WHERE id = ?').run(id);
  }

  /**
   * Move an active memory into cold storage (reversible). Removes it from the
   * active table so hybrid search stays fast; the full row is preserved.
   */
  moveToCold(id: string): void {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db
        .prepare(
          `INSERT OR REPLACE INTO mneme_cold_storage
             (${COLUMNS}, archived_at)
           SELECT ${COLUMNS}, ? FROM mneme_memories WHERE id = ?`,
        )
        .run(Date.now(), id);
      this.db.prepare('DELETE FROM mneme_memories WHERE id = ?').run(id);
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * Restore a memory from cold storage back into the active table.
   * Returns the restored memory, or null if it was not in cold storage.
   */
  restore(id: string): MemoryUnit | null {
    const row = this.db
      .prepare('SELECT * FROM mneme_cold_storage WHERE id = ?')
      .get(id) as (MemoryRow & { archived_at: number }) | undefined;
    if (!row) return null;

    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db
        .prepare(
          `INSERT OR REPLACE INTO mneme_memories (${COLUMNS})
           SELECT ${COLUMNS} FROM mneme_cold_storage WHERE id = ?`,
        )
        .run(id);
      this.db.prepare('DELETE FROM mneme_cold_storage WHERE id = ?').run(id);
      this.db.exec('COMMIT');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
    return this.rowToMemory(row);
  }

  /** Cold-storage memories whose energy fell below the delete threshold. */
  getColdBelowEnergy(threshold: number): MemoryUnit[] {
    const rows = this.db
      .prepare('SELECT * FROM mneme_cold_storage WHERE energy_score < ?')
      .all(threshold) as MemoryRow[];
    return rows.map((r) => this.rowToMemory(r));
  }

  deleteCold(id: string): void {
    this.db.prepare('DELETE FROM mneme_cold_storage WHERE id = ?').run(id);
  }

  getColdStats(): { count: number } {
    const row = this.db
      .prepare('SELECT COUNT(*) as count FROM mneme_cold_storage')
      .get() as { count: number };
    return { count: row.count };
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
      kind: (row.kind as MemoryKind) ?? 'episodic',
    };
  }
}
