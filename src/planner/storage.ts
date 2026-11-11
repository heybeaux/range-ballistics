import type {
  ActiveLoad,
  AppState,
  Cartridge,
  LibraryLoad,
  LoadLibrary,
  Rifle,
  SavedProfile,
  SavedState,
  ScopeLibrary,
  ScopeProfile
} from './types';
import { activeLoadFromLibrary, clampMagnification } from './model';
import type { AngleUnit, UnitSystem } from '../units/units';
import loadsJson from '../data/loads.json';
import rifleJson from '../data/rifle.json';
import scopesJson from '../data/scopes.json';

export const STORAGE_KEY_V1 = 'range-ballistics/v1';
export const STORAGE_KEY = 'range-ballistics/v2';

export const library: LoadLibrary = loadsJson;

function narrowFocalPlane(raw: string): ScopeProfile['focalPlane'] {
  return raw === 'second' ? 'second' : 'first';
}

function narrowReticleId(raw: string): ScopeProfile['reticleId'] {
  return raw === 'ebr-7c-mrad' ? 'ebr-7c-mrad' : raw === 'generic-moa' ? 'generic-moa' : 'generic-mil';
}

function narrowAngleUnit(raw: string): AngleUnit {
  return raw === 'MOA' ? 'MOA' : 'MIL';
}

function narrowScope(raw: {
  libraryId: string | null;
  name: string;
  magMin: number;
  magMax: number;
  focalPlane: string;
  fovAtMinRad: number;
  fovAtMaxRad: number;
  trueSubtensionMag: number | null;
  reticleId: string;
  availableElevation: number;
  note: { text: string; sourceUrl: string; readOn: string } | null;
}): ScopeProfile {
  return {
    libraryId: raw.libraryId,
    name: raw.name,
    magMin: raw.magMin,
    magMax: raw.magMax,
    focalPlane: narrowFocalPlane(raw.focalPlane),
    fovAtMinRad: raw.fovAtMinRad,
    fovAtMaxRad: raw.fovAtMaxRad,
    trueSubtensionMag: raw.trueSubtensionMag,
    reticleId: narrowReticleId(raw.reticleId),
    availableElevation: raw.availableElevation,
    note: raw.note
  };
}

export const scopeLibrary: ScopeLibrary = {
  scopes: scopesJson.scopes.map((entry) => ({
    scope: narrowScope(entry.scope),
    angleUnit: narrowAngleUnit(entry.angleUnit),
    clickValue: entry.clickValue,
    facts: entry.facts
  }))
};

export function cartridgeById(id: string): Cartridge | undefined {
  return library.cartridges.find((c) => c.id === id);
}

export function loadsForCartridge(cartridgeId: string): LibraryLoad[] {
  return library.loads.filter((l) => l.cartridgeId === cartridgeId);
}

export function defaultScope(): ScopeProfile {
  return narrowScope(rifleJson.scope);
}

export function genericScope(): ScopeProfile {
  return narrowScope(rifleJson.genericScope);
}

export function defaultRifle(): Rifle {
  return {
    name: rifleJson.name,
    cartridgeId: rifleJson.cartridgeId,
    barrelLengthM: rifleJson.barrelLengthM,
    twistM: rifleJson.twistM,
    twistDirection: rifleJson.twistDirection === 'left' ? 'left' : 'right',
    twistConfirmed: rifleJson.twistConfirmed,
    sightHeightM: rifleJson.sightHeightM,
    zeroRangeM: rifleJson.zeroRangeM,
    angleUnit: narrowAngleUnit(rifleJson.angleUnit),
    clickValue: rifleJson.clickValue,
    scope: defaultScope()
  };
}

export function defaultState(): AppState {
  const rifle = defaultRifle();
  const first = library.loads.find((l) => l.cartridgeId === rifle.cartridgeId);
  if (first === undefined) throw new Error('no library load for the default cartridge');
  const load = activeLoadFromLibrary(first, rifle, library);
  const cartridge = cartridgeById(rifle.cartridgeId);
  const defaults = cartridge?.defaults;
  return {
    version: 1,
    unitSystem: 'imperial',
    rifle,
    load,
    customLoads: [],
    conditions: {
      targetRangeM: defaults?.targetRangeM ?? 274.32,
      windSpeedMps: 2.2352,
      windClock: 3,
      temperatureK: 288.15,
      pressureMode: 'station',
      pressurePa: 101325,
      altitudeM: 0,
      relativeHumidity: 0.5,
      shotAngleRad: 0
    },
    dope: defaults?.dope ?? { startM: 91.44, endM: 548.64, stepM: 45.72 },
    spinDrift: true,
    targetType: 'steel',
    setupDone: false,
    magnification: 10
  };
}

export function blankLoad(cartridgeId: string): ActiveLoad {
  const diameterM = cartridgeById(cartridgeId)?.bulletDiameterM ?? 0.0078232;
  return {
    libraryId: null,
    name: 'My load',
    bulletMassKg: 0.00972,
    bulletDiameterM: diameterM,
    bulletLengthM: null,
    bcG1: null,
    bcG7: null,
    bcRA4: null,
    dragModel: 'G1',
    muzzleVelocityMps: 0,
    velocityMeasured: false,
    origin: { bulletLengthM: 'user', bcG1: 'user', bcG7: 'user', bcRA4: 'user' }
  };
}

export function newRifleState(cartridgeId: string, name: string, unitSystem: UnitSystem): AppState {
  const c = cartridgeById(cartridgeId);
  const rifle: Rifle = {
    name,
    cartridgeId,
    barrelLengthM: c?.defaults.barrelLengthM ?? 0.508,
    twistM: c?.defaults.twistM ?? 0.254,
    twistDirection: 'right',
    twistConfirmed: false,
    sightHeightM: 0.04445,
    zeroRangeM: c?.defaults.zeroRangeM ?? 91.44,
    angleUnit: 'MIL',
    clickValue: 0.1,
    scope: genericScope()
  };
  const first = loadsForCartridge(cartridgeId)[0];
  const load = first === undefined ? blankLoad(cartridgeId) : activeLoadFromLibrary(first, rifle, library);
  const base = defaultState();
  return {
    version: 1,
    unitSystem,
    rifle,
    load,
    customLoads: [],
    conditions: { ...base.conditions, targetRangeM: c?.defaults.targetRangeM ?? 274.32 },
    dope: c?.defaults.dope ?? base.dope,
    spinDrift: true,
    targetType: 'steel',
    setupDone: false,
    magnification: genericScope().magMin * 2,
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function num(v: unknown): boolean {
  return typeof v === 'number' && Number.isFinite(v);
}

function isScopeRecord(v: unknown): boolean {
  if (!isRecord(v)) return false;
  return (
    num(v.magMin) &&
    num(v.magMax) &&
    num(v.fovAtMinRad) &&
    num(v.fovAtMaxRad) &&
    num(v.availableElevation) &&
    typeof v.reticleId === 'string' &&
    typeof v.focalPlane === 'string'
  );
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
  if (typeof x.magnification !== 'number' || !Number.isFinite(x.magnification)) return false;
  if (typeof rifle.cartridgeId !== 'string') return false;
  if (!isScopeRecord(rifle.scope)) return false;
  if (!isRecord(load.origin)) return false;
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

export function migrateV1(x: unknown): AppState | null {
  if (!isRecord(x)) return null;
  const rifle = x.rifle;
  const load = x.load;
  const conditions = x.conditions;
  const dope = x.dope;
  if (!isRecord(rifle) || !isRecord(load) || !isRecord(conditions) || !isRecord(dope)) return null;
  const copy = JSON.parse(JSON.stringify(x)) as Record<string, any>;
  if (copy.rifle.cartridgeId === undefined) copy.rifle.cartridgeId = '308-win';
  if (copy.rifle.scope === undefined) copy.rifle.scope = defaultScope();
  if (copy.magnification === undefined) copy.magnification = 10;
  if (copy.load.bcRA4 === undefined) copy.load.bcRA4 = null;
  if (isRecord(copy.load.origin) && copy.load.origin.bcRA4 === undefined) copy.load.origin.bcRA4 = 'library';
  if (Array.isArray(copy.customLoads)) {
    for (const entry of copy.customLoads) {
      if (!isRecord(entry)) continue;
      if (entry.bcRA4 === undefined) entry.bcRA4 = null;
      if (isRecord(entry.origin) && entry.origin.bcRA4 === undefined) entry.origin.bcRA4 = 'library';
    }
  }
  return isAppState(copy) ? copy : null;
}

export function isSavedState(x: unknown): x is SavedState {
  if (!isRecord(x)) return false;
  if (x.version !== 2) return false;
  if (typeof x.activeId !== 'string') return false;
  if (!Array.isArray(x.profiles) || x.profiles.length === 0) return false;
  for (const p of x.profiles) {
    if (!isRecord(p)) return false;
    if (typeof p.id !== 'string') return false;
    if (!isAppState(p.state)) return false;
  }
  return x.profiles.some((p) => isRecord(p) && p.id === x.activeId);
}

function parse(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function loadSaved(storage: Pick<Storage, 'getItem'>): SavedState {
  const saved = parse(storage.getItem(STORAGE_KEY));
  if (isSavedState(saved)) return saved;
  const v1 = parse(storage.getItem(STORAGE_KEY_V1));
  const migrated = v1 === null ? null : migrateV1(v1);
  if (migrated !== null) {
    return { version: 2, activeId: 'r1', profiles: [{ id: 'r1', state: migrated }] };
  }
  return { version: 2, activeId: 'r1', profiles: [{ id: 'r1', state: defaultState() }] };
}

export function saveSaved(storage: Pick<Storage, 'setItem'>, saved: SavedState): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // full or blocked storage must not crash the app
  }
}

export function activeState(saved: SavedState): AppState {
  const found = saved.profiles.find((p) => p.id === saved.activeId);
  return found?.state ?? saved.profiles[0]?.state ?? defaultState();
}

export function withActiveState(saved: SavedState, state: AppState): SavedState {
  const profiles: SavedProfile[] = saved.profiles.map((p) => (p.id === saved.activeId ? { ...p, state } : p));
  return { ...saved, profiles };
}

export function nextProfileId(saved: SavedState): string {
  let max = 0;
  for (const p of saved.profiles) {
    const m = /^r(\d+)$/.exec(p.id);
    if (m !== null && m[1] !== undefined) {
      const n = Number(m[1]);
      if (n > max) max = n;
    }
  }
  return `r${max + 1}`;
}

export function addProfile(saved: SavedState, cartridgeId: string, name: string): SavedState {
  const id = nextProfileId(saved);
  const state = newRifleState(cartridgeId, name, activeState(saved).unitSystem);
  return { ...saved, activeId: id, profiles: [...saved.profiles, { id, state }] };
}

export function duplicateProfile(saved: SavedState): SavedState {
  const state = activeState(saved);
  const copy = JSON.parse(JSON.stringify(state)) as AppState;
  copy.rifle.name = copy.rifle.name + ' (copy)';
  const id = nextProfileId(saved);
  return { ...saved, activeId: id, profiles: [...saved.profiles, { id, state: copy }] };
}

export function deleteProfile(saved: SavedState, id: string): SavedState {
  if (saved.profiles.length <= 1) return saved;
  const remaining = saved.profiles.filter((p) => p.id !== id);
  if (remaining.length === saved.profiles.length) return saved;
  const activeId = saved.activeId === id ? remaining[0]?.id ?? saved.activeId : saved.activeId;
  return { ...saved, activeId, profiles: remaining };
}

export function selectProfile(saved: SavedState, id: string): SavedState {
  if (!saved.profiles.some((p) => p.id === id)) return saved;
  return { ...saved, activeId: id };
}

export function selectLibraryScope(state: AppState, libraryId: string): AppState {
  const found = scopeLibrary.scopes.find((s) => s.scope.libraryId === libraryId);
  if (found === undefined) return state;
  const scope: ScopeProfile = { ...found.scope };
  const magnification = clampMagnification(state.magnification, scope);
  return {
    ...state,
    rifle: { ...state.rifle, scope, angleUnit: found.angleUnit, clickValue: found.clickValue },
    magnification
  };
}

export function selectGenericScope(state: AppState): AppState {
  const scope: ScopeProfile = { ...genericScope() };
  if (state.rifle.angleUnit === 'MOA') scope.reticleId = 'generic-moa';
  const magnification = clampMagnification(state.magnification, scope);
  return { ...state, rifle: { ...state.rifle, scope }, magnification };
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
