// Lead-owned check. A second, independent reference: the velocity tables Federal publishes for
// its two Gold Medal .308 loads (read 2026-11-10 from the pages in research/sources.md).
// Our solver, fed Federal's muzzle velocity and the published G1 BC in a standard atmosphere,
// must reproduce the published downrange velocities within 1%.
//
// Federal does not state the atmosphere or drag model behind its table, so 1% is the honest
// bound. Observed: within 13 fps (0.75%) at 500 yd. With the G7 BC the same loads run up to
// 43 fps (2.4%) slower than Federal's table at 500 yd; that difference is between the two
// published BCs, not a solver error, and is reported in the README.
import { describe, it, expect } from 'vitest';
import { solve, sampleAt } from '../src/solver/solve';
import type { ShotInput } from '../src/solver/types';

const FT = 0.3048;
const YD = 0.9144;

function load(muzzleFps: number, bcG1: number, grains: number): ShotInput {
  return {
    muzzleVelocityMps: muzzleFps * FT,
    bc: bcG1,
    dragModel: 'G1',
    bulletMassKg: grains * 0.00006479891,
    bulletDiameterM: 0.0078232,
    bulletLengthM: null,
    twistM: 0.2794,
    twistDirection: 'right',
    sightHeightM: 0.0381,
    zeroRangeM: 100 * YD,
    maxRangeM: 470,
    shotAngleRad: 0,
    atmosphere: { temperatureK: 288.15, pressurePa: 101325, relativeHumidity: 0 },
    wind: { speedMps: 0, clock: 3 },
    spinDrift: false,
    coriolis: null
  };
}

const TABLES = [
  { name: 'Federal GM308M, 168 gr, G1 0.462', input: load(2650, 0.462, 168), fps: [2460, 2277, 2103, 1936, 1778] },
  { name: 'Federal GM308M2, 175 gr, G1 0.505', input: load(2600, 0.505, 175), fps: [2427, 2262, 2102, 1949, 1803] }
];

describe('solver against Federal published velocity tables', () => {
  for (const table of TABLES) {
    it(`${table.name}: velocity at 100 to 500 yd within 1%`, () => {
      const result = solve(table.input);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      table.fps.forEach((published, i) => {
        const yards = (i + 1) * 100;
        const s = sampleAt(result.samples, yards * YD);
        expect(s, `no sample at ${yards} yd`).not.toBeNull();
        if (s === null) return;
        const ours = s.speedMps / FT;
        expect(Math.abs(ours - published) / published, `${yards} yd: ours ${ours.toFixed(0)} fps, Federal ${published} fps`).toBeLessThan(0.01);
      });
    });
  }
});

// Second build: the same check for the new cartridges. Where a maker gives a BC without naming a
// drag model (CCI, Federal, PMC), the app treats it as G1. These tables are the evidence for
// that choice: with G1, the solver reproduces each maker's own downrange velocities.
// Observed worst case: 0.5% for .22 LR at 150 yd; 1.3% for .223 / 5.56 at 500 yd.
function table(muzzleFps: number, bcG1: number, grains: number, diameterIn: number): ShotInput {
  return { ...load(muzzleFps, bcG1, grains), bulletDiameterM: diameterIn * 0.0254 };
}

const MORE_TABLES = [
  { name: 'CCI Standard Velocity, 40 gr, BC 0.120', input: table(1070, 0.12, 40, 0.2255), yards: [50, 75, 100], fps: [977, 940, 908], bound: 0.01 },
  { name: 'CCI Target Mini-Mag, 40 gr, BC 0.130', input: table(1235, 0.13, 40, 0.2255), yards: [50, 75, 100], fps: [1092, 1040, 998], bound: 0.01 },
  { name: 'Federal 711B, 40 gr, BC 0.138', input: table(1080, 0.138, 40, 0.2255), yards: [50, 100, 150], fps: [994, 930, 878], bound: 0.01 },
  { name: 'Federal 719, 40 gr, BC 0.138', input: table(1200, 0.138, 40, 0.2255), yards: [50, 100, 150], fps: [1075, 991, 928], bound: 0.01 },
  { name: 'Federal GM223M, 69 gr, BC 0.301', input: table(2950, 0.301, 69, 0.224), yards: [100, 200, 300, 400, 500], fps: [2642, 2353, 2084, 1832, 1604], bound: 0.015 },
  { name: 'Federal GM223M3, 77 gr, BC 0.372', input: table(2720, 0.372, 77, 0.224), yards: [100, 200, 300, 400, 500], fps: [2481, 2255, 2041, 1838, 1652], bound: 0.015 },
  { name: 'Federal AE193, 55 gr, BC 0.246', input: table(3165, 0.246, 55, 0.224), yards: [100, 200, 300, 400, 500], fps: [2772, 2412, 2080, 1776, 1506], bound: 0.015 },
  { name: 'Hornady 80269, 73 gr, G1 0.398', input: table(2790, 0.398, 73, 0.224), yards: [100, 200, 300, 400, 500], fps: [2563, 2348, 2143, 1949, 1766], bound: 0.015 },
  { name: 'PMC X-TAC 5.56K from 16 in, 62 gr, BC 0.304', input: table(2920, 0.304, 62, 0.224), yards: [100, 200, 300, 400, 500], fps: [2617, 2333, 2067, 1819, 1595], bound: 0.015 }
];

describe('solver against published velocity tables: .22 LR, .223 Remington, 5.56 NATO', () => {
  for (const t of MORE_TABLES) {
    it(`${t.name}: within ${(t.bound * 100).toFixed(1)}%`, () => {
      const result = solve(t.input);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      t.yards.forEach((yards, i) => {
        const published = t.fps[i];
        const s = sampleAt(result.samples, yards * YD);
        expect(s, `no sample at ${yards} yd`).not.toBeNull();
        if (s === null || published === undefined) return;
        const ours = s.speedMps / FT;
        expect(Math.abs(ours - published) / published, `${yards} yd: ours ${ours.toFixed(0)} fps, published ${published} fps`).toBeLessThan(t.bound);
      });
    });
  }

  it('Federal 711B drop: 50 yd zero, sights 1.5 in, -7.3 in at 100 yd and -24.5 in at 150 yd, within 0.4 in', () => {
    const result = solve({ ...table(1080, 0.138, 40, 0.2255), zeroRangeM: 50 * YD });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const at = (yards: number): number => (sampleAt(result.samples, yards * YD)?.pathM ?? NaN) / 0.0254;
    expect(Math.abs(at(100) - -7.3)).toBeLessThan(0.4);
    expect(Math.abs(at(150) - -24.5)).toBeLessThan(0.4);
  });
});
