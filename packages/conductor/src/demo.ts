/**
 * Demo: Conductor + MNEME mit Grok xAI (Phase 2).
 *
 * Voraussetzung: XAI_API_KEY muss gesetzt sein.
 * Starten: pnpm --filter @conductor/core demo
 *
 * Teil 1 — Conductor: einfacher Memory-gestützter Chat.
 * Teil 2 — MemoryAgent: Tool-Calling-Agent, der retrieve_memory selbst aufruft,
 *          danach event-getriebenes Forgetting (idle) → cold_storage.
 */
import { Conductor } from './conductor.js';
import { MemoryAgent } from './memory-agent.js';
import path from 'node:path';
import os from 'node:os';

async function conductorDemo() {
  const dbPath = path.join(os.tmpdir(), 'conductor-demo.db');
  const conductor = new Conductor({ dbPath });
  const sessionId = `demo-${Date.now()}`;

  console.log('\n=== Teil 1: Conductor ===\n');
  const turns = [
    'Ich arbeite an einem Projekt namens Conductor, das Grok mit einem Memory-System verbindet.',
    'Was war das Projekt, an dem ich gerade arbeite?',
    'Erkläre kurz, was MNEME in diesem Kontext bedeutet.',
  ];
  for (const message of turns) {
    console.log(`> ${message}`);
    const response = await conductor.run(message, sessionId);
    console.log(
      `Intent: ${response.intent} | Memories verwendet: ${response.memoriesUsed}`,
    );
    console.log(`Antwort: ${response.content}\n`);
  }
  conductor.close();
}

async function memoryAgentDemo() {
  const dbPath = path.join(os.tmpdir(), 'memory-agent-demo.db');
  // Aggressive Schwellwerte, damit Forgetting im Demo sichtbar wird.
  const agent = new MemoryAgent({
    dbPath,
    forgetting: { coldThreshold: 95, deleteThreshold: 1, storedTrigger: 1 },
  });
  const sessionId = `agent-${Date.now()}`;

  console.log('\n=== Teil 2: MemoryAgent (Tool-Calling) ===\n');
  const turns = [
    'Merke dir: mein Lieblingsframework ist MNEME.',
    'Welches Framework mag ich am liebsten?',
  ];
  for (const message of turns) {
    console.log(`> ${message}`);
    const response = await agent.run(message, sessionId);
    console.log(
      `Tool-Calls: ${response.toolCalls} | Memories abgerufen: ${response.memoriesRetrieved}`,
    );
    console.log(`Antwort: ${response.content}\n`);
  }

  // Event-getriebenes Forgetting ohne aktive Loop: idle injizieren.
  await agent.notify({ type: 'idle' });
  console.log(`cold_storage nach idle: ${agent.getColdStats().count} Memories`);
  agent.close();
}

async function main() {
  await conductorDemo();
  await memoryAgentDemo();
}

main().catch(console.error);
