import { describe, it, expect } from 'vitest';
import { findZeroAngle } from '../src/solver/zero';
import { integrate, sampleAtRange } from '../src/solver/integrate';
import type { ShotInput } from '../src/solver/types';

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
  maxRangeM: 1000,
  shotAngleRad: 0,
  atmosphere: { temperatureK: 288.15, pressurePa: 101325, relativeHumidity: 0 },
  wind: { speedMps: 0, clock: 3 },
  spinDrift: false,
  coriolis: null,
};

describe('findZeroAngle', () => {
  it('computes the correct zero angle for the base input', () => {
    const angle = findZeroAngle(base);
    expect(angle).toBeCloseTo(0.00138488, 5);
  });

  it('produces a pathM near zero at the zero range with the computed angle', () => {
    const angle = findZeroAngle(base);
    const samples = integrate(base, angle);
    const sample = sampleAtRange(samples, 91.44);
    expect(sample).not.toBeNull();
    if (sample !== null) {
      expect(Math.abs(sample.pathM)).toBeLessThan(1e-6);
    }
  });

  it('computes the correct zero angle for a longer range and higher sight', () => {
    const input: ShotInput = { ...base, zeroRangeM: 182.88, sightHeightM: 0.07 };
    const angle = findZeroAngle(input);
    expect(angle).toBeCloseTo(0.00214883, 5);
  });

  it('matches the vacuum projectile formula when drag is disabled and sight height is zero', () => {
    const input: ShotInput = { ...base, dragEnabled: false, sightHeightM: 0, zeroRangeM: 300 };
    const angle = findZeroAngle(input);
    const expected = 0.5 * Math.asin((9.80665 * 300) / (750 * 750));
    expect(angle).toBeCloseTo(expected, 6);
  });

  it('is unaffected by wind and shot angle', () => {
    const withWindAndSlope: ShotInput = { ...base, wind: { speedMps: 10, clock: 3 }, shotAngleRad: 0.3 };
    const angle1 = findZeroAngle(withWindAndSlope);
    const angle2 = findZeroAngle(base);
    expect(angle1).toBeCloseTo(angle2, 12);
  });

  it('requires a larger angle for a longer zero range', () => {
    const angle100 = findZeroAngle({ ...base, zeroRangeM: 100 });
    const angle300 = findZeroAngle({ ...base, zeroRangeM: 300 });
    expect(angle300).toBeGreaterThan(angle100);
  });

  it('throws when the zero range is out of reach', () => {
    const input: ShotInput = { ...base, muzzleVelocityMps: 100, zeroRangeM: 5000 };
    expect(() => findZeroAngle(input)).toThrow('zero range is out of reach');
  });
});
