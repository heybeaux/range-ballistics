Write one pure TypeScript module and its Vitest test. No DOM. No `any`.

Files you own (create both, touch nothing else):
  src/planner/model.ts
  tests/planner-model.test.ts

Read first, in full: src/planner/types.ts (the fixed contract), and the header comment of src/solver/types.ts.
Also read the signatures of: `solve`, `sampleAt` in src/solver/solve.ts; `pressureAtAltitudePa` in src/solver/atmosphere.ts; `unitFor`, `format`, `correctionFor`, `clicksFor` in src/units/units.ts.

PURPOSE: the planner keeps an AppState (all SI). This module turns AppState into a solver input, and turns the solver output into what the screen shows. It never does physics itself.

EXPORTS of src/planner/model.ts

1. export function effectivePressurePa(c: Conditions): number
   pressureMode 'station' -> c.pressurePa. 'altitude' -> pressureAtAltitudePa(c.altitudeM).

2. export function toShotInput(state: AppState): ShotInput | null
   bc = state.load.bcG1 when load.dragModel is 'G1', else state.load.bcG7. If that bc is null, return null.
   Field mapping:
     muzzleVelocityMps, bulletMassKg, bulletDiameterM, bulletLengthM, dragModel  <- state.load
     twistM, twistDirection, sightHeightM, zeroRangeM                              <- state.rifle
     maxRangeM = Math.max(conditions.targetRangeM, dope.endM) + 50
     shotAngleRad <- conditions.shotAngleRad
     atmosphere = { temperatureK, pressurePa: effectivePressurePa(conditions), relativeHumidity }
     wind = { speedMps: conditions.windSpeedMps, clock: conditions.windClock }
     spinDrift <- state.spinDrift
     coriolis = null
   Do not set timeStepS or dragEnabled.

3. export function makeCorrection(offsetM: number, rangeM: number, axis: 'elevation' | 'windage', rifle: Rifle): Correction
   offsetM is where the bullet lands relative to the point of aim (elevation: negative = low; windage: negative = left).
   mil = Math.abs(correctionFor(offsetM, rangeM, 'MIL')); moa = Math.abs(correctionFor(offsetM, rangeM, 'MOA')).
   direction: if Math.abs(offsetM) < 0.0005 -> 'none'.
     elevation: offsetM < 0 -> 'up' (bullet is low, dial up); offsetM > 0 -> 'down'.
     windage:   offsetM < 0 -> 'right' (bullet is left, dial right); offsetM > 0 -> 'left'.
   clicks = clicksFor(rifle.angleUnit === 'MIL' ? mil : moa, rifle.clickValue). Always >= 0.
   Return { offsetM, mil, moa, direction, clicks }.

4. export function shotResults(state: AppState, result: SolveSuccess): ShotResults | null
   s = sampleAt(result.samples, conditions.targetRangeM). If s is null return null.
   elevation = makeCorrection(s.pathM, s.rangeM, 'elevation', rifle)
   windage   = makeCorrection(s.windageM, s.rangeM, 'windage', rifle)
   rangeM = conditions.targetRangeM; timeOfFlightS = s.timeS; velocityMps = s.speedMps; energyJ = s.energyJ; mach = s.mach
   spinDriftM = (result.stability === null || !state.spinDrift) ? null : s.spinDriftM
   stabilitySg = result.stability?.sg ?? null; stabilityStatus = result.stability?.status ?? null
   transonicRangeM, subsonicRangeM <- result
   pastTransonic = result.transonicRangeM !== null && conditions.targetRangeM > result.transonicRangeM
   velocityEstimated = !state.load.velocityMeasured
   notes = result.notes

5. export function dopeRows(state: AppState, result: SolveSuccess): DopeRow[]
   If dope.stepM <= 0 or dope.endM < dope.startM return [].
   Ranges: startM, startM + stepM, startM + 2*stepM, ... while range <= endM + 1e-6. Compute each as startM + i * stepM (do not accumulate by adding).
   For each range: s = sampleAt(result.samples, range). Skip the row if s is null.
   Row = { rangeM: range, elevation and windage via makeCorrection as in shotResults, timeOfFlightS: s.timeS, velocityMps: s.speedMps }.

6. export function estimateVelocityMps(publishedMps: number | null, testBarrelM: number | null, barrelLengthM: number, lossMpsPerM: number | null): number | null
   If publishedMps, testBarrelM, or lossMpsPerM is null return null.
   If barrelLengthM >= testBarrelM return publishedMps.
   Else return publishedMps - lossMpsPerM * (testBarrelM - barrelLengthM).

7. export function activeLoadFromLibrary(lib: LibraryLoad, rifle: Rifle, library: LoadLibrary): ActiveLoad
   dragModel = 'G7' when lib.bcG7.value !== null, else 'G1'.
   estimate = estimateVelocityMps(lib.publishedVelocityMps.value, lib.testBarrelM, rifle.barrelLengthM, library.velocityLossMpsPerM.value)
   muzzleVelocityMps = estimate ?? lib.publishedVelocityMps.value ?? 0
   velocityMeasured = false; libraryId = lib.id; name = lib.name
   bulletMassKg, bulletDiameterM copied; bulletLengthM = lib.bulletLengthM.value; bcG1 = lib.bcG1.value; bcG7 = lib.bcG7.value
   origin = { bulletLengthM: 'library', bcG1: 'library', bcG7: 'library' }

8. export function toCsv(state: AppState, rows: DopeRow[], dateIso: string): string
   Lines joined with '\n', no trailing newline. `sys` = state.unitSystem, `u` = state.rifle.angleUnit.
     # Range Ballistics dope card
     # Load: <load.name>
     # Muzzle velocity: <format(load.muzzleVelocityMps, 'velocity', sys)><" (estimated)" when !load.velocityMeasured>
     # Zero: <format(rifle.zeroRangeM, 'range', sys)>
     # Wind: <format(conditions.windSpeedMps, 'windSpeed', sys)> from <conditions.windClock> o'clock
     # Air: <format(conditions.temperatureK, 'temperature', sys)>, <format(effectivePressurePa(conditions), 'pressure', sys)>, <Math.round(relativeHumidity * 100)>% humidity
     # Date: <dateIso>
     # <PLANNING_NOTICE>
     range_<unitFor('range', sys).label>,elevation_<u>,elevation_dir,elevation_clicks,windage_<u>,windage_dir,windage_clicks,time_s,velocity_<unitFor('velocity', sys).label>
   then one line per row:
     <format(row.rangeM, 'range', sys, false)>,<angle of elevation in u, toFixed(2)>,<elevation.direction>,<elevation.clicks>,<angle of windage in u, toFixed(2)>,<windage.direction>,<windage.clicks>,<timeOfFlightS.toFixed(2)>,<format(row.velocityMps, 'velocity', sys, false)>
   "angle in u" = correction.mil when u is 'MIL', correction.moa when u is 'MOA'.

TESTS in tests/planner-model.test.ts. Start the file with this fixture, unchanged:

```ts
import { describe, it, expect } from 'vitest';
import { solve } from '../src/solver/solve';
import type { SolveSuccess } from '../src/solver/types';
import type { AppState, LibraryLoad, LoadLibrary } from '../src/planner/types';
import { PLANNING_NOTICE } from '../src/planner/types';
import { effectivePressurePa, toShotInput, makeCorrection, shotResults, dopeRows, estimateVelocityMps, activeLoadFromLibrary, toCsv } from '../src/planner/model';

function testState(): AppState {
  return {
    version: 1,
    unitSystem: 'imperial',
    rifle: { name: 'Test rifle', barrelLengthM: 0.4064, twistM: 0.2794, twistDirection: 'right', twistConfirmed: false, sightHeightM: 0.05, zeroRangeM: 91.44, angleUnit: 'MIL', clickValue: 0.1 },
    load: { libraryId: null, name: 'Test 175', bulletMassKg: 0.01134, bulletDiameterM: 0.007823, bulletLengthM: null, bcG1: 0.5, bcG7: 0.243, dragModel: 'G7', muzzleVelocityMps: 750, velocityMeasured: false, origin: { bulletLengthM: 'user', bcG1: 'user', bcG7: 'user' } },
    customLoads: [],
    conditions: { targetRangeM: 548.64, windSpeedMps: 4.4704, windClock: 3, temperatureK: 288.15, pressureMode: 'station', pressurePa: 101325, altitudeM: 0, relativeHumidity: 0, shotAngleRad: 0 },
    dope: { startM: 91.44, endM: 548.64, stepM: 45.72 },
    spinDrift: false,
    targetType: 'steel',
    setupDone: true
  };
}

function solved(state: AppState): SolveSuccess {
  const input = toShotInput(state);
  if (input === null) throw new Error('no input');
  const r = solve(input);
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r;
}
```

Write exactly these tests:
 1. effectivePressurePa: station mode returns 101325; altitude mode with altitudeM 0 returns 101325 within 1; altitude mode with altitudeM 1500 returns a value between 84000 and 85000.
 2. toShotInput(testState()): bc is 0.243, dragModel 'G7', maxRangeM is 598.64 within 1e-9, wind is { speedMps: 4.4704, clock: 3 }, coriolis is null, zeroRangeM 91.44, twistM 0.2794.
 3. toShotInput with load.dragModel 'G1' uses bc 0.5. With dragModel 'G7' and bcG7 null it returns null.
 4. toShotInput in altitude mode with altitudeM 1500: atmosphere.pressurePa is between 84000 and 85000.
 5. makeCorrection(-0.5, 500, 'elevation', rifle): mil is 1.0 within 1e-4, moa is 3.4377 within 1e-3, direction 'up', clicks 10, offsetM -0.5.
 6. makeCorrection(0.5, 500, 'elevation', rifle): direction 'down', clicks 10, mil positive.
 7. makeCorrection(-0.25, 500, 'windage', rifle): direction 'right', clicks 5. With +0.25: direction 'left', clicks 5.
 8. makeCorrection(0.0001, 500, 'elevation', rifle): direction 'none', clicks 0.
 9. makeCorrection(-0.5, 500, 'elevation', { ...rifle, angleUnit: 'MOA', clickValue: 0.25 }): clicks 14.
10. shotResults(testState(), solved): not null; rangeM 548.64; elevation.direction 'up'; elevation.mil between 3 and 6; windage.direction 'right' (wind from 3 o'clock pushes the bullet left); windage.mil between 1.2 and 2.2; timeOfFlightS between 0.8 and 1.1; velocityMps between 450 and 600; spinDriftM null; stabilitySg null; velocityEstimated true.
11. shotResults with spinDrift true and load.bulletLengthM 0.0315: spinDriftM is a number > 0; stabilitySg is a number > 1.
12. shotResults: with conditions.targetRangeM 548.64 pastTransonic is false. With targetRangeM 900 and dope.endM 900, pastTransonic is true.
13. shotResults returns null when conditions.targetRangeM is 5000 (beyond the solve; build the SolveSuccess from testState(), then call shotResults with a state whose targetRangeM is 5000).
14. dopeRows(testState(), solved): 11 rows; first rangeM 91.44 within 1e-9; last rangeM 548.64 within 1e-6; elevation.mil strictly increases from row 2 to row 11; first row elevation.clicks is 0.
15. dopeRows with stepM 0 returns []; with endM < startM returns [].
16. estimateVelocityMps(800, 0.6096, 0.4064, 250) is 749.2 within 1e-9. With barrelLengthM 0.7 it is 800. With testBarrelM null it is null. With lossMpsPerM null it is null. With publishedMps null it is null.
17. activeLoadFromLibrary: build a LibraryLoad `lib` with id 'x', name 'X', bulletMassKg 0.0109, bulletDiameterM 0.007823, bulletLengthM {value: null, sourceUrl: null, readOn: null}, bcG1 {value: 0.462, sourceUrl: 'https://example.com', readOn: '2026-11-10'}, bcG7 {value: null, sourceUrl: null, readOn: null}, publishedVelocityMps {value: 800, sourceUrl: 'https://example.com', readOn: '2026-11-10'}, testBarrelM 0.6096, note null; and a LoadLibrary with loads [lib], velocityLossMpsPerM {value: 250, sourceUrl: 'https://example.com', readOn: '2026-11-10'}, velocityLossNote ''. Result: dragModel 'G1', muzzleVelocityMps 749.2 within 1e-9, velocityMeasured false, libraryId 'x', bcG7 null, origin.bcG1 'library'.
18. activeLoadFromLibrary with bcG7.value 0.224: dragModel 'G7'. With testBarrelM null: muzzleVelocityMps 800.
19. toCsv(testState(), dopeRows(...), '2026-11-10'): split on '\n'. Line 0 is '# Range Ballistics dope card'. Some line equals '# ' + PLANNING_NOTICE. Some line contains 'Muzzle velocity:' and '(estimated)'. Some line is '# Date: 2026-11-10'. The header line starts with 'range_yd,elevation_MIL,' and ends with 'velocity_fps'. There are exactly 11 lines that do not start with '#' and are not the header; the first of them starts with '100,' and the last starts with '600,'. Every one of those 11 lines has exactly 9 comma-separated fields.
20. toCsv with load.velocityMeasured true: no line contains '(estimated)'.

If a test fails, check your code against this task first. Do not edit any file you do not own. If you think the task itself is wrong, leave the test failing and say which and why.

Finish by running `npm run typecheck` and `npm test`. Reply with the test count and anything you left failing.
