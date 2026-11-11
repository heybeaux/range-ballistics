The planner contract changed (src/planner/types.ts). Update saved state to version 2: several rifles, each with its own AppState, and a migration from version 1. Other modules (fields, panels, view, setup, main) are still on the old contract and will not typecheck yet; that is expected and NOT your job here.

Files you own (edit only these):
  src/planner/storage.ts
  tests/planner-storage.test.ts

Read first, in full: src/planner/types.ts, src/planner/model.ts, src/planner/storage.ts, tests/planner-storage.test.ts, tests/helpers/fixtures.ts, src/data/rifle.json, src/data/scopes.json, and the "cartridges" part of src/data/loads.json.

KEY IDEA: AppState is still ONE rifle with its load and conditions. SavedState { version: 2, activeId, profiles: [{ id, state }] } is what is stored. Everything else in the app keeps working on the active AppState.

JSON typing note: a JSON import types string fields as `string`, so they must be narrowed to the union types. Do it with small functions, not with `as`:
  focalPlane: raw === 'second' ? 'second' : 'first'
  reticleId:  raw === 'ebr-7c-mrad' ? 'ebr-7c-mrad' : raw === 'generic-moa' ? 'generic-moa' : 'generic-mil'
  angleUnit:  raw === 'MOA' ? 'MOA' : 'MIL'

EXPORTS of src/planner/storage.ts (keep the existing exports unless listed as changed)

export const STORAGE_KEY_V1 = 'range-ballistics/v1';
export const STORAGE_KEY = 'range-ballistics/v2';
export const library: LoadLibrary = loadsJson;            // unchanged
export const scopeLibrary: ScopeLibrary                    // built from scopes.json with the narrowing above

export function cartridgeById(id: string): Cartridge | undefined
export function loadsForCartridge(cartridgeId: string): LibraryLoad[]      // library order
export function defaultScope(): ScopeProfile               // rifleJson.scope, narrowed
export function genericScope(): ScopeProfile               // rifleJson.genericScope, narrowed

export function defaultRifle(): Rifle
  As now, plus cartridgeId: rifleJson.cartridgeId and scope: defaultScope().

export function defaultState(): AppState
  As now, plus magnification: 10. The load is the FIRST library load whose cartridgeId equals the rifle's (throw if none). Target, zero and dope come from the cartridge's defaults (for .308 these equal the current numbers).

export function blankLoad(cartridgeId: string): ActiveLoad
  For a cartridge with no library loads: libraryId null, name 'My load', bulletMassKg 0.00972, bulletDiameterM = the cartridge's diameter (0.0078232 when the cartridge is unknown), bulletLengthM null, bcG1 null, bcG7 null, bcRA4 null, dragModel 'G1', muzzleVelocityMps 0, velocityMeasured false, origin all 'user'.

export function newRifleState(cartridgeId: string, name: string, unitSystem: UnitSystem): AppState
  A new rifle. c = cartridgeById(cartridgeId) (may be undefined for 'other').
  rifle: name; cartridgeId; barrelLengthM c?.defaults.barrelLengthM ?? 0.508; twistM c?.defaults.twistM ?? 0.254; twistDirection 'right'; twistConfirmed false; sightHeightM 0.04445; zeroRangeM c?.defaults.zeroRangeM ?? 91.44; angleUnit 'MIL'; clickValue 0.1; scope genericScope().
  load: activeLoadFromLibrary(first load of that cartridge, rifle, library), or blankLoad(cartridgeId) when the cartridge has no loads.
  conditions: the same as defaultState() but targetRangeM = c?.defaults.targetRangeM ?? 274.32.
  dope: c?.defaults.dope ?? defaultState().dope. customLoads []. spinDrift true. targetType 'steel'. setupDone false. magnification = genericScope().magMin * 2. version 1. unitSystem as given.

export function isAppState(x: unknown): x is AppState
  Everything it checks now, plus: rifle.cartridgeId is a string; rifle.scope is a record with finite numbers magMin, magMax, fovAtMinRad, fovAtMaxRad, availableElevation, and string reticleId and focalPlane; magnification is a finite number; load.origin is a record.

export function migrateV1(x: unknown): AppState | null
  Takes a version 1 AppState as it was stored before this change and returns it in the new shape, or null when it cannot.
  If x is not a record, or x.rifle / x.load / x.conditions / x.dope are not records -> null.
  Work on a deep copy (JSON round trip). Fill ONLY what is missing:
    rifle.cartridgeId -> '308-win';  rifle.scope -> defaultScope();  magnification -> 10;
    load.bcRA4 -> null;  load.origin.bcRA4 -> 'library';
    the same two load fields on every entry of customLoads.
  Then return the copy if isAppState(copy), else null.

export function isSavedState(x: unknown): x is SavedState
  version === 2; activeId is a string; profiles is a non-empty array; every profile has a string id and isAppState(state); some profile's id equals activeId.

export function loadSaved(storage: Pick<Storage, 'getItem'>): SavedState
  1. raw = getItem(STORAGE_KEY). If it parses and isSavedState -> return it.
  2. Else raw1 = getItem(STORAGE_KEY_V1). If it parses and migrateV1 gives a state -> { version: 2, activeId: 'r1', profiles: [{ id: 'r1', state }] }.
  3. Else -> { version: 2, activeId: 'r1', profiles: [{ id: 'r1', state: defaultState() }] }.
  JSON.parse always inside try/catch.

export function saveSaved(storage: Pick<Storage, 'setItem'>, saved: SavedState): void     // try/catch, key STORAGE_KEY

export function activeState(saved: SavedState): AppState
  The active profile's state. If activeId matches nothing, the first profile's state.

export function withActiveState(saved: SavedState, state: AppState): SavedState
  A new SavedState where the active profile's state is replaced. Never mutates.

export function nextProfileId(saved: SavedState): string
  'r' + (the largest number n among ids of the form r<n>, plus 1). 'r1' when there are none.

export function addProfile(saved: SavedState, cartridgeId: string, name: string): SavedState
  Appends { id: nextProfileId(saved), state: newRifleState(cartridgeId, name, activeState(saved).unitSystem) } and makes it active.

export function duplicateProfile(saved: SavedState): SavedState
  Appends a deep copy of the active state with rifle.name + ' (copy)', under a new id, and makes it active.

export function deleteProfile(saved: SavedState, id: string): SavedState
  Only one profile, or id not found -> return saved unchanged (same object). Otherwise remove it; if it was active, the first remaining profile becomes active.

export function selectProfile(saved: SavedState, id: string): SavedState
  id not found -> same object. Otherwise { ...saved, activeId: id }.

export function selectLibraryScope(state: AppState, libraryId: string): AppState
  Find the scope in scopeLibrary. Not found -> same object. Found -> new state with rifle.scope = a copy of its scope, rifle.angleUnit and rifle.clickValue from the library entry, and magnification = clampMagnification(state.magnification, that scope).

export function selectGenericScope(state: AppState): AppState
  rifle.scope = genericScope() with reticleId 'generic-moa' when state.rifle.angleUnit is 'MOA'; magnification clamped. angleUnit and clickValue unchanged.

selectLibraryLoad, saveCustomLoad, selectCustomLoad: unchanged.
Remove loadState and saveState (the app will use loadSaved / saveSaved).

TESTS in tests/planner-storage.test.ts
Keep the existing tests that still make sense, converted to the new API (loadSaved / saveSaved / activeState in place of loadState / saveState). Keep the fakeStorage helper. Then make sure these exist:
 1. defaultState(): isAppState true; rifle.cartridgeId '308-win'; rifle.scope.reticleId 'ebr-7c-mrad'; rifle.scope.availableElevation 19; rifle.scope.focalPlane 'first'; magnification 10; load.libraryId 'federal-gm308m'; load.bcRA4 null; load.muzzleVelocityMps 807.72 within 0.01; conditions.targetRangeM 274.32 within 1e-6; setupDone false.
 2. defaultState() solves (toShotInput not null and solve ok).
 3. loadSaved on empty storage: version 2, one profile, activeId 'r1', and activeState deep-equals defaultState().
 4. Round trip: saveSaved then loadSaved deep-equals the saved value (after changing the active state's targetRangeM to 500 with withActiveState).
 5. Migration: build a version 1 value by taking defaultState() and deleting rifle.cartridgeId, rifle.scope, magnification, load.bcRA4, and load.origin.bcRA4 (use a JSON copy and `delete` on a Record<string, unknown>), then set setupDone true and conditions.targetRangeM 400. Store it under STORAGE_KEY_V1 only. loadSaved gives one profile whose state has setupDone true, targetRangeM 400, rifle.cartridgeId '308-win', rifle.scope.reticleId 'ebr-7c-mrad', magnification 10, load.bcRA4 null, and the same load.muzzleVelocityMps and rifle.twistM as before.
 6. Migration keeps custom loads: the v1 value has one custom load without bcRA4; after loadSaved the custom load has bcRA4 null and origin.bcRA4 'library' and the same name.
 7. Version 2 wins: with both keys present, loadSaved returns the version 2 value.
 8. Damaged storage: 'not json' under both keys, or { version: 2, profiles: [] }, or a v1 value whose conditions.targetRangeM is 'abc' -> the default single profile.
 9. saveSaved does not throw when setItem throws.
10. withActiveState does not mutate its argument and changes only the active profile (two profiles, change the active one, the other is deep-equal to before).
11. addProfile(saved, '22-lr', 'My rimfire'): two profiles; the new one is active with id 'r2'; its rifle.name 'My rimfire', cartridgeId '22-lr', zeroRangeM 45.72 within 1e-6, conditions.targetRangeM 45.72 within 1e-6, dope.endM 182.88 within 1e-6, rifle.twistM 0.4064 within 1e-6, load.libraryId 'cci-32', load.bulletDiameterM 0.0057277 within 1e-6, setupDone false, rifle.scope.reticleId 'generic-mil'; the first profile is unchanged.
12. addProfile(saved, 'other', 'Wildcat'): the load is the blank load (libraryId null, bcG1 null, muzzleVelocityMps 0, name 'My load'), isAppState true.
13. addProfile for '223-rem' and '556-nato': load.libraryId 'federal-gm223m' and 'federal-ae193'; both states solve (toShotInput not null, solve ok).
14. nextProfileId: 'r1' for no r-ids; 'r3' when ids are 'r1' and 'r2'; 'r8' when ids are 'r7' and 'x'.
15. duplicateProfile: two profiles, new one active, name ends ' (copy)', and changing the copy's state with withActiveState leaves the original deep-equal to before.
16. deleteProfile: with one profile returns the same object (toBe); with two, deleting the active one leaves one profile that is active; deleting an unknown id returns the same object.
17. selectProfile: unknown id returns the same object; known id changes activeId only.
18. selectLibraryScope(newRifleState('308-win', 'X', 'imperial'), 'vortex-venom-5-25x56-ebr7c-mrad'): rifle.scope.reticleId 'ebr-7c-mrad', magMax 25, clickValue 0.1, angleUnit 'MIL', magnification within 5..25. Unknown id returns the same object.
19. selectGenericScope on a state with angleUnit 'MOA' gives reticleId 'generic-moa'; with 'MIL' gives 'generic-mil'.
20. cartridgeById('22-lr')?.name is '.22 Long Rifle'; cartridgeById('nope') is undefined; loadsForCartridge('556-nato').length is 8; loadsForCartridge('nope') is [].
21. The existing selectLibraryLoad / saveCustomLoad / selectCustomLoad tests still pass (hornady-80966 gives 772.0 within 0.1; bullet-nosler-53164 gives dragModel 'G1' and velocity 0).
22. selectLibraryLoad(state for a 16 inch 5.56 rifle from addProfile, 'pmc-556k'): muzzleVelocityMps is 2920 * 0.3048 within 0.01 (PMC's own 16 inch figure).

ACCEPTANCE (the whole project will NOT typecheck yet; check only your files)
- `npx tsc --noEmit 2>&1 | grep -E "src/planner/storage|tests/planner-storage"` prints nothing.
- `npx vitest run tests/planner-storage.test.ts` passes.
If an expectation fails and your code matches the definition, leave the test failing and report the actual value. Do not edit any other file.

Reply with the test count for your file and anything left failing.
