import type { Stability, Atmosphere } from './types';

const INCH_TO_M = 0.0254;
const GRAIN_TO_KG = 0.00006479891;
const M_TO_FT = 1 / 0.3048;

export function millerStability(p: {
  bulletMassKg: number;
  bulletDiameterM: number;
  bulletLengthM: number;
  twistM: number;
  muzzleVelocityMps: number;
  atmosphere: Atmosphere;
}): Stability {
  const m = p.bulletMassKg / GRAIN_TO_KG;
  const d = p.bulletDiameterM / INCH_TO_M;
  const l = p.bulletLengthM / p.bulletDiameterM;
  const t = p.twistM / p.bulletDiameterM;

  const sg0 = (30 * m) / (t * t * d * d * d * l * (1 + l * l));

  const vFps = p.muzzleVelocityMps * M_TO_FT;
  const fv = Math.cbrt(vFps / 2800);

  const fa = (p.atmosphere.temperatureK / 288.15) * (101325 / p.atmosphere.pressurePa);

  const sg = sg0 * fv * fa;

  let status: Stability['status'];
  if (sg >= 1.5) {
    status = 'stable';
  } else if (sg >= 1.0) {
    status = 'marginal';
  } else {
    status = 'unstable';
  }

  return { sg, status };
}

export function spinDriftM(sg: number, timeOfFlightS: number, twistDirection: 'right' | 'left'): number {
  if (timeOfFlightS <= 0) {
    return 0;
  }

  const driftInches = 1.25 * (sg + 1.2) * Math.pow(timeOfFlightS, 1.83);
  const driftM = driftInches * INCH_TO_M;

  return twistDirection === 'right' ? driftM : -driftM;
}
