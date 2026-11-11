// Lead-owned test fixtures. Tests build on these so a contract change is fixed in one place.
import type { AppState, Cartridge, LibraryLoad, LoadLibrary, Rifle, ScopeProfile, Sourced } from '../../src/planner/types';

export const none: Sourced = { value: null, sourceUrl: null, readOn: null };
export const src = (value: number): Sourced => ({ value, sourceUrl: 'https://example.com', readOn: '2026-11-10' });

export function testScope(): ScopeProfile {
  return {
    libraryId: null,
    name: 'Test scope',
    magMin: 5,
    magMax: 25,
    focalPlane: 'first',
    fovAtMinRad: 0.0706,
    fovAtMaxRad: 0.01567,
    trueSubtensionMag: null,
    reticleId: 'generic-mil',
    availableElevation: 19,
    note: null
  };
}

export function testRifle(): Rifle {
  return {
    name: 'Test rifle',
    cartridgeId: 'test-308',
    barrelLengthM: 0.4064,
    twistM: 0.2794,
    twistDirection: 'right',
    twistConfirmed: false,
    sightHeightM: 0.05,
    zeroRangeM: 91.44,
    angleUnit: 'MIL',
    clickValue: 0.1,
    scope: testScope()
  };
}

/** 750 m/s, G7 0.243, 175 gr: the same shot as the reference case g7-175-wind-4.5mps-from-3. */
export function testState(): AppState {
  return {
    version: 1,
    unitSystem: 'imperial',
    rifle: testRifle(),
    load: {
      libraryId: null,
      name: 'Test 175',
      bulletMassKg: 0.01134,
      bulletDiameterM: 0.007823,
      bulletLengthM: null,
      bcG1: 0.5,
      bcG7: 0.243,
      bcRA4: null,
      dragModel: 'G7',
      muzzleVelocityMps: 750,
      velocityMeasured: false,
      origin: { bulletLengthM: 'user', bcG1: 'user', bcG7: 'user', bcRA4: 'user' }
    },
    customLoads: [],
    conditions: {
      targetRangeM: 548.64,
      windSpeedMps: 4.4704,
      windClock: 3,
      temperatureK: 288.15,
      pressureMode: 'station',
      pressurePa: 101325,
      altitudeM: 0,
      relativeHumidity: 0,
      shotAngleRad: 0
    },
    dope: { startM: 91.44, endM: 548.64, stepM: 45.72 },
    spinDrift: false,
    targetType: 'steel',
    setupDone: true,
    magnification: 10
  };
}

export function testCartridge(overrides: Partial<Cartridge> = {}): Cartridge {
  return {
    id: 'test-308',
    name: 'Test .308',
    bulletDiameterM: 0.007823,
    diameterSource: { text: 'test', sourceUrl: 'https://example.com', readOn: '2026-11-10' },
    velocityLossMpsPerM: src(250),
    velocityLossNote: 'test note',
    safetyNote: null,
    defaults: {
      targetRangeM: 274.32,
      zeroRangeM: 91.44,
      dope: { startM: 91.44, endM: 548.64, stepM: 45.72 },
      twistM: 0.2794,
      barrelLengthM: 0.4064
    },
    ...overrides
  };
}

/** A library load: 800 m/s from a 0.6096 m (24 in) test barrel, G1 0.462 only. */
export function testLoad(overrides: Partial<LibraryLoad> = {}): LibraryLoad {
  return {
    id: 'x',
    cartridgeId: 'test-308',
    name: 'X',
    bulletMassKg: 0.0109,
    bulletDiameterM: 0.007823,
    bulletLengthM: none,
    bcG1: src(0.462),
    bcG7: none,
    bcRA4: none,
    bcModelStated: true,
    publishedVelocityMps: src(800),
    testBarrelM: 0.6096,
    velocityByBarrel: [],
    note: null,
    ...overrides
  };
}

export function testLibrary(loads: LibraryLoad[] = [testLoad()], cartridges: Cartridge[] = [testCartridge()]): LoadLibrary {
  return { cartridges, loads };
}
