The planner contract changed (src/planner/types.ts). Update the input fields module and its tests. Modules after this one (panels, view, setup, main) are still on the old contract and will not typecheck yet; that is expected and NOT your job here.

Files you own (edit only these):
  src/planner/fields.ts
  tests/planner-fields.test.ts

Read first, in full: src/planner/types.ts, src/planner/fields.ts, tests/planner-fields.test.ts, tests/helpers/fixtures.ts, and the exported signatures of src/planner/model.ts and src/planner/storage.ts (both already updated: use `library`, `cartridgeById`, `velocityForBarrel`, `clampMagnification`, `defaultState`).

CHANGES TO src/planner/fields.ts

1. FieldDef.kind gains 'text': a plain text input whose value is stored as a string. Group gains 'scope'.
   GROUP_TITLES.scope = 'Your scope'. formHtml group order: shot, air, load, rifle, scope, table, display.

2. New rows in FIELDS (same row format as the existing ones; limits are SI unless a unit is named):
   id | group | kind | path | unit | limits | label | help
   rifleName | rifle | text | rifle.name | | | Rifle name | A name for this rifle, so you can tell your rifles apart.
       (FIRST row of the rifle group)
   barrelLength | rifle | number | rifle.barrelLengthM | unitLabel "in", scale 1 / 0.0254, decimals 1 | 0.1..1.0 | Barrel length | Measured from the bolt face to the muzzle. Shorter barrels give lower velocity.
       (second row of the rifle group; inches in both unit systems, because barrels are sold in inches)
   bulletDiameter | load | number | load.bulletDiameterM | q: smallLength, decimals 3 | 0.004..0.013 | Bullet diameter | The diameter of the bullet, not the case. 0.308 in for .308 Winchester, 0.224 in for .223 and 5.56.
       (right after bulletMass)
   bcRA4 | load | number | load.bcRA4 | decimals 3, nullable | 0.05..1.2 | RA4 BC | Ballistic coefficient against the RA4 rimfire shape. Eley publishes this for .22 Long Rifle.
       (right after bcG1)
   availableElevation | scope | number | rifle.scope.availableElevation | decimals 1 | 1..60 | Elevation you can dial | How far the elevation turret turns up from your zero before it stops, in your scope's unit. It depends on your mount and your zero.
   magMin | scope | number | rifle.scope.magMin | unitLabel "x", decimals 1 | 1..60 | Lowest magnification | The low end of the zoom range.
   magMax | scope | number | rifle.scope.magMax | unitLabel "x", decimals 1 | 1..80 | Highest magnification | The high end of the zoom range.
   focalPlane | scope | select | rifle.scope.focalPlane | options first="First focal plane (reticle grows as you zoom)", second="Second focal plane (reticle stays the same size)" | | Reticle sits in the | First focal plane reticles read true at every magnification. Second focal plane reticles read true at one magnification only.
   fovAtMin | scope | number | rifle.scope.fovAtMinRad | unitLabel "MIL across", scale 1000, decimals 1 | 0.005..0.5 | Field of view at lowest magnification | How wide the view is at the low end. To convert a figure in feet at 100 yards, multiply by 3.33.
   fovAtMax | scope | number | rifle.scope.fovAtMaxRad | unitLabel "MIL across", scale 1000, decimals 1 | 0.002..0.5 | Field of view at highest magnification | How wide the view is at the high end.
   The dragModel select gains a third option: RA4="RA4 (.22 rimfire, Eley)".
   getPath / setPath must handle 3-part paths ('rifle.scope.magMin').

3. unitLabelFor: 'availableElevation' (like 'clickValue') returns state.rifle.angleUnit.

4. fieldHtml for kind 'text': <label for="{id}">{label}</label><span class="input-row"><input type="text" id="{id}" name="{id}" value="{escaped current string}" autocomplete="off"></span>, then help and error as for other kinds.

5. formHtml: in addition to the pressure/altitude rule, skip 'magMin', 'magMax', 'focalPlane', 'fovAtMin', 'fovAtMax' when state.rifle.scope.libraryId !== null (a library scope's published figures are not editable). 'availableElevation' is always shown.

6. applyField(state, def, value): value may now be a string for kind 'text' (an empty or blank rifle name becomes 'My rifle'). Keep the existing side effects and add:
   - 'bcRA4': set load.origin.bcRA4 = 'user'.
   - 'barrelLength': when next.load.libraryId is not null and next.load.velocityMeasured is false, find the library load (library.loads) and its cartridge (cartridgeById), and v = velocityForBarrel(lib, next.rifle.barrelLengthM, cartridge).velocityMps; when v is not null set next.load.muzzleVelocityMps = v. A measured velocity is never changed.
   - 'magMin' / 'magMax': next.magnification = clampMagnification(next.magnification, next.rifle.scope).
   - 'angleUnit': when next.rifle.scope.libraryId is null, set next.rifle.scope.reticleId to 'generic-moa' for 'MOA' and 'generic-mil' for 'MIL'. Also convert next.rifle.scope.availableElevation and next.rifle.clickValue ONLY IF the unit actually changed: MIL -> MOA multiply availableElevation by 3.4377; MOA -> MIL divide by 3.4377. (Leave clickValue alone; the user sets it.)

TESTS (tests/planner-fields.test.ts)
Keep every existing test, updated only where the contract forces it: FIELDS now has 39 rows (29 + 10). Use defaultState() from storage as before.
Add:
 21. FIELDS has 39 rows with unique ids; the rifle group starts with 'rifleName' then 'barrelLength'; every path resolves in defaultState().
 22. displayValue for defaultState(): barrelLength '16.0', bulletDiameter '0.308', availableElevation '19.0', bcRA4 ''. In metric, barrelLength is still '16.0' and unitLabelFor(barrelLength) is 'in'.
 23. unitLabelFor(availableElevation, defaultState()) is 'MIL'.
 24. parseInput(barrelLength, '20', 'imperial') is ok with value 0.508 within 1e-9; '2' is not ok (below 0.1 m is 3.9 in; the message contains 'Must be between 3.9 and 39.4 in').
 25. applyField(rifleName, 'Savage') sets rifle.name 'Savage'; applyField(rifleName, '   ') sets 'My rifle'.
 26. fieldHtml(rifleName, defaultState(), undefined) contains 'type="text"', 'id="rifleName"' and the escaped rifle name as the value.
 27. Barrel length re-estimates an estimated velocity: s = selectLibraryLoad(defaultState(), 'hornady-80966') (772.0 m/s for 16 in). applyField(barrelLength, 0.508) gives muzzleVelocityMps 2700 * 0.3048 - 250.8 * (0.6096 - 0.508) within 0.05 (797.5). applyField(barrelLength, 0.6096) gives 822.96 within 0.01.
 28. Barrel length does not touch a measured velocity: same load with velocityMeasured true and muzzleVelocityMps 760; after applyField(barrelLength, 0.508) the velocity is still 760.
 29. Barrel length with a custom load (libraryId null) leaves the velocity unchanged.
 30. PMC's two barrels: a state from addProfile(loadSaved(empty storage), '556-nato', 'AR') then selectLibraryLoad(state, 'pmc-556k'): velocity 2920 * 0.3048 at 16 in; after applyField(barrelLength, 0.508) it is 3100 * 0.3048 within 0.01; after applyField(barrelLength, 0.4572) it is 3010 * 0.3048 within 0.01 (half way).
 31. applyField(bcRA4, 0.112): load.bcRA4 0.112 and origin.bcRA4 'user'.
 32. fieldHtml(dragModel, ...) contains '<option value="RA4"'.
 33. formHtml(defaultState(), {}) (a library scope): contains 7 '<fieldset'; contains '<legend>Your scope</legend>' and 'id="availableElevation"'; does not contain 'id="magMin"' or 'id="fovAtMin"'. With rifle.scope.libraryId null it contains 'id="magMin"', 'id="magMax"', 'id="focalPlane"', 'id="fovAtMin"', 'id="fovAtMax"'.
 34. applyField(magMax, 12) on a state with rifle.scope.libraryId null, magMax 25 and magnification 20: magnification becomes 12.
 35. applyField(angleUnit, 'MOA') on a generic-scope state with availableElevation 15: reticleId 'generic-moa' and availableElevation 51.57 within 0.01. Applying 'MIL' to a state already in MIL leaves availableElevation at 15. On a library-scope state the reticleId does not change.
 36. setPath(state, 'rifle.scope.magMin', 4).rifle.scope.magMin is 4 and the original is unchanged.

ACCEPTANCE (the whole project will NOT typecheck yet; check only your files)
- `npx tsc --noEmit 2>&1 | grep -E "src/planner/fields|tests/planner-fields"` prints nothing.
- `npx vitest run tests/planner-fields.test.ts` passes.
If an expectation fails and your code matches the definition, leave the test failing and report the actual value. Do not edit any other file.

Reply with the test count for your file and anything left failing.
