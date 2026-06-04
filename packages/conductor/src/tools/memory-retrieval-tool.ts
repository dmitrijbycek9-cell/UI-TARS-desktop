import { MemoryManager } from '@mneme/core';

/**
 * Framework-agnostic tool spec. Shaped to be directly usable both with the
 * OpenAI-native tool-calling API (GrokClient) and with any agent framework
 * that accepts `{ name, description, parameters, execute }` (e.g. @tarko/agent's
 * `new Tool({ id: name, ... })`). Kept free of heavy framework imports so it
 * stays unit-testable and CI-safe.
 */
export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

export type RetrievalMode = 'hybrid' | 'graph' | 'temporal';

export interface RetrievedMemory {
  id: string;
  content: string;
  confidence: number;
  energy: number;
  scores: { vector: number; graph: number; temporal: number };
}

/**
 * Core retrieval logic (pure, no framework deps). Retrieves the most relevant
 * memories for the agent and reinforces each surfaced memory (+energy), so that
 * frequently-recalled knowledge resists forgetting.
 */
export async function memoryRetrieve(
  mm: MemoryManager,
  agentId: string,
  args: { query: string; k?: number; mode?: RetrievalMode },
): Promise<RetrievedMemory[]> {
  const { query, k = 5 } = args;
  const results = await mm.retrieveForAgent(query, agentId, { k });

  for (const r of results) {
    mm.reinforce(r.memory.id, 'retrieved'); // reinforcement loop
  }

  return results.map((r) => ({
    id: r.memory.id,
    content: r.memory.content,
    confidence: r.memory.confidence.value,
    energy: r.memory.energyScore,
    scores: {
      vector: r.vectorScore,
      graph: r.graphScore,
      temporal: r.temporalScore,
    },
  }));
}

/**
 * Build the `retrieve_memory` tool spec bound to a memory manager + agent.
 *
 * @example
 *   // OpenAI-native (GrokClient):
 *   const spec = createMemoryRetrievalToolSpec(mm, agentId);
 *   // @tarko/agent:
 *   // new Tool({ id: spec.name, description: spec.description,
 *   //            parameters: spec.parameters, function: spec.execute });
 */
export function createMemoryRetrievalToolSpec(
  mm: MemoryManager,
  agentId: string,
): ToolSpec {
  return {
    name: 'retrieve_memory',
    description:
      'Retrieve evolved long-term memory before answering or acting. Returns ' +
      'semantically, relationally and temporally relevant memories, each with ' +
      'confidence and energy (importance). Call this at the start of almost ' +
      'every non-trivial step.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to recall' },
        k: { type: 'number', description: 'Max results (default 5)' },
        mode: {
          type: 'string',
          enum: ['hybrid', 'graph', 'temporal'],
          description: 'Bias retrieval: relations vs sequences vs balanced',
        },
      },
      required: ['query'],
    },
    execute: (args) =>
      memoryRetrieve(
        mm,
        agentId,
        args as { query: string; k?: number; mode?: RetrievalMode },
      ),
  };
}
