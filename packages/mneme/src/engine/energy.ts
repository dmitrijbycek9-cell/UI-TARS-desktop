/**
 * Reinforcement-based energy system (Whitepaper §4.2).
 *
 * Each memory carries an activation energy. Access/usage reinforces it,
 * time decays it. The forgetting worker archives/deletes low-energy memories.
 */

export type EnergyEvent =
  | 'retrieved' // +10  — surfaced by a retrieval
  | 'cited' // +25  — quoted in an answer
  | 'action_success' // +50  — produced a successful action
  | 'contradicted'; // -30  — refuted (confidence should also drop)

const DELTAS: Record<EnergyEvent, number> = {
  retrieved: 10,
  cited: 25,
  action_success: 50,
  contradicted: -30,
};

/**
 * Apply a reinforcement event to an energy score. Clamped at >= 0.
 */
export function applyReinforcement(energy: number, event: EnergyEvent): number {
  return Math.max(0, energy + DELTAS[event]);
}

/**
 * Ebbinghaus/Hebb forgetting curve: energy decays by ×0.95 per hour.
 * 0.95^hours = e^(-LAMBDA·hours) with LAMBDA = -ln(0.95) ≈ 0.0513.
 */
const LAMBDA = -Math.log(0.95);

/**
 * Decay an energy score over an elapsed time window (in hours).
 * Negative or zero elapsed time returns the energy unchanged.
 */
export function decayEnergy(energy: number, hoursElapsed: number): number {
  if (hoursElapsed <= 0) return energy;
  return energy * Math.exp(-LAMBDA * hoursElapsed);
}

/**
 * Default energy thresholds for the forgetting lifecycle.
 */
export const DEFAULT_COLD_THRESHOLD = 20;
export const DEFAULT_DELETE_THRESHOLD = 5;
