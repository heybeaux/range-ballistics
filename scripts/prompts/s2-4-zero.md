You write one pure TypeScript module and its Vitest test for a rifle ballistics solver. strict mode with noUncheckedIndexedAccess is on. No DOM. No `any`. SI units everywhere.

Files you own:
  src/solver/zero.ts
  tests/zero.test.ts

Existing code you import (do not redefine):

// src/solver/types.ts
export interface ShotInput {
  muzzleVelocityMps: number; bc: number; dragModel: 'G1' | 'G7'; bulletMassKg: number;
  bulletDiameterM: number; bulletLengthM: number | null; twistM: number; twistDirection: 'right' | 'left';
  sightHeightM: number; zeroRangeM: number; maxRangeM: number; shotAngleRad: number;
  atmosphere: { temperatureK: number; pressurePa: number; relativeHumidity: number };
  wind: { speedMps: number; clock: number }; spinDrift: boolean;
  coriolis: { latitudeRad: number; azimuthRad: number } | null;
  timeStepS?: number; dragEnabled?: boolean;
}
// src/solver/integrate.ts
export interface RawSample { timeS: number; position: {x:number;y:number;z:number}; velocity: {x:number;y:number;z:number}; speedMps: number; mach: number; rangeM: number; pathM: number }
export function integrate(input: ShotInput, zeroAngleRad: number): RawSample[];
  // flies the bullet with the bore raised zeroAngleRad above the line of sight; stops just past input.maxRangeM
export function sampleAtRange(samples: RawSample[], rangeM: number): RawSample | null;
  // interpolated sample at a line-of-sight range, or null when the bullet never got there

WHAT TO BUILD
export function findZeroAngle(input: ShotInput): number
Returns the bore elevation (radians, above the line of sight) that makes pathM equal 0 at input.zeroRangeM.
Rules:
- The zero is always computed for a LEVEL shot with NO wind and NO Coriolis, in the input's atmosphere. So build a copy of the input with
  shotAngleRad: 0, wind: { speedMps: 0, clock: 12 }, coriolis: null, maxRangeM: input.zeroRangeM + 1. Keep every other field, including dragEnabled and timeStepS.
- f(angle) = pathM of sampleAtRange(integrate(copy, angle), input.zeroRangeM). If that sample is null, treat f as negative (bullet fell short: need more angle).
- Bisection on angle between lo = -0.02 and hi = 0.2 radians, 60 iterations. f rises as the angle rises. Return the midpoint of the final bracket.
- If f(hi) is still negative, throw new Error('zero range is out of reach').

TESTS in tests/zero.test.ts (import { describe, it, expect } from 'vitest')
Use this base input and spread overrides onto it:
const base: ShotInput = { muzzleVelocityMps: 750, bc: 0.243, dragModel: 'G7', bulletMassKg: 0.01134, bulletDiameterM: 0.007823,
  bulletLengthM: null, twistM: 0.2794, twistDirection: 'right', sightHeightM: 0.05, zeroRangeM: 91.44, maxRangeM: 1000, shotAngleRad: 0,
  atmosphere: { temperatureK: 288.15, pressurePa: 101325, relativeHumidity: 0 }, wind: { speedMps: 0, clock: 3 },
  spinDrift: false, coriolis: null };
1. findZeroAngle(base) is 0.00138488 within 2e-5 (value from an independent solver).
2. With that angle, sampleAtRange(integrate(base, angle), 91.44) has |pathM| < 1e-6.
3. zeroRangeM 182.88 and sightHeightM 0.07: angle is 0.00214883 within 2e-5.
4. Vacuum (dragEnabled: false), sightHeightM 0, zeroRangeM 300: the angle equals 0.5 * Math.asin(9.80665 * 300 / (750 * 750)) within 1e-6.
5. Wind and slope do not change the zero: findZeroAngle({ ...base, wind: { speedMps: 10, clock: 3 }, shotAngleRad: 0.3 }) equals findZeroAngle(base) within 1e-12.
6. A longer zero needs more angle: zeroRangeM 300 gives a larger angle than zeroRangeM 100.
7. findZeroAngle({ ...base, muzzleVelocityMps: 100, zeroRangeM: 5000 }) throws.
