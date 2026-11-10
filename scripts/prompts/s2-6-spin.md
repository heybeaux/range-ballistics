You write one pure TypeScript module and its Vitest test for a rifle ballistics solver. strict mode with noUncheckedIndexedAccess is on. No DOM. No `any`. Inputs are SI; the two published formulas below use imperial units, so convert inside the functions.

Files you own:
  src/solver/spin.ts
  tests/spin.test.ts

Existing types you import from './types' (do not redefine):
export interface Stability { sg: number; status: 'stable' | 'marginal' | 'unstable' }
export interface Atmosphere { temperatureK: number; pressurePa: number; relativeHumidity: number }

CONSTANTS: 1 inch = 0.0254 m. 1 grain = 0.00006479891 kg. 1 ft = 0.3048 m.

EXPORTS
export function millerStability(p: { bulletMassKg: number; bulletDiameterM: number; bulletLengthM: number; twistM: number; muzzleVelocityMps: number; atmosphere: Atmosphere }): Stability
  Miller twist rule with the usual corrections:
    m = mass in grains; d = diameter in inches; l = bulletLengthM / bulletDiameterM (length in calibres); t = twistM / bulletDiameterM (twist in calibres per turn)
    sg0 = 30 * m / (t*t * d*d*d * l * (1 + l*l))
    velocity correction: fv = cbrt(vFps / 2800) where vFps = muzzleVelocityMps / 0.3048
    atmosphere correction: fa = (temperatureK / 288.15) * (101325 / pressurePa)
    sg = sg0 * fv * fa
  status: sg >= 1.5 'stable'; sg >= 1.0 'marginal'; otherwise 'unstable'.

export function spinDriftM(sg: number, timeOfFlightS: number, twistDirection: 'right' | 'left'): number
  Litz approximation: drift in inches = 1.25 * (sg + 1.2) * timeOfFlightS ** 1.83. Convert to metres.
  Right-hand twist drifts right (positive). Left-hand twist drifts left (negative). timeOfFlightS <= 0 returns 0.

TESTS in tests/spin.test.ts (import { describe, it, expect } from 'vitest')
const std = { temperatureK: 288.15, pressurePa: 101325, relativeHumidity: 0 };
const b175 = { bulletMassKg: 175 * 0.00006479891, bulletDiameterM: 0.308 * 0.0254, bulletLengthM: 1.24 * 0.0254, twistM: 11 * 0.0254, muzzleVelocityMps: 750, atmosphere: std };
1. millerStability(b175).sg is 1.947 within 0.01 and status is 'stable'.
2. spinDriftM(millerStability(b175).sg, 1.9151, 'right') is 0.3282 within 0.002 (independent solver value).
3. Left twist gives exactly the negative of right twist.
4. spinDriftM(2, 0, 'right') is 0 and spinDriftM(2, -1, 'right') is 0.
5. A slower twist (twistM = 14 * 0.0254) gives a lower sg than 11 inches; a faster twist (8 inches) gives a higher sg.
6. Thin air raises sg: pressurePa 70000 gives a higher sg than 101325. Cold raises density, so temperatureK 253.15 gives a lower sg than 288.15.
7. Status boundaries: build cases by changing twistM until sg is below 1.0 (use twistM = 16 * 0.0254: expect 'unstable') and check a 'marginal' case with twistM = 13 * 0.0254 (expect sg between 1.0 and 1.5 and status 'marginal').
8. Higher muzzle velocity gives a higher sg.
