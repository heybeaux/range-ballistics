import type { ActiveLoad, AppState, LoadLibrary, Rifle } from './types';
import { activeLoadFromLibrary } from './model';
import loadsJson from '../data/loads.json';
import rifleJson from '../data/rifle.json';

export const STORAGE_KEY = 'range-ballistics/v1';

export const library: LoadLibrary = loadsJson;

export function defaultRifle(): Rifle {
  return {
    name: rifleJson.name,
    barrelLengthM: rifleJson.barrelLengthM,
    twistM: rifleJson.twistM,
    twistDirection: rifleJson.twistDirection === 'left' ? 'left' : 'right',
    twistConfirmed: rifleJson.twistConfirmed,
    sightHeightM: rifleJson.sightHeightM,
    zeroRangeM: rifleJson.zeroRangeM,
    angleUnit: rifleJson.angleUnit === 'MOA' ? 'MOA' : 'MIL',
    clickValue: rifleJson.clickValue
  };
}

export function defaultState(): AppState {
  const rifle = defaultRifle();
  const first = library.loads[0];
  if (first === undefined) throw new Error('load library is empty');
  const load = activeLoadFromLibrary(first, rifle, library);
  return {
    version: 1,
    unitSystem: 'imperial',
    rifle,
    load,
    customLoads: [],
    conditions: {
      targetRangeM: 274.32,
      windSpeedMps: 2.2352,
      windClock: 3,
      temperatureK: 288.15,
      pressureMode: 'station',
      pressurePa: 101325,
      altitudeM: 0,
      relativeHumidity: 0.5,
      shotAngleRad: 0
    },
    dope: { startM: 91.44, endM: 548.64, stepM: 45.72 },
    spinDrift: true,
    targetType: 'steel',
    setupDone: false
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function num(v: unknown): boolean {
  return typeof v === 'number' && Number.isFinite(v);
}

export function isAppState(x: unknown): x is AppState {
  if (!isRecord(x)) return false;
  if (x.version !== 1) return false;
  if (x.unitSystem !== 'imperial' && x.unitSystem !== 'metric') return false;
  const rifle = x.rifle;
  const load = x.load;
  const conditions = x.conditions;
  const dope = x.dope;
  if (!isRecord(rifle) || !isRecord(load) || !isRecord(conditions) || !isRecord(dope)) return false;
  if (!Array.isArray(x.customLoads)) return false;
  if (typeof x.spinDrift !== 'boolean' || typeof x.setupDone !== 'boolean') return false;
  if (x.targetType !== 'steel' && x.targetType !== 'paper') return false;
  return (
    num(rifle.twistM) &&
    num(rifle.sightHeightM) &&
    num(rifle.zeroRangeM) &&
    num(rifle.clickValue) &&
    num(rifle.barrelLengthM) &&
    num(load.muzzleVelocityMps) &&
    num(load.bulletMassKg) &&
    num(load.bulletDiameterM) &&
    num(conditions.targetRangeM) &&
    num(conditions.windSpeedMps) &&
    num(conditions.windClock) &&
    num(conditions.temperatureK) &&
    num(conditions.pressurePa) &&
    num(conditions.altitudeM) &&
    num(conditions.relativeHumidity) &&
    num(conditions.shotAngleRad) &&
    num(dope.startM) &&
    num(dope.endM) &&
    num(dope.stepM)
  );
}

export function loadState(storage: Pick<Storage, 'getItem'>): AppState {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return defaultState();
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return defaultState();
  }
  if (!isAppState(parsed)) return defaultState();
  return parsed;
}

export function saveState(storage: Pick<Storage, 'setItem'>, state: AppState): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // full or blocked storage must not crash the app
  }
}

export function selectLibraryLoad(state: AppState, id: string): AppState {
  const found = library.loads.find((l) => l.id === id);
  if (found === undefined) return state;
  return { ...state, load: activeLoadFromLibrary(found, state.rifle, library) };
}

export function saveCustomLoad(state: AppState): AppState {
  const copy: ActiveLoad = { ...state.load, libraryId: null, origin: { ...state.load.origin } };
  return {
    ...state,
    customLoads: [...state.customLoads.filter((l) => l.name !== copy.name), copy]
  };
}

export function selectCustomLoad(state: AppState, name: string): AppState {
  const found = state.customLoads.find((l) => l.name === name);
  if (found === undefined) return state;
  return { ...state, load: { ...found, origin: { ...found.origin } } };
}
