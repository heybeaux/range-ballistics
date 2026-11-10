import { describe, it, expect } from 'vitest';
import { makeAirModel } from '../src/solver/integrate-air';
import { airDensity, speedOfSound } from '../src/solver/atmosphere';
import type { Atmosphere } from '../src/solver/types';

const std: Atmosphere = { temperatureK: 288.15, pressurePa: 101325, relativeHumidity: 0 };

describe('makeAirModel', () => {
  it('1. At height 0: densityKgM3 equals airDensity(std) within 1e-12, speedOfSoundMps equals speedOfSound(288.15) within 1e-12, temperatureK is 288.15', () => {
    const model = makeAirModel(std);
    const air = model(0);
    expect(air.densityKgM3).toBeCloseTo(airDensity(std), 12);
    expect(air.speedOfSoundMps).toBeCloseTo(speedOfSound(288.15), 12);
    expect(air.temperatureK).toBe(288.15);
  });

  it('2. At height -347.89 the density divided by the density at 0 is 1.0338 within 0.0008', () => {
    const model = makeAirModel(std);
    const air0 = model(0);
    const airNeg = model(-347.89);
    const ratio = airNeg.densityKgM3 / air0.densityKgM3;
    expect(ratio).toBeCloseTo(1.0338, 3); // 1.0338 +/- 0.0008
  });

  it('3. At height +1000 the density ratio is 0.9075 within 0.001 and temperatureK is 281.65 within 1e-9', () => {
    const model = makeAirModel(std);
    const air0 = model(0);
    const airPos = model(1000);
    const ratio = airPos.densityKgM3 / air0.densityKgM3;
    expect(ratio).toBeCloseTo(0.9075, 3); // 0.9075 +/- 0.001
    expect(airPos.temperatureK).toBeCloseTo(281.65, 9);
  });

  it('4. Density falls as height rises: check -500 > 0 > 500 > 2000', () => {
    const model = makeAirModel(std);
    const dNeg500 = model(-500).densityKgM3;
    const d0 = model(0).densityKgM3;
    const d500 = model(500).densityKgM3;
    const d2000 = model(2000).densityKgM3;
    expect(dNeg500).toBeGreaterThan(d0);
    expect(d0).toBeGreaterThan(d500);
    expect(d500).toBeGreaterThan(d2000);
  });

  it('5. Speed of sound falls as height rises: 0 > 1000', () => {
    const model = makeAirModel(std);
    const c0 = model(0).speedOfSoundMps;
    const c1000 = model(1000).speedOfSoundMps;
    expect(c0).toBeGreaterThan(c1000);
  });

  it('6. Clamping: height 50000 gives the same result as height 11000; height -99999 gives the same as -5000', () => {
    const model = makeAirModel(std);
    const air50000 = model(50000);
    const air11000 = model(11000);
    expect(air50000.densityKgM3).toBe(air11000.densityKgM3);
    expect(air50000.speedOfSoundMps).toBe(air11000.speedOfSoundMps);
    expect(air50000.temperatureK).toBe(air11000.temperatureK);

    const airNeg99999 = model(-99999);
    const airNeg5000 = model(-5000);
    expect(airNeg99999.densityKgM3).toBe(airNeg5000.densityKgM3);
    expect(airNeg99999.speedOfSoundMps).toBe(airNeg5000.speedOfSoundMps);
    expect(airNeg99999.temperatureK).toBe(airNeg5000.temperatureK);
  });

  it('7. A humid, hot atmosphere (303.15 K, 101325 Pa, humidity 0.9) at height 0 returns airDensity of that atmosphere within 1e-12', () => {
    const hotHumid: Atmosphere = { temperatureK: 303.15, pressurePa: 101325, relativeHumidity: 0.9 };
    const model = makeAirModel(hotHumid);
    const air = model(0);
    expect(air.densityKgM3).toBeCloseTo(airDensity(hotHumid), 12);
  });
});
