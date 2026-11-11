The planner contract changed (src/planner/types.ts). Update the results and dope-table views and their tests. Modules after this one (setup, main, scene) are still on the old contract and will not typecheck yet; that is NOT your job here.

Files you own (edit only these):
  src/planner/view.ts
  tests/planner-view.test.ts

Read first, in full: src/planner/types.ts (Correction.beyondDial, Correction.holdRemaining, ShotResults.muzzleRegime), src/planner/view.ts, tests/planner-view.test.ts, tests/helpers/fixtures.ts, and the exported signatures of src/planner/model.ts and src/planner/storage.ts.

CHANGES TO src/planner/view.ts

1. correctionHtml(title, c, state): when c.beyondDial is true, add after the .clicks line:
   <p class="warning dial-limit">Your scope dials {state.rifle.scope.availableElevation.toFixed(1)} {u} up from zero. Dial all of it and hold the remaining {c.holdRemaining.toFixed(1)} {u}.</p>

2. resultsHtml: the two "Goes transonic at" / "Goes subsonic at" rows now depend on results.muzzleRegime:
   - 'supersonic': exactly as now.
   - 'transonic':
       Speed range        -> Starts in the transonic range (between Mach 1.0 and 1.2 at the muzzle)
       Goes subsonic at   -> subsonicRangeM null: 'Not within this distance' ; else format(subsonicRangeM, 'range', sys)
     and no "Goes transonic at" row.
   - 'subsonic':
       Speed range        -> Subsonic from the muzzle
     and neither of the other two rows.
   The pastTransonic warning paragraph is unchanged (it is already false for transonic and subsonic loads).
   For 'transonic' add, after the facts list: <p class="regime-note">This load starts just above the speed of sound and drops through it early in flight. Predictions for it are less exact than for a load that stays subsonic or stays well supersonic.</p>

3. dopeTableHtml: a row whose elevation.beyondDial is true gets the class "beyond" (a row can have both: class="current beyond"). Its elevation clicks cell shows the number followed by an asterisk, for example <td>214*</td>. When at least one row is beyond the dial, add after the table: <p class="dope-note">* More than your scope can dial ({available.toFixed(1)} {u}). Dial all of it and hold the rest.</p>

4. cardHeaderLines: unchanged. printCardHtml: unchanged (it already shows the rifle name and uses dopeTableHtml, so the note prints too).

5. windClockSvg: unchanged.

TESTS (tests/planner-view.test.ts)
Keep the existing tests; they should still pass with defaultState() unchanged in substance. Add:
 18. correctionHtml with { offsetM: -10, mil: 20, moa: 68.75, direction: 'up', clicks: 200, beyondDial: true, holdRemaining: 1 } and defaultState(): contains 'class="warning dial-limit"', 'Your scope dials 19.0 MIL up from zero', 'hold the remaining 1.0 MIL'. With beyondDial false the output does not contain 'dial-limit'.
 19. Existing Correction literals in the tests gain beyondDial: false, holdRemaining: 0.
 20. Subsonic load: rimfire = activeState(addProfile(loadSaved(emptyStorage), '22-lr', 'Rimfire')) (CCI Standard Velocity, 50 yd zero and target); set conditions.targetRangeM to 91.44 and compute. resultsHtml contains 'At 100 yd', 'Subsonic from the muzzle'; does not contain 'Goes transonic at', 'Goes subsonic at', 'Stays supersonic', or 'class="warning"'.
 21. Transonic start: the same rifle with selectLibraryLoad(rimfire, 'cci-30') (1235 fps): resultsHtml contains 'Starts in the transonic range', 'Goes subsonic at', 'class="regime-note"'; does not contain 'Goes transonic at' or 'class="warning"'.
 22. Supersonic unchanged: resultsHtml for defaultState() still contains 'Stays supersonic to 300 yd' and does not contain 'Subsonic from the muzzle' or 'regime-note'.
 23. Dial limit in the table: defaultState() with rifle.scope.availableElevation 2 and dope { startM: 91.44, endM: 548.64, stepM: 45.72 }: the HTML contains 'class="beyond"' or 'class="current beyond"' at least 5 times, contains '<p class="dope-note">', and contains '2.0 MIL'. With availableElevation 19 it contains neither 'beyond' nor 'dope-note'.
 24. An asterisk marks only beyond rows: with availableElevation 2, the 100 yd row's clicks cell is '<td>0</td>' and the 600 yd row contains '48*'.
 25. printCardHtml with availableElevation 2 contains 'dope-note'.

ACCEPTANCE (the whole project will NOT typecheck yet; check only your files)
- `npx tsc --noEmit 2>&1 | grep -E "src/planner/view|tests/planner-view"` prints nothing.
- `npx vitest run tests/planner-view.test.ts` passes.
If an expectation fails and your code matches the definition, leave the test failing and report the actual value. Do not edit any other file.

Reply with the test count for your file and anything left failing.
