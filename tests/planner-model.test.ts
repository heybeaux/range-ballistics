import { describe, it, expect } from 'vitest';
import { solve } from '../src/solver/solve';
import type { SolveSuccess } from '../src/solver/types';
import type { AppState, LibraryLoad, LoadLibrary } from '../src/planner/types';
import { PLANNING_NOTICE } from '../src/planner/types';
import { effectivePressurePa, toShotInput, makeCorrection, shotResults, dopeRows, estimateVelocityMps, activeLoadFromLibrary, toCsv } from '../src/planner/model';

function testState(): AppState {
  return {
    version: 1,
    unitSystem: 'imperial',
    rifle: { name: 'Test rifle', barrelLengthM: 0.4064, twistM: 0.2794, twistDirection: 'right', twistConfirmed: false, sightHeightM: 0.05, zeroRangeM: 91.44, angleUnit: 'MIL', clickValue: 0.1 },
    load: { libraryId: null, name: 'Test 175', bulletMassKg: 0.01134, bulletDiameterM: 0.007823, bulletLengthM: null, bcG1: 0.5, bcG7: 0.243, dragModel: 'G7', muzzleVelocityMps: 750, velocityMeasured: false, origin: { bulletLengthM: 'user', bcG1: 'user', bcG7: 'user' } },
    customLoads: [],
    conditions: { targetRangeM: 548.64, windSpeedMps: 4.4704, windClock: 3, temperatureK: 288.15, pressureMode: 'station', pressurePa: 101325, altitudeM: 0, relativeHumidity: 0, shotAngleRad: 0 },
    dope: { startM: 91.44, endM: 548.64, stepM: 45.72 },
    spinDrift: false,
    targetType: 'steel',
    setupDone: true
  };
}

function solved(state: AppState): SolveSuccess {
  const input = toShotInput(state);
  if (input === null) throw new Error('no input');
  const r = solve(input);
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r;
}

const rifle = testState().rifle;

describe('effectivePressurePa', () => {
  it('station mode returns the station pressure', () => {
    expect(effectivePressurePa(testState().conditions)).toBe(101325);
  });

  it('altitude mode at 0 m returns 101325 within 1', () => {
    const c = { ...testState().conditions, pressureMode: 'altitude' as const, altitudeM: 0 };
    expect(Math.abs(effectivePressurePa(c) - 101325)).toBeLessThan(1);
  });

  it('altitude mode at 1500 m returns between 84000 and 85000', () => {
    const c = { ...testState().conditions, pressureMode: 'altitude' as const, altitudeM: 1500 };
    const p = effectivePressurePa(c);
    expect(p).toBeGreaterThan(84000);
    expect(p).toBeLessThan(85000);
  });
});

describe('toShotInput', () => {
  it('maps testState to a ShotInput', () => {
    const input = toShotInput(testState());
    expect(input).not.toBeNull();
    if (input === null) return;
    expect(input.bc).toBe(0.243);
    expect(input.dragModel).toBe('G7');
    expect(Math.abs(input.maxRangeM - 598.64)).toBeLessThan(1e-9);
    expect(input.wind).toEqual({ speedMps: 4.4704, clock: 3 });
    expect(input.coriolis).toBeNull();
    expect(input.zeroRangeM).toBe(91.44);
    expect(input.twistM).toBe(0.2794);
  });

  it('G1 drag model uses bcG1', () => {
    const state = { ...testState(), load: { ...testState().load, dragModel: 'G1' as const } };
    const input = toShotInput(state);
    expect(input).not.toBeNull();
    if (input !== null) expect(input.bc).toBe(0.5);
  });

  it('G7 drag model with null bcG7 returns null', () => {
    const state = { ...testState(), load: { ...testState().load, dragModel: 'G7' as const, bcG7: null } };
    expect(toShotInput(state)).toBeNull();
  });

  it('altitude mode pressure lands in the input atmosphere', () => {
    const state = { ...testState(), conditions: { ...testState().conditions, pressureMode: 'altitude' as const, altitudeM: 1500 } };
    const input = toShotInput(state);
    expect(input).not.toBeNull();
    if (input === null) return;
    expect(input.atmosphere.pressurePa).toBeGreaterThan(84000);
    expect(input.atmosphere.pressurePa).toBeLessThan(85000);
  });
});

describe('makeCorrection', () => {
  it('low bullet at 500 m: up, 10 clicks', () => {
    const c = makeCorrection(-0.5, 500, 'elevation', rifle);
    expect(Math.abs(c.mil - 1.0)).toBeLessThan(1e-4);
    expect(Math.abs(c.moa - 3.4377)).toBeLessThan(1e-3);
    expect(c.direction).toBe('up');
    expect(c.clicks).toBe(10);
    expect(c.offsetM).toBe(-0.5);
  });

  it('high bullet at 500 m: down, 10 clicks, positive mil', () => {
    const c = makeCorrection(0.5, 500, 'elevation', rifle);
    expect(c.direction).toBe('down');
    expect(c.clicks).toBe(10);
    expect(c.mil).toBeGreaterThan(0);
  });

  it('windage: left bullet dials right, right bullet dials left', () => {
    const left = makeCorrection(-0.25, 500, 'windage', rifle);
    expect(left.direction).toBe('right');
    expect(left.clicks).toBe(5);
    const right = makeCorrection(0.25, 500, 'windage', rifle);
    expect(right.direction).toBe('left');
    expect(right.clicks).toBe(5);
  });

  it('offset under 0.5 mm: none, 0 clicks', () => {
    const c = makeCorrection(0.0001, 500, 'elevation', rifle);
    expect(c.direction).toBe('none');
    expect(c.clicks).toBe(0);
  });

  it('MOA rifle with 0.25 clicks: 14 clicks for 0.5 m low at 500 m', () => {
    const c = makeCorrection(-0.5, 500, 'elevation', { ...rifle, angleUnit: 'MOA', clickValue: 0.25 });
    expect(c.clicks).toBe(14);
  });
});

describe('shotResults', () => {
  it('results at the target range', () => {
    const state = testState();
    const r = shotResults(state, solved(state));
    expect(r).not.toBeNull();
    if (r === null) return;
    expect(r.rangeM).toBe(548.64);
    expect(r.elevation.direction).toBe('up');
    expect(r.elevation.mil).toBeGreaterThan(3);
    expect(r.elevation.mil).toBeLessThan(6);
    expect(r.windage.direction).toBe('right');
    expect(r.windage.mil).toBeGreaterThan(1.2);
    expect(r.windage.mil).toBeLessThan(2.2);
    expect(r.timeOfFlightS).toBeGreaterThan(0.8);
    expect(r.timeOfFlightS).toBeLessThan(1.1);
    expect(r.velocityMps).toBeGreaterThan(450);
    expect(r.velocityMps).toBeLessThan(600);
    expect(r.spinDriftM).toBeNull();
    expect(r.stabilitySg).toBeNull();
    expect(r.velocityEstimated).toBe(true);
  });

  it('spin drift and stability with a known bullet length', () => {
    const state = { ...testState(), spinDrift: true, load: { ...testState().load, bulletLengthM: 0.0315 } };
    const r = shotResults(state, solved(state));
    expect(r).not.toBeNull();
    if (r === null) return;
    expect(r.spinDriftM).not.toBeNull();
    if (r.spinDriftM !== null) expect(r.spinDriftM).toBeGreaterThan(0);
    expect(r.stabilitySg).not.toBeNull();
    if (r.stabilitySg !== null) expect(r.stabilitySg).toBeGreaterThan(1);
  });

  it('pastTransonic is false at 548.64 m and true at 900 m', () => {
    const state = testState();
    const r = shotResults(state, solved(state));
    expect(r).not.toBeNull();
    if (r !== null) expect(r.pastTransonic).toBe(false);

    const state900 = {
      ...state,
      conditions: { ...state.conditions, targetRangeM: 900 },
      dope: { ...state.dope, endM: 900 }
    };
    const r900 = shotResults(state900, solved(state900));
    expect(r900).not.toBeNull();
    if (r900 !== null) expect(r900.pastTransonic).toBe(true);
  });

  it('returns null when the target range is beyond the solve', () => {
    const result = solved(testState());
    const state = { ...testState(), conditions: { ...testState().conditions, targetRangeM: 5000 } };
    expect(shotResults(state, result)).toBeNull();
  });
});

describe('dopeRows', () => {
  it('builds the 11-row range table', () => {
    const state = testState();
    const rows = dopeRows(state, solved(state));
    expect(rows.length).toBe(11);
    const first = rows[0];
    const last = rows[10];
    expect(first).toBeDefined();
    expect(last).toBeDefined();
    if (first === undefined || last === undefined) return;
    expect(Math.abs(first.rangeM - 91.44)).toBeLessThan(1e-9);
    expect(Math.abs(last.rangeM - 548.64)).toBeLessThan(1e-6);
    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1];
      const curr = rows[i];
      if (prev === undefined || curr === undefined) return;
      expect(curr.elevation.mil).toBeGreaterThan(prev.elevation.mil);
    }
    expect(first.elevation.clicks).toBe(0);
  });

  it('returns [] for stepM 0 and for endM < startM', () => {
    const state = testState();
    const result = solved(state);
    expect(dopeRows({ ...state, dope: { ...state.dope, stepM: 0 } }, result)).toEqual([]);
    expect(dopeRows({ ...state, dope: { startM: 548.64, endM: 91.44, stepM: 45.72 } }, result)).toEqual([]);
  });
});

describe('estimateVelocityMps', () => {
  it('shorter barrel loses velocity', () => {
    const v = estimateVelocityMps(800, 0.6096, 0.4064, 250);
    expect(v).not.toBeNull();
    if (v !== null) expect(Math.abs(v - 749.2)).toBeLessThan(1e-9);
  });

  it('longer or equal barrel keeps the published velocity', () => {
    expect(estimateVelocityMps(800, 0.6096, 0.7, 250)).toBe(800);
  });

  it('returns null when any input is null', () => {
    expect(estimateVelocityMps(800, null, 0.4064, 250)).toBeNull();
    expect(estimateVelocityMps(800, 0.6096, 0.4064, null)).toBeNull();
    expect(estimateVelocityMps(null, 0.6096, 0.4064, 250)).toBeNull();
  });
});

describe('activeLoadFromLibrary', () => {
  function lib(bullet: Partial<LibraryLoad> = {}): LibraryLoad {
    return {
      id: 'x',
      name: 'X',
      bulletMassKg: 0.0109,
      bulletDiameterM: 0.007823,
      bulletLengthM: { value: null, sourceUrl: null, readOn: null },
      bcG1: { value: 0.462, sourceUrl: 'https://example.com', readOn: '2026-11-10' },
      bcG7: { value: null, sourceUrl: null, readOn: null },
      publishedVelocityMps: { value: 800, sourceUrl: 'https://example.com', readOn: '2026-11-10' },
      testBarrelM: 0.6096,
      note: null,
      ...bullet
    };
  }

  function library(): LoadLibrary {
    return {
      loads: [lib()],
      velocityLossMpsPerM: { value: 250, sourceUrl: 'https://example.com', readOn: '2026-11-10' },
      velocityLossNote: ''
    };
  }

  it('copies the library load with an estimated velocity', () => {
    const l = lib();
    const load = activeLoadFromLibrary(l, rifle, library());
    expect(load.dragModel).toBe('G1');
    expect(Math.abs(load.muzzleVelocityMps - 749.2)).toBeLessThan(1e-9);
    expect(load.velocityMeasured).toBe(false);
    expect(load.libraryId).toBe('x');
    expect(load.bcG7).toBeNull();
    expect(load.origin.bcG1).toBe('library');
  });

  it('prefers G7 when published; falls back to published velocity without a test barrel', () => {
    const l7 = lib({ bcG7: { value: 0.224, sourceUrl: 'https://example.com', readOn: '2026-11-10' } });
    expect(activeLoadFromLibrary(l7, rifle, library()).dragModel).toBe('G7');
    const noBarrel = lib({ testBarrelM: null });
    expect(activeLoadFromLibrary(noBarrel, rifle, library()).muzzleVelocityMps).toBe(800);
  });
});

describe('toCsv', () => {
  it('builds the dope card', () => {
    const state = testState();
    const csv = toCsv(state, dopeRows(state, solved(state)), '2026-11-10');
    const lines = csv.split('\n');
    expect(lines[0]).toBe('# Range Ballistics dope card');
    expect(lines).toContain('# ' + PLANNING_NOTICE);
    expect(lines.some((l) => l.includes('Muzzle velocity:') && l.includes('(estimated)'))).toBe(true);
    expect(lines).toContain('# Date: 2026-11-10');
    const header = lines.find((l) => l.startsWith('range_yd,'));
    expect(header).toBeDefined();
    if (header === undefined) return;
    expect(header.startsWith('range_yd,elevation_MIL,')).toBe(true);
    expect(header.endsWith('velocity_fps')).toBe(true);
    const data = lines.filter((l) => !l.startsWith('#') && l !== header);
    expect(data.length).toBe(11);
    const first = data[0];
    const last = data[data.length - 1];
    expect(first).toBeDefined();
    expect(last).toBeDefined();
    if (first === undefined || last === undefined) return;
    expect(first.startsWith('100,')).toBe(true);
    expect(last.startsWith('600,')).toBe(true);
    for (const l of data) {
      expect(l.split(',').length).toBe(9);
    }
  });

  it('omits the estimated marker when the velocity is measured', () => {
    const state = { ...testState(), load: { ...testState().load, velocityMeasured: true } };
    const csv = toCsv(state, dopeRows(state, solved(state)), '2026-11-10');
    expect(csv.includes('(estimated)')).toBe(false);
  });
});
