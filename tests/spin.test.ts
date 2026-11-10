import { describe, it, expect } from 'vitest';
import { millerStability, spinDriftM } from '../src/solver/spin';
import type { Atmosphere } from '../src/solver/types';

const std: Atmosphere = { temperatureK: 288.15, pressurePa: 101325, relativeHumidity: 0 };

const b175 = {
  bulletMassKg: 175 * 0.00006479891,
  bulletDiameterM: 0.308 * 0.0254,
  bulletLengthM: 1.24 * 0.0254,
  twistM: 11 * 0.0254,
  muzzleVelocityMps: 750,
  atmosphere: std,
};

describe('millerStability', () => {
  it('calculates correct sg and status for standard 175gr bullet', () => {
    const result = millerStability(b175);
    expect(result.sg).toBeCloseTo(1.947, 2);
    expect(result.status).toBe('stable');
  });

  it('gives lower sg for slower twist (14 inches)', () => {
    const slowTwist = { ...b175, twistM: 14 * 0.0254 };
    const result = millerStability(slowTwist);
    const baseResult = millerStability(b175);
    expect(result.sg).toBeLessThan(baseResult.sg);
  });

  it('gives higher sg for faster twist (8 inches)', () => {
    const fastTwist = { ...b175, twistM: 8 * 0.0254 };
    const result = millerStability(fastTwist);
    const baseResult = millerStability(b175);
    expect(result.sg).toBeGreaterThan(baseResult.sg);
  });

  it('gives higher sg in thin air (low pressure)', () => {
    const thinAir = { ...b175, atmosphere: { ...std, pressurePa: 70000 } };
    const result = millerStability(thinAir);
    const baseResult = millerStability(b175);
    expect(result.sg).toBeGreaterThan(baseResult.sg);
  });

  it('gives lower sg in cold air (low temperature)', () => {
    const coldAir = { ...b175, atmosphere: { ...std, temperatureK: 253.15 } };
    const result = millerStability(coldAir);
    const baseResult = millerStability(b175);
    expect(result.sg).toBeLessThan(baseResult.sg);
  });

  it('handles status boundaries: unstable for 16 inch twist', () => {
    const unstableCase = { ...b175, twistM: 16 * 0.0254 };
    const result = millerStability(unstableCase);
    expect(result.status).toBe('unstable');
    expect(result.sg).toBeLessThan(1.0);
  });

  it('handles status boundaries: marginal for 13 inch twist', () => {
    const marginalCase = { ...b175, twistM: 13 * 0.0254 };
    const result = millerStability(marginalCase);
    expect(result.status).toBe('marginal');
    expect(result.sg).toBeGreaterThanOrEqual(1.0);
    expect(result.sg).toBeLessThan(1.5);
  });

  it('gives higher sg for higher muzzle velocity', () => {
    const highVel = { ...b175, muzzleVelocityMps: 850 };
    const result = millerStability(highVel);
    const baseResult = millerStability(b175);
    expect(result.sg).toBeGreaterThan(baseResult.sg);
  });
});

describe('spinDriftM', () => {
  it('calculates correct drift for right twist', () => {
    const sg = millerStability(b175).sg;
    const drift = spinDriftM(sg, 1.9151, 'right');
    expect(drift).toBeCloseTo(0.3282, 2);
  });

  it('gives negative drift for left twist', () => {
    const sg = millerStability(b175).sg;
    const rightDrift = spinDriftM(sg, 1.9151, 'right');
    const leftDrift = spinDriftM(sg, 1.9151, 'left');
    expect(leftDrift).toBe(-rightDrift);
  });

  it('returns 0 for zero or negative time of flight', () => {
    expect(spinDriftM(2, 0, 'right')).toBe(0);
    expect(spinDriftM(2, -1, 'right')).toBe(0);
  });
});
