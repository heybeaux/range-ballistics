Write one TypeScript module and its Vitest test. No DOM access except through the `storage` argument. No `any`.

Files you own (create both, touch nothing else):
  src/planner/storage.ts
  tests/planner-storage.test.ts

Read first, in full: src/planner/types.ts, src/planner/model.ts, src/data/rifle.json. Look at the first load in src/data/loads.json to see the shape.

Imports allowed in storage.ts: types from './types'; `activeLoadFromLibrary` from './model'; `import loadsJson from '../data/loads.json'`; `import rifleJson from '../data/rifle.json'`.

EXPORTS of src/planner/storage.ts

1. export const STORAGE_KEY = 'range-ballistics/v1';

2. export const library: LoadLibrary = loadsJson;

3. export function defaultRifle(): Rifle
   Copy these fields from rifleJson: name, barrelLengthM, twistM, twistConfirmed, sightHeightM, zeroRangeM, clickValue.
   twistDirection: 'left' when rifleJson.twistDirection === 'left', else 'right'. angleUnit: 'MOA' when rifleJson.angleUnit === 'MOA', else 'MIL'.
   (JSON strings are typed as `string`, so narrow them like this. Do not use `as`.)

4. export function defaultState(): AppState
   rifle = defaultRifle()
   first = library.loads[0]; throw new Error('load library is empty') when undefined.
   load = activeLoadFromLibrary(first, rifle, library)
   version 1; unitSystem 'imperial'; customLoads []
   conditions = { targetRangeM: 274.32, windSpeedMps: 2.2352, windClock: 3, temperatureK: 288.15, pressureMode: 'station', pressurePa: 101325, altitudeM: 0, relativeHumidity: 0.5, shotAngleRad: 0 }
   dope = { startM: 91.44, endM: 548.64, stepM: 45.72 }
   spinDrift true; targetType 'steel'; setupDone false

5. export function isAppState(x: unknown): x is AppState
   True only when x is a non-null object with: version === 1; unitSystem 'imperial' or 'metric'; rifle, load, conditions, dope are non-null objects; customLoads is an array; spinDrift and setupDone are booleans; targetType 'steel' or 'paper'; and these are finite numbers: rifle.twistM, rifle.sightHeightM, rifle.zeroRangeM, rifle.clickValue, rifle.barrelLengthM, load.muzzleVelocityMps, load.bulletMassKg, load.bulletDiameterM, conditions.targetRangeM, conditions.windSpeedMps, conditions.windClock, conditions.temperatureK, conditions.pressurePa, conditions.altitudeM, conditions.relativeHumidity, conditions.shotAngleRad, dope.startM, dope.endM, dope.stepM.
   Write a small helper `isRecord(v: unknown): v is Record<string, unknown>` and a helper `num(v: unknown): boolean` (typeof number and Number.isFinite).

6. export function loadState(storage: Pick<Storage, 'getItem'>): AppState
   raw = storage.getItem(STORAGE_KEY). null -> defaultState(). JSON.parse inside try/catch; on a throw -> defaultState(). If !isAppState(parsed) -> defaultState(). Else return parsed.

7. export function saveState(storage: Pick<Storage, 'setItem'>, state: AppState): void
   storage.setItem(STORAGE_KEY, JSON.stringify(state)) inside try/catch (a full or blocked storage must not crash the app).

8. export function selectLibraryLoad(state: AppState, id: string): AppState
   Find the library load with that id. Not found -> return state unchanged (same object). Found -> return { ...state, load: activeLoadFromLibrary(found, state.rifle, library) }.

9. export function saveCustomLoad(state: AppState): AppState
   copy = { ...state.load, libraryId: null, origin: { ...state.load.origin } }.
   Return { ...state, customLoads: [...state.customLoads.filter(l => l.name !== copy.name), copy] }.

10. export function selectCustomLoad(state: AppState, name: string): AppState
   Find the custom load with that name. Not found -> return state unchanged. Found -> return { ...state, load: { ...found, origin: { ...found.origin } } }.

TESTS in tests/planner-storage.test.ts. Use this fake storage (copy unchanged):

```ts
function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (k: string): string | null => data.get(k) ?? null,
    setItem: (k: string, v: string): void => { data.set(k, v); },
    data
  };
}
```

Write exactly these tests:
 1. defaultState(): isAppState is true; rifle.angleUnit 'MIL'; rifle.clickValue 0.1; rifle.twistM 0.2794 within 1e-6; rifle.twistConfirmed false; rifle.barrelLengthM 0.4064 within 1e-6; load.libraryId 'federal-gm308m'; load.dragModel 'G7'; load.bcG7 0.224; load.velocityMeasured false; load.muzzleVelocityMps 807.72 within 0.01; setupDone false; unitSystem 'imperial'.
 2. defaultState() solves: toShotInput(defaultState()) is not null and solve(...) of it has ok true. (Import toShotInput from '../src/planner/model' and solve from '../src/solver/solve'.)
 3. loadState on empty storage deep-equals defaultState().
 4. Round trip: s = defaultState() with setupDone true and conditions.targetRangeM 500; saveState(store, s); loadState(store) deep-equals s.
 5. loadState with the key set to 'not json' deep-equals defaultState().
 6. loadState with the key set to JSON.stringify({ version: 2 }) deep-equals defaultState().
 7. loadState with a saved state whose conditions.targetRangeM was replaced by the string 'abc' deep-equals defaultState().
 8. saveState does not throw when storage.setItem throws.
 9. isAppState(null) false; isAppState(42) false; isAppState({}) false.
10. selectLibraryLoad(defaultState(), 'hornady-80966'): load.libraryId 'hornady-80966'; load.bcG7 0.263; load.muzzleVelocityMps 772.0 within 0.1 (2700 fps from a 24 inch barrel, less 250.8 m/s per metre over 0.2032 m). selectLibraryLoad(s, 'nope') returns the same object (toBe).
11. selectLibraryLoad(defaultState(), 'bullet-nosler-53164'): load.dragModel 'G1'; load.bcG7 null; load.muzzleVelocityMps 0.
12. saveCustomLoad: start from defaultState() with load.name 'My handload' and load.muzzleVelocityMps 760; after saveCustomLoad, customLoads has length 1, its libraryId is null and name 'My handload'. Saving again with muzzleVelocityMps 770 keeps length 1 and the stored velocity is 770.
13. selectCustomLoad(state from test 12, 'My handload') has load.muzzleVelocityMps 770; selectCustomLoad(s, 'nope') returns the same object (toBe).

If a test fails, check your code against this task first. Do not edit any file you do not own. If you think the task itself is wrong, leave the test failing and say which and why.

Finish by running `npm run typecheck` and `npm test`. Reply with the test count and anything you left failing.
