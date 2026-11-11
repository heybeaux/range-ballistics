// Scout-owned check. The coder does not edit this file.
// Reference shots for every library cartridge beyond .308: .22 LR (G1 and RA4), .223 Remington,
// 5.56x45 NATO, and the 2026-11-11 additions (6.5 CM, 6.5 PRC, .243, 7mm-08, 7mm RM, 7mm PRC,
// .270, .30-06, .300 WM, .300 PRC, .450 BM), through the public solve() entry: our own zero
// solve, our own spin drift. Tolerance from the spec: 0.05 MIL at that range, or 1%, whichever is larger.
import { describe, it, expect } from 'vitest';
import reference from './reference/cases-cartridges.json';
import { solve, sampleAt } from '../src/solver/solve';
import type { ShotInput } from '../src/solver/types';

function tolerance(rangeM: number, value: number): number {
  return Math.max(0.00005 * rangeM, 0.01 * Math.abs(value));
}

describe('solve() against py-ballisticcalc: rimfire and .224 cartridges', () => {
  for (const c of reference.cases) {
    it(c.name, () => {
      const result = solve(c.input as unknown as ShotInput);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(Math.abs(result.zeroAngleRad - c.zeroAngleRad), 'zero angle').toBeLessThanOrEqual(0.00002);
      for (const row of c.rows) {
        const s = sampleAt(result.samples, row.rangeM);
        expect(s, `no sample at ${row.rangeM} m`).not.toBeNull();
        if (s === null) continue;
        expect(Math.abs(s.pathM - row.pathM), `path at ${row.rangeM} m`).toBeLessThanOrEqual(tolerance(row.rangeM, row.pathM));
        expect(Math.abs(s.windageM - row.windageM), `windage at ${row.rangeM} m`).toBeLessThanOrEqual(tolerance(row.rangeM, row.windageM));
        expect(Math.abs(s.speedMps - row.speedMps), `speed at ${row.rangeM} m`).toBeLessThanOrEqual(0.01 * row.speedMps);
        expect(Math.abs(s.timeS - row.timeS), `time at ${row.rangeM} m`).toBeLessThanOrEqual(0.01 * row.timeS);
        // The reference reports Mach from ground speed; ours is from airspeed. They agree only in still air.
        if (c.input.wind.speedMps === 0) {
          expect(Math.abs(s.mach - row.mach), `mach at ${row.rangeM} m`).toBeLessThanOrEqual(0.01 * row.mach);
        }
      }
    });
  }
});
