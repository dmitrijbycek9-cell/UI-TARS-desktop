import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryManager } from '../engine/memory-manager.js';
import { ForgettingWorker } from '../workers/forgetting-worker.js';
import { WorkerRunner } from '../workers/worker-runner.js';
import { Worker, WorkerContext, WorkerResult } from '../workers/types.js';
import { EmbeddingFn } from '../types.js';

const embed: EmbeddingFn = async (text) => {
  const seed = text.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from({ length: 8 }, (_, i) => Math.sin(seed + i));
};

describe('ForgettingWorker', () => {
  let manager: MemoryManager;

  beforeEach(() => {
    manager = new MemoryManager({ dbPath: ':memory:', embeddingFn: embed });
  });

  afterEach(() => manager.close());

  it('archives a memory whose energy is below the cold threshold', async () => {
    const m = await manager.store({
      content: 'Selten genutzte Notiz',
      agentId: 'a1',
      sessionId: 's1',
    });
    // Below cold (20) but above delete (5): should be archived, not deleted.
    manager.setEnergy(m.id, 12);

    const worker = new ForgettingWorker(manager);
    const result = await worker.run({
      event: { type: 'manual' },
      memoriesStoredSinceLastRun: 0,
      lastRunAt: null,
    });

    expect(result.stats.archived).toBe(1);
    expect(result.stats.deleted).toBe(0);
    expect(manager.getById(m.id)).toBeNull(); // gone from active store
    expect(manager.getColdStats().count).toBe(1);
  });

  it('keeps high-energy memories active', async () => {
    const m = await manager.store({
      content: 'Wichtige, frisch genutzte Notiz',
      agentId: 'a1',
      sessionId: 's1',
    });
    manager.setEnergy(m.id, 100);

    const worker = new ForgettingWorker(manager);
    await worker.run({
      event: { type: 'manual' },
      memoriesStoredSinceLastRun: 0,
      lastRunAt: null,
    });

    expect(manager.getById(m.id)).not.toBeNull();
    expect(manager.getColdStats().count).toBe(0);
  });

  it('permanently deletes cold memories below the delete threshold', async () => {
    const m = await manager.store({
      content: 'Fast vergessene Notiz',
      agentId: 'a1',
      sessionId: 's1',
    });
    manager.setEnergy(m.id, 2); // below both cold (20) and delete (5)

    const worker = new ForgettingWorker(manager);
    const result = await worker.run({
      event: { type: 'manual' },
      memoriesStoredSinceLastRun: 0,
      lastRunAt: null,
    });

    expect(result.stats.archived).toBe(1);
    expect(result.stats.deleted).toBe(1);
    expect(manager.getColdStats().count).toBe(0);
  });

  it('restore() brings an archived memory back to the active store', async () => {
    const m = await manager.store({
      content: 'Archivierte, aber wiederherstellbare Notiz',
      agentId: 'a1',
      sessionId: 's1',
    });
    manager.setEnergy(m.id, 10); // archived but above delete threshold
    await new ForgettingWorker(manager).run({
      event: { type: 'manual' },
      memoriesStoredSinceLastRun: 0,
      lastRunAt: null,
    });
    expect(manager.getById(m.id)).toBeNull();

    const restored = await manager.restore(m.id);
    expect(restored?.content).toBe(
      'Archivierte, aber wiederherstellbare Notiz',
    );
    expect(manager.getById(m.id)).not.toBeNull();
    expect(manager.getColdStats().count).toBe(0);
  });
});

describe('WorkerRunner', () => {
  it('runs a worker on idle and never overlaps runs', async () => {
    let active = 0;
    let maxConcurrent = 0;
    let runs = 0;

    const slow: Worker = {
      name: 'slow',
      shouldRun: () => true,
      run: async (_ctx: WorkerContext): Promise<WorkerResult> => {
        active++;
        maxConcurrent = Math.max(maxConcurrent, active);
        await new Promise((r) => setTimeout(r, 10));
        active--;
        runs++;
        return { worker: 'slow', stats: { runs } };
      },
    };

    const runner = new WorkerRunner([slow]);
    // Fire two notifies concurrently; reentrancy guard must serialize.
    await Promise.all([
      runner.notify({ type: 'idle' }),
      runner.notify({ type: 'idle' }),
    ]);

    expect(maxConcurrent).toBe(1);
  });

  it('triggers forgetting after enough memories are stored', async () => {
    const manager = new MemoryManager({
      dbPath: ':memory:',
      embeddingFn: embed,
    });
    const worker = new ForgettingWorker(manager, { storedTrigger: 3 });
    const runner = new WorkerRunner([worker]);

    let ran = (await runner.notify({ type: 'memory_stored' })).length;
    ran += (await runner.notify({ type: 'memory_stored' })).length;
    expect(ran).toBe(0); // only 2 stored, trigger is 3

    const results = await runner.notify({ type: 'memory_stored' });
    expect(results.length).toBe(1); // 3rd store crosses the trigger
    expect(results[0]?.worker).toBe('forgetting');

    manager.close();
  });
});
