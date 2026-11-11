import type { DragModel, ShotInput, SolveSuccess } from '../solver/types';
import { sampleAt } from '../solver/solve';
import { pressureAtAltitudePa } from '../solver/atmosphere';
import { clicksFor, correctionFor, format, unitFor } from '../units/units';
import type {
  ActiveLoad,
  AppState,
  Cartridge,
  Conditions,
  Correction,
  DopeRow,
  LibraryLoad,
  LoadLibrary,
  MuzzleRegime,
  Rifle,
  ScopeProfile,
  ShotResults
} from './types';
import { PLANNING_NOTICE } from './types';

export function effectivePressurePa(c: Conditions): number {
  return c.pressureMode === 'station' ? c.pressurePa : pressureAtAltitudePa(c.altitudeM);
}

export function toShotInput(state: AppState): ShotInput | null {
  const { load, rifle, conditions, dope } = state;
  const bc =
    load.dragModel === 'G1' ? load.bcG1 : load.dragModel === 'G7' ? load.bcG7 : load.bcRA4;
  if (bc === null) return null;
  return {
    muzzleVelocityMps: load.muzzleVelocityMps,
    bc,
    dragModel: load.dragModel,
    bulletMassKg: load.bulletMassKg,
    bulletDiameterM: load.bulletDiameterM,
    bulletLengthM: load.bulletLengthM,
    twistM: rifle.twistM,
    twistDirection: rifle.twistDirection,
    sightHeightM: rifle.sightHeightM,
    zeroRangeM: rifle.zeroRangeM,
    maxRangeM: Math.max(conditions.targetRangeM, dope.endM) + 50,
    shotAngleRad: conditions.shotAngleRad,
    atmosphere: {
      temperatureK: conditions.temperatureK,
      pressurePa: effectivePressurePa(conditions),
      relativeHumidity: conditions.relativeHumidity
    },
    wind: { speedMps: conditions.windSpeedMps, clock: conditions.windClock },
    spinDrift: state.spinDrift,
    coriolis: null
  };
}

export function makeCorrection(offsetM: number, rangeM: number, axis: 'elevation' | 'windage', rifle: Rifle): Correction {
  const mil = Math.abs(correctionFor(offsetM, rangeM, 'MIL'));
  const moa = Math.abs(correctionFor(offsetM, rangeM, 'MOA'));
  let direction: Correction['direction'];
  if (Math.abs(offsetM) < 0.0005) {
    direction = 'none';
  } else if (axis === 'elevation') {
    direction = offsetM < 0 ? 'up' : 'down';
  } else {
    direction = offsetM < 0 ? 'right' : 'left';
  }
  const clicks = clicksFor(rifle.angleUnit === 'MIL' ? mil : moa, rifle.clickValue);
  const a = rifle.angleUnit === 'MIL' ? mil : moa;
  const beyondDial = axis === 'elevation' && direction === 'up' && a > rifle.scope.availableElevation + 1e-9;
  const holdRemaining = beyondDial ? a - rifle.scope.availableElevation : 0;
  return { offsetM, mil, moa, direction, clicks, beyondDial, holdRemaining };
}

export function muzzleRegimeOf(mach: number): MuzzleRegime {
  if (mach >= 1.2) return 'supersonic';
  if (mach >= 1.0) return 'transonic';
  return 'subsonic';
}

export function shotResults(state: AppState, result: SolveSuccess): ShotResults | null {
  const { conditions, rifle, load } = state;
  const s = sampleAt(result.samples, conditions.targetRangeM);
  if (s === null) return null;
  const first = result.samples[0];
  const muzzleRegime = first === undefined ? 'subsonic' : muzzleRegimeOf(first.mach);
  return {
    rangeM: conditions.targetRangeM,
    elevation: makeCorrection(s.pathM, s.rangeM, 'elevation', rifle),
    windage: makeCorrection(s.windageM, s.rangeM, 'windage', rifle),
    timeOfFlightS: s.timeS,
    velocityMps: s.speedMps,
    energyJ: s.energyJ,
    mach: s.mach,
    spinDriftM: result.stability === null || !state.spinDrift ? null : s.spinDriftM,
    stabilitySg: result.stability?.sg ?? null,
    stabilityStatus: result.stability?.status ?? null,
    transonicRangeM: result.transonicRangeM,
    subsonicRangeM: result.subsonicRangeM,
    muzzleRegime,
    pastTransonic:
      muzzleRegime === 'supersonic' &&
      result.transonicRangeM !== null &&
      conditions.targetRangeM > result.transonicRangeM,
    velocityEstimated: !load.velocityMeasured,
    notes: result.notes
  };
}

export function dopeRows(state: AppState, result: SolveSuccess): DopeRow[] {
  const { dope, rifle } = state;
  if (dope.stepM <= 0 || dope.endM < dope.startM) return [];
  const rows: DopeRow[] = [];
  for (let i = 0; ; i++) {
    const range = dope.startM + i * dope.stepM;
    if (range > dope.endM + 1e-6) break;
    const s = sampleAt(result.samples, range);
    if (s === null) continue;
    rows.push({
      rangeM: range,
      elevation: makeCorrection(s.pathM, s.rangeM, 'elevation', rifle),
      windage: makeCorrection(s.windageM, s.rangeM, 'windage', rifle),
      timeOfFlightS: s.timeS,
      velocityMps: s.speedMps
    });
  }
  return rows;
}

export function estimateVelocityMps(
  publishedMps: number | null,
  testBarrelM: number | null,
  barrelLengthM: number,
  lossMpsPerM: number | null
): number | null {
  if (publishedMps === null || testBarrelM === null || lossMpsPerM === null) return null;
  if (barrelLengthM >= testBarrelM) return publishedMps;
  return publishedMps - lossMpsPerM * (testBarrelM - barrelLengthM);
}

export type VelocityBasis = 'published-barrel' | 'interpolated' | 'nearest-barrel' | 'estimated' | 'published' | 'none';

export function velocityForBarrel(
  lib: LibraryLoad,
  barrelLengthM: number,
  cartridge: Cartridge | undefined
): { velocityMps: number | null; basis: VelocityBasis } {
  const listed = lib.velocityByBarrel;
  if (listed.length > 0) {
    for (const entry of listed) {
      if (Math.abs(entry.barrelM - barrelLengthM) <= 0.0127) {
        return { velocityMps: entry.velocityMps, basis: 'published-barrel' };
      }
    }
    const first = listed[0];
    const last = listed[listed.length - 1];
    if (first !== undefined && last !== undefined) {
      if (barrelLengthM < first.barrelM) {
        return { velocityMps: first.velocityMps, basis: 'nearest-barrel' };
      }
      if (barrelLengthM > last.barrelM) {
        return { velocityMps: last.velocityMps, basis: 'nearest-barrel' };
      }
      for (let i = 1; i < listed.length; i++) {
        const prev = listed[i - 1];
        const curr = listed[i];
        if (prev === undefined || curr === undefined) continue;
        if (barrelLengthM >= prev.barrelM && barrelLengthM <= curr.barrelM) {
          const span = curr.barrelM - prev.barrelM;
          const t = span === 0 ? 0 : (barrelLengthM - prev.barrelM) / span;
          return {
            velocityMps: prev.velocityMps + t * (curr.velocityMps - prev.velocityMps),
            basis: 'interpolated'
          };
        }
      }
    }
  }
  const published = lib.publishedVelocityMps.value;
  if (published === null) return { velocityMps: null, basis: 'none' };
  const est = estimateVelocityMps(
    published,
    lib.testBarrelM,
    barrelLengthM,
    cartridge?.velocityLossMpsPerM.value ?? null
  );
  if (est !== null && est !== published) return { velocityMps: est, basis: 'estimated' };
  return { velocityMps: published, basis: 'published' };
}

export function activeLoadFromLibrary(lib: LibraryLoad, rifle: Rifle, library: LoadLibrary): ActiveLoad {
  const cartridge = library.cartridges.find((c) => c.id === lib.cartridgeId);
  const dragModel: DragModel =
    lib.bcG7.value !== null ? 'G7' : lib.bcG1.value !== null ? 'G1' : lib.bcRA4.value !== null ? 'RA4' : 'G1';
  return {
    libraryId: lib.id,
    name: lib.name,
    bulletMassKg: lib.bulletMassKg,
    bulletDiameterM: lib.bulletDiameterM,
    bulletLengthM: lib.bulletLengthM.value,
    bcG1: lib.bcG1.value,
    bcG7: lib.bcG7.value,
    bcRA4: lib.bcRA4.value,
    dragModel,
    muzzleVelocityMps: velocityForBarrel(lib, rifle.barrelLengthM, cartridge).velocityMps ?? 0,
    velocityMeasured: false,
    origin: { bulletLengthM: 'library', bcG1: 'library', bcG7: 'library', bcRA4: 'library' }
  };
}

export function clampMagnification(mag: number, scope: ScopeProfile): number {
  if (!Number.isFinite(mag)) return scope.magMin;
  return Math.min(Math.max(mag, scope.magMin), scope.magMax);
}

export function toCsv(state: AppState, rows: DopeRow[], dateIso: string): string {
  const sys = state.unitSystem;
  const u = state.rifle.angleUnit;
  const { load, rifle, conditions } = state;
  const lines: string[] = [
    '# Range Ballistics dope card',
    `# Load: ${load.name}`,
    `# Muzzle velocity: ${format(load.muzzleVelocityMps, 'velocity', sys)}${load.velocityMeasured ? '' : ' (estimated)'}`,
    `# Zero: ${format(rifle.zeroRangeM, 'range', sys)}`,
    `# Wind: ${format(conditions.windSpeedMps, 'windSpeed', sys)} from ${conditions.windClock} o'clock`,
    `# Air: ${format(conditions.temperatureK, 'temperature', sys)}, ${format(effectivePressurePa(conditions), 'pressure', sys)}, ${Math.round(conditions.relativeHumidity * 100)}% humidity`,
    `# Date: ${dateIso}`,
    `# ${PLANNING_NOTICE}`
  ];
  lines.push(
    `range_${unitFor('range', sys).label},elevation_${u},elevation_dir,elevation_clicks,windage_${u},windage_dir,windage_clicks,time_s,velocity_${unitFor('velocity', sys).label}`
  );
  for (const row of rows) {
    const elevationAngle = u === 'MIL' ? row.elevation.mil : row.elevation.moa;
    const windageAngle = u === 'MIL' ? row.windage.mil : row.windage.moa;
    lines.push(
      [
        format(row.rangeM, 'range', sys, false),
        elevationAngle.toFixed(2),
        row.elevation.direction,
        String(row.elevation.clicks),
        windageAngle.toFixed(2),
        row.windage.direction,
        String(row.windage.clicks),
        row.timeOfFlightS.toFixed(2),
        format(row.velocityMps, 'velocity', sys, false)
      ].join(',')
    );
  }
  return lines.join('\n');
}
