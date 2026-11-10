export type UnitSystem = 'imperial' | 'metric';
export type AngleUnit = 'MIL' | 'MOA';

export const YARD_M = 0.9144;
export const INCH_M = 0.0254;
export const FOOT_M = 0.3048;
export const GRAIN_KG = 0.00006479891;
export const MPH_MPS = 0.44704;
export const KMH_MPS = 1 / 3.6;
export const INHG_PA = 3386.389;
export const HPA_PA = 100;
export const FTLB_J = 1.3558179483;

export type Quantity = 'range' | 'smallLength' | 'velocity' | 'windSpeed' | 'mass' | 'temperature' | 'pressure' | 'energy' | 'altitude' | 'twist';

export interface UnitDef {
  label: string;
  decimals: number;
  toDisplay(si: number): number;
  fromDisplay(display: number): number;
}

export function unitFor(quantity: Quantity, system: UnitSystem): UnitDef {
  switch (quantity) {
    case 'range':
      if (system === 'imperial') {
        return { label: 'yd', decimals: 0, toDisplay: (si) => si / YARD_M, fromDisplay: (d) => d * YARD_M };
      }
      return { label: 'm', decimals: 0, toDisplay: (si) => si, fromDisplay: (d) => d };
    case 'smallLength':
      if (system === 'imperial') {
        return { label: 'in', decimals: 1, toDisplay: (si) => si / INCH_M, fromDisplay: (d) => d * INCH_M };
      }
      return { label: 'cm', decimals: 1, toDisplay: (si) => si * 100, fromDisplay: (d) => d / 100 };
    case 'velocity':
      if (system === 'imperial') {
        return { label: 'fps', decimals: 0, toDisplay: (si) => si / FOOT_M, fromDisplay: (d) => d * FOOT_M };
      }
      return { label: 'm/s', decimals: 0, toDisplay: (si) => si, fromDisplay: (d) => d };
    case 'windSpeed':
      if (system === 'imperial') {
        return { label: 'mph', decimals: 0, toDisplay: (si) => si / MPH_MPS, fromDisplay: (d) => d * MPH_MPS };
      }
      return { label: 'km/h', decimals: 0, toDisplay: (si) => si / KMH_MPS, fromDisplay: (d) => d * KMH_MPS };
    case 'mass':
      if (system === 'imperial') {
        return { label: 'gr', decimals: 0, toDisplay: (si) => si / GRAIN_KG, fromDisplay: (d) => d * GRAIN_KG };
      }
      return { label: 'g', decimals: 2, toDisplay: (si) => si * 1000, fromDisplay: (d) => d / 1000 };
    case 'temperature':
      if (system === 'imperial') {
        return {
          label: '°F',
          decimals: 0,
          toDisplay: (si) => (si - 273.15) * (9 / 5) + 32,
          fromDisplay: (d) => ((d - 32) * (5 / 9)) + 273.15
        };
      }
      return {
        label: '°C',
        decimals: 0,
        toDisplay: (si) => si - 273.15,
        fromDisplay: (d) => d + 273.15
      };
    case 'pressure':
      if (system === 'imperial') {
        return { label: 'inHg', decimals: 2, toDisplay: (si) => si / INHG_PA, fromDisplay: (d) => d * INHG_PA };
      }
      return { label: 'hPa', decimals: 0, toDisplay: (si) => si / HPA_PA, fromDisplay: (d) => d * HPA_PA };
    case 'energy':
      if (system === 'imperial') {
        return { label: 'ft·lb', decimals: 0, toDisplay: (si) => si / FTLB_J, fromDisplay: (d) => d * FTLB_J };
      }
      return { label: 'J', decimals: 0, toDisplay: (si) => si, fromDisplay: (d) => d };
    case 'altitude':
      if (system === 'imperial') {
        return { label: 'ft', decimals: 0, toDisplay: (si) => si / FOOT_M, fromDisplay: (d) => d * FOOT_M };
      }
      return { label: 'm', decimals: 0, toDisplay: (si) => si, fromDisplay: (d) => d };
    case 'twist':
      if (system === 'imperial') {
        return { label: 'in', decimals: 1, toDisplay: (si) => si / INCH_M, fromDisplay: (d) => d * INCH_M };
      }
      return { label: 'cm', decimals: 1, toDisplay: (si) => si * 100, fromDisplay: (d) => d / 100 };
  }
}

export function format(siValue: number, quantity: Quantity, system: UnitSystem, withLabel = true): string {
  if (!Number.isFinite(siValue)) {
    return '—';
  }
  const def = unitFor(quantity, system);
  const displayValue = def.toDisplay(siValue);
  let str = displayValue.toFixed(def.decimals);
  if (parseFloat(str) === 0) {
    str = (0).toFixed(def.decimals);
  }
  return withLabel ? `${str} ${def.label}` : str;
}

export const MIL_RAD = 0.001;
export const MOA_RAD = Math.PI / (180 * 60);

export function offsetToAngle(offsetM: number, rangeM: number, unit: AngleUnit): number {
  if (rangeM <= 0) return 0;
  const rad = Math.atan2(offsetM, rangeM);
  const unitRad = unit === 'MIL' ? MIL_RAD : MOA_RAD;
  return rad / unitRad;
}

export function angleToOffset(angle: number, rangeM: number, unit: AngleUnit): number {
  const unitRad = unit === 'MIL' ? MIL_RAD : MOA_RAD;
  return Math.tan(angle * unitRad) * rangeM;
}

export function correctionFor(offsetM: number, rangeM: number, unit: AngleUnit): number {
  return -offsetToAngle(offsetM, rangeM, unit);
}

export function clicksFor(correction: number, clickValue: number): number {
  if (clickValue <= 0) return 0;
  const clicks = Math.round(correction / clickValue);
  return clicks === 0 ? 0 : clicks;
}

export function formatCorrection(correction: number, unit: AngleUnit, axis: 'elevation' | 'windage'): string {
  const decimals = unit === 'MIL' ? 1 : 2;
  const rounded = Math.round(correction * Math.pow(10, decimals)) / Math.pow(10, decimals);
  const absStr = Math.abs(rounded).toFixed(decimals);
  
  if (rounded === 0) {
    return `${absStr} ${unit}`;
  }

  let dir = '';
  if (axis === 'elevation') {
    dir = rounded > 0 ? 'U ' : 'D ';
  } else {
    dir = rounded > 0 ? 'R ' : 'L ';
  }

  return `${dir}${absStr} ${unit}`;
}
