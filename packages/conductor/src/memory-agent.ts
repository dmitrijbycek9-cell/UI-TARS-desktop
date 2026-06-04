import {
  MemoryManager,
  ForgettingWorker,
  WorkerRunner,
  ForgettingWorkerOptions,
} from '@mneme/core';
import {
  GrokClient,
  GrokConfig,
  ChatMessageParam,
  ChatTool,
} from './integrations/grok.js';
import {
  createMemoryRetrievalToolSpec,
  ToolSpec,
} from './tools/memory-retrieval-tool.js';

export interface MemoryAgentConfig {
  dbPath: string;
  agentId?: string;
  grok?: GrokConfig;
  forgetting?: ForgettingWorkerOptions;
  /** Max tool-calling iterations per run (safety bound). */
  maxIterations?: number;
}

export interface MemoryAgentResponse {
  content: string;
  toolCalls: number;
  memoriesRetrieved: number;
  sessionId: string;
}

const SYSTEM_PROMPT =
  'You are an assistant with persistent, self-evolving memory. ' +
  'Before answering anything non-trivial, call retrieve_memory to recall ' +
  'relevant context. Prefer remembered facts over guessing.';

/**
 * A tool-calling agent built on Grok (OpenAI-native tool calling). It exposes
 * MNEME retrieval as a first-class tool and drives the forgetting worker via
 * an event-driven WorkerRunner (loop_end trigger) — no @tarko/agent dependency,
 * so it stays self-contained and CI-safe.
 */
export class MemoryAgent {
  private readonly grok: GrokClient;
  private readonly memory: MemoryManager;
  private readonly runner: WorkerRunner;
  private readonly tool: ToolSpec;
  private readonly agentId: string;
  private readonly maxIterations: number;

  constructor(config: MemoryAgentConfig) {
    this.agentId = config.agentId ?? 'memory-agent';
    this.maxIterations = config.maxIterations ?? 5;

    this.grok = new GrokClient(config.grok);
    this.memory = new MemoryManager({
      dbPath: config.dbPath,
      embeddingFn: (text: string) => this.grok.embed(text),
    });

    this.tool = createMemoryRetrievalToolSpec(this.memory, this.agentId);
    this.runner = new WorkerRunner([
      new ForgettingWorker(this.memory, config.forgetting),
    ]);
  }

  /** Inject a worker event from outside (idle, scheduled, manual). */
  notify(event: Parameters<WorkerRunner['notify']>[0]) {
    return this.runner.notify(event);
  }

  async run(
    userMessage: string,
    sessionId: string,
  ): Promise<MemoryAgentResponse> {
    const tools: ChatTool[] = [
      {
        type: 'function',
        function: {
          name: this.tool.name,
          description: this.tool.description,
          parameters: this.tool.parameters,
        },
      },
    ];

    const messages: ChatMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ];

    let toolCalls = 0;
    let memoriesRetrieved = 0;
    let finalContent = '';

    for (let i = 0; i < this.maxIterations; i++) {
      const assistant = await this.grok.chatWithTools(messages, tools);
      messages.push(assistant);

      const calls = assistant.tool_calls ?? [];
      if (calls.length === 0) {
        finalContent = assistant.content ?? '';
        break;
      }

      for (const call of calls) {
        if (call.type !== 'function') continue;
        toolCalls++;
        let result: unknown = [];
        try {
          const args = JSON.parse(call.function.arguments || '{}');
          result = await this.tool.execute(args);
          if (Array.isArray(result)) memoriesRetrieved += result.length;
        } catch (err) {
          result = { error: err instanceof Error ? err.message : String(err) };
        }
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
    }

    // Persist the interaction as a new memory.
    await this.memory.store({
      content: `User: ${userMessage}\nAssistant: ${finalContent}`,
      agentId: this.agentId,
      sessionId,
    });

    // Event-driven trigger: a finished loop may warrant forgetting work.
    await this.runner.notify({ type: 'memory_stored' });
    await this.runner.notify({ type: 'loop_end' });

    return {
      content: finalContent,
      toolCalls,
      memoriesRetrieved,
      sessionId,
    };
  }

  getColdStats() {
    return this.memory.getColdStats();
  }

  close(): void {
    this.memory.close();
  }
}
