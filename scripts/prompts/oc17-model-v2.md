The planner contract changed (src/planner/types.ts). Update the planner model and its tests to match. Other modules are still on the old contract and will not typecheck yet; that is expected and is NOT your job in this task.

Files you own (edit only these):
  src/planner/model.ts
  tests/planner-model.test.ts

Read first, in full: src/planner/types.ts (new fields are described in its comments), src/planner/model.ts, tests/planner-model.test.ts, and tests/helpers/fixtures.ts (lead-owned fixtures; use them, do not edit them).

WHAT CHANGED IN THE CONTRACT (the parts that touch this module)
- DragModel is now 'G1' | 'G7' | 'RA4'. ActiveLoad has bcRA4 and origin.bcRA4. LibraryLoad has cartridgeId, bcRA4, bcModelStated, velocityByBarrel.
- LoadLibrary is now { cartridges, loads }. The barrel-length velocity figure moved from the library to each Cartridge (velocityLossMpsPerM).
- Rifle has cartridgeId and scope (ScopeProfile, with availableElevation in the rifle's angleUnit).
- Correction has beyondDial and holdRemaining.
- ShotResults has muzzleRegime, and pastTransonic has a narrower meaning.

CHANGES TO src/planner/model.ts

1. toShotInput: bc = bcG1 for 'G1', bcG7 for 'G7', bcRA4 for 'RA4' (exhaustive switch). null -> return null. Everything else unchanged.

2. makeCorrection(offsetM, rangeM, axis, rifle): add the two new fields.
   a = the correction in the rifle's unit (mil when rifle.angleUnit is 'MIL', else moa).
   beyondDial = axis === 'elevation' && direction === 'up' && a > rifle.scope.availableElevation + 1e-9.
   holdRemaining = beyondDial ? a - rifle.scope.availableElevation : 0.
   clicks is unchanged (the clicks for the full correction).

3. export function muzzleRegimeOf(mach: number): MuzzleRegime
   mach >= 1.2 'supersonic'; mach >= 1.0 'transonic'; else 'subsonic'.

4. shotResults: add muzzleRegime = muzzleRegimeOf(first sample's mach) (if result.samples is empty use 'subsonic').
   pastTransonic = muzzleRegime === 'supersonic' && result.transonicRangeM !== null && conditions.targetRangeM > result.transonicRangeM.

5. export type VelocityBasis = 'published-barrel' | 'interpolated' | 'nearest-barrel' | 'estimated' | 'published' | 'none';
   export function velocityForBarrel(lib: LibraryLoad, barrelLengthM: number, cartridge: Cartridge | undefined): { velocityMps: number | null; basis: VelocityBasis }
   In this order:
   a. lib.velocityByBarrel is not empty (it is sorted, shortest barrel first):
      - a listed barrel within 0.0127 m (half an inch) of barrelLengthM -> its velocity, basis 'published-barrel'.
      - barrelLengthM between two neighbouring listed barrels -> straight-line interpolation between them, basis 'interpolated'.
      - shorter than the shortest or longer than the longest -> the nearest listed velocity, basis 'nearest-barrel'. (No extrapolation.)
   b. lib.publishedVelocityMps.value is null -> { velocityMps: null, basis: 'none' }.
   c. est = estimateVelocityMps(published, lib.testBarrelM, barrelLengthM, cartridge?.velocityLossMpsPerM.value ?? null).
      est !== null and est !== published -> { velocityMps: est, basis: 'estimated' }.
   d. otherwise -> { velocityMps: published, basis: 'published' }.
   estimateVelocityMps itself does not change.

6. activeLoadFromLibrary(lib, rifle, library):
   cartridge = library.cartridges.find(c => c.id === lib.cartridgeId).
   muzzleVelocityMps = velocityForBarrel(lib, rifle.barrelLengthM, cartridge).velocityMps ?? 0.
   dragModel: 'G7' when lib.bcG7.value !== null; else 'G1' when lib.bcG1.value !== null; else 'RA4' when lib.bcRA4.value !== null; else 'G1'.
   Copy bcRA4 = lib.bcRA4.value. origin = { bulletLengthM: 'library', bcG1: 'library', bcG7: 'library', bcRA4: 'library' }.

7. export function clampMagnification(mag: number, scope: ScopeProfile): number
   Not a finite number -> scope.magMin. Otherwise Math.min(Math.max(mag, scope.magMin), scope.magMax).

toCsv, dopeRows, effectivePressurePa: unchanged (dopeRows gets the new Correction fields through makeCorrection).

CHANGES TO tests/planner-model.test.ts

- Delete the file's own testState() and use the fixtures: import { testState, testRifle, testLoad, testLibrary, testCartridge, src, none } from './helpers/fixtures'. Keep the local `solved()` helper.
- Keep every existing test. Update only what the contract forces:
  - where a test builds a LibraryLoad or LoadLibrary by hand, build it with testLoad({...}) and testLibrary([...]) (testLoad() already is the old test-17 load: 800 m/s, 0.6096 m test barrel, G1 0.462; testCartridge() has loss 250).
  - the old tests 17 and 18 keep their expectations (749.2 with the 250 figure; 800 when testBarrelM is null).
- Add these tests:
  21. toShotInput with load.dragModel 'RA4' and bcRA4 0.112 uses bc 0.112 and dragModel 'RA4'; with bcRA4 null it returns null.
  22. makeCorrection(-0.5, 500, 'elevation', testRifle()): beyondDial false, holdRemaining 0.
  23. makeCorrection(-10, 500, 'elevation', testRifle()) (about 20.0 MIL up, limit 19): beyondDial true; holdRemaining is 1.0 within 0.01; clicks 200.
  24. beyondDial is false for a 'down' correction of the same size (offset +10), and for windage (makeCorrection(-10, 500, 'windage', testRifle())).
  25. With rifle.scope.availableElevation 25, makeCorrection(-10, 500, 'elevation', rifle).beyondDial is false.
  26. muzzleRegimeOf(2) 'supersonic'; (1.2) 'supersonic'; (1.19) 'transonic'; (1.0) 'transonic'; (0.95) 'subsonic'.
  27. shotResults(testState(), solved).muzzleRegime is 'supersonic'.
  28. A subsonic .22 LR shot: state = testState() with load { bulletMassKg: 0.002592, bulletDiameterM: 0.0057277, bcG1: 0.138, dragModel: 'G1', muzzleVelocityMps: 329 }, rifle.zeroRangeM 45.72, rifle.twistM 0.4064, conditions.targetRangeM 91.44, dope { startM: 22.86, endM: 182.88, stepM: 22.86 }. shotResults: not null; muzzleRegime 'subsonic'; pastTransonic false; elevation.direction 'up'; elevation.mil between 1.5 and 3.0; velocityMps between 270 and 300.
  29. A load that starts transonic: same state as 28 but muzzleVelocityMps 376 and bcG1 0.130: muzzleRegime 'transonic'; pastTransonic false; subsonicRangeM is a number between 5 and 120.
  30. velocityForBarrel(testLoad(), 0.4064, testCartridge()) is { velocityMps: 749.2 within 1e-9, basis: 'estimated' }.
  31. velocityForBarrel(testLoad(), 0.4064, testCartridge({ velocityLossMpsPerM: none })) is { velocityMps: 800, basis: 'published' }. Same with cartridge undefined. Same with testLoad({ testBarrelM: null }).
  32. velocityForBarrel(testLoad({ publishedVelocityMps: none }), 0.4064, testCartridge()) is { velocityMps: null, basis: 'none' }.
  33. Two published barrels: lib = testLoad({ velocityByBarrel: [{ barrelM: 0.4064, velocityMps: 890 }, { barrelM: 0.508, velocityMps: 945 }] }).
      at 0.4064 -> 890, 'published-barrel'; at 0.41 (within half an inch) -> 890, 'published-barrel'; at 0.508 -> 945, 'published-barrel';
      at 0.4572 (half way) -> 917.5 within 1e-6, 'interpolated'; at 0.3 -> 890, 'nearest-barrel'; at 0.66 -> 945, 'nearest-barrel'.
      The cartridge loss figure is ignored when velocityByBarrel is present (pass testCartridge()).
  34. activeLoadFromLibrary(testLoad({ bcG1: none, bcRA4: src(0.112), publishedVelocityMps: none }), testRifle(), testLibrary()): dragModel 'RA4', bcRA4 0.112, muzzleVelocityMps 0, origin.bcRA4 'library'.
  35. activeLoadFromLibrary uses the load's own cartridge: with library = testLibrary([lib], [testCartridge({ id: 'other', velocityLossMpsPerM: src(999) }), testCartridge()]) the velocity is still 749.2.
  36. clampMagnification(10, scope) is 10; (1, scope) is 5; (99, scope) is 25; (NaN, scope) is 5, with scope = testRifle().scope.

ACCEPTANCE (the whole project will NOT typecheck yet; check only your files)
- `npx tsc --noEmit 2>&1 | grep -E "src/planner/model|tests/planner-model"` prints nothing.
- `npx vitest run tests/planner-model.test.ts` passes.
If an expectation above fails and your code matches the definition, leave the test failing and report the actual value. Do not edit any other file, even to make the project typecheck.

Reply with the test count for your file and anything left failing.
