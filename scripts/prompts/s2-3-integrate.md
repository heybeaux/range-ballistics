You write one pure TypeScript module and its Vitest test for a rifle ballistics solver. strict mode with noUncheckedIndexedAccess is on (array[i] has type T | undefined; guard it). No DOM. No `any`. SI units everywhere.

Files you own:
  src/solver/integrate.ts
  tests/integrate.test.ts

Existing code you import (do not redefine):

// src/solver/types.ts
export type DragModel = 'G1' | 'G7';
export interface Vec3 { x: number; y: number; z: number }
export interface Atmosphere { temperatureK: number; pressurePa: number; relativeHumidity: number }
export interface Wind { speedMps: number; clock: number }
export interface ShotInput {
  muzzleVelocityMps: number; bc: number; dragModel: DragModel; bulletMassKg: number;
  bulletDiameterM: number; bulletLengthM: number | null; twistM: number; twistDirection: 'right' | 'left';
  sightHeightM: number; zeroRangeM: number; maxRangeM: number; shotAngleRad: number;
  atmosphere: Atmosphere; wind: Wind; spinDrift: boolean;
  coriolis: { latitudeRad: number; azimuthRad: number } | null;
  timeStepS?: number;      // default 0.0005
  dragEnabled?: boolean;   // default true; false = vacuum
}
// src/solver/atmosphere.ts
export const STANDARD_GRAVITY: number;                       // 9.80665
export function airDensity(atm: Atmosphere): number;         // kg/m^3
export function speedOfSound(temperatureK: number): number;  // m/s
// src/solver/drag.ts
export function dragFactor(model: DragModel, mach: number, bc: number, airDensityKgM3: number): number;
// returns k such that drag acceleration vector = -k * |vr| * vr

PHYSICS (follow exactly)
World frame, origin at the muzzle: x = horizontal downrange, y = up, z = horizontal to the shooter's right.
theta = input.shotAngleRad. Line of sight (LOS) unit vector u = (cos theta, sin theta, 0). Normal n = (-sin theta, cos theta, 0).
LOS origin o = sightHeightM * n. For bullet position p: rangeM = (p - o) . u ; pathM = (p - o) . n
Start: position (0,0,0); velocity = muzzleVelocityMps * (cos(theta + zeroAngleRad), sin(theta + zeroAngleRad), 0).
Wind: phi = clock * 30 degrees in radians. Air velocity w = -speedMps * (cos phi, 0, sin phi).
Acceleration at velocity v: vr = v - w; mach = |vr| / speedOfSound(T);
  a = (0, -STANDARD_GRAVITY, 0) - dragFactor(dragModel, mach, bc, rho) * |vr| * vr     (drag term omitted when dragEnabled === false)
rho and speed of sound are computed once from input.atmosphere.
Integrate position and velocity with classic RK4 at fixed step dt = input.timeStepS ?? 0.0005.
Ignore input.coriolis, spinDrift, twist, bullet length in this module.

EXPORTS of src/solver/integrate.ts
export interface RawSample { timeS: number; position: Vec3; velocity: Vec3; speedMps: number; mach: number; rangeM: number; pathM: number }
  // speedMps = |v| (ground speed). mach = |v - w| / speedOfSound.
export function airVelocity(wind: Wind): Vec3
export function integrate(input: ShotInput, zeroAngleRad: number): RawSample[]
  // First sample is t = 0. Push one sample per step. Stop after pushing the first sample with rangeM >= input.maxRangeM.
  // Also stop (without error) if timeS > 30, or speedMps < 30, or position.y < -2000.
export function sampleAtRange(samples: RawSample[], rangeM: number): RawSample | null
  // Linear interpolation of every numeric field (including position and velocity components) between the two
  // neighbouring samples whose rangeM bracket the requested rangeM. Return null if rangeM is below the first
  // sample's rangeM or above the last sample's rangeM. rangeM increases monotonically; use binary search.

TESTS in tests/integrate.test.ts (import { describe, it, expect } from 'vitest'; import from '../src/solver/integrate')
Use this base input and spread overrides onto it:
const base: ShotInput = { muzzleVelocityMps: 750, bc: 0.243, dragModel: 'G7', bulletMassKg: 0.01134, bulletDiameterM: 0.007823,
  bulletLengthM: null, twistM: 0.2794, twistDirection: 'right', sightHeightM: 0, zeroRangeM: 91.44, maxRangeM: 500, shotAngleRad: 0,
  atmosphere: { temperatureK: 288.15, pressurePa: 101325, relativeHumidity: 0 }, wind: { speedMps: 0, clock: 3 },
  spinDrift: false, coriolis: null };
1. Vacuum (dragEnabled: false, zeroAngleRad 0): sampleAtRange(s, 300) has timeS = 0.4 within 1e-6 and pathM = -0.5 * 9.80665 * 0.16 within 1e-6, speed x component 750 within 1e-9.
2. Vacuum with sightHeightM 0.05: pathM at range 0 (first sample) is -0.05 within 1e-12.
3. Convergence with drag: pathM at 400 m with timeStepS 0.0005 and with 0.00025 differ by less than 1e-5.
4. Drag slows the bullet: with drag, speedMps at 400 m is below 750 and above 400; flight time to 400 m is longer than in vacuum.
5. Wind from 3 o'clock at 5 m/s: position.z at 400 m is negative. Wind from 9: positive, and equal in size within 1e-9.
6. airVelocity({speedMps: 5, clock: 12}) is (-5, 0, 0) within 1e-12; clock 3 gives (0, 0, -5) within 1e-12.
7. Headwind (clock 12, 10 m/s) gives lower speedMps at 400 m than no wind; tailwind (clock 6) gives higher.
8. Inclined: shotAngleRad = 0.3, vacuum, zeroAngleRad 0: first sample rangeM is 0 and pathM is 0 within 1e-12; the last sample has rangeM >= 500.
9. sampleAtRange returns null for rangeM -1 and for rangeM 1e6.
10. The last sample has rangeM >= maxRangeM and the one before it has rangeM < maxRangeM.
