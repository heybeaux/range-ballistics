import type { Atmosphere } from './types';

export const STANDARD_GRAVITY = 9.80665;

/**
 * Saturation vapour pressure of water, pascal. Buck equation.
 * tC = temperatureK - 273.15.
 * es = 611.21 * exp((18.678 - tC / 234.5) * (tC / (257.14 + tC)))
 */
export function saturationVaporPressurePa(temperatureK: number): number {
  const tC = temperatureK - 273.15;
  return 611.21 * Math.exp((18.678 - tC / 234.5) * (tC / (257.14 + tC)));
}

/**
 * Air density kg/m^3 from partial pressures.
 * pv = relativeHumidity * saturationVaporPressurePa(T); pd = pressurePa - pv
 * rho = pd / (287.058 * T) + pv / (461.495 * T)
 */
export function airDensity(atm: Atmosphere): number {
  const T = atm.temperatureK;
  const pv = atm.relativeHumidity * saturationVaporPressurePa(T);
  const pd = atm.pressurePa - pv;
  return pd / (287.058 * T) + pv / (461.495 * T);
}

/**
 * Speed of sound m/s = 331.3 * sqrt(temperatureK / 273.15). Humidity ignored.
 */
export function speedOfSound(temperatureK: number): number {
  return 331.3 * Math.sqrt(temperatureK / 273.15);
}

/**
 * ISA standard pressure (pascal) at an altitude in metres (valid 0 to 11000 m):
 * 101325 * (1 - 2.25577e-5 * altitudeM) ^ 5.25588
 */
export function pressureAtAltitudePa(altitudeM: number): number {
  return 101325 * Math.pow(1 - 2.25577e-5 * altitudeM, 5.25588);
}
