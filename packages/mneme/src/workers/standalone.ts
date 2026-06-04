/**
 * Standalone nonstop runner for a single memory worker.
 *
 * Lets a worker (e.g. forgetting) run as its own background process,
 * independent of any active agent session — the "nonstop scaffolding".
 * It periodically injects `scheduled` events; energy decay → cold_storage →
 * delete therefore keeps happening even with no agent in the loop.
 *
 * Usage: mneme-worker forgetting --db <path> [--interval-ms 60000]
 */
import { MemoryManager } from '../engine/memory-manager.js';
import { ForgettingWorker } from './forgetting-worker.js';
import { WorkerRunner } from './worker-runner.js';
import { Worker } from './types.js';

export interface StandaloneOptions {
  dbPath: string;
  intervalMs?: number;
  /** Stop after this many ticks (for tests); undefined = run forever. */
  maxTicks?: number;
  onTick?: (results: Awaited<ReturnType<WorkerRunner['notify']>>) => void;
}

function buildWorker(name: string, memory: MemoryManager): Worker {
  switch (name) {
    case 'forgetting':
      return new ForgettingWorker(memory);
    default:
      throw new Error(`Unknown standalone worker: ${name}`);
  }
}

/**
 * Run a single worker standalone on a scheduled tick. Resolves when stopped
 * (maxTicks reached) or never, if maxTicks is undefined.
 */
export async function runStandaloneWorker(
  workerName: string,
  options: StandaloneOptions,
): Promise<void> {
  const memory = new MemoryManager({ dbPath: options.dbPath });
  const worker = buildWorker(workerName, memory);
  if (!worker.standalone) {
    memory.close();
    throw new Error(`Worker "${workerName}" is not standalone-capable`);
  }

  const runner = new WorkerRunner([worker]);
  const intervalMs = options.intervalMs ?? 60_000;
  let ticks = 0;

  return new Promise<void>((resolve) => {
    const timer = setInterval(async () => {
      const results = await runner.notify({ type: 'scheduled' });
      options.onTick?.(results);
      ticks++;
      if (options.maxTicks !== undefined && ticks >= options.maxTicks) {
        clearInterval(timer);
        memory.close();
        resolve();
      }
    }, intervalMs);
  });
}

function parseArgs(argv: string[]): {
  worker: string;
  opts: StandaloneOptions;
} {
  const worker = argv[0] ?? 'forgetting';
  let dbPath = '';
  let intervalMs = 60_000;
  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === '--db') dbPath = argv[++i] ?? '';
    else if (argv[i] === '--interval-ms') intervalMs = Number(argv[++i]);
  }
  if (!dbPath) throw new Error('Missing --db <path>');
  return { worker, opts: { dbPath, intervalMs } };
}

// CLI entry: `node dist/workers/standalone.js forgetting --db ./mneme.db`
if (
  typeof process !== 'undefined' &&
  process.argv[1] &&
  process.argv[1].endsWith('standalone.js')
) {
  const { worker, opts } = parseArgs(process.argv.slice(2));
  // eslint-disable-next-line no-console
  console.log(`[mneme-worker] starting "${worker}" on ${opts.dbPath}`);
  runStandaloneWorker(worker, {
    ...opts,
    onTick: (results) => {
      for (const r of results) {
        // eslint-disable-next-line no-console
        console.log(`[mneme-worker] ${r.worker}`, r.stats);
      }
    },
  }).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[mneme-worker] fatal', err);
    process.exit(1);
  });
}
