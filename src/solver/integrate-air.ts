import type { Atmosphere } from './types';
import { airDensity, speedOfSound } from './atmosphere';

export const LAPSE_RATE_K_PER_M = 0.0065;
export const DENSITY_EXPONENT = 4.25588;

export interface AirAtHeight {
  densityKgM3: number;
  speedOfSoundMps: number;
  temperatureK: number;
}

export function makeAirModel(atm: Atmosphere): (heightM: number) => AirAtHeight {
  const rho0 = airDensity(atm);
  const T0 = atm.temperatureK;

  return (heightM: number): AirAtHeight => {
    const y = Math.min(11000, Math.max(-5000, heightM));
    const T = T0 - LAPSE_RATE_K_PER_M * y;
    const density = rho0 * Math.pow(T / T0, DENSITY_EXPONENT);
    const c = speedOfSound(T);
    return {
      densityKgM3: density,
      speedOfSoundMps: c,
      temperatureK: T,
    };
  };
}
