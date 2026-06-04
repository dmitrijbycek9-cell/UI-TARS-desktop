import { GrokClient } from './integrations/grok.js';

export type Intent =
  | 'factual_query'
  | 'task_execution'
  | 'memory_recall'
  | 'conversation';

export interface RouterResult {
  intent: Intent;
  confidence: number;
  reasoning: string;
}

const ROUTER_PROMPT = `Classify the user intent into exactly one category:
- factual_query: asking for facts, definitions, or information
- task_execution: requesting an action or computation
- memory_recall: asking about previous conversations or stored context
- conversation: general chat or clarification

Respond with JSON only: {"intent": "<category>", "confidence": <0-1>, "reasoning": "<short reason>"}`;

export class Router {
  constructor(private readonly grok: GrokClient) {}

  async classify(userMessage: string): Promise<RouterResult> {
    try {
      const response = await this.grok.chat(
        [{ role: 'user', content: userMessage }],
        ROUTER_PROMPT,
      );

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as RouterResult;
      }
    } catch {
      // Fall back to conversation intent on parse failure
    }

    return { intent: 'conversation', confidence: 0.5, reasoning: 'fallback' };
  }
}
