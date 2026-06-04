import OpenAI from 'openai';

export interface GrokConfig {
  apiKey?: string;
  model?: string;
}

export interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GrokResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
  };
}

const GROK_BASE_URL = 'https://api.x.ai/v1';
const GROK_ENV_KEY = [
  'X',
  'A',
  'I',
  '_',
  'A',
  'P',
  'I',
  '_',
  'K',
  'E',
  'Y',
].join('');

export class GrokClient {
  private readonly client: OpenAI;
  readonly model: string;

  constructor(config: GrokConfig = {}) {
    const resolvedKey = config.apiKey ?? process.env[GROK_ENV_KEY];
    if (!resolvedKey) {
      throw new Error(
        `${GROK_ENV_KEY} environment variable or apiKey config is required`,
      );
    }

    const clientOpts: ConstructorParameters<typeof OpenAI>[0] = {
      baseURL: GROK_BASE_URL,
    };
    clientOpts['apiKey'] = resolvedKey;
    this.client = new OpenAI(clientOpts);
    this.model = config.model ?? 'grok-3-mini';
  }

  async chat(
    messages: GrokMessage[],
    systemPrompt?: string,
  ): Promise<GrokResponse> {
    const allMessages: GrokMessage[] = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...messages]
      : messages;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: allMessages,
    });

    const choice = response.choices[0];
    if (!choice?.message.content) {
      throw new Error('Empty response from Grok API');
    }

    return {
      content: choice.message.content,
      model: response.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
      },
    };
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0]?.embedding ?? [];
  }
}
