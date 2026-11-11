import type { TrajectorySample, Vec3 } from '../solver/types';
import { sampleAt } from '../solver/solve';
import { unitFor } from '../units/units';
import type { UnitSystem } from '../units/units';
import type { CameraPreset, CameraPose, DistanceMarker, FlagPose, FlightRegime, PathRun, Readout } from './types';

export function losPoint(rangeM: number, shotAngleRad: number, sightHeightM: number): Vec3 {
  const c = Math.cos(shotAngleRad);
  const s = Math.sin(shotAngleRad);
  return {
    x: rangeM * c - sightHeightM * s,
    y: sightHeightM * c + rangeM * s,
    z: 0
  };
}

export function displayPoint(sample: TrajectorySample, shotAngleRad: number, sightHeightM: number, exaggeration: number): Vec3 {
  const los = losPoint(sample.rangeM, shotAngleRad, sightHeightM);
  const s = Math.sin(shotAngleRad);
  const c = Math.cos(shotAngleRad);
  return {
    x: los.x - exaggeration * sample.pathM * s,
    y: los.y + exaggeration * sample.pathM * c,
    z: exaggeration * sample.windageM
  };
}

export function trimToRange(samples: TrajectorySample[], targetRangeM: number): TrajectorySample[] {
  const kept = samples.filter((s) => s.rangeM < targetRangeM);
  const extra = sampleAt(samples, targetRangeM);
  if (extra === null) return [...samples];
  return [...kept, extra];
}

export function dialSamples(samples: TrajectorySample[], targetRangeM: number): TrajectorySample[] {
  if (targetRangeM <= 0) return [...samples];
  const t = sampleAt(samples, targetRangeM);
  if (t === null) return [...samples];
  return samples.map((s) => ({
    ...s,
    pathM: s.pathM - t.pathM * (s.rangeM / targetRangeM),
    windageM: s.windageM - t.windageM * (s.rangeM / targetRangeM)
  }));
}

export function regimeOf(mach: number): FlightRegime {
  if (mach >= 1.2) return 'supersonic';
  if (mach >= 1.0) return 'transonic';
  return 'subsonic';
}

export function pathRuns(samples: TrajectorySample[], shotAngleRad: number, sightHeightM: number, exaggeration: number): PathRun[] {
  if (samples.length === 0) return [];
  const runs: PathRun[] = [];
  let current: PathRun | null = null;
  for (const sample of samples) {
    const regime = regimeOf(sample.mach);
    const p = displayPoint(sample, shotAngleRad, sightHeightM, exaggeration);
    if (current === null || current.regime !== regime) {
      if (current !== null) {
        current.points.push(p);
      }
      current = { regime, points: [p] };
      runs.push(current);
    } else {
      current.points.push(p);
    }
  }
  return runs.filter((r) => r.points.length >= 2);
}

export function sampleAtTime(samples: TrajectorySample[], timeS: number): TrajectorySample | null {
  if (samples.length === 0) return null;
  const first = samples[0];
  const last = samples[samples.length - 1];
  if (first === undefined || last === undefined) return null;
  if (timeS <= first.timeS) return first;
  if (timeS >= last.timeS) return last;

  let lo = 0;
  let hi = samples.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const s = samples[mid];
    if (s === undefined) break;
    if (s.timeS < timeS) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  const i2 = lo;
  const i1 = lo - 1;
  const b = samples[i2];
  const a = samples[i1];
  if (a === undefined || b === undefined) return null;

  const f = (timeS - a.timeS) / (b.timeS - a.timeS);
  const lerp = (x: number, y: number) => x + f * (y - x);

  return {
    timeS: lerp(a.timeS, b.timeS),
    position: {
      x: lerp(a.position.x, b.position.x),
      y: lerp(a.position.y, b.position.y),
      z: lerp(a.position.z, b.position.z)
    },
    velocity: {
      x: lerp(a.velocity.x, b.velocity.x),
      y: lerp(a.velocity.y, b.velocity.y),
      z: lerp(a.velocity.z, b.velocity.z)
    },
    speedMps: lerp(a.speedMps, b.speedMps),
    mach: lerp(a.mach, b.mach),
    rangeM: lerp(a.rangeM, b.rangeM),
    pathM: lerp(a.pathM, b.pathM),
    windDriftM: lerp(a.windDriftM, b.windDriftM),
    spinDriftM: lerp(a.spinDriftM, b.spinDriftM),
    windageM: lerp(a.windageM, b.windageM),
    energyJ: lerp(a.energyJ, b.energyJ)
  };
}

export function flagPose(windSpeedMps: number, windClock: number): FlagPose {
  const phi = windClock * 30 * (Math.PI / 180);
  const downwind: Vec3 = { x: -Math.cos(phi), y: 0, z: -Math.sin(phi) };
  const liftRad = Math.min(windSpeedMps / 8.9408, 1) * (Math.PI / 2);
  const flutterHz = 0.5 + 0.4 * Math.max(windSpeedMps, 0);
  return { downwind, liftRad, flutterHz };
}

export function markerRanges(targetRangeM: number, system: UnitSystem): DistanceMarker[] {
  const unit = unitFor('range', system);
  const d = unit.toDisplay(targetRangeM);
  const last = Math.max(100, Math.ceil((d - 1e-6) / 100) * 100);
  const markers: DistanceMarker[] = [];
  for (let value = 100; value <= last; value += 100) {
    markers.push({ rangeM: unit.fromDisplay(value), label: `${value} ${unit.label}` });
  }
  return markers;
}

export function cameraPose(preset: CameraPreset, targetRangeM: number, shotAngleRad: number, sightHeightM: number): CameraPose {
  const R = targetRangeM;
  const T = losPoint(R, shotAngleRad, sightHeightM);
  switch (preset) {
    case 'shooter':
      return {
        position: { x: -4, y: sightHeightM + 0.5, z: 0 },
        target: T,
        up: { x: 0, y: 1, z: 0 }
      };
    case 'side':
      return {
        position: { x: R / 2, y: T.y / 2 + Math.max(2, R * 0.02), z: Math.max(30, R * 0.75) },
        target: { x: R / 2, y: T.y / 2, z: 0 },
        up: { x: 0, y: 1, z: 0 }
      };
    case 'top':
      return {
        position: { x: R / 2, y: T.y / 2 + Math.max(30, R * 0.75), z: 0 },
        target: { x: R / 2, y: T.y / 2, z: 0 },
        up: { x: 0, y: 0, z: -1 }
      };
    case 'reset':
      return {
        position: { x: -(R * 0.05 + 6), y: R * 0.08 + 3, z: R * 0.15 + 5 },
        target: { x: R / 2, y: T.y / 2, z: 0 },
        up: { x: 0, y: 1, z: 0 }
      };
  }
}

export function readoutAt(samples: TrajectorySample[], timeS: number, playing: boolean): Readout | null {
  const s = sampleAtTime(samples, timeS);
  if (s === null) return null;
  const last = samples[samples.length - 1];
  if (last === undefined) return null;
  return {
    timeS: s.timeS,
    durationS: last.timeS,
    rangeM: s.rangeM,
    speedMps: s.speedMps,
    pathM: s.pathM,
    playing
  };
}
