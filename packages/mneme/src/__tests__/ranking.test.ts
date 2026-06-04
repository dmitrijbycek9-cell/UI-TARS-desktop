import { describe, it, expect } from 'vitest';
import { reciprocalRankFusion } from '../retrieval/ranking.js';
import { MemoryUnit, StoreSearchResult } from '../types.js';

function makeMemory(id: string): MemoryUnit {
  const now = new Date();
  return {
    id,
    content: `Memory ${id}`,
    embedding: [],
    agentId: 'agent-1',
    sessionId: 'session-1',
    createdAt: now,
    lastAccessedAt: now,
    energyScore: 100,
    confidence: { value: 0.9, decayRate: 0.01, lastVerified: now },
    provenance: [],
  };
}

function scored(id: string, score: number): StoreSearchResult {
  return { memory: makeMemory(id), score };
}

describe('reciprocalRankFusion', () => {
  it('returns empty array when all stores are empty', () => {
    expect(reciprocalRankFusion([], [], [])).toEqual([]);
  });

  it('assigns higher fusedScore to top-ranked items', () => {
    const vector = [scored('a', 0.9), scored('b', 0.5), scored('c', 0.3)];
    const graph: StoreSearchResult[] = [];
    const temporal = [scored('a', 0.8), scored('c', 0.4)];

    const results = reciprocalRankFusion(vector, graph, temporal);

    expect(results[0]?.memory.id).toBe('a');
    expect(results[0]!.fusedScore).toBeGreaterThan(results[1]!.fusedScore);
  });

  it('includes all unique memory ids across stores', () => {
    const vector = [scored('x', 0.7)];
    const graph = [scored('y', 0.5)];
    const temporal = [scored('z', 0.3)];

    const results = reciprocalRankFusion(vector, graph, temporal);
    const ids = results.map((r) => r.memory.id).sort();

    expect(ids).toEqual(['x', 'y', 'z']);
  });

  it('accumulates fusedScore when memory appears in multiple stores', () => {
    const both = [scored('shared', 0.9)];
    const results = reciprocalRankFusion(both, both, both);
    const shared = results.find((r) => r.memory.id === 'shared');

    expect(shared).toBeDefined();
    // fusedScore should be 3 × (1/(60+1)) ≈ 0.049
    expect(shared!.fusedScore).toBeCloseTo(3 / 61, 3);
  });

  it('preserves individual store scores', () => {
    const vector = [scored('a', 0.8)];
    const graph = [scored('a', 0.6)];
    const temporal = [scored('a', 0.4)];

    const results = reciprocalRankFusion(vector, graph, temporal);
    const a = results.find((r) => r.memory.id === 'a');

    expect(a?.vectorScore).toBe(0.8);
    expect(a?.graphScore).toBe(0.6);
    expect(a?.temporalScore).toBe(0.4);
  });
});
