/**
 * Background memory workers. Each worker is a specialized, independently
 * runnable unit of the self-evolving memory "scaffolding". Workers are driven
 * by events (not blind cron) via the WorkerRunner, and — when marked
 * `standalone` — can also run as their own nonstop background process.
 */

export type WorkerEvent =
  | { type: 'memory_stored' }
  | { type: 'loop_end' }
  | { type: 'idle' }
  | { type: 'scheduled' }
  | { type: 'manual' };

export interface WorkerContext {
  /** The event that triggered this evaluation. */
  event: WorkerEvent;
  /** Memories stored since this worker last ran (reset after each run). */
  memoriesStoredSinceLastRun: number;
  /** Epoch ms of this worker's previous run, or null if it never ran. */
  lastRunAt: number | null;
}

export interface WorkerResult {
  worker: string;
  /** Free-form per-worker stats (e.g. { decayed, archived, deleted }). */
  stats: Record<string, number>;
}

export interface Worker {
  name: string;
  shouldRun(ctx: WorkerContext): boolean | Promise<boolean>;
  run(ctx: WorkerContext): Promise<WorkerResult>;
  /**
   * When true, this worker is also runnable on its own (without the full
   * WorkerRunner) as a standalone nonstop background process/subagent. Such
   * workers must own their concurrency control (DB transaction boundaries),
   * since the in-process reentrancy guard does not span processes.
   */
  standalone?: boolean;
}
