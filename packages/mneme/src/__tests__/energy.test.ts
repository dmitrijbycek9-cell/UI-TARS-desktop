import { describe, it, expect } from 'vitest';
import { applyReinforcement, decayEnergy } from '../engine/energy.js';

describe('applyReinforcement', () => {
  it('adds the correct delta per event', () => {
    expect(applyReinforcement(20, 'retrieved')).toBe(30);
    expect(applyReinforcement(20, 'cited')).toBe(45);
    expect(applyReinforcement(20, 'action_success')).toBe(70);
    expect(applyReinforcement(50, 'contradicted')).toBe(20);
  });

  it('clamps energy at zero on strong negative events', () => {
    expect(applyReinforcement(10, 'contradicted')).toBe(0);
    expect(applyReinforcement(0, 'contradicted')).toBe(0);
  });
});

describe('decayEnergy', () => {
  it('decays by ~5% per hour', () => {
    expect(decayEnergy(100, 1)).toBeCloseTo(95, 5);
    expect(decayEnergy(100, 2)).toBeCloseTo(90.25, 5);
  });

  it('returns energy unchanged for zero or negative elapsed time', () => {
    expect(decayEnergy(100, 0)).toBe(100);
    expect(decayEnergy(100, -5)).toBe(100);
  });

  it('approaches zero over long idle periods', () => {
    const decayed = decayEnergy(100, 200);
    expect(decayed).toBeLessThan(1);
    expect(decayed).toBeGreaterThan(0);
  });

  it('compounds consistently across sequential windows', () => {
    const oneStep = decayEnergy(100, 4);
    const twoSteps = decayEnergy(decayEnergy(100, 2), 2);
    expect(oneStep).toBeCloseTo(twoSteps, 6);
  });
});
