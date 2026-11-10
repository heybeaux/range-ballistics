import type { ShotInput } from './types';
import { integrate, sampleAtRange } from './integrate';

export function findZeroAngle(input: ShotInput): number {
  const copy: ShotInput = {
    ...input,
    shotAngleRad: 0,
    wind: { speedMps: 0, clock: 12 },
    coriolis: null,
    maxRangeM: input.zeroRangeM + 1,
  };

  const f = (angle: number): number => {
    const samples = integrate(copy, angle);
    const sample = sampleAtRange(samples, input.zeroRangeM);
    if (sample === null) {
      return -1;
    }
    return sample.pathM;
  };

  let lo = -0.02;
  let hi = 0.2;

  const fHi = f(hi);
  if (fHi < 0) {
    throw new Error('zero range is out of reach');
  }

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const fMid = f(mid);
    if (fMid < 0) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  return (lo + hi) / 2;
}
