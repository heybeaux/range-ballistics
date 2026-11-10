You write one pure TypeScript module and its Vitest test. strict mode with noUncheckedIndexedAccess is on. No DOM. No `any`. No imports except vitest in the test.

Files you own:
  src/units/units.ts
  tests/units.test.ts

PURPOSE: a rifle ballistics app keeps every value in SI internally. This module converts at the edge for display and input, in two unit systems, and does the angle maths for scope adjustments.

EXPORTS of src/units/units.ts

export type UnitSystem = 'imperial' | 'metric';
export type AngleUnit = 'MIL' | 'MOA';

// Exact constants
export const YARD_M = 0.9144; export const INCH_M = 0.0254; export const FOOT_M = 0.3048;
export const GRAIN_KG = 0.00006479891; export const MPH_MPS = 0.44704; export const KMH_MPS = 1 / 3.6;
export const INHG_PA = 3386.389; export const HPA_PA = 100; export const FTLB_J = 1.3558179483;

// One entry per quantity. toDisplay converts SI to the display unit; fromDisplay is the inverse.
export type Quantity = 'range' | 'smallLength' | 'velocity' | 'windSpeed' | 'mass' | 'temperature' | 'pressure' | 'energy' | 'altitude' | 'twist';
export interface UnitDef { label: string; decimals: number; toDisplay(si: number): number; fromDisplay(display: number): number }
export function unitFor(quantity: Quantity, system: UnitSystem): UnitDef
  quantity      SI unit   imperial (label, decimals)     metric (label, decimals)
  range         m         yd, 0                          m, 0
  smallLength   m         in, 1                          cm, 1        (drop, drift, sight height)
  velocity      m/s       fps, 0                         m/s, 0
  windSpeed     m/s       mph, 0                         km/h, 0
  mass          kg        gr, 0                          g, 2
  temperature   K         °F, 0                          °C, 0        (F = (K - 273.15) * 9/5 + 32)
  pressure      Pa        inHg, 2                        hPa, 0
  energy        J         ft·lb, 0                       J, 0
  altitude      m         ft, 0                          m, 0
  twist         m         in, 1                          cm, 1        (barrel twist: length per turn)

export function format(siValue: number, quantity: Quantity, system: UnitSystem, withLabel = true): string
  Converts, rounds to the quantity's decimals with toFixed, and appends a space and the label when withLabel is true.
  A result that rounds to zero must not print as "-0" or "-0.0": print "0" or "0.0".
  Non-finite input returns '—' (em dash) with no label.

// Angle maths. offsetM is the bullet's distance from the line of sight (drop or windage) at rangeM.
export const MIL_RAD = 0.001;                         // 1 MIL = 1 milliradian
export const MOA_RAD = Math.PI / (180 * 60);          // true minute of angle
export function offsetToAngle(offsetM: number, rangeM: number, unit: AngleUnit): number
  angle in radians = Math.atan2(offsetM, rangeM), then divided by MIL_RAD or MOA_RAD. rangeM <= 0 returns 0.
export function angleToOffset(angle: number, rangeM: number, unit: AngleUnit): number
  inverse: Math.tan(angle * unitRad) * rangeM.
export function correctionFor(offsetM: number, rangeM: number, unit: AngleUnit): number
  The scope correction that brings the impact back to the aim point: the NEGATIVE of offsetToAngle. (Bullet 1 MIL low: dial +1 MIL up.)
export function clicksFor(correction: number, clickValue: number): number
  Math.round(correction / clickValue). clickValue <= 0 returns 0. Must not return -0.
export function formatCorrection(correction: number, unit: AngleUnit, axis: 'elevation' | 'windage'): string
  Rounds to 1 decimal for MIL and 2 decimals for MOA (use the rounded value to decide the direction).
  elevation: positive -> "U 1.2 MIL", negative -> "D 1.2 MIL".  windage: positive -> "R 0.4 MIL", negative -> "L 0.4 MIL".
  A value that rounds to zero prints "0.0 MIL" or "0.00 MOA" with no letter.

TESTS in tests/units.test.ts (import { describe, it, expect } from 'vitest')
1. Round trip: for every Quantity and both systems, fromDisplay(toDisplay(x)) equals x within 1e-9 relative, for x in [0.5, 12.3, 288.15, 101325].
2. Known values: range 91.44 m imperial -> 100; velocity 800 m/s imperial -> 2624.67 within 0.01; mass 175 * GRAIN_KG imperial -> 175 within 1e-9; temperature 288.15 K imperial -> 59 within 1e-9 and metric -> 15; pressure 101325 Pa imperial -> 29.921 within 0.001 and metric -> 1013.25; windSpeed 4.4704 imperial -> 10; energy 3000 J imperial -> 2212.7 within 0.1; twist 0.2794 imperial -> 11 within 1e-9.
3. format(91.44, 'range', 'imperial') is '100 yd'; format(91.44, 'range', 'metric') is '91 m'; format(0.0254, 'smallLength', 'imperial') is '1.0 in'; format(-0.0001, 'smallLength', 'metric') is '0.0 cm'; format(NaN, 'range', 'metric') is '—'; format(288.15, 'temperature', 'imperial', false) is '59'.
4. offsetToAngle(0.1, 100, 'MIL') is 1.0 within 1e-5. offsetToAngle(0.0254 * 1.047, 91.44, 'MOA') is 1.0 within 0.001.
5. angleToOffset(offsetToAngle(-3.2, 800, u), 800, u) is -3.2 within 1e-9 for both units.
6. correctionFor(-0.5, 500, 'MIL') is +1.0 within 1e-5 (bullet low: dial up). correctionFor(0.25, 500, 'MIL') is -0.5 within 1e-5.
7. clicksFor(1.0, 0.1) is 10; clicksFor(-0.26, 0.1) is -3; clicksFor(0.01, 0.1) is 0 and Object.is(result, -0) is false for clicksFor(-0.01, 0.1); clicksFor(1, 0) is 0; clicksFor(2.5, 0.25) is 10.
8. formatCorrection(1.23, 'MIL', 'elevation') is 'U 1.2 MIL'; (-0.44, 'MIL', 'elevation') is 'D 0.4 MIL'; (0.4, 'MIL', 'windage') is 'R 0.4 MIL'; (-2.256, 'MOA', 'windage') is 'L 2.26 MOA'; (0.04, 'MIL', 'elevation') is '0.0 MIL'; (-0.004, 'MOA', 'windage') is '0.00 MOA'.
9. offsetToAngle(1, 0, 'MIL') is 0.
