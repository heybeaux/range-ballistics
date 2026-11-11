Write one pure TypeScript module and its Vitest test. No DOM. No three.js import. No `any`.

Files you own (create both, touch nothing else):
  src/scene/geometry.ts
  tests/scene-geometry.test.ts

Read first, in full: src/scene/types.ts (the fixed contract) and the header comment of src/solver/types.ts.
Also read the signature of `sampleAt` in src/solver/solve.ts and `unitFor` in src/units/units.ts.

PURPOSE: the 3D scene draws what the solver computed. This module holds every piece of scene maths so it can be tested without a browser. It never does physics.

Frame: x = downrange, y = up, z = shooter's right, origin at the muzzle, metres.
Line of sight (LOS) for shot angle theta: u = (cos theta, sin theta, 0), n = (-sin theta, cos theta, 0), LOS origin o = sightHeightM * n.

EXPORTS of src/scene/geometry.ts

1. export function losPoint(rangeM: number, shotAngleRad: number, sightHeightM: number): Vec3
   The point on the line of sight at that range: o + rangeM * u.

2. export function displayPoint(sample: TrajectorySample, shotAngleRad: number, sightHeightM: number, exaggeration: number): Vec3
   Where to draw the bullet: losPoint(sample.rangeM) + exaggeration * sample.pathM * n + (0, 0, exaggeration * sample.windageM).
   (Use windageM, not position.z, so the picture matches the windage number in the panel.)

3. export function trimToRange(samples: TrajectorySample[], targetRangeM: number): TrajectorySample[]
   All samples with rangeM < targetRangeM, in order, followed by one last sample = sampleAt(samples, targetRangeM) when that is not null.
   If sampleAt returns null (target beyond the solve), return a copy of all samples.

4. export function regimeOf(mach: number): FlightRegime
   mach >= 1.2 -> 'supersonic'; mach >= 1.0 -> 'transonic'; else 'subsonic'.

5. export function pathRuns(samples: TrajectorySample[], shotAngleRad: number, sightHeightM: number, exaggeration: number): PathRun[]
   Walk the samples in order. Start a run with the first sample's regime. For each sample: p = displayPoint(...). If its regime equals the current run's regime, push p. Otherwise push p onto the current run (so the runs join), then start a new run with that regime whose first point is p.
   Empty input -> []. Do not return runs with fewer than 2 points.

6. export function sampleAtTime(samples: TrajectorySample[], timeS: number): TrajectorySample | null
   Empty input -> null. timeS <= first.timeS -> first. timeS >= last.timeS -> last.
   Otherwise find neighbours a, b with a.timeS <= timeS <= b.timeS (binary search) and return a new sample with EVERY numeric field linearly interpolated, including position.x/y/z and velocity.x/y/z. f = (timeS - a.timeS) / (b.timeS - a.timeS).

7. export function flagPose(windSpeedMps: number, windClock: number): FlagPose
   phi = windClock * 30 degrees in radians. downwind = (-cos phi, 0, -sin phi). (Wind from 3 o'clock streams toward -z, the shooter's left.)
   liftRad = Math.min(windSpeedMps / 8.9408, 1) * (Math.PI / 2). Negative speed counts as 0.
   flutterHz = 0.5 + 0.4 * Math.max(windSpeedMps, 0).

8. export function markerRanges(targetRangeM: number, system: UnitSystem): DistanceMarker[]
   unit = unitFor('range', system). d = unit.toDisplay(targetRangeM). last = Math.max(100, Math.ceil((d - 1e-6) / 100) * 100).
   One marker at each 100, 200, ... last (display units). rangeM = unit.fromDisplay(value). label = `${value} ${unit.label}`.

9. export function cameraPose(preset: CameraPreset, targetRangeM: number, shotAngleRad: number, sightHeightM: number): CameraPose
   R = targetRangeM. T = losPoint(R, shotAngleRad, sightHeightM).
   'shooter': position (-4, sightHeightM + 0.5, 0); target T; up (0, 1, 0).
   'side':    position (R / 2, T.y / 2 + Math.max(3, R * 0.05), Math.max(30, R * 0.75)); target (R / 2, T.y / 2, 0); up (0, 1, 0).
   'top':     position (R / 2, T.y / 2 + Math.max(30, R * 0.75), 0); target (R / 2, T.y / 2, 0); up (1, 0, 0).
   'reset':   position (-(R * 0.05 + 6), R * 0.08 + 3, R * 0.15 + 5); target (R / 2, T.y / 2, 0); up (0, 1, 0).

10. export function readoutAt(samples: TrajectorySample[], timeS: number, playing: boolean): Readout | null
   s = sampleAtTime(samples, timeS). null -> null. durationS = last sample's timeS. timeS in the readout = s.timeS.
   Return { timeS, durationS, rangeM: s.rangeM, speedMps: s.speedMps, pathM: s.pathM, playing }.

TESTS in tests/scene-geometry.test.ts. Get real samples like this (copy unchanged):

```ts
import { describe, it, expect } from 'vitest';
import { solve, sampleAt } from '../src/solver/solve';
import type { ShotInput, TrajectorySample } from '../src/solver/types';
import { losPoint, displayPoint, trimToRange, regimeOf, pathRuns, sampleAtTime, flagPose, markerRanges, cameraPose, readoutAt } from '../src/scene/geometry';

const base: ShotInput = {
  muzzleVelocityMps: 750, bc: 0.243, dragModel: 'G7', bulletMassKg: 0.01134, bulletDiameterM: 0.007823,
  bulletLengthM: null, twistM: 0.2794, twistDirection: 'right', sightHeightM: 0.05, zeroRangeM: 91.44,
  maxRangeM: 914.4, shotAngleRad: 0, atmosphere: { temperatureK: 288.15, pressurePa: 101325, relativeHumidity: 0 },
  wind: { speedMps: 4.4704, clock: 3 }, spinDrift: false, coriolis: null
};

function samplesFor(input: ShotInput): TrajectorySample[] {
  const r = solve(input);
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.samples;
}
```

Write exactly these tests:
 1. losPoint(100, 0, 0.05) is (100, 0.05, 0) within 1e-12. losPoint(100, Math.PI / 6, 0) is (86.60254, 50, 0) within 1e-4.
 2. displayPoint at true scale equals the solver position when there is no spin drift: for the samples of `base` at index 0, 500, and the last index, displayPoint(s, 0, 0.05, 1) equals s.position within 1e-9 on x, y, and z.
 3. displayPoint on an inclined shot: with base and shotAngleRad 0.2, for the sample at index 500, displayPoint(s, 0.2, 0.05, 1) equals s.position within 1e-9.
 4. Exaggeration 3 triples the offsets from the line of sight: for s = sampleAt(samples, 500) on `base`, p1 = displayPoint(s, 0, 0.05, 1), p3 = displayPoint(s, 0, 0.05, 3), L = losPoint(s.rangeM, 0, 0.05): (p3.y - L.y) equals 3 * (p1.y - L.y) within 1e-9, same for z, and p3.x equals p1.x within 1e-9.
 5. trimToRange(samples, 548.64): the last element has rangeM 548.64 within 1e-6; every element before it has rangeM < 548.64; length is at least 100.
 6. trimToRange(samples, 5000) has the same length as samples.
 7. regimeOf(2) 'supersonic'; regimeOf(1.2) 'supersonic'; regimeOf(1.19) 'transonic'; regimeOf(1.0) 'transonic'; regimeOf(0.99) 'subsonic'.
 8. pathRuns on trimToRange(samples, 548.64): exactly 1 run, regime 'supersonic', with the same number of points as the trimmed samples.
 9. pathRuns on all samples of { ...base, maxRangeM: 1400 }: exactly 3 runs in the order supersonic, transonic, subsonic; the last point of run 0 equals the first point of run 1 (x, y, z within 1e-12); the last point of run 1 equals the first point of run 2.
10. pathRuns([], 0, 0.05, 1) is [].
11. sampleAtTime: at -1 returns the first sample; at 1e9 returns the last sample; for a = samples[100], b = samples[101], the sample at (a.timeS + b.timeS) / 2 has rangeM = (a.rangeM + b.rangeM) / 2 within 1e-9 and position.y = (a.position.y + b.position.y) / 2 within 1e-12. sampleAtTime([], 1) is null.
12. flagPose(4.4704, 3): downwind is (0, 0, -1) within 1e-9; liftRad is Math.PI / 4 within 1e-9. flagPose(0, 3).liftRad is 0. flagPose(20, 3).liftRad is Math.PI / 2. flagPose(5, 12).downwind is (-1, 0, 0) within 1e-9. flagPose(5, 9).downwind is (0, 0, 1) within 1e-9. flagPose(10, 3).flutterHz is greater than flagPose(1, 3).flutterHz.
13. markerRanges(548.64, 'imperial'): 6 markers; first label '100 yd' with rangeM 91.44 within 1e-9; last label '600 yd'. markerRanges(600, 'metric'): 6 markers, last label '600 m'. markerRanges(50, 'metric'): 1 marker, label '100 m'. markerRanges(601, 'metric'): 7 markers.
14. cameraPose('side', 600, 0, 0.05): position is (300, 30.025, 450) within 1e-9, target (300, 0.025, 0), up (0, 1, 0). cameraPose('top', 600, 0, 0.05): position (300, 450.025, 0), up (1, 0, 0). cameraPose('shooter', 600, 0, 0.05): position (-4, 0.55, 0), target (600, 0.05, 0). cameraPose('reset', 600, 0, 0.05): position (-36, 51, 95).
15. readoutAt(samples, 0.5, true): not null; timeS 0.5 within 1e-9; durationS equals the last sample's timeS; playing true; rangeM between 300 and 400. readoutAt([], 0, false) is null.

If a test fails, check your code against this task first. Do not edit any file you do not own. If you think the task itself is wrong, leave the test failing and say which and why.

Finish by running `npm run typecheck` and `npm test`. Reply with the test count and anything you left failing.
