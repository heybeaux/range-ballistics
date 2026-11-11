import { describe, expect, it } from 'vitest';
import {
  defaultState,
  isAppState,
  loadState,
  saveCustomLoad,
  saveState,
  selectCustomLoad,
  selectLibraryLoad,
  STORAGE_KEY
} from '../src/planner/storage';
import { toShotInput } from '../src/planner/model';
import { solve } from '../src/solver/solve';

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
    expect(s.rifle.angleUnit).toBe('MIL');
    expect(s.rifle.clickValue).toBe(0.1);
    expect(s.rifle.twistM).toBeCloseTo(0.2794, 6);
    expect(s.rifle.twistConfirmed).toBe(false);
    expect(s.rifle.barrelLengthM).toBeCloseTo(0.4064, 6);
    expect(s.load.libraryId).toBe('federal-gm308m');
    expect(s.load.dragModel).toBe('G7');
    expect(s.load.bcG7).toBe(0.224);
    expect(s.load.velocityMeasured).toBe(false);
    expect(s.load.muzzleVelocityMps).toBeCloseTo(807.72, 2);
    expect(s.setupDone).toBe(false);
    expect(s.unitSystem).toBe('imperial');
  });

  it('defaultState solves', () => {
    const input = toShotInput(defaultState());
    expect(input).not.toBeNull();
    expect(solve(input as NonNullable<typeof input>).ok).toBe(true);
  });

  it('loadState on empty storage deep-equals defaultState', () => {
    expect(loadState(fakeStorage())).toEqual(defaultState());
  });

  it('round trip preserves state', () => {
    const s = defaultState();
    s.setupDone = true;
    s.conditions.targetRangeM = 500;
    const store = fakeStorage();
    saveState(store, s);
    expect(loadState(store)).toEqual(s);
  });

  it('loadState with invalid json deep-equals defaultState', () => {
    expect(loadState(fakeStorage({ [STORAGE_KEY]: 'not json' }))).toEqual(defaultState());
  });

  it('loadState with wrong version deep-equals defaultState', () => {
    expect(loadState(fakeStorage({ [STORAGE_KEY]: JSON.stringify({ version: 2 }) }))).toEqual(defaultState());
  });

  it('loadState with a non-numeric field deep-equals defaultState', () => {
    const s = defaultState();
    const broken = JSON.parse(JSON.stringify(s));
    broken.conditions.targetRangeM = 'abc';
    expect(loadState(fakeStorage({ [STORAGE_KEY]: JSON.stringify(broken) }))).toEqual(defaultState());
  });

  it('saveState does not throw when setItem throws', () => {
    const store = {
      getItem: (k: string): string | null => { throw new Error('nope'); },
      setItem: (k: string, v: string): void => { throw new Error('quota exceeded'); }
    };
    expect(() => saveState(store, defaultState())).not.toThrow();
  });

  it('isAppState rejects non-state values', () => {
    expect(isAppState(null)).toBe(false);
    expect(isAppState(42)).toBe(false);
    expect(isAppState({})).toBe(false);
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
});
