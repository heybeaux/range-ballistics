import { describe, it, expect } from 'vitest';
import { solve, sampleAt } from '../src/solver/solve';
import type { ShotInput, SolveSuccess, TrajectorySample } from '../src/solver/types';

const base: ShotInput = {
  muzzleVelocityMps: 750,
  bc: 0.243,
  dragModel: 'G7',
  bulletMassKg: 0.01134,
  bulletDiameterM: 0.007823,
  bulletLengthM: null,
  twistM: 0.2794,
  twistDirection: 'right',
  sightHeightM: 0.05,
  zeroRangeM: 91.44,
  maxRangeM: 914.4,
  shotAngleRad: 0,
  atmosphere: { temperatureK: 288.15, pressurePa: 101325, relativeHumidity: 0 },
  wind: { speedMps: 0, clock: 3 },
  spinDrift: false,
  coriolis: null
};

function ok(input: ShotInput): SolveSuccess {
  const result = solve(input);
  if (!result.ok) {
    throw new Error('Solve failed: ' + JSON.stringify(result.errors));
  }
  return result;
}

function at(result: SolveSuccess, rangeM: number): TrajectorySample {
  const sample = sampleAt(result.samples, rangeM);
  if (sample === null) {
    throw new Error(`No sample at range ${rangeM} m`);
  }
  return sample;
}

describe('physics sanity', () => {
  it('1. Past the zero, drop grows with distance', () => {
    const result = ok(base);
    let previous: number | null = null;
    for (let range = 100; range <= 900; range += 50) {
      const path = at(result, range).pathM;
      if (previous !== null) {
        expect(path).toBeLessThan(previous);
      }
      previous = path;
    }
  });

  it('2. At the muzzle the bullet is one sight height below the line of sight', () => {
    const result = ok(base);
    const first = result.samples[0];
    expect(first).toBeDefined();
    if (first === undefined) {
      throw new Error('No samples');
    }
    expect(Math.abs(first.rangeM)).toBeLessThan(1e-9);
    expect(Math.abs(first.pathM + 0.05)).toBeLessThan(1e-9);
  });

  it('3. At the zero range the path is about zero', () => {
    const result = ok(base);
    expect(Math.abs(at(result, 91.44).pathM)).toBeLessThan(0.001);
  });

  it('4. No wind means no drift', () => {
    const result = ok(base);
    expect(Math.abs(at(result, 900).windDriftM)).toBeLessThan(1e-9);
  });

  it('5. A headwind or tailwind barely changes drift', () => {
    for (const clock of [12, 6]) {
      const result = ok({ ...base, wind: { speedMps: 4.4704, clock } });
      expect(Math.abs(at(result, 900).windDriftM)).toBeLessThan(1e-6);
    }
  });

  it('6. A full-value crosswind gives the most drift', () => {
    const driftAt = (clock: number) =>
      Math.abs(at(ok({ ...base, wind: { speedMps: 4.4704, clock } }), 900).windDriftM);
    const d1 = driftAt(1);
    const d2 = driftAt(2);
    const d3 = driftAt(3);
    const d4 = driftAt(4);
    const d5 = driftAt(5);
    expect(d3).toBeGreaterThan(d1);
    expect(d3).toBeGreaterThan(d2);
    expect(d3).toBeGreaterThan(d4);
    expect(d3).toBeGreaterThan(d5);
    expect(d2).toBeGreaterThan(d1);
    expect(d4).toBeGreaterThan(d5);
  });

  it('7. Crosswind direction: clock 3 left, clock 9 right, equal sizes', () => {
    const fromRight = ok({ ...base, wind: { speedMps: 4.4704, clock: 3 } });
    const fromLeft = ok({ ...base, wind: { speedMps: 4.4704, clock: 9 } });
    const driftRight = at(fromRight, 900).windDriftM;
    const driftLeft = at(fromLeft, 900).windDriftM;
    expect(driftRight).toBeLessThan(0);
    expect(driftLeft).toBeGreaterThan(0);
    expect(Math.abs(Math.abs(driftRight) - Math.abs(driftLeft))).toBeLessThan(1e-6);
  });

  it('8. Drift scales with wind speed', () => {
    const slow = ok({ ...base, wind: { speedMps: 4.4704, clock: 3 } });
    const fast = ok({ ...base, wind: { speedMps: 8.9408, clock: 3 } });
    const ratio = Math.abs(at(fast, 900).windDriftM) / Math.abs(at(slow, 900).windDriftM);
    expect(ratio).toBeGreaterThan(1.9);
    expect(ratio).toBeLessThan(2.1);
  });

  it('9. Denser air increases drop', () => {
    const dense = ok(base);
    const thin = ok({ ...base, atmosphere: { ...base.atmosphere, pressurePa: 85000 } });
    expect(at(dense, 900).pathM).toBeLessThan(at(thin, 900).pathM);
  });

  it('10. Colder air increases drop', () => {
    const cold = ok({ ...base, atmosphere: { ...base.atmosphere, temperatureK: 258.15 } });
    const warm = ok({ ...base, atmosphere: { ...base.atmosphere, temperatureK: 308.15 } });
    expect(at(cold, 900).pathM).toBeLessThan(at(warm, 900).pathM);
  });

  it('11. A faster bullet drops less', () => {
    const fast = ok({ ...base, muzzleVelocityMps: 800 });
    const slow = ok({ ...base, muzzleVelocityMps: 700 });
    expect(at(fast, 900).pathM).toBeGreaterThan(at(slow, 900).pathM);
  });

  it('12. A higher BC drops less and drifts less', () => {
    const wind = { speedMps: 4.4704, clock: 3 };
    const highBc = ok({ ...base, bc: 0.28, wind });
    const lowBc = ok({ ...base, bc: 0.2, wind });
    expect(at(highBc, 900).pathM).toBeGreaterThan(at(lowBc, 900).pathM);
    expect(Math.abs(at(highBc, 900).windDriftM)).toBeLessThan(Math.abs(at(lowBc, 900).windDriftM));
  });

  it('13. Speed falls all the way; time of flight increases', () => {
    const result = ok(base);
    let previousSpeed: number | null = null;
    let previousTime: number | null = null;
    for (let range = 100; range <= 900; range += 100) {
      const sample = at(result, range);
      if (previousSpeed !== null) {
        expect(sample.speedMps).toBeLessThan(previousSpeed);
      }
      if (previousTime !== null) {
        expect(sample.timeS).toBeGreaterThan(previousTime);
      }
      previousSpeed = sample.speedMps;
      previousTime = sample.timeS;
    }
  });
});
