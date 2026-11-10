// Scout-owned check. The coder does not edit this file.
// Flies each reference case with the reference solver's own zero angle, so this isolates the
// integrator, drag, atmosphere and wind handling from the zero solve.
import { describe, it, expect } from 'vitest';
import reference from './reference/cases.json';
import { integrate, sampleAtRange } from '../src/solver/integrate';
import type { ShotInput } from '../src/solver/types';

/** Spec tolerance: 0.05 MIL of angle at that range, or 1% of the value, whichever is larger. */
function tolerance(rangeM: number, value: number): number {
  return Math.max(0.00005 * rangeM, 0.01 * Math.abs(value));
}

describe('integrator against py-ballisticcalc', () => {
  for (const c of reference.cases) {
    if (c.input.spinDrift) continue; // spin drift is checked through solve()
    it(c.name, () => {
      const input = c.input as unknown as ShotInput;
      const samples = integrate(input, c.zeroAngleRad);
      for (const row of c.rows) {
        const s = sampleAtRange(samples, row.rangeM);
        expect(s, `no sample at ${row.rangeM} m`).not.toBeNull();
        if (s === null) continue;
        expect(Math.abs(s.pathM - row.pathM), `path at ${row.rangeM} m`).toBeLessThanOrEqual(tolerance(row.rangeM, row.pathM));
        expect(Math.abs(s.position.z - row.windageM), `windage at ${row.rangeM} m`).toBeLessThanOrEqual(tolerance(row.rangeM, row.windageM));
        expect(Math.abs(s.speedMps - row.speedMps), `speed at ${row.rangeM} m`).toBeLessThanOrEqual(0.01 * row.speedMps);
        expect(Math.abs(s.timeS - row.timeS), `time at ${row.rangeM} m`).toBeLessThanOrEqual(0.01 * row.timeS);
      }
    });
  }
});
