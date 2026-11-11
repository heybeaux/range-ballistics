import type { DragModel } from './types';
import g1 from '../data/g1.json';
import g7 from '../data/g7.json';
import ra4 from '../data/ra4.json';

export const BC_LB_IN2_TO_KG_M2 = 703.0696;

const toTable = (pts: number[][]): Array<readonly [number, number]> =>
  pts.map(p => {
    const [m, cd] = p;
    if (m === undefined || cd === undefined) throw new Error('bad drag table row');
    return [m, cd] as const;
  });

const G1_TABLE = toTable(g1.points);
const G7_TABLE = toTable(g7.points);
const RA4_TABLE = toTable(ra4.points);

/**
 * Drag coefficient at a Mach number: linear interpolation between the two
 * neighbouring table points. If mach is below the first point return the
 * first cd. If above the last point return the last cd.
 */
export function dragCoefficient(model: DragModel, mach: number): number {
  let points: Array<readonly [number, number]>;
  switch (model) {
    case 'G1':
      points = G1_TABLE;
      break;
    case 'G7':
      points = G7_TABLE;
      break;
    case 'RA4':
      points = RA4_TABLE;
      break;
  }
  const n = points.length;
  if (n === 0) throw new Error('empty drag table');

  const first = points[0];
  if (first === undefined) throw new Error('empty drag table');
  if (mach <= first[0]) return first[1];

  const last = points[n - 1];
  if (last === undefined) throw new Error('impossible: empty table');
  if (mach >= last[0]) return last[1];

  for (let i = 0; i < n - 1; i++) {
    const row0 = points[i];
    const row1 = points[i + 1];
    if (row0 === undefined || row1 === undefined) throw new Error('impossible: table row missing');
    const m0 = row0[0];
    const m1 = row1[0];
    if (mach >= m0 && mach <= m1) {
      const cd0 = row0[1];
      const cd1 = row1[1];
      const t = (mach - m0) / (m1 - m0);
      return cd0 + t * (cd1 - cd0);
    }
  }
  return last[1];
}

/**
 * Drag deceleration factor k such that acceleration vector = -k * |vr| * vr,
 * where vr is velocity relative to the air.
 * k = (Math.PI / 8) * airDensityKgM3 * dragCoefficient(model, mach) / (bc * BC_LB_IN2_TO_KG_M2)
 * bc is in lb/in^2.
 */
export function dragFactor(
  model: DragModel,
  mach: number,
  bc: number,
  airDensityKgM3: number
): number {
  const cd = dragCoefficient(model, mach);
  return (Math.PI / 8) * airDensityKgM3 * cd / (bc * BC_LB_IN2_TO_KG_M2);
}
