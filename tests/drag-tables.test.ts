import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import g1 from '../src/data/g1.json';
import g7 from '../src/data/g7.json';
import ra4 from '../src/data/ra4.json';

// The drag tables are generated from py-ballisticcalc, never typed by hand or by a model.
// These checksums fail if any point is changed, added, or removed.
const sha = (points: number[][]): string =>
  createHash('sha256').update(JSON.stringify(points)).digest('hex');

const cdAt = (points: number[][], mach: number): number | undefined =>
  points.find(p => p[0] === mach)?.[1];

describe('drag tables', () => {
  it('G1 has 79 points and the recorded checksum', () => {
    expect(g1.points.length).toBe(79);
    expect(sha(g1.points)).toBe('441c511fb0619f607e73c6abe29eeaedb99a90dc4cf5bc6276af00a2b4a7f43f');
  });

  it('G7 has 84 points and the recorded checksum', () => {
    expect(g7.points.length).toBe(84);
    expect(sha(g7.points)).toBe('c7c9b1aaa0b35eea461c1bbb16b04d43e75cad28f1b12bfa33171f1584d3c22a');
  });

  it('RA4 has 87 points and the recorded checksum', () => {
    expect(ra4.points.length).toBe(87);
    expect(sha(ra4.points)).toBe('926219f7ca07bb56bda13ae6d705a0b8872a1cd0327c3e93cce32666c8e57cb1');
    expect(cdAt(ra4.points, 0)).toBe(0.2283);
    expect(cdAt(ra4.points, 1)).toBe(0.3975);
    expect(cdAt(ra4.points, 4)).toBe(0.4969);
  });

  it('spot values match the published tables', () => {
    expect(cdAt(g1.points, 0)).toBe(0.2629);
    expect(cdAt(g1.points, 2)).toBe(0.5934);
    expect(cdAt(g1.points, 5)).toBe(0.4988);
    expect(cdAt(g7.points, 0)).toBe(0.1198);
    expect(cdAt(g7.points, 2)).toBe(0.298);
    expect(cdAt(g7.points, 5)).toBe(0.1618);
  });

  it('Mach values strictly increase and every Cd is positive', () => {
    for (const table of [g1.points, g7.points, ra4.points]) {
      for (let i = 0; i < table.length; i++) {
        const row = table[i];
        const prev = table[i - 1];
        expect(row?.length).toBe(2);
        expect(row?.[1]).toBeGreaterThan(0);
        if (prev !== undefined && row !== undefined) {
          expect(row[0]).toBeGreaterThan(prev[0] ?? Infinity);
        }
      }
    }
  });
});
