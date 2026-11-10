You write one pure TypeScript module and its Vitest test for a rifle ballistics solver. strict mode with noUncheckedIndexedAccess is on (array[i] is T | undefined; guard it). No DOM. No `any`. SI units.

Files you own:
  src/solver/solve.ts
  tests/solve.test.ts

Existing code you import (do not redefine):

// src/solver/types.ts
export interface Vec3 { x: number; y: number; z: number }
export interface ShotInput {
  muzzleVelocityMps: number; bc: number; dragModel: 'G1' | 'G7'; bulletMassKg: number;
  bulletDiameterM: number; bulletLengthM: number | null; twistM: number; twistDirection: 'right' | 'left';
  sightHeightM: number; zeroRangeM: number; maxRangeM: number; shotAngleRad: number;
  atmosphere: { temperatureK: number; pressurePa: number; relativeHumidity: number };
  wind: { speedMps: number; clock: number }; spinDrift: boolean;
  coriolis: { latitudeRad: number; azimuthRad: number } | null;
  timeStepS?: number; dragEnabled?: boolean;
}
export interface TrajectorySample { timeS: number; position: Vec3; velocity: Vec3; speedMps: number; mach: number; rangeM: number; pathM: number;
  windDriftM: number; spinDriftM: number; windageM: number; energyJ: number }
export interface Stability { sg: number; status: 'stable' | 'marginal' | 'unstable' }
export interface SolveError { field: string; message: string }
export interface SolveSuccess { ok: true; zeroAngleRad: number; airDensityKgM3: number; speedOfSoundMps: number; samples: TrajectorySample[];
  stability: Stability | null; transonicRangeM: number | null; subsonicRangeM: number | null; reachedMaxRange: boolean; notes: string[] }
export interface SolveFailure { ok: false; errors: SolveError[] }
export type SolveResult = SolveSuccess | SolveFailure;
// src/solver/atmosphere.ts
export function airDensity(atm: ShotInput['atmosphere']): number;
export function speedOfSound(temperatureK: number): number;
// src/solver/integrate.ts
export interface RawSample { timeS: number; position: Vec3; velocity: Vec3; speedMps: number; mach: number; rangeM: number; pathM: number }
export function integrate(input: ShotInput, zeroAngleRad: number): RawSample[];
// src/solver/zero.ts
export function findZeroAngle(input: ShotInput): number;   // throws Error when the zero range cannot be reached
// src/solver/spin.ts
export function millerStability(p: { bulletMassKg: number; bulletDiameterM: number; bulletLengthM: number; twistM: number; muzzleVelocityMps: number; atmosphere: ShotInput['atmosphere'] }): Stability;
export function spinDriftM(sg: number, timeOfFlightS: number, twistDirection: 'right' | 'left'): number;

EXPORTS of src/solver/solve.ts

1. export function validate(input: ShotInput): SolveError[]
Return one error per bad field (all of them, not only the first). `field` is the exact name below. `message` is a plain sentence that states the allowed range, for example "Muzzle velocity must be between 100 and 1500 m/s.". A value that is NaN or infinite is an error for that field.
  muzzleVelocityMps            100 to 1500
  bc                           greater than 0, up to 1.2
  bulletMassKg                 greater than 0, up to 0.1
  bulletDiameterM              greater than 0, up to 0.02
  bulletLengthM                null is valid; otherwise greater than 0, up to 0.1
  twistM                       0.1 to 1
  sightHeightM                 0 to 0.2
  zeroRangeM                   10 to 1000
  maxRangeM                    greater than 0, up to 3000
  shotAngleRad                 -1.0472 to 1.0472
  atmosphere.temperatureK      213.15 to 333.15
  atmosphere.pressurePa        30000 to 110000
  atmosphere.relativeHumidity  0 to 1
  wind.speedMps                0 to 40
  wind.clock                   greater than 0, up to 12
  timeStepS                    undefined is valid; otherwise 0.00005 to 0.005
  coriolis.latitudeRad         only when coriolis is not null: -Math.PI/2 to Math.PI/2

2. export function solve(input: ShotInput): SolveResult
  a. errors = validate(input). If any: return { ok: false, errors }.
  b. zeroAngleRad = findZeroAngle(input). If it throws: return { ok: false, errors: [{ field: 'zeroRangeM', message: 'The bullet cannot reach the zero range with these inputs.' }] }.
  c. raw = integrate(input, zeroAngleRad).
  d. stability = input.bulletLengthM === null ? null : millerStability({ ...the six fields from input, bulletLengthM: input.bulletLengthM }).
  e. For each raw sample build a TrajectorySample: copy the raw fields; windDriftM = position.z;
     spinDriftM = (input.spinDrift && stability !== null) ? spinDriftM(stability.sg, timeS, input.twistDirection) : 0;
     windageM = windDriftM + spinDriftM; energyJ = 0.5 * input.bulletMassKg * speedMps * speedMps.
  f. transonicRangeM: find the first sample with mach < 1.2. If none: null. If it is the first sample: its rangeM. Otherwise interpolate linearly between the previous sample and this one to the rangeM where mach equals 1.2. subsonicRangeM: the same with 1.0. Write one helper for both.
  g. reachedMaxRange = last sample rangeM >= input.maxRangeM.
  h. notes (push in this order, only when true):
     input.spinDrift && input.bulletLengthM === null  -> 'Spin drift not available: bullet length unknown.'
     stability status 'marginal'  -> 'Stability is marginal for this twist rate. Accuracy and BC may suffer.'
     stability status 'unstable'  -> 'This bullet is not stable at this twist rate.'
     !reachedMaxRange             -> 'The bullet did not reach the requested maximum range.'
  i. airDensityKgM3 = airDensity(input.atmosphere); speedOfSoundMps = speedOfSound(input.atmosphere.temperatureK).

3. export function sampleAt(samples: TrajectorySample[], rangeM: number): TrajectorySample | null
  Linear interpolation of every numeric field (position and velocity components too) between the two neighbouring samples; rangeM in the result is the requested value. null when rangeM is below the first or above the last sample's rangeM. Binary search.

TESTS in tests/solve.test.ts (import { describe, it, expect } from 'vitest')
const base: ShotInput = { muzzleVelocityMps: 750, bc: 0.243, dragModel: 'G7', bulletMassKg: 0.01134, bulletDiameterM: 0.007823,
  bulletLengthM: null, twistM: 0.2794, twistDirection: 'right', sightHeightM: 0.05, zeroRangeM: 91.44, maxRangeM: 914.4, shotAngleRad: 0,
  atmosphere: { temperatureK: 288.15, pressurePa: 101325, relativeHumidity: 0 }, wind: { speedMps: 0, clock: 3 },
  spinDrift: false, coriolis: null };
Write a helper `ok(input)` that calls solve, throws if result.ok is false, and returns the SolveSuccess.
1. validate(base) is an empty array.
2. validate({ ...base, muzzleVelocityMps: 5 }) has exactly one error with field 'muzzleVelocityMps' and a message containing '100'.
3. Three bad fields at once (bc: 0, wind: { speedMps: -1, clock: 3 }, atmosphere: { ...base.atmosphere, pressurePa: 5 }) give exactly the fields ['atmosphere.pressurePa', 'bc', 'wind.speedMps'] when sorted.
4. NaN muzzle velocity is an error; wind clock 0 and 12.5 are errors, 12 and 0.5 are valid; bulletLengthM 0 is an error and null is valid; timeStepS 1 is an error.
5. solve with a bad field returns ok false with the same errors as validate.
6. ok(base): zeroAngleRad is 0.00138488 within 2e-5; first sample timeS 0 and energyJ equals 0.5 * 0.01134 * 750 * 750 within 1e-6; pathM at sampleAt(samples, 91.44) is 0 within 1e-5; stability is null; notes is empty; reachedMaxRange is true.
7. ok(base) at 914.4 m (use the last sample or sampleAt 914.4): pathM is -12.46 within 0.13, speedMps is 317.8 within 3.2, timeS is 1.915 within 0.02.
8. transonicRangeM is not null, subsonicRangeM is not null, transonic < subsonic, and the interpolated mach at each (sampleAt) is 1.2 and 1.0 within 0.002.
9. With maxRangeM 300: transonicRangeM and subsonicRangeM are both null.
10. spinDrift true with bulletLengthM null: every spinDriftM is 0 and notes contains 'Spin drift not available: bullet length unknown.'.
11. spinDrift true with bulletLengthM 1.24 * 0.0254: stability is not null with sg 1.947 within 0.01; at 914.4 m spinDriftM is 0.328 within 0.01 and windageM equals windDriftM + spinDriftM within 1e-12. With twistDirection 'left' the spin drift is negative.
12. spinDrift false with a bullet length: stability is not null but every spinDriftM is 0.
13. Wind from 3 o'clock at 4.4704 m/s: windDriftM at 914.4 m is -3.11 within 0.05.
14. twistM 13 * 0.0254 with bulletLengthM 1.24 * 0.0254: notes contains the 'marginal' sentence.
15. { ...base, muzzleVelocityMps: 150, zeroRangeM: 50, maxRangeM: 3000 }: ok is true, reachedMaxRange is false, notes contains 'The bullet did not reach the requested maximum range.'.
16. { ...base, muzzleVelocityMps: 100, zeroRangeM: 1000 }: ok is false with one error on field 'zeroRangeM'.
17. sampleAt returns null below the first range and above the last range.
