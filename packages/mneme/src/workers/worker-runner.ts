import { Worker, WorkerContext, WorkerEvent, WorkerResult } from './types.js';

interface WorkerState {
  running: boolean;
  lastRunAt: number | null;
  storedSinceLastRun: number;
}

/**
 * In-process, event-driven worker coordinator. Workers are evaluated on each
 * `notify(event)` and run when their `shouldRun` trigger fires — there is no
 * cron loop. A per-worker reentrancy guard prevents overlapping runs.
 *
 * This is the lightweight precursor to the full MemoryConductor: it drives the
 * forgetting worker today and accepts any number of additional workers later.
 * Workers that set `standalone: true` may additionally be run on their own as
 * nonstop background processes, independent of this runner.
 */
export class WorkerRunner {
  private readonly workers: Worker[] = [];
  private readonly state = new Map<string, WorkerState>();

  constructor(workers: Worker[] = []) {
    for (const worker of workers) this.register(worker);
  }

  register(worker: Worker): void {
    this.workers.push(worker);
    this.state.set(worker.name, {
      running: false,
      lastRunAt: null,
      storedSinceLastRun: 0,
    });
  }

  /**
   * Inject an event from anywhere (active agent loop, scheduler, external
   * monitor). Returns the results of any workers that ran.
   */
  async notify(event: WorkerEvent): Promise<WorkerResult[]> {
    if (event.type === 'memory_stored') {
      for (const s of this.state.values()) s.storedSinceLastRun++;
    }

    const results: WorkerResult[] = [];
    for (const worker of this.workers) {
      const s = this.state.get(worker.name)!;
      if (s.running) continue; // reentrancy guard

      const ctx: WorkerContext = {
        event,
        memoriesStoredSinceLastRun: s.storedSinceLastRun,
        lastRunAt: s.lastRunAt,
      };

      if (!(await worker.shouldRun(ctx))) continue;
      // Re-check after the await: another notify() may have started this
      // worker while shouldRun was pending (reentrancy guard).
      if (s.running) continue;

      s.running = true;
      try {
        results.push(await worker.run(ctx));
      } finally {
        s.running = false;
        s.lastRunAt = Date.now();
        s.storedSinceLastRun = 0;
      }
    }
    return results;
  }
}
