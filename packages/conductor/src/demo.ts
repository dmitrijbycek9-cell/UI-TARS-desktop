/**
 * Demo script: Conductor + MNEME mit Grok xAI
 *
 * Voraussetzung: XAI_API_KEY muss gesetzt sein.
 * Starten: pnpm tsx src/demo.ts
 */
import { Conductor } from './conductor.js';
import path from 'node:path';
import os from 'node:os';

async function main() {
  const dbPath = path.join(os.tmpdir(), 'conductor-demo.db');
  const conductor = new Conductor({ dbPath });

  const sessionId = `demo-${Date.now()}`;

  console.log('Conductor + MNEME Demo gestartet\n');

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

main().catch(console.error);
