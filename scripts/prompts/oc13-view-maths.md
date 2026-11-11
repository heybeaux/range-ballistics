Add five pure functions to the scene geometry module, with tests. No DOM, no three.js, no `any`.

Files you own (edit only these):
  src/scene/geometry.ts          (append; do not change existing functions)
  tests/scene-geometry.test.ts   (append; do not change existing tests)

Read first: both files, and src/scene/types.ts.

WHY: at true scale a 600 yd range is unreadable on a screen (a 1 m high arc over 550 m is a flat line, and the target is half a pixel). The scene is getting a zoomed "scope view" with a MIL reticle, and side / top views that scale the drop up by a labelled factor. These functions are the maths for that.

EXPORTS to add

1. export function scopeFovRad(samples: TrajectorySample[], targetRangeM: number): number
   Vertical field of view for the scope view, wide enough to show the uncorrected impact.
   t = sampleAt(samples, targetRangeM). If t is null or t.rangeM <= 0 return 0.024.
   elev = Math.abs(Math.atan2(t.pathM, t.rangeM)); wind = Math.abs(Math.atan2(t.windageM, t.rangeM)).
   Return Math.min(0.12, Math.max(0.024, 3.2 * Math.max(elev, wind))).

2. export const NICE_SCALES: number[] = [1, 2, 5, 10, 20, 50, 100, 200];

3. export function autoExaggeration(samples: TrajectorySample[], targetRangeM: number, axis: 'path' | 'windage'): number
   A scale that makes the largest offset from the line of sight about 12% of the range.
   m = the largest Math.abs(s.pathM) (axis 'path') or Math.abs(s.windageM) (axis 'windage') over all samples with s.rangeM <= targetRangeM.
   If samples is empty, m < 1e-6, or targetRangeM <= 0, return 1.
   raw = (0.12 * targetRangeM) / m. Return the largest value in NICE_SCALES that is <= raw; if raw < 1 return 1.

4. export function pxPerMil(fovRad: number, heightPx: number): number
   heightPx / (2 * Math.tan(fovRad / 2) * 1000). If fovRad <= 0 return 0.

5. export function visibleLabels(points: Array<{ x: number; y: number; depth: number }>, minDx: number, minDy: number): boolean[]
   Decides which screen labels to show so they do not pile up. points[i] is the label's screen position in pixels and its distance from the camera.
   Visit the points in order of depth, nearest first. Show a point unless an already-shown point is within minDx horizontally AND within minDy vertically (Math.abs(dx) < minDx && Math.abs(dy) < minDy).
   Return a boolean[] in the ORIGINAL order of `points`.

6. export function dotScale(distanceM: number, fovRad: number, k: number): number
   distanceM * k * (Math.tan(fovRad / 2) / Math.tan((50 * Math.PI / 180) / 2)). (k was tuned for a 50 degree camera; this keeps dots the same size on screen at any zoom.)

TESTS to add (use the existing `base` and `samplesFor`; `base` has wind 4.4704 m/s from 3 o'clock, at 548.64 m its pathM is -2.9648 and windageM is -0.9169)

 22. scopeFovRad(samples, 548.64) is 0.024 within 1e-12 (3.2 * 5.40 mil = 17.3 mil, below the floor). scopeFovRad(samples, 900) is 3.2 * Math.atan2(11.8861, 900) within 1e-4. scopeFovRad([], 500) is 0.024. For every range in [100, 300, 500, 700, 900] the result is >= 0.024 and <= 0.12.
 23. NICE_SCALES is [1, 2, 5, 10, 20, 50, 100, 200].
 24. autoExaggeration(dialSamples(trimToRange(samples, 548.64), 548.64), 548.64, 'path') is 50. (Dialled arc is about 1.1 m high; 0.12 * 548.64 / 1.1 is about 60.)
 25. autoExaggeration(trimToRange(samples, 548.64), 548.64, 'path') is 20 (largest offset 2.96 m; raw about 22). With axis 'windage' it is 50 (largest offset 0.92 m; raw about 72).
 26. autoExaggeration([], 500, 'path') is 1. With samples from { ...base, wind: { speedMps: 0, clock: 3 } } and axis 'windage' it is 1.
 27. pxPerMil(0.024, 480) is 20 within 0.01. pxPerMil(0, 480) is 0.
 28. visibleLabels([{x:100,y:100,depth:10},{x:110,y:104,depth:20},{x:300,y:100,depth:30}], 60, 24) is [true, false, true].
 29. visibleLabels keeps the nearest when the input is not sorted: [{x:100,y:100,depth:50},{x:105,y:100,depth:5}] with (60, 24) gives [false, true]. visibleLabels([], 60, 24) is [].
 30. visibleLabels: points close in x but far apart in y are both shown: [{x:100,y:100,depth:1},{x:100,y:200,depth:2}] gives [true, true].
 31. dotScale(100, 50 * Math.PI / 180, 0.012) is 1.2 within 1e-9. dotScale(100, 0.024, 0.012) is less than 0.05.

If one of the numeric expectations in tests 22, 24 or 25 fails, print the actual value, check your code against the definition, and if your code matches the definition leave the test failing and report the actual value. Do not change the definition to fit.

Finish by running `npm run typecheck` and `npm test`. Reply with the test count and anything you left failing.
