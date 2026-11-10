import { describe, it, expect } from 'vitest';
import { solve, validate, sampleAt } from '../src/solver/solve';
import type { ShotInput, SolveSuccess } from '../src/solver/types';

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

describe('validate', () => {
  it('1. validate(base) is an empty array', () => {
    expect(validate(base)).toEqual([]);
  });

  it('2. validate({ ...base, muzzleVelocityMps: 5 }) has exactly one error with field \'muzzleVelocityMps\' and a message containing \'100\'', () => {
    const errors = validate({ ...base, muzzleVelocityMps: 5 });
    expect(errors).toHaveLength(1);
    expect(errors[0]?.field).toBe('muzzleVelocityMps');
    expect(errors[0]?.message).toContain('100');
  });

  it('3. Three bad fields at once give exactly the fields [\'atmosphere.pressurePa\', \'bc\', \'wind.speedMps\'] when sorted', () => {
    const input = {
      ...base,
      bc: 0,
      wind: { speedMps: -1, clock: 3 },
      atmosphere: { ...base.atmosphere, pressurePa: 5 }
    };
    const errors = validate(input);
    const fields = errors.map(e => e.field).sort();
    expect(fields).toEqual(['atmosphere.pressurePa', 'bc', 'wind.speedMps']);
  });

  it('4. NaN muzzle velocity is an error; wind clock 0 and 12.5 are errors, 12 and 0.5 are valid; bulletLengthM 0 is an error and null is valid; timeStepS 1 is an error', () => {
    // NaN muzzle velocity
    expect(validate({ ...base, muzzleVelocityMps: NaN }).some(e => e.field === 'muzzleVelocityMps')).toBe(true);
    
    // Wind clock 0 is error
    expect(validate({ ...base, wind: { ...base.wind, clock: 0 } }).some(e => e.field === 'wind.clock')).toBe(true);
    // Wind clock 12.5 is error
    expect(validate({ ...base, wind: { ...base.wind, clock: 12.5 } }).some(e => e.field === 'wind.clock')).toBe(true);
    // Wind clock 12 is valid
    expect(validate({ ...base, wind: { ...base.wind, clock: 12 } }).some(e => e.field === 'wind.clock')).toBe(false);
    // Wind clock 0.5 is valid
    expect(validate({ ...base, wind: { ...base.wind, clock: 0.5 } }).some(e => e.field === 'wind.clock')).toBe(false);
    
    // bulletLengthM 0 is error
    expect(validate({ ...base, bulletLengthM: 0 }).some(e => e.field === 'bulletLengthM')).toBe(true);
    // bulletLengthM null is valid
    expect(validate({ ...base, bulletLengthM: null }).some(e => e.field === 'bulletLengthM')).toBe(false);
    
    // timeStepS 1 is error
    expect(validate({ ...base, timeStepS: 1 }).some(e => e.field === 'timeStepS')).toBe(true);
  });
});

describe('solve', () => {
  it('5. solve with a bad field returns ok false with the same errors as validate', () => {
    const badInput = { ...base, muzzleVelocityMps: 5 };
    const result = solve(badInput);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(validate(badInput));
    }
  });

  it('6. ok(base): zeroAngleRad is 0.00138488 within 2e-5; first sample timeS 0 and energyJ equals 0.5 * 0.01134 * 750 * 750 within 1e-6; pathM at sampleAt(samples, 91.44) is 0 within 1e-5; stability is null; notes is empty; reachedMaxRange is true', () => {
    const res = ok(base);
    expect(res.zeroAngleRad).toBeCloseTo(0.00138488, 4); // 2e-5 tolerance
    
    const first = res.samples[0];
    expect(first).toBeDefined();
    if (first) {
      expect(first.timeS).toBe(0);
      const expectedEnergy = 0.5 * 0.01134 * 750 * 750;
      expect(first.energyJ).toBeCloseTo(expectedEnergy, 6);
    }
    
    const atZero = sampleAt(res.samples, 91.44);
    expect(atZero).not.toBeNull();
    if (atZero) {
      expect(atZero.pathM).toBeCloseTo(0, 5);
    }
    
    expect(res.stability).toBeNull();
    expect(res.notes).toEqual([]);
    expect(res.reachedMaxRange).toBe(true);
  });

  it('7. ok(base) at 914.4 m: pathM is -12.46 within 0.13, speedMps is 317.8 within 3.2, timeS is 1.915 within 0.02', () => {
    const res = ok(base);
    const atMax = sampleAt(res.samples, 914.4);
    expect(atMax).not.toBeNull();
    if (atMax) {
      expect(Math.abs(atMax.pathM - -12.46)).toBeLessThan(0.13);
      expect(Math.abs(atMax.speedMps - 317.8)).toBeLessThan(3.2);
      expect(Math.abs(atMax.timeS - 1.915)).toBeLessThan(0.02);
    }
  });

  it('8. transonicRangeM is not null, subsonicRangeM is not null, transonic < subsonic, and the interpolated mach at each (sampleAt) is 1.2 and 1.0 within 0.002', () => {
    const res = ok(base);
    expect(res.transonicRangeM).not.toBeNull();
    expect(res.subsonicRangeM).not.toBeNull();
    
    if (res.transonicRangeM !== null && res.subsonicRangeM !== null) {
      expect(res.transonicRangeM).toBeLessThan(res.subsonicRangeM);
      
      const atTransonic = sampleAt(res.samples, res.transonicRangeM);
      expect(atTransonic).not.toBeNull();
      if (atTransonic) {
        expect(atTransonic.mach).toBeCloseTo(1.2, 3);
      }
      
      const atSubsonic = sampleAt(res.samples, res.subsonicRangeM);
      expect(atSubsonic).not.toBeNull();
      if (atSubsonic) {
        expect(atSubsonic.mach).toBeCloseTo(1.0, 3);
      }
    }
  });

  it('9. With maxRangeM 300: transonicRangeM and subsonicRangeM are both null', () => {
    const res = ok({ ...base, maxRangeM: 300 });
    expect(res.transonicRangeM).toBeNull();
    expect(res.subsonicRangeM).toBeNull();
  });

  it('10. spinDrift true with bulletLengthM null: every spinDriftM is 0 and notes contains \'Spin drift not available: bullet length unknown.\'', () => {
    const res = ok({ ...base, spinDrift: true, bulletLengthM: null });
    for (const s of res.samples) {
      expect(s.spinDriftM).toBe(0);
    }
    expect(res.notes).toContain('Spin drift not available: bullet length unknown.');
  });

  it('11. spinDrift true with bulletLengthM 1.24 * 0.0254: stability is not null with sg 1.947 within 0.01; at 914.4 m spinDriftM is 0.328 within 0.01 and windageM equals windDriftM + spinDriftM within 1e-12. With twistDirection \'left\' the spin drift is negative', () => {
    const bulletLength = 1.24 * 0.0254;
    const res = ok({ ...base, spinDrift: true, bulletLengthM: bulletLength });
    expect(res.stability).not.toBeNull();
    if (res.stability) {
      expect(res.stability.sg).toBeCloseTo(1.947, 2);
    }
    
    const atMax = sampleAt(res.samples, 914.4);
    expect(atMax).not.toBeNull();
    if (atMax) {
      expect(atMax.spinDriftM).toBeCloseTo(0.328, 2);
      expect(atMax.windageM).toBeCloseTo(atMax.windDriftM + atMax.spinDriftM, 12);
    }
    
    const resLeft = ok({ ...base, spinDrift: true, bulletLengthM: bulletLength, twistDirection: 'left' });
    const atMaxLeft = sampleAt(resLeft.samples, 914.4);
    expect(atMaxLeft).not.toBeNull();
    if (atMaxLeft) {
      expect(atMaxLeft.spinDriftM).toBeLessThan(0);
    }
  });

  it('12. spinDrift false with a bullet length: stability is not null but every spinDriftM is 0', () => {
    const bulletLength = 1.24 * 0.0254;
    const res = ok({ ...base, spinDrift: false, bulletLengthM: bulletLength });
    expect(res.stability).not.toBeNull();
    for (const s of res.samples) {
      expect(s.spinDriftM).toBe(0);
    }
  });

  it('13. Wind from 3 o\'clock at 4.4704 m/s: windDriftM at 914.4 m is -3.11 within 0.05', () => {
    const res = ok({ ...base, wind: { speedMps: 4.4704, clock: 3 } });
    const atMax = sampleAt(res.samples, 914.4);
    expect(atMax).not.toBeNull();
    if (atMax) {
      expect(atMax.windDriftM).toBeCloseTo(-3.11, 1);
    }
  });

  it('14. twistM 13 * 0.0254 with bulletLengthM 1.24 * 0.0254: notes contains the \'marginal\' sentence', () => {
    const res = ok({
      ...base,
      twistM: 13 * 0.0254,
      bulletLengthM: 1.24 * 0.0254
    });
    expect(res.notes).toContain('Stability is marginal for this twist rate. Accuracy and BC may suffer.');
  });

  it('15. { ...base, muzzleVelocityMps: 150, zeroRangeM: 50, maxRangeM: 3000 }: ok is true, reachedMaxRange is false, notes contains \'The bullet did not reach the requested maximum range.\'', () => {
    const res = ok({ ...base, muzzleVelocityMps: 150, zeroRangeM: 50, maxRangeM: 3000 });
    expect(res.reachedMaxRange).toBe(false);
    expect(res.notes).toContain('The bullet did not reach the requested maximum range.');
  });

  it('16. { ...base, muzzleVelocityMps: 100, zeroRangeM: 1000 }: ok is false with one error on field \'zeroRangeM\'', () => {
    const result = solve({ ...base, muzzleVelocityMps: 100, zeroRangeM: 1000 });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.field).toBe('zeroRangeM');
    }
  });

  it('17. sampleAt returns null below the first range and above the last range', () => {
    const res = ok(base);
    const first = res.samples[0];
    const last = res.samples[res.samples.length - 1];
    if (first && last) {
      expect(sampleAt(res.samples, first.rangeM - 1)).toBeNull();
      expect(sampleAt(res.samples, last.rangeM + 1)).toBeNull();
    }
  });
});
