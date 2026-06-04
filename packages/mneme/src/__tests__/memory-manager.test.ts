import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryManager } from '../engine/memory-manager.js';
import { EmbeddingFn } from '../types.js';

const deterministicEmbed: EmbeddingFn = async (text) => {
  const seed = text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return Array.from({ length: 8 }, (_, i) => Math.sin(seed + i));
};

describe('MemoryManager', () => {
  let manager: MemoryManager;

  beforeEach(() => {
    manager = new MemoryManager({
      dbPath: ':memory:',
      embeddingFn: deterministicEmbed,
    });
  });

  afterEach(() => {
    manager.close();
  });

  it('stores a memory and retrieves it by id', async () => {
    const memory = await manager.store({
      content: 'Der Nutzer arbeitet an Projekt Conductor',
      agentId: 'agent-1',
      sessionId: 'session-1',
    });

    expect(memory.id).toBeTruthy();
    expect(memory.content).toBe('Der Nutzer arbeitet an Projekt Conductor');
    expect(memory.energyScore).toBe(100);

    const retrieved = manager.getById(memory.id);
    expect(retrieved?.content).toBe(memory.content);
  });

  it('returns top-k results from hybrid search', async () => {
    await manager.store({
      content: 'Projekt Conductor kombiniert Grok mit MNEME',
      agentId: 'agent-1',
      sessionId: 's1',
    });
    await manager.store({
      content: 'Das Wetter ist heute schön',
      agentId: 'agent-1',
      sessionId: 's1',
    });
    await manager.store({
      content: 'MNEME speichert Erinnerungen in drei Datenbanken',
      agentId: 'agent-1',
      sessionId: 's1',
    });

    const results = await manager.retrieve('MNEME Projekt', { k: 2 });

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(2);
    results.forEach((r) => {
      expect(r.fusedScore).toBeGreaterThan(0);
    });
  });

  it('deletes a memory from all stores', async () => {
    const memory = await manager.store({
      content: 'Temporäre Notiz',
      agentId: 'agent-2',
      sessionId: 's2',
    });

    manager.delete(memory.id);

    const retrieved = manager.getById(memory.id);
    expect(retrieved).toBeNull();
  });

  it('stores provenance with user_statement type', async () => {
    const memory = await manager.store({
      content: 'Nutzeraussage',
      agentId: 'agent-3',
      sessionId: 'sess-3',
    });

    expect(memory.provenance).toHaveLength(1);
    expect(memory.provenance[0]?.type).toBe('user_statement');
    expect(memory.provenance[0]?.weight).toBe(1.0);
  });

  it('links related memories in the graph store', async () => {
    const m1 = await manager.store({
      content: 'Erstes Dokument',
      agentId: 'agent-1',
      sessionId: 's1',
    });
    const m2 = await manager.store({
      content: 'Zweites Dokument, verknüpft mit dem ersten',
      agentId: 'agent-1',
      sessionId: 's1',
      relatedIds: [m1.id],
    });

    expect(m2.id).not.toBe(m1.id);

    const results = await manager.retrieve('Dokument', { k: 5 });
    const ids = results.map((r) => r.memory.id);
    expect(ids).toContain(m1.id);
    expect(ids).toContain(m2.id);
  });
});
