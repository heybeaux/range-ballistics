import { describe, it, expect } from 'vitest';
import {
  unitFor,
  format,
  offsetToAngle,
  angleToOffset,
  correctionFor,
  clicksFor,
  formatCorrection,
  GRAIN_KG,
  type Quantity,
  type UnitSystem,
  type AngleUnit
} from '../src/units/units';

describe('units', () => {
  const quantities: Quantity[] = ['range', 'smallLength', 'velocity', 'windSpeed', 'mass', 'temperature', 'pressure', 'energy', 'altitude', 'twist'];
  const systems: UnitSystem[] = ['imperial', 'metric'];
  const testValues = [0.5, 12.3, 288.15, 101325];

  it('round trip: fromDisplay(toDisplay(x)) equals x within 1e-9 relative', () => {
    for (const q of quantities) {
      for (const s of systems) {
        const def = unitFor(q, s);
        for (const x of testValues) {
          const display = def.toDisplay(x);
          const back = def.fromDisplay(display);
          const relError = Math.abs(back - x) / Math.max(Math.abs(x), 1e-9);
          expect(relError).toBeLessThan(1e-9);
        }
      }
    }
  });

  it('known values', () => {
    // range 91.44 m imperial -> 100
    expect(unitFor('range', 'imperial').toDisplay(91.44)).toBeCloseTo(100, 9);
    
    // velocity 800 m/s imperial -> 2624.67 within 0.01
    const vImp = unitFor('velocity', 'imperial').toDisplay(800);
    expect(Math.abs(vImp - 2624.67)).toBeLessThan(0.01);

    // mass 175 * GRAIN_KG imperial -> 175 within 1e-9
    const massKg = 175 * GRAIN_KG;
    expect(unitFor('mass', 'imperial').toDisplay(massKg)).toBeCloseTo(175, 9);

    // temperature 288.15 K imperial -> 59 within 1e-9 and metric -> 15
    expect(unitFor('temperature', 'imperial').toDisplay(288.15)).toBeCloseTo(59, 9);
    expect(unitFor('temperature', 'metric').toDisplay(288.15)).toBeCloseTo(15, 9);

    // pressure 101325 Pa imperial -> 29.921 within 0.001 and metric -> 1013.25
    const pImp = unitFor('pressure', 'imperial').toDisplay(101325);
    expect(Math.abs(pImp - 29.921)).toBeLessThan(0.001);
    expect(unitFor('pressure', 'metric').toDisplay(101325)).toBeCloseTo(1013.25, 9);

    // windSpeed 4.4704 imperial -> 10
    expect(unitFor('windSpeed', 'imperial').toDisplay(4.4704)).toBeCloseTo(10, 9);

    // energy 3000 J imperial -> 2212.7 within 0.1
    const eImp = unitFor('energy', 'imperial').toDisplay(3000);
    expect(Math.abs(eImp - 2212.7)).toBeLessThan(0.1);

    // twist 0.2794 imperial -> 11 within 1e-9
    expect(unitFor('twist', 'imperial').toDisplay(0.2794)).toBeCloseTo(11, 9);
  });

  it('format', () => {
    expect(format(91.44, 'range', 'imperial')).toBe('100 yd');
    expect(format(91.44, 'range', 'metric')).toBe('91 m');
    expect(format(0.0254, 'smallLength', 'imperial')).toBe('1.0 in');
    expect(format(-0.0001, 'smallLength', 'metric')).toBe('0.0 cm');
    expect(format(NaN, 'range', 'metric')).toBe('—');
    expect(format(288.15, 'temperature', 'imperial', false)).toBe('59');
  });

  it('offsetToAngle', () => {
    expect(offsetToAngle(0.1, 100, 'MIL')).toBeCloseTo(1.0, 5);
    expect(offsetToAngle(0.0254 * 1.047, 91.44, 'MOA')).toBeCloseTo(1.0, 3);
  });

  it('angleToOffset round trip', () => {
    const units: AngleUnit[] = ['MIL', 'MOA'];
    for (const u of units) {
      const angle = offsetToAngle(-3.2, 800, u);
      const offset = angleToOffset(angle, 800, u);
      expect(offset).toBeCloseTo(-3.2, 9);
    }
  });

  it('correctionFor', () => {
    expect(correctionFor(-0.5, 500, 'MIL')).toBeCloseTo(1.0, 5);
    expect(correctionFor(0.25, 500, 'MIL')).toBeCloseTo(-0.5, 5);
  });

  it('clicksFor', () => {
    expect(clicksFor(1.0, 0.1)).toBe(10);
    expect(clicksFor(-0.26, 0.1)).toBe(-3);
    expect(clicksFor(0.01, 0.1)).toBe(0);
    const negZeroResult = clicksFor(-0.01, 0.1);
    expect(negZeroResult).toBe(0);
    expect(Object.is(negZeroResult, -0)).toBe(false);
    expect(clicksFor(1, 0)).toBe(0);
    expect(clicksFor(2.5, 0.25)).toBe(10);
  });

  it('formatCorrection', () => {
    expect(formatCorrection(1.23, 'MIL', 'elevation')).toBe('U 1.2 MIL');
    expect(formatCorrection(-0.44, 'MIL', 'elevation')).toBe('D 0.4 MIL');
    expect(formatCorrection(0.4, 'MIL', 'windage')).toBe('R 0.4 MIL');
    expect(formatCorrection(-2.256, 'MOA', 'windage')).toBe('L 2.26 MOA');
    expect(formatCorrection(0.04, 'MIL', 'elevation')).toBe('0.0 MIL');
    expect(formatCorrection(-0.004, 'MOA', 'windage')).toBe('0.00 MOA');
  });

  it('offsetToAngle with range 0', () => {
    expect(offsetToAngle(1, 0, 'MIL')).toBe(0);
  });
});
