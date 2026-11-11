import { describe, expect, it } from 'vitest';
import {
  addProfile,
  activeState,
  cartridgeById,
  defaultState,
  deleteProfile,
  duplicateProfile,
  isAppState,
  isSavedState,
  loadSaved,
  loadsForCartridge,
  migrateV1,
  nextProfileId,
  newRifleState,
  saveCustomLoad,
  saveSaved,
  selectCustomLoad,
  selectGenericScope,
  selectLibraryLoad,
  selectLibraryScope,
  selectProfile,
  STORAGE_KEY,
  STORAGE_KEY_V1,
  withActiveState
} from '../src/planner/storage';
import { toShotInput } from '../src/planner/model';
import { solve } from '../src/solver/solve';
import type { AppState, SavedState } from '../src/planner/types';

function makeSaved(id: string, state: AppState): SavedState {
  return { version: 2, activeId: id, profiles: [{ id, state }] };
}

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (k: string): string | null => data.get(k) ?? null,
    setItem: (k: string, v: string): void => { data.set(k, v); },
    data
  };
}

describe('planner storage', () => {
  it('defaultState has the expected defaults', () => {
    const s = defaultState();
    expect(isAppState(s)).toBe(true);
    expect(s.rifle.cartridgeId).toBe('308-win');
    expect(s.rifle.scope.reticleId).toBe('ebr-7c-mrad');
    expect(s.rifle.scope.availableElevation).toBe(19);
    expect(s.rifle.scope.focalPlane).toBe('first');
    expect(s.magnification).toBe(10);
    expect(s.rifle.angleUnit).toBe('MIL');
    expect(s.rifle.clickValue).toBe(0.1);
    expect(s.rifle.twistM).toBeCloseTo(0.2794, 6);
    expect(s.rifle.twistConfirmed).toBe(false);
    expect(s.rifle.barrelLengthM).toBeCloseTo(0.4064, 6);
    expect(s.load.libraryId).toBe('federal-gm308m');
    expect(s.load.bcRA4).toBe(null);
    expect(s.load.dragModel).toBe('G7');
    expect(s.load.bcG7).toBe(0.224);
    expect(s.load.velocityMeasured).toBe(false);
    expect(s.load.muzzleVelocityMps).toBeCloseTo(807.72, 2);
    expect(s.conditions.targetRangeM).toBeCloseTo(274.32, 6);
    expect(s.setupDone).toBe(false);
    expect(s.unitSystem).toBe('imperial');
  });

  it('defaultState solves', () => {
    const input = toShotInput(defaultState());
    expect(input).not.toBeNull();
    expect(solve(input as NonNullable<typeof input>).ok).toBe(true);
  });

  it('loadSaved on empty storage gives the default single profile', () => {
    const saved = loadSaved(fakeStorage());
    expect(saved.version).toBe(2);
    expect(saved.profiles).toHaveLength(1);
    expect(saved.activeId).toBe('r1');
    expect(activeState(saved)).toEqual(defaultState());
  });

  it('round trip preserves the saved value', () => {
    const saved = withActiveState(makeSaved('r1', defaultState()), {
      ...defaultState(),
      conditions: { ...defaultState().conditions, targetRangeM: 500 }
    });
    const store = fakeStorage();
    saveSaved(store, saved);
    expect(loadSaved(store)).toEqual(saved);
  });

  it('migrates a version 1 value', () => {
    const s = defaultState();
    const v1 = JSON.parse(JSON.stringify(s)) as Record<string, unknown>;
    const rifle = v1.rifle as Record<string, unknown>;
    const load = v1.load as Record<string, unknown>;
    const origin = load.origin as Record<string, unknown>;
    delete rifle.cartridgeId;
    delete rifle.scope;
    delete v1.magnification;
    delete load.bcRA4;
    delete origin.bcRA4;
    v1.setupDone = true;
    (v1.conditions as Record<string, unknown>).targetRangeM = 400;
    const store = fakeStorage({ [STORAGE_KEY_V1]: JSON.stringify(v1) });
    const saved = loadSaved(store);
    const state = activeState(saved);
    expect(saved.profiles).toHaveLength(1);
    expect(state.setupDone).toBe(true);
    expect(state.conditions.targetRangeM).toBe(400);
    expect(state.rifle.cartridgeId).toBe('308-win');
    expect(state.rifle.scope.reticleId).toBe('ebr-7c-mrad');
    expect(state.magnification).toBe(10);
    expect(state.load.bcRA4).toBe(null);
    expect(state.load.muzzleVelocityMps).toBeCloseTo(s.load.muzzleVelocityMps, 6);
    expect(state.rifle.twistM).toBeCloseTo(s.rifle.twistM, 6);
  });

  it('migration keeps custom loads and fills their missing fields', () => {
    const s = defaultState();
    const v1 = JSON.parse(JSON.stringify(s)) as Record<string, unknown>;
    const rifle = v1.rifle as Record<string, unknown>;
    const load = v1.load as Record<string, unknown>;
    const origin = load.origin as Record<string, unknown>;
    delete rifle.cartridgeId;
    delete rifle.scope;
    delete v1.magnification;
    delete load.bcRA4;
    delete origin.bcRA4;
    const custom = JSON.parse(JSON.stringify(s.load)) as Record<string, unknown>;
    custom.name = 'My handload';
    delete custom.bcRA4;
    delete (custom.origin as Record<string, unknown>).bcRA4;
    v1.customLoads = [custom];
    const store = fakeStorage({ [STORAGE_KEY_V1]: JSON.stringify(v1) });
    const state = activeState(loadSaved(store));
    expect(state.customLoads).toHaveLength(1);
    expect(state.customLoads[0]?.bcRA4).toBe(null);
    expect(state.customLoads[0]?.origin.bcRA4).toBe('library');
    expect(state.customLoads[0]?.name).toBe('My handload');
  });

  it('version 2 wins when both keys are present', () => {
    const v2 = {
      version: 2,
      activeId: 'r1',
      profiles: [{ id: 'r1', state: { ...defaultState(), setupDone: true } }]
    };
    const store = fakeStorage({
      [STORAGE_KEY]: JSON.stringify(v2),
      [STORAGE_KEY_V1]: JSON.stringify(defaultState())
    });
    expect(loadSaved(store)).toEqual(v2);
  });

  it('damaged storage falls back to the default single profile', () => {
    expect(loadSaved(fakeStorage({ [STORAGE_KEY]: 'not json', [STORAGE_KEY_V1]: 'not json' }))).toEqual({
      version: 2,
      activeId: 'r1',
      profiles: [{ id: 'r1', state: defaultState() }]
    });
    expect(loadSaved(fakeStorage({ [STORAGE_KEY]: JSON.stringify({ version: 2, profiles: [] }) }))).toEqual({
      version: 2,
      activeId: 'r1',
      profiles: [{ id: 'r1', state: defaultState() }]
    });
    const s = defaultState();
    const v1 = JSON.parse(JSON.stringify(s)) as Record<string, unknown>;
    (v1.conditions as Record<string, unknown>).targetRangeM = 'abc';
    expect(loadSaved(fakeStorage({ [STORAGE_KEY_V1]: JSON.stringify(v1) }))).toEqual({
      version: 2,
      activeId: 'r1',
      profiles: [{ id: 'r1', state: defaultState() }]
    });
  });

  it('saveSaved does not throw when setItem throws', () => {
    const store = {
      getItem: (k: string): string | null => { throw new Error('nope'); },
      setItem: (k: string, v: string): void => { throw new Error('quota exceeded'); }
    };
    expect(() => saveSaved(store, makeSaved('r1', defaultState()))).not.toThrow();
  });

  it('isAppState rejects non-state values', () => {
    expect(isAppState(null)).toBe(false);
    expect(isAppState(42)).toBe(false);
    expect(isAppState({})).toBe(false);
  });

  it('isSavedState validates the saved shape', () => {
    expect(isSavedState(makeSaved('r1', defaultState()))).toBe(true);
    expect(isSavedState({ version: 2, activeId: 'r1', profiles: [] })).toBe(false);
    expect(isSavedState({ version: 2, activeId: 'nope', profiles: [{ id: 'r1', state: defaultState() }] })).toBe(false);
    expect(isSavedState({ version: 1, activeId: 'r1', profiles: [{ id: 'r1', state: defaultState() }] })).toBe(false);
  });

  it('migrateV1 returns null for non-records and bad shapes', () => {
    expect(migrateV1(null)).toBe(null);
    expect(migrateV1({})).toBe(null);
    expect(migrateV1({ rifle: 'nope' })).toBe(null);
  });

  it('withActiveState does not mutate and changes only the active profile', () => {
    const a = defaultState();
    const b = newRifleState('22-lr', 'Rim', 'imperial');
    const saved: SavedState = { version: 2, activeId: 'r2', profiles: [{ id: 'r1', state: a }, { id: 'r2', state: b }] };
    const beforeA = JSON.parse(JSON.stringify(a));
    const beforeB = JSON.parse(JSON.stringify(b));
    const changed = { ...b, conditions: { ...b.conditions, targetRangeM: 100 } };
    const next = withActiveState(saved, changed);
    expect(next.profiles[0]?.state).toEqual(beforeA);
    expect(next.profiles[1]?.state).toEqual(changed);
    expect(saved.profiles[1]?.state).toEqual(beforeB);
    expect(saved.activeId).toBe('r2');
  });

  it('addProfile appends a new rifle and makes it active', () => {
    const saved = makeSaved('r1', defaultState());
    const before = JSON.parse(JSON.stringify(saved.profiles[0]?.state));
    const next = addProfile(saved, '22-lr', 'My rimfire');
    expect(next.profiles).toHaveLength(2);
    expect(next.activeId).toBe('r2');
    const s = next.profiles[1]?.state;
    expect(s).toBeDefined();
    if (s === undefined) return;
    expect(s.rifle.name).toBe('My rimfire');
    expect(s.rifle.cartridgeId).toBe('22-lr');
    expect(s.rifle.zeroRangeM).toBeCloseTo(45.72, 6);
    expect(s.conditions.targetRangeM).toBeCloseTo(45.72, 6);
    expect(s.dope.endM).toBeCloseTo(182.88, 6);
    expect(s.rifle.twistM).toBeCloseTo(0.4064, 6);
    expect(s.load.libraryId).toBe('cci-32');
    expect(s.load.bulletDiameterM).toBeCloseTo(0.0057277, 6);
    expect(s.setupDone).toBe(false);
    expect(s.rifle.scope.reticleId).toBe('generic-mil');
    expect(next.profiles[0]?.state).toEqual(before);
  });

  it('addProfile for an unknown cartridge gives the blank load', () => {
    const saved = makeSaved('r1', defaultState());
    const next = addProfile(saved, 'other', 'Wildcat');
    const s = next.profiles[1]?.state;
    expect(s).toBeDefined();
    if (s === undefined) return;
    expect(isAppState(s)).toBe(true);
    expect(s.load.libraryId).toBe(null);
    expect(s.load.bcG1).toBe(null);
    expect(s.load.muzzleVelocityMps).toBe(0);
    expect(s.load.name).toBe('My load');
  });

  it('addProfile for 223-rem and 556-nato picks the first library load and solves', () => {
    const saved = makeSaved('r1', defaultState());
    const s223 = addProfile(saved, '223-rem', 'A').profiles[1]?.state;
    expect(s223?.load.libraryId).toBe('federal-gm223m');
    const s556 = addProfile(saved, '556-nato', 'B').profiles[1]?.state;
    expect(s556?.load.libraryId).toBe('federal-ae193');
    for (const s of [s223, s556]) {
      if (s === undefined) continue;
      const input = toShotInput(s);
      expect(input).not.toBeNull();
      expect(solve(input as NonNullable<typeof input>).ok).toBe(true);
    }
  });

  it('nextProfileId counts the largest r-id', () => {
    expect(nextProfileId({ version: 2, activeId: 'x', profiles: [{ id: 'x', state: defaultState() }] })).toBe('r1');
    expect(
      nextProfileId({
        version: 2,
        activeId: 'r1',
        profiles: [
          { id: 'r1', state: defaultState() },
          { id: 'r2', state: defaultState() }
        ]
      } as SavedState)
    ).toBe('r3');
    expect(
      nextProfileId({
        version: 2,
        activeId: 'r7',
        profiles: [
          { id: 'r7', state: defaultState() },
          { id: 'x', state: defaultState() }
        ]
      } as SavedState)
    ).toBe('r8');
  });

  it('duplicateProfile copies the active state under a new id', () => {
    const saved = makeSaved('r1', defaultState());
    const before = JSON.parse(JSON.stringify(saved.profiles[0]?.state));
    const next = duplicateProfile(saved);
    expect(next.profiles).toHaveLength(2);
    expect(next.activeId).toBe('r2');
    const copy = next.profiles[1]?.state;
    expect(copy?.rifle.name).toBe(defaultState().rifle.name + ' (copy)');
    if (copy === undefined) return;
    const changed = withActiveState(next, { ...copy, conditions: { ...copy.conditions, targetRangeM: 1 } });
    expect(changed.profiles[0]?.state).toEqual(before);
  });

  it('deleteProfile guards single and unknown profiles', () => {
    const saved = makeSaved('r1', defaultState());
    expect(deleteProfile(saved, 'r1')).toBe(saved);
    const two = addProfile(saved, '22-lr', 'Rim');
    const deleted = deleteProfile(two, 'r2');
    expect(deleted.profiles).toHaveLength(1);
    expect(deleted.activeId).toBe('r1');
    expect(deleteProfile(two, 'nope')).toBe(two);
  });

  it('selectProfile changes only the active id', () => {
    const saved = makeSaved('r1', defaultState());
    const two = addProfile(saved, '22-lr', 'Rim');
    expect(selectProfile(two, 'nope')).toBe(two);
    const selected = selectProfile(two, 'r1');
    expect(selected.activeId).toBe('r1');
    expect(selected.profiles).toEqual(two.profiles);
  });

  it('selectLibraryScope applies the library scope and click settings', () => {
    const s = newRifleState('308-win', 'X', 'imperial');
    const next = selectLibraryScope(s, 'vortex-venom-5-25x56-ebr7c-mrad');
    expect(next.rifle.scope.reticleId).toBe('ebr-7c-mrad');
    expect(next.rifle.scope.magMax).toBe(25);
    expect(next.rifle.clickValue).toBe(0.1);
    expect(next.rifle.angleUnit).toBe('MIL');
    expect(next.magnification).toBeGreaterThanOrEqual(5);
    expect(next.magnification).toBeLessThanOrEqual(25);
    expect(selectLibraryScope(s, 'nope')).toBe(s);
  });

  it('selectGenericScope keeps the angle unit and picks the reticle to match', () => {
    const mil = newRifleState('308-win', 'X', 'imperial');
    expect(selectGenericScope(mil).rifle.scope.reticleId).toBe('generic-mil');
    const moa = { ...mil, rifle: { ...mil.rifle, angleUnit: 'MOA' as const } };
    expect(selectGenericScope(moa).rifle.scope.reticleId).toBe('generic-moa');
  });

  it('cartridgeById and loadsForCartridge look up the library', () => {
    expect(cartridgeById('22-lr')?.name).toBe('.22 Long Rifle');
    expect(cartridgeById('nope')).toBe(undefined);
    expect(loadsForCartridge('556-nato')).toHaveLength(8);
    expect(loadsForCartridge('nope')).toEqual([]);
  });

  it('selectLibraryLoad switches to the named load', () => {
    const s = selectLibraryLoad(defaultState(), 'hornady-80966');
    expect(s.load.libraryId).toBe('hornady-80966');
    expect(s.load.bcG7).toBe(0.263);
    expect(s.load.muzzleVelocityMps).toBeCloseTo(772.0, 1);
    expect(selectLibraryLoad(s, 'nope')).toBe(s);
  });

  it('selectLibraryLoad handles a G1-only load', () => {
    const s = selectLibraryLoad(defaultState(), 'bullet-nosler-53164');
    expect(s.load.dragModel).toBe('G1');
    expect(s.load.bcG7).toBe(null);
    expect(s.load.muzzleVelocityMps).toBe(0);
  });

  it('saveCustomLoad stores and updates by name', () => {
    let s = defaultState();
    s = { ...s, load: { ...s.load, name: 'My handload', muzzleVelocityMps: 760 } };
    s = saveCustomLoad(s);
    expect(s.customLoads).toHaveLength(1);
    expect(s.customLoads[0]?.libraryId).toBe(null);
    expect(s.customLoads[0]?.name).toBe('My handload');
    s = { ...s, load: { ...s.load, muzzleVelocityMps: 770 } };
    s = saveCustomLoad(s);
    expect(s.customLoads).toHaveLength(1);
    expect(s.customLoads[0]?.muzzleVelocityMps).toBe(770);
  });

  it('selectCustomLoad loads the named custom load', () => {
    let s = defaultState();
    s = { ...s, load: { ...s.load, name: 'My handload', muzzleVelocityMps: 760 } };
    s = saveCustomLoad(s);
    s = { ...s, load: { ...s.load, muzzleVelocityMps: 770 } };
    s = saveCustomLoad(s);
    const picked = selectCustomLoad(s, 'My handload');
    expect(picked.load.muzzleVelocityMps).toBe(770);
    expect(selectCustomLoad(s, 'nope')).toBe(s);
  });

  it('selectLibraryLoad uses the published barrel figure for a 16 inch 5.56 rifle', () => {
    const saved = makeSaved('r1', defaultState());
    const state = addProfile(saved, '556-nato', 'Fifteen').profiles[1]?.state;
    expect(state).toBeDefined();
    if (state === undefined) return;
    const s = selectLibraryLoad(state, 'pmc-556k');
    expect(s.load.muzzleVelocityMps).toBeCloseTo(2920 * 0.3048, 2);
  });
});
