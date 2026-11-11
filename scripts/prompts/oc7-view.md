Write one pure TypeScript module and its Vitest test. It builds HTML strings. No DOM access, no `document`. No `any`.

Files you own (create both, touch nothing else):
  src/planner/view.ts
  tests/planner-view.test.ts

Read first, in full: src/planner/types.ts. Read the signatures of `format`, `unitFor` in src/units/units.ts.

PURPOSE: the results panel, the dope table, and the printable card are plain HTML strings built from already-computed values. A new shooter must be able to read them without knowing ballistics terms.

Helpers to write (not exported unless listed):
  angle(c: Correction, unit: AngleUnit): number   -> c.mil for 'MIL', c.moa for 'MOA'
  dirWord(d): 'up' | 'down' | 'left' | 'right' | '' -> '' for 'none'

EXPORTS of src/planner/view.ts

1. export function escapeHtml(text: string): string
   Replace & < > " ' with &amp; &lt; &gt; &quot; &#39; (replace & first).

2. export function correctionHtml(title: string, c: Correction, state: AppState): string
   u = state.rifle.angleUnit. Returns:
   <div class="correction">
     <h3>{title}</h3>
     <p class="dial"><strong>{c.clicks} clicks {dirWord}</strong> ({angle in u, toFixed(2)} {u} before rounding)</p>
     <p class="equiv">{c.mil.toFixed(2)} MIL · {c.moa.toFixed(2)} MOA · {(Math.abs(c.offsetM) / 0.0254).toFixed(1)} in · {(Math.abs(c.offsetM) * 100).toFixed(1)} cm</p>
   </div>
   When c.direction is 'none', the dial line is <p class="dial"><strong>No correction</strong></p>.

3. export function resultsHtml(results: ShotResults | null, state: AppState, stale: boolean): string
   sys = state.unitSystem.
   If results is null: return <section class="results"><p class="notice">{PLANNING_NOTICE}</p><p class="empty">Fix the highlighted inputs to see a result.</p></section>
   Otherwise, in this order inside <section class="results{stale ? ' stale' : ''}">:
   a. <p class="notice">{PLANNING_NOTICE}</p>
   b. when stale: <p class="stale-mark">Out of date: fix the highlighted inputs.</p>
   c. when results.velocityEstimated: <p class="estimate-mark">Estimated velocity. Replace it with your chronograph average.</p>
   d. <h2>At {format(results.rangeM, 'range', sys)}</h2>
   e. correctionHtml('Elevation', results.elevation, state) then correctionHtml('Windage', results.windage, state)
   f. <dl class="facts"> with these <dt>/<dd> pairs:
      Time of flight       -> {timeOfFlightS.toFixed(2)} s
      Remaining velocity   -> {format(velocityMps, 'velocity', sys)} (Mach {mach.toFixed(2)})
      Remaining energy     -> {format(energyJ, 'energy', sys)}
      Spin drift           -> spinDriftM null: 'Not available' ; else {format(Math.abs(spinDriftM), 'smallLength', sys)} {spinDriftM >= 0 ? 'right' : 'left'} (included in windage)
      Stability factor     -> stabilitySg null: 'Not available (bullet length unknown)' ; else {stabilitySg.toFixed(2)} ({stabilityStatus})
      Goes transonic at    -> transonicRangeM null: 'Stays supersonic to ' + format(results.rangeM, 'range', sys) ; else format(transonicRangeM, 'range', sys)
      Goes subsonic at     -> subsonicRangeM null: 'Not within this distance' ; else format(subsonicRangeM, 'range', sys)
   g. when results.pastTransonic: <p class="warning">The target is past the transonic range. Predictions beyond it are less reliable.</p>
   h. when results.notes is not empty: <ul class="notes"> with one <li> per note (escaped).

4. export function dopeTableHtml(rows: DopeRow[], state: AppState): string
   u = state.rifle.angleUnit, sys = state.unitSystem.
   <table class="dope"><thead><tr>
     <th>Distance ({unitFor('range', sys).label})</th><th>Elevation ({u})</th><th>Clicks</th><th>Windage ({u})</th><th>Clicks</th><th>Time (s)</th><th>Velocity ({unitFor('velocity', sys).label})</th>
   </tr></thead><tbody> one <tr> per row:
     <td>{format(row.rangeM, 'range', sys, false)}</td>
     <td>{angle(elevation).toFixed(1)} {dirWord(elevation.direction)}</td>
     <td>{elevation.clicks}</td>
     <td>{angle(windage).toFixed(1)} {dirWord(windage.direction)}</td>
     <td>{windage.clicks}</td>
     <td>{timeOfFlightS.toFixed(2)}</td>
     <td>{format(row.velocityMps, 'velocity', sys, false)}</td>
   </tbody></table>
   Trim the cell text (no trailing space when the direction word is '').
   If rows is empty return <p class="empty">No rows. Check the start, end, and step distances.</p>

5. export function cardHeaderLines(state: AppState, dateIso: string): string[]
   sys = state.unitSystem. Returns exactly these strings (not escaped):
     state.load.name
     `Muzzle velocity ${format(load.muzzleVelocityMps, 'velocity', sys)}${load.velocityMeasured ? '' : ' (estimated velocity)'}`
     `Zero ${format(rifle.zeroRangeM, 'range', sys)}`
     `Wind ${format(conditions.windSpeedMps, 'windSpeed', sys)} from ${conditions.windClock} o'clock`
     `${format(conditions.temperatureK, 'temperature', sys)}, ${Math.round(conditions.relativeHumidity * 100)}% humidity`
     dateIso

6. export function printCardHtml(rows: DopeRow[], state: AppState, dateIso: string): string
   <div class="print-card"><h2>{escaped state.rifle.name}</h2>
   one <p class="card-line">{escaped line}</p> per cardHeaderLines line,
   then dopeTableHtml(rows, state),
   then <p class="notice">{PLANNING_NOTICE}</p></div>

Every piece of text that comes from state or from results.notes must go through escapeHtml.

TESTS in tests/planner-view.test.ts. Build the inputs with real functions (copy unchanged):

```ts
import { describe, it, expect } from 'vitest';
import { solve } from '../src/solver/solve';
import type { AppState, ShotResults, DopeRow } from '../src/planner/types';
import { PLANNING_NOTICE } from '../src/planner/types';
import { toShotInput, shotResults, dopeRows } from '../src/planner/model';
import { defaultState } from '../src/planner/storage';
import { escapeHtml, correctionHtml, resultsHtml, dopeTableHtml, cardHeaderLines, printCardHtml } from '../src/planner/view';

function compute(state: AppState): { results: ShotResults; rows: DopeRow[] } {
  const input = toShotInput(state);
  if (input === null) throw new Error('no input');
  const solved = solve(input);
  if (!solved.ok) throw new Error(JSON.stringify(solved.errors));
  const results = shotResults(state, solved);
  if (results === null) throw new Error('no results');
  return { results, rows: dopeRows(state, solved) };
}
```

Write exactly these tests:
 1. escapeHtml('<a href="x">Tom & \'Jo\'</a>') is '&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jo&#39;&lt;/a&gt;'.
 2. correctionHtml('Elevation', { offsetM: -0.5, mil: 1.0, moa: 3.4377, direction: 'up', clicks: 10 }, defaultState()) contains '<h3>Elevation</h3>', '10 clicks up', '1.00 MIL', '3.44 MOA', '19.7 in', '50.0 cm'.
 3. correctionHtml with direction 'none' and clicks 0 contains 'No correction' and does not contain 'clicks'.
 4. resultsHtml(null, defaultState(), false) contains PLANNING_NOTICE and 'Fix the highlighted inputs'.
 5. resultsHtml(results, state, false) for defaultState(): contains PLANNING_NOTICE; contains 'At 300 yd'; contains 'Estimated velocity'; contains '<h3>Elevation</h3>' and '<h3>Windage</h3>'; contains 'Time of flight'; contains 'Stays supersonic to 300 yd'; does not contain 'Out of date'; does not contain 'class="warning"'.
 6. The notice comes first: in the string from test 5, indexOf(PLANNING_NOTICE) is less than indexOf('<h2>').
 7. resultsHtml(results, state, true) contains 'class="results stale"' and 'Out of date'.
 8. With state.load.velocityMeasured true (recompute), the HTML does not contain 'Estimated velocity'.
 9. With conditions.targetRangeM 900 and dope.endM 900 (recompute): contains 'class="warning"' and 'Goes transonic at'; does not contain 'Stays supersonic'.
10. In metric (state.unitSystem 'metric', recompute): contains 'At 274 m' and 'm/s'.
11. A note is escaped: resultsHtml({ ...results, notes: ['a <b> note'] }, state, false) contains 'a &lt;b&gt; note'.
12. dopeTableHtml(rows, state) for defaultState(): contains exactly 11 '<tr>' inside the tbody (count occurrences of '<tr>' in the whole string: 12, one of them the header); contains '<th>Distance (yd)</th>' and '<th>Elevation (MIL)</th>'; contains '<td>100</td>' and '<td>600</td>'.
13. dopeTableHtml([], state) contains 'No rows'.
14. cardHeaderLines(defaultState(), '2026-11-10'): length 6; line 0 is the load name; line 1 contains '2650 fps' and '(estimated velocity)'; line 2 is 'Zero 100 yd'; line 3 is "Wind 5 mph from 3 o'clock"; line 5 is '2026-11-10'.
15. printCardHtml(rows, state, '2026-11-10') contains 'class="print-card"', PLANNING_NOTICE, '(estimated velocity)', '<table class="dope">', and '2026-11-10'.

If a test fails, check your code against this task first. Do not edit any file you do not own. If you think the task itself is wrong, leave the test failing and say which and why.

Finish by running `npm run typecheck` and `npm test`. Reply with the test count and anything you left failing.
