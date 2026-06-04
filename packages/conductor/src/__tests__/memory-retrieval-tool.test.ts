import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryManager, EmbeddingFn } from '@mneme/core';
import {
  memoryRetrieve,
  createMemoryRetrievalToolSpec,
} from '../tools/memory-retrieval-tool.js';

const embed: EmbeddingFn = async (text) => {
  const seed = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from({ length: 8 }, (_, i) => Math.sin(seed + i));
};

describe('memoryRetrieve', () => {
  let mm: MemoryManager;

  beforeEach(() => {
    mm = new MemoryManager({ dbPath: ':memory:', embeddingFn: embed });
  });

  afterEach(() => mm.close());

  it('returns relevant memories for the agent', async () => {
    await mm.store({
      content: 'Projekt Conductor verbindet Grok mit MNEME',
      agentId: 'a1',
      sessionId: 's1',
    });
    await mm.store({
      content: 'Das Mittagessen war Pasta',
      agentId: 'a1',
      sessionId: 's1',
    });

    const results = await memoryRetrieve(mm, 'a1', {
      query: 'Conductor',
      k: 2,
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(2);
    expect(results[0]).toHaveProperty('content');
    expect(results[0]).toHaveProperty('confidence');
    expect(results[0]).toHaveProperty('energy');
    expect(results[0]?.scores).toHaveProperty('vector');
  });

  it('reinforces retrieved memories (+energy)', async () => {
    const m = await mm.store({
      content: 'Eine merkenswerte Tatsache',
      agentId: 'a1',
      sessionId: 's1',
    });
    const before = mm.getById(m.id)!.energyScore;

    await memoryRetrieve(mm, 'a1', { query: 'merkenswerte', k: 5 });

    const after = mm.getById(m.id)!.energyScore;
    expect(after).toBeGreaterThan(before); // +10 for 'retrieved'
  });

  it('scopes retrieval to the requested agent', async () => {
    await mm.store({
      content: 'Agent-1 Wissen',
      agentId: 'a1',
      sessionId: 's1',
    });
    await mm.store({
      content: 'Agent-2 Wissen',
      agentId: 'a2',
      sessionId: 's2',
    });

    const results = await memoryRetrieve(mm, 'a2', { query: 'Wissen', k: 5 });
    const contents = results.map((r) => r.content);

    expect(contents).toContain('Agent-2 Wissen');
    expect(contents).not.toContain('Agent-1 Wissen');
  });
});

describe('createMemoryRetrievalToolSpec', () => {
  it('produces a well-formed tool spec usable by any agent framework', () => {
    const mm = new MemoryManager({ dbPath: ':memory:', embeddingFn: embed });
    const spec = createMemoryRetrievalToolSpec(mm, 'a1');

    expect(spec.name).toBe('retrieve_memory');
    expect(spec.description.toLowerCase()).toContain('memory');
    expect(spec.parameters).toMatchObject({ type: 'object' });
    expect(typeof spec.execute).toBe('function');

    mm.close();
  });

  it('execute() runs the retrieval and returns an array', async () => {
    const mm = new MemoryManager({ dbPath: ':memory:', embeddingFn: embed });
    await mm.store({ content: 'Testinhalt', agentId: 'a1', sessionId: 's1' });

    const spec = createMemoryRetrievalToolSpec(mm, 'a1');
    const result = await spec.execute({ query: 'Test' });

    expect(Array.isArray(result)).toBe(true);
    mm.close();
  });
});
