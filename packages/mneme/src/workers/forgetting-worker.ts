import { MemoryManager } from '../engine/memory-manager.js';
import {
  decayEnergy,
  DEFAULT_COLD_THRESHOLD,
  DEFAULT_DELETE_THRESHOLD,
} from '../engine/energy.js';
import { Worker, WorkerContext, WorkerResult } from './types.js';

export interface ForgettingWorkerOptions {
  /** Energy below which an active memory is archived to cold storage. */
  coldThreshold?: number;
  /** Energy below which a cold memory is permanently deleted. */
  deleteThreshold?: number;
  /** Trigger run once this many memories were stored since the last run. */
  storedTrigger?: number;
  /** Safety-net max interval (ms) so the worker can't stall forever. */
  maxIntervalMs?: number;
}

/**
 * Worker 4 — Forgetting. Decays energy of active memories based on idle time,
 * archives low-energy memories into cold storage, and permanently deletes
 * cold memories that fall below the delete threshold.
 *
 * Runs standalone (own DB transaction boundaries) so it can operate as a
 * nonstop background process independent of any active agent session.
 */
export class ForgettingWorker implements Worker {
  readonly name = 'forgetting';
  readonly standalone = true;

  private readonly coldThreshold: number;
  private readonly deleteThreshold: number;
  private readonly storedTrigger: number;
  private readonly maxIntervalMs: number;

  constructor(
    private readonly memory: MemoryManager,
    options: ForgettingWorkerOptions = {},
  ) {
    this.coldThreshold = options.coldThreshold ?? DEFAULT_COLD_THRESHOLD;
    this.deleteThreshold = options.deleteThreshold ?? DEFAULT_DELETE_THRESHOLD;
    this.storedTrigger = options.storedTrigger ?? 10;
    this.maxIntervalMs = options.maxIntervalMs ?? 60 * 60 * 1000;
  }

  /**
   * Trigger-based (energy-gap / new-inputs), not blind-periodic:
   * fire on idle, on enough new memories, or as a max-interval safety net.
   */
  shouldRun(ctx: WorkerContext): boolean {
    if (ctx.event.type === 'idle' || ctx.event.type === 'scheduled')
      return true;
    if (ctx.event.type === 'manual') return true;
    if (ctx.memoriesStoredSinceLastRun >= this.storedTrigger) return true;
    if (
      ctx.lastRunAt !== null &&
      Date.now() - ctx.lastRunAt >= this.maxIntervalMs
    ) {
      return true;
    }
    return false;
  }

  async run(_ctx: WorkerContext): Promise<WorkerResult> {
    const now = Date.now();
    let decayed = 0;
    let archived = 0;

    for (const memory of this.memory.listActive()) {
      const hoursIdle = (now - memory.lastAccessedAt.getTime()) / 3_600_000;
      const newEnergy = decayEnergy(memory.energyScore, hoursIdle);
      this.memory.setEnergy(memory.id, newEnergy);
      decayed++;

      if (newEnergy < this.coldThreshold) {
        this.memory.archive(memory.id);
        archived++;
      }
    }

    const deleted = this.memory.purgeCold(this.deleteThreshold);

    return { worker: this.name, stats: { decayed, archived, deleted } };
  }
}
