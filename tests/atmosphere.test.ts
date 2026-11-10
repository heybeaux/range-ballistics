import { describe, it, expect } from 'vitest';
import {
  airDensity,
  speedOfSound,
  pressureAtAltitudePa,
  saturationVaporPressurePa,
} from '../src/solver/atmosphere';

describe('atmosphere', () => {
  it('airDensity at sea-level standard conditions is ~1.225', () => {
    const rho = airDensity({ temperatureK: 288.15, pressurePa: 101325, relativeHumidity: 0 });
    expect(Math.abs(rho - 1.225)).toBeLessThanOrEqual(0.001);
  });

  it('speedOfSound at 288.15 K is ~340.3', () => {
    const a = speedOfSound(288.15);
    expect(Math.abs(a - 340.3)).toBeLessThanOrEqual(0.2);
  });

  it('pressureAtAltitudePa at 0 m and 1500 m', () => {
    expect(Math.abs(pressureAtAltitudePa(0) - 101325)).toBeLessThanOrEqual(1);
    expect(Math.abs(pressureAtAltitudePa(1500) - 84560)).toBeLessThanOrEqual(100);
  });

  it('density at 303.15 K is lower at full humidity than at zero humidity', () => {
    const dry = airDensity({ temperatureK: 303.15, pressurePa: 101325, relativeHumidity: 0 });
    const wet = airDensity({ temperatureK: 303.15, pressurePa: 101325, relativeHumidity: 1 });
    expect(wet).toBeLessThan(dry);
  });

  it('density at 263.15 K is higher than at 303.15 K (same pressure, dry)', () => {
    const cold = airDensity({ temperatureK: 263.15, pressurePa: 101325, relativeHumidity: 0 });
    const warm = airDensity({ temperatureK: 303.15, pressurePa: 101325, relativeHumidity: 0 });
    expect(cold).toBeGreaterThan(warm);
  });

  it('saturationVaporPressurePa at 293.15 K is ~2339', () => {
    const es = saturationVaporPressurePa(293.15);
    expect(Math.abs(es - 2339)).toBeLessThanOrEqual(15);
  });
});
