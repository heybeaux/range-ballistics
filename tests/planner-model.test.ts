import { describe, it, expect } from 'vitest';
import { solve } from '../src/solver/solve';
import type { SolveSuccess } from '../src/solver/types';
import type { AppState } from '../src/planner/types';
import { PLANNING_NOTICE } from '../src/planner/types';
import {
  effectivePressurePa,
  toShotInput,
  makeCorrection,
  shotResults,
  dopeRows,
  estimateVelocityMps,
  activeLoadFromLibrary,
  toCsv,
  muzzleRegimeOf,
  velocityForBarrel,
  clampMagnification
} from '../src/planner/model';
import { testState, testRifle, testLoad, testLibrary, testCartridge, src, none } from './helpers/fixtures';

function solved(state: AppState): SolveSuccess {
  const input = toShotInput(state);
  if (input === null) throw new Error('no input');
  const r = solve(input);
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r;
}

const rifle = testRifle();

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

  it('RA4 drag model uses bcRA4', () => {
    const state = { ...testState(), load: { ...testState().load, dragModel: 'RA4' as const, bcRA4: 0.112 } };
    const input = toShotInput(state);
    expect(input).not.toBeNull();
    if (input !== null) {
      expect(input.bc).toBe(0.112);
      expect(input.dragModel).toBe('RA4');
    }
  });

  it('RA4 drag model with null bcRA4 returns null', () => {
    const state = { ...testState(), load: { ...testState().load, dragModel: 'RA4' as const, bcRA4: null } };
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

  it('small elevation correction: beyondDial false, holdRemaining 0', () => {
    const c = makeCorrection(-0.5, 500, 'elevation', rifle);
    expect(c.beyondDial).toBe(false);
    expect(c.holdRemaining).toBe(0);
  });

  it('10 m low at 500 m exceeds the 19 MIL dial: beyondDial with 1 MIL left to hold', () => {
    const c = makeCorrection(-10, 500, 'elevation', rifle);
    expect(c.beyondDial).toBe(true);
    expect(Math.abs(c.holdRemaining - 1.0)).toBeLessThan(0.01);
    expect(c.clicks).toBe(200);
  });

  it('beyondDial is false for a down correction and for windage', () => {
    expect(makeCorrection(10, 500, 'elevation', rifle).beyondDial).toBe(false);
    expect(makeCorrection(-10, 500, 'windage', rifle).beyondDial).toBe(false);
  });

  it('beyondDial is false when the scope can dial the full correction', () => {
    const bigScope = { ...rifle, scope: { ...rifle.scope, availableElevation: 25 } };
    expect(makeCorrection(-10, 500, 'elevation', bigScope).beyondDial).toBe(false);
  });
});

describe('muzzleRegimeOf', () => {
  it('classifies the muzzle mach number', () => {
    expect(muzzleRegimeOf(2)).toBe('supersonic');
    expect(muzzleRegimeOf(1.2)).toBe('supersonic');
    expect(muzzleRegimeOf(1.19)).toBe('transonic');
    expect(muzzleRegimeOf(1.0)).toBe('transonic');
    expect(muzzleRegimeOf(0.95)).toBe('subsonic');
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
    expect(r.muzzleRegime).toBe('supersonic');
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

  it('subsonic .22 LR shot: subsonic regime, no pastTransonic, up correction', () => {
    const state: AppState = {
      ...testState(),
      load: {
        ...testState().load,
        bulletMassKg: 0.002592,
        bulletDiameterM: 0.0057277,
        bcG1: 0.138,
        bcG7: null,
        dragModel: 'G1',
        muzzleVelocityMps: 329
      },
      rifle: { ...testRifle(), zeroRangeM: 45.72, twistM: 0.4064 },
      conditions: { ...testState().conditions, targetRangeM: 91.44 },
      dope: { startM: 22.86, endM: 182.88, stepM: 22.86 }
    };
    const r = shotResults(state, solved(state));
    expect(r).not.toBeNull();
    if (r === null) return;
    expect(r.muzzleRegime).toBe('subsonic');
    expect(r.pastTransonic).toBe(false);
    expect(r.elevation.direction).toBe('up');
    expect(r.elevation.mil).toBeGreaterThan(1.5);
    expect(r.elevation.mil).toBeLessThan(3.0);
    expect(r.velocityMps).toBeGreaterThan(270);
    expect(r.velocityMps).toBeLessThan(300);
  });

  it('transonic .22 LR start: transonic regime, subsonic range within the solve', () => {
    const state: AppState = {
      ...testState(),
      load: {
        ...testState().load,
        bulletMassKg: 0.002592,
        bulletDiameterM: 0.0057277,
        bcG1: 0.13,
        bcG7: null,
        dragModel: 'G1',
        muzzleVelocityMps: 376
      },
      rifle: { ...testRifle(), zeroRangeM: 45.72, twistM: 0.4064 },
      conditions: { ...testState().conditions, targetRangeM: 91.44 },
      dope: { startM: 22.86, endM: 182.88, stepM: 22.86 }
    };
    const r = shotResults(state, solved(state));
    expect(r).not.toBeNull();
    if (r === null) return;
    expect(r.muzzleRegime).toBe('transonic');
    expect(r.pastTransonic).toBe(false);
    expect(r.subsonicRangeM).not.toBeNull();
    if (r.subsonicRangeM !== null) {
      expect(r.subsonicRangeM).toBeGreaterThan(5);
      expect(r.subsonicRangeM).toBeLessThan(120);
    }
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
  it('copies the library load with an estimated velocity', () => {
    const load = activeLoadFromLibrary(testLoad(), rifle, testLibrary());
    expect(load.dragModel).toBe('G1');
    expect(Math.abs(load.muzzleVelocityMps - 749.2)).toBeLessThan(1e-9);
    expect(load.velocityMeasured).toBe(false);
    expect(load.libraryId).toBe('x');
    expect(load.bcG7).toBeNull();
    expect(load.origin.bcG1).toBe('library');
  });

  it('prefers G7 when published; falls back to published velocity without a test barrel', () => {
    const l7 = testLoad({ bcG7: src(0.224) });
    expect(activeLoadFromLibrary(l7, rifle, testLibrary([l7])).dragModel).toBe('G7');
    const noBarrel = testLoad({ testBarrelM: null });
    expect(activeLoadFromLibrary(noBarrel, rifle, testLibrary([noBarrel])).muzzleVelocityMps).toBe(800);
  });

  it('falls back to RA4 when only bcRA4 is published', () => {
    const load = activeLoadFromLibrary(
      testLoad({ bcG1: none, bcRA4: src(0.112), publishedVelocityMps: none }),
      rifle,
      testLibrary()
    );
    expect(load.dragModel).toBe('RA4');
    expect(load.bcRA4).toBe(0.112);
    expect(load.muzzleVelocityMps).toBe(0);
    expect(load.origin.bcRA4).toBe('library');
  });

  it('uses the load\'s own cartridge for the velocity loss figure', () => {
    const lib = testLoad();
    const library = testLibrary(
      [lib],
      [testCartridge({ id: 'other', velocityLossMpsPerM: src(999) }), testCartridge()]
    );
    const load = activeLoadFromLibrary(lib, rifle, library);
    expect(Math.abs(load.muzzleVelocityMps - 749.2)).toBeLessThan(1e-9);
  });
});

describe('velocityForBarrel', () => {
  it('estimates from the test barrel and the cartridge loss figure', () => {
    const v = velocityForBarrel(testLoad(), 0.4064, testCartridge());
    expect(Math.abs((v.velocityMps ?? 0) - 749.2)).toBeLessThan(1e-9);
    expect(v.basis).toBe('estimated');
  });

  it('keeps the published velocity when no estimate is possible', () => {
    const noLoss = velocityForBarrel(testLoad(), 0.4064, testCartridge({ velocityLossMpsPerM: none }));
    expect(noLoss.velocityMps).toBe(800);
    expect(noLoss.basis).toBe('published');
    const noCartridge = velocityForBarrel(testLoad(), 0.4064, undefined);
    expect(noCartridge.velocityMps).toBe(800);
    expect(noCartridge.basis).toBe('published');
    const noTestBarrel = velocityForBarrel(testLoad({ testBarrelM: null }), 0.4064, testCartridge());
    expect(noTestBarrel.velocityMps).toBe(800);
    expect(noTestBarrel.basis).toBe('published');
  });

  it('returns null with basis none when nothing is published', () => {
    const v = velocityForBarrel(testLoad({ publishedVelocityMps: none }), 0.4064, testCartridge());
    expect(v.velocityMps).toBeNull();
    expect(v.basis).toBe('none');
  });

  it('published barrels: exact, near, interpolated and nearest', () => {
    const lib = testLoad({
      velocityByBarrel: [
        { barrelM: 0.4064, velocityMps: 890 },
        { barrelM: 0.508, velocityMps: 945 }
      ]
    });
    const at = (barrelLengthM: number) => velocityForBarrel(lib, barrelLengthM, testCartridge());
    expect(at(0.4064)).toEqual({ velocityMps: 890, basis: 'published-barrel' });
    expect(at(0.41)).toEqual({ velocityMps: 890, basis: 'published-barrel' });
    expect(at(0.508)).toEqual({ velocityMps: 945, basis: 'published-barrel' });
    const mid = at(0.4572);
    expect(Math.abs((mid.velocityMps ?? 0) - 917.5)).toBeLessThan(1e-6);
    expect(mid.basis).toBe('interpolated');
    expect(at(0.3)).toEqual({ velocityMps: 890, basis: 'nearest-barrel' });
    expect(at(0.66)).toEqual({ velocityMps: 945, basis: 'nearest-barrel' });
  });
});

describe('clampMagnification', () => {
  it('keeps the value in the scope range and maps NaN to magMin', () => {
    const scope = rifle.scope;
    expect(clampMagnification(10, scope)).toBe(10);
    expect(clampMagnification(1, scope)).toBe(5);
    expect(clampMagnification(99, scope)).toBe(25);
    expect(clampMagnification(NaN, scope)).toBe(5);
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
