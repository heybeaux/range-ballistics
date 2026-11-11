Write one Vitest test file. Do not change any other file.

File you own: tests/sanity.test.ts

Read first: the header comment of src/solver/types.ts, and lines 1-31 of tests/solve.test.ts (copy its `base` input and its `ok()` helper into your file unchanged).

Imports allowed: vitest; `solve`, `sampleAt` from '../src/solver/solve'; types from '../src/solver/types'.

Facts you need:
- `ok(input).samples` is an array of TrajectorySample. `sampleAt(samples, rangeM)` returns the interpolated sample at that range, or null.
- `pathM` is height relative to the line of sight; negative = below. "Drop below the line of sight" = -pathM.
- `windDriftM` is positive to the right. Wind `clock` is where the wind comes FROM: 12 = headwind, 6 = tailwind, 3 = from the right (pushes the bullet left, so windDriftM is negative), 9 = from the left.
- base has a 91.44 m zero, 914.4 m max range, no wind.
- Write a small helper `at(result, rangeM)` that calls sampleAt and throws if it returns null.

Write exactly these tests, in one `describe('physics sanity', ...)`:

1. Past the zero, drop grows with distance: for ranges 100, 150, 200, ... 900 m (step 50), pathM at each range is strictly less than pathM at the previous range.
2. At the muzzle the bullet is one sight height below the line of sight: first sample rangeM is 0 within 1e-9 and pathM is -0.05 within 1e-9.
3. At the zero range the path is about zero: |pathM at 91.44 m| < 0.001.
4. No wind means no drift: with wind speed 0, |windDriftM at 900 m| < 1e-9.
5. A headwind or tailwind barely changes drift: with wind speed 4.4704 and clock 12, |windDriftM at 900 m| < 1e-6. Same for clock 6.
6. A full-value crosswind gives the most drift: with speed 4.4704, compute |windDriftM at 900 m| for clocks 1, 2, 3, 4, 5. Clock 3 is strictly the largest. Clock 2 is larger than clock 1. Clock 4 is larger than clock 5.
7. Crosswind direction: clock 3 gives negative windDriftM at 900 m; clock 9 gives positive; the two sizes are equal within 1e-6.
8. Drift scales with wind speed: at clock 3, |drift at 900 m| with speed 8.9408 is between 1.9 and 2.1 times the drift with speed 4.4704.
9. Denser air increases drop: with atmosphere.pressurePa 101325 the pathM at 900 m is lower (more negative) than with pressurePa 85000. Keep everything else the same.
10. Colder air increases drop: with temperatureK 258.15 the pathM at 900 m is lower (more negative) than with temperatureK 308.15, at the same pressure.
11. A faster bullet drops less: muzzleVelocityMps 800 gives a higher pathM at 900 m than 700.
12. A higher BC drops less and drifts less: bc 0.28 versus bc 0.20, with wind speed 4.4704 clock 3: pathM at 900 m is higher, and |windDriftM at 900 m| is smaller.
13. Speed falls all the way: speedMps at 100, 200, ... 900 m is strictly decreasing, and time of flight (timeS) is strictly increasing.

Build inputs with object spread, for example `{ ...base, wind: { speedMps: 4.4704, clock: 3 } }` and `{ ...base, atmosphere: { ...base.atmosphere, pressurePa: 85000 } }`.

If a test fails, first check your test against the facts above. Do NOT edit the solver. If you believe the solver is wrong, leave the test failing and say which one and why.

Finish by running `npm run typecheck` and `npm test`. Reply with the test count and any test you left failing.
