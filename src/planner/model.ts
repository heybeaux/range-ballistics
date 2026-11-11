import type { DragModel, ShotInput, SolveSuccess } from '../solver/types';
import { sampleAt } from '../solver/solve';
import { pressureAtAltitudePa } from '../solver/atmosphere';
import { clicksFor, correctionFor, format, unitFor } from '../units/units';
import type {
  ActiveLoad,
  AppState,
  Conditions,
  Correction,
  DopeRow,
  LibraryLoad,
  LoadLibrary,
  Rifle,
  ShotResults
} from './types';
import { PLANNING_NOTICE } from './types';

export function effectivePressurePa(c: Conditions): number {
  return c.pressureMode === 'station' ? c.pressurePa : pressureAtAltitudePa(c.altitudeM);
}

export function toShotInput(state: AppState): ShotInput | null {
  const { load, rifle, conditions, dope } = state;
  const bc = load.dragModel === 'G1' ? load.bcG1 : load.bcG7;
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
  return { offsetM, mil, moa, direction, clicks };
}

export function shotResults(state: AppState, result: SolveSuccess): ShotResults | null {
  const { conditions, rifle, load } = state;
  const s = sampleAt(result.samples, conditions.targetRangeM);
  if (s === null) return null;
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
    pastTransonic: result.transonicRangeM !== null && conditions.targetRangeM > result.transonicRangeM,
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

export function activeLoadFromLibrary(lib: LibraryLoad, rifle: Rifle, library: LoadLibrary): ActiveLoad {
  const dragModel: DragModel = lib.bcG7.value !== null ? 'G7' : 'G1';
  const estimate = estimateVelocityMps(
    lib.publishedVelocityMps.value,
    lib.testBarrelM,
    rifle.barrelLengthM,
    library.velocityLossMpsPerM.value
  );
  return {
    libraryId: lib.id,
    name: lib.name,
    bulletMassKg: lib.bulletMassKg,
    bulletDiameterM: lib.bulletDiameterM,
    bulletLengthM: lib.bulletLengthM.value,
    bcG1: lib.bcG1.value,
    bcG7: lib.bcG7.value,
    dragModel,
    muzzleVelocityMps: estimate ?? lib.publishedVelocityMps.value ?? 0,
    velocityMeasured: false,
    origin: { bulletLengthM: 'library', bcG1: 'library', bcG7: 'library' }
  };
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
