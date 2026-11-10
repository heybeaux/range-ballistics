You change one existing TypeScript function and add tests. strict mode with noUncheckedIndexedAccess is on. No `any`.

Files you own (return BOTH in full):
  src/solver/integrate-air.ts      (new, small)
  tests/integrate-air.test.ts      (new)

Do not return integrate.ts. A reviewer will wire your new function into it.

WHY: an independent solver disagrees with ours by more than 1% on steep shots (20 degrees downhill, 780 m: speed off by 4.4 m/s). The cause: our air density and speed of sound are constant, but a bullet that drops 300 m flies through denser air. The fix is the standard lapse rate applied to bullet height.

Existing code you import:
// src/solver/types.ts
export interface Atmosphere { temperatureK: number; pressurePa: number; relativeHumidity: number }
// src/solver/atmosphere.ts
export function airDensity(atm: Atmosphere): number;         // kg/m^3 at the muzzle
export function speedOfSound(temperatureK: number): number;  // m/s

BUILD in src/solver/integrate-air.ts
export const LAPSE_RATE_K_PER_M = 0.0065;
export const DENSITY_EXPONENT = 4.25588;

export interface AirAtHeight { densityKgM3: number; speedOfSoundMps: number; temperatureK: number }

/** Returns a function giving the air at a height in metres above the muzzle (negative = below).
 *  T(y) = T0 - LAPSE_RATE_K_PER_M * y
 *  density(y) = rho0 * (T(y) / T0) ** DENSITY_EXPONENT          where rho0 = airDensity(atm), T0 = atm.temperatureK
 *  speed of sound(y) = speedOfSound(T(y))
 *  Clamp y to the range -5000..11000 before use so T stays positive.
 *  rho0 must be computed once, when makeAirModel is called, not on every lookup. */
export function makeAirModel(atm: Atmosphere): (heightM: number) => AirAtHeight

TESTS in tests/integrate-air.test.ts (import { describe, it, expect } from 'vitest')
const std = { temperatureK: 288.15, pressurePa: 101325, relativeHumidity: 0 };
1. At height 0: densityKgM3 equals airDensity(std) within 1e-12, speedOfSoundMps equals speedOfSound(288.15) within 1e-12, temperatureK is 288.15.
2. At height -347.89 the density divided by the density at 0 is 1.0338 within 0.0008 (independent solver value).
3. At height +1000 the density ratio is 0.9075 within 0.001 and temperatureK is 281.65 within 1e-9.
4. Density falls as height rises: check -500 > 0 > 500 > 2000.
5. Speed of sound falls as height rises: 0 > 1000.
6. Clamping: height 50000 gives the same result as height 11000; height -99999 gives the same as -5000.
7. A humid, hot atmosphere (303.15 K, 101325 Pa, humidity 0.9) at height 0 returns airDensity of that atmosphere within 1e-12.
