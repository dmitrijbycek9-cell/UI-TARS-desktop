import { Provenance, ProvenanceType } from '../types.js';

export function createProvenance(
  type: ProvenanceType,
  source: string,
  weight: number,
): Provenance {
  return { type, source, weight, timestamp: new Date() };
}

export function mergeProvenance(
  existing: Provenance[],
  incoming: Provenance[],
): Provenance[] {
  const merged = [...existing];
  for (const p of incoming) {
    const idx = merged.findIndex(
      (e) => e.source === p.source && e.type === p.type,
    );
    if (idx >= 0) {
      merged[idx] = {
        ...merged[idx]!,
        weight: Math.min(1, (merged[idx]!.weight + p.weight) / 2),
      };
    } else {
      merged.push(p);
    }
  }
  return merged;
}

/**
 * Decays confidence value based on elapsed time and decay rate.
 * confidence(t) = base * e^(-decayRate * hours)
 */
export function decayedConfidence(
  baseValue: number,
  decayRate: number,
  lastVerified: Date,
): number {
  const hours = (Date.now() - lastVerified.getTime()) / 3_600_000;
  return Math.max(0, baseValue * Math.exp(-decayRate * hours));
}
