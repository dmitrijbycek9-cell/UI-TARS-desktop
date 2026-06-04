import { MemoryManager, TriStoreSearchResult } from '@mneme/core';
import { GrokClient, GrokConfig, GrokMessage } from './integrations/grok.js';
import { Router } from './router.js';

export interface ConductorConfig {
  dbPath: string;
  grok?: GrokConfig;
  agentId?: string;
}

export interface ConductorResponse {
  content: string;
  intent: string;
  memoriesUsed: number;
  sessionId: string;
}

export class Conductor {
  private readonly memory: MemoryManager;
  private readonly grok: GrokClient;
  private readonly router: Router;
  private readonly agentId: string;

  constructor(config: ConductorConfig) {
    this.agentId = config.agentId ?? 'conductor-default';

    this.grok = new GrokClient(config.grok);

    this.memory = new MemoryManager({
      dbPath: config.dbPath,
      embeddingFn: (text: string) => this.grok.embed(text),
    });

    this.router = new Router(this.grok);
  }

  async run(
    userMessage: string,
    sessionId: string,
  ): Promise<ConductorResponse> {
    const routerResult = await this.router.classify(userMessage);

    const relevantMemories = await this.memory.retrieveForAgent(
      userMessage,
      this.agentId,
      {
        k: 5,
      },
    );

    const messages = this.buildMessages(
      userMessage,
      relevantMemories,
      routerResult.intent,
    );
    const response = await this.grok.chat(messages);

    await this.memory.store({
      content: `User: ${userMessage}\nAssistant: ${response.content}`,
      agentId: this.agentId,
      sessionId,
      relatedIds: relevantMemories.slice(0, 3).map((m) => m.memory.id),
    });

    return {
      content: response.content,
      intent: routerResult.intent,
      memoriesUsed: relevantMemories.length,
      sessionId,
    };
  }

  private buildMessages(
    userMessage: string,
    memories: TriStoreSearchResult[],
    _intent: string,
  ): GrokMessage[] {
    const systemParts = [
      'You are a helpful AI assistant with persistent memory.',
      'Use the provided memory context to give informed, personalized responses.',
    ];

    if (memories.length > 0) {
      const memoryContext = memories
        .map(
          (m: TriStoreSearchResult, i: number) =>
            `[Memory ${i + 1}] (confidence: ${m.memory.confidence.value.toFixed(2)})\n${m.memory.content}`,
        )
        .join('\n\n');
      systemParts.push(`\n## Relevant Memory Context\n${memoryContext}`);
    }

    return [
      { role: 'system', content: systemParts.join('\n') },
      { role: 'user', content: userMessage },
    ];
  }

  close(): void {
    this.memory.close();
  }
}
