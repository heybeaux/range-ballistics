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
