import { describe, it, expect } from 'vitest';
import { dragCoefficient, dragFactor, BC_LB_IN2_TO_KG_M2 } from '../src/solver/drag';
import g1 from '../src/data/g1.json';

describe('drag', () => {
  it('dragCoefficient at Mach 2.0', () => {
    expect(Math.abs(dragCoefficient('G1', 2.0) - 0.5934)).toBeLessThanOrEqual(1e-6);
    expect(Math.abs(dragCoefficient('G7', 2.0) - 0.298)).toBeLessThanOrEqual(1e-6);
  });

  it('dragCoefficient at Mach 0', () => {
    expect(Math.abs(dragCoefficient('G1', 0) - 0.2629)).toBeLessThanOrEqual(1e-6);
    expect(Math.abs(dragCoefficient('G7', 0) - 0.1198)).toBeLessThanOrEqual(1e-6);
  });

  it('clamps outside the table range', () => {
    expect(dragCoefficient('G7', 10)).toBe(dragCoefficient('G7', 5));
    expect(dragCoefficient('G1', -1)).toBe(dragCoefficient('G1', 0));
  });

  it('linear interpolation at the midpoint of the first two G1 points', () => {
    const p0 = g1.points[0];
    const p1 = g1.points[1];
    if (p0 === undefined || p1 === undefined) throw new Error('impossible: G1 table too short');
    const [m0, cd0] = p0;
    const [m1, cd1] = p1;
    if (m0 === undefined || cd0 === undefined || m1 === undefined || cd1 === undefined) {
      throw new Error('impossible: G1 table row malformed');
    }
    const mid = (m0 + m1) / 2;
    const expected = (cd0 + cd1) / 2;
    expect(Math.abs(dragCoefficient('G1', mid) - expected)).toBeLessThanOrEqual(1e-9);
  });

  it('dragFactor matches the closed-form expression', () => {
    const k = dragFactor('G7', 2.0, 0.25, 1.225);
    const expected = (Math.PI / 8) * 1.225 * 0.298 / (0.25 * BC_LB_IN2_TO_KG_M2);
    expect(Math.abs(k - expected)).toBeLessThanOrEqual(1e-12);
  });

  it('RA4 table values', () => {
    expect(Math.abs(dragCoefficient('RA4', 0) - 0.2283)).toBeLessThanOrEqual(1e-6);
    expect(Math.abs(dragCoefficient('RA4', 1) - 0.3975)).toBeLessThanOrEqual(1e-6);
    expect(Math.abs(dragCoefficient('RA4', 4) - 0.4969)).toBeLessThanOrEqual(1e-6);
  });

  it('RA4 clamps outside the table range', () => {
    expect(dragCoefficient('RA4', 9)).toBe(dragCoefficient('RA4', 4));
    expect(dragCoefficient('RA4', -1)).toBe(dragCoefficient('RA4', 0));
  });

  it('RA4 differs from G1 at Mach 0.9', () => {
    expect(dragCoefficient('RA4', 0.9)).not.toBe(dragCoefficient('G1', 0.9));
  });
});
