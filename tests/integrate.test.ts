import { describe, it, expect } from 'vitest';
import { integrate, sampleAtRange, airVelocity } from '../src/solver/integrate';
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
  sightHeightM: 0,
  zeroRangeM: 91.44,
  maxRangeM: 500,
  shotAngleRad: 0,
  atmosphere: { temperatureK: 288.15, pressurePa: 101325, relativeHumidity: 0 },
  wind: { speedMps: 0, clock: 3 },
  spinDrift: false,
  coriolis: null,
};

describe('integrate', () => {
  it('1. Vacuum: sampleAtRange(s, 300) has timeS = 0.4 within 1e-6 and pathM = -0.5 * 9.80665 * 0.16 within 1e-6, speed x component 750 within 1e-9', () => {
    const input: ShotInput = { ...base, dragEnabled: false };
    const samples = integrate(input, 0);
    const s = sampleAtRange(samples, 300);
    expect(s).not.toBeNull();
    if (s === null) return;
    expect(s.timeS).toBeCloseTo(0.4, 6);
    const expectedPath = -0.5 * 9.80665 * 0.16;
    expect(s.pathM).toBeCloseTo(expectedPath, 6);
    expect(s.velocity.x).toBeCloseTo(750, 9);
  });

  it('2. Vacuum with sightHeightM 0.05: pathM at range 0 (first sample) is -0.05 within 1e-12', () => {
    const input: ShotInput = { ...base, dragEnabled: false, sightHeightM: 0.05 };
    const samples = integrate(input, 0);
    const first = samples[0];
    expect(first).toBeDefined();
    if (first === undefined) return;
    expect(first.pathM).toBeCloseTo(-0.05, 12);
  });

  it('3. Convergence with drag: pathM at 400 m with timeStepS 0.0005 and with 0.00025 differ by less than 1e-5', () => {
    const input1: ShotInput = { ...base, timeStepS: 0.0005 };
    const input2: ShotInput = { ...base, timeStepS: 0.00025 };
    const samples1 = integrate(input1, 0);
    const samples2 = integrate(input2, 0);
    const s1 = sampleAtRange(samples1, 400);
    const s2 = sampleAtRange(samples2, 400);
    expect(s1).not.toBeNull();
    expect(s2).not.toBeNull();
    if (s1 === null || s2 === null) return;
    expect(Math.abs(s1.pathM - s2.pathM)).toBeLessThan(1e-5);
  });

  it('4. Drag slows the bullet: with drag, speedMps at 400 m is below 750 and above 400; flight time to 400 m is longer than in vacuum', () => {
    const inputDrag: ShotInput = { ...base, dragEnabled: true };
    const inputVac: ShotInput = { ...base, dragEnabled: false };
    const samplesDrag = integrate(inputDrag, 0);
    const samplesVac = integrate(inputVac, 0);
    const sDrag = sampleAtRange(samplesDrag, 400);
    const sVac = sampleAtRange(samplesVac, 400);
    expect(sDrag).not.toBeNull();
    expect(sVac).not.toBeNull();
    if (sDrag === null || sVac === null) return;
    expect(sDrag.speedMps).toBeLessThan(750);
    expect(sDrag.speedMps).toBeGreaterThan(400);
    expect(sDrag.timeS).toBeGreaterThan(sVac.timeS);
  });

  it('5. Wind from 3 o\'clock at 5 m/s: position.z at 400 m is negative. Wind from 9: positive, and equal in size within 1e-9', () => {
    const input3: ShotInput = { ...base, wind: { speedMps: 5, clock: 3 } };
    const input9: ShotInput = { ...base, wind: { speedMps: 5, clock: 9 } };
    const samples3 = integrate(input3, 0);
    const samples9 = integrate(input9, 0);
    const s3 = sampleAtRange(samples3, 400);
    const s9 = sampleAtRange(samples9, 400);
    expect(s3).not.toBeNull();
    expect(s9).not.toBeNull();
    if (s3 === null || s9 === null) return;
    expect(s3.position.z).toBeLessThan(0);
    expect(s9.position.z).toBeGreaterThan(0);
    expect(Math.abs(s3.position.z)).toBeCloseTo(Math.abs(s9.position.z), 9);
  });

  it('6. airVelocity({speedMps: 5, clock: 12}) is (-5, 0, 0) within 1e-12; clock 3 gives (0, 0, -5) within 1e-12', () => {
    const v12 = airVelocity({ speedMps: 5, clock: 12 });
    expect(v12.x).toBeCloseTo(-5, 12);
    expect(v12.y).toBeCloseTo(0, 12);
    expect(v12.z).toBeCloseTo(0, 12);

    const v3 = airVelocity({ speedMps: 5, clock: 3 });
    expect(v3.x).toBeCloseTo(0, 12);
    expect(v3.y).toBeCloseTo(0, 12);
    expect(v3.z).toBeCloseTo(-5, 12);
  });

  it('7. Headwind (clock 12, 10 m/s) gives lower speedMps at 400 m than no wind; tailwind (clock 6) gives higher', () => {
    const inputHead: ShotInput = { ...base, wind: { speedMps: 10, clock: 12 } };
    const inputTail: ShotInput = { ...base, wind: { speedMps: 10, clock: 6 } };
    const inputNoWind: ShotInput = { ...base, wind: { speedMps: 0, clock: 3 } };

    const samplesHead = integrate(inputHead, 0);
    const samplesTail = integrate(inputTail, 0);
    const samplesNoWind = integrate(inputNoWind, 0);

    const sHead = sampleAtRange(samplesHead, 400);
    const sTail = sampleAtRange(samplesTail, 400);
    const sNoWind = sampleAtRange(samplesNoWind, 400);

    expect(sHead).not.toBeNull();
    expect(sTail).not.toBeNull();
    expect(sNoWind).not.toBeNull();
    if (sHead === null || sTail === null || sNoWind === null) return;

    expect(sHead.speedMps).toBeLessThan(sNoWind.speedMps);
    expect(sTail.speedMps).toBeGreaterThan(sNoWind.speedMps);
  });

  it('8. Inclined: shotAngleRad = 0.3, vacuum, zeroAngleRad 0: first sample rangeM is 0 and pathM is 0 within 1e-12; the last sample has rangeM >= 500', () => {
    const input: ShotInput = { ...base, shotAngleRad: 0.3, dragEnabled: false };
    const samples = integrate(input, 0);
    const first = samples[0];
    const last = samples[samples.length - 1];
    expect(first).toBeDefined();
    expect(last).toBeDefined();
    if (first === undefined || last === undefined) return;
    expect(first.rangeM).toBeCloseTo(0, 12);
    expect(first.pathM).toBeCloseTo(0, 12);
    expect(last.rangeM).toBeGreaterThanOrEqual(500);
  });

  it('9. sampleAtRange returns null for rangeM -1 and for rangeM 1e6', () => {
    const input: ShotInput = { ...base, dragEnabled: false };
    const samples = integrate(input, 0);
    expect(sampleAtRange(samples, -1)).toBeNull();
    expect(sampleAtRange(samples, 1e6)).toBeNull();
  });

  it('10. The last sample has rangeM >= maxRangeM and the one before it has rangeM < maxRangeM', () => {
    const input: ShotInput = { ...base, dragEnabled: false };
    const samples = integrate(input, 0);
    expect(samples.length).toBeGreaterThan(1);
    const last = samples[samples.length - 1];
    const prev = samples[samples.length - 2];
    expect(last).toBeDefined();
    expect(prev).toBeDefined();
    if (last === undefined || prev === undefined) return;
    expect(last.rangeM).toBeGreaterThanOrEqual(input.maxRangeM);
    expect(prev.rangeM).toBeLessThan(input.maxRangeM);
  });
});
