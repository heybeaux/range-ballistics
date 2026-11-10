import type { ShotInput, SolveError, SolveResult, SolveSuccess, SolveFailure, TrajectorySample, Stability } from './types';
import { airDensity, speedOfSound } from './atmosphere';
import { integrate, type RawSample } from './integrate';
import { findZeroAngle } from './zero';
import { millerStability, spinDriftM } from './spin';

export function validate(input: ShotInput): SolveError[] {
  const errors: SolveError[] = [];
  const add = (field: string, message: string) => errors.push({ field, message });

  const checkNum = (val: number, field: string, min: number, max: number, minInclusive = true, maxInclusive = true) => {
    if (Number.isNaN(val) || !Number.isFinite(val)) {
      add(field, `Value must be a finite number.`);
      return;
    }
    if ((minInclusive && val < min) || (!minInclusive && val <= min)) {
      add(field, `Value must be ${minInclusive ? 'at least' : 'greater than'} ${min}.`);
      return;
    }
    if ((maxInclusive && val > max) || (!maxInclusive && val >= max)) {
      add(field, `Value must be ${maxInclusive ? 'at most' : 'less than'} ${max}.`);
    }
  };

  // muzzleVelocityMps
  checkNum(input.muzzleVelocityMps, 'muzzleVelocityMps', 100, 1500);
  
  // bc
  checkNum(input.bc, 'bc', 0, 1.2, false, true);
  
  // bulletMassKg
  checkNum(input.bulletMassKg, 'bulletMassKg', 0, 0.1, false, true);
  
  // bulletDiameterM
  checkNum(input.bulletDiameterM, 'bulletDiameterM', 0, 0.02, false, true);
  
  // bulletLengthM
  if (input.bulletLengthM !== null) {
    checkNum(input.bulletLengthM, 'bulletLengthM', 0, 0.1, false, true);
  }
  
  // twistM
  checkNum(input.twistM, 'twistM', 0.1, 1);
  
  // sightHeightM
  checkNum(input.sightHeightM, 'sightHeightM', 0, 0.2);
  
  // zeroRangeM
  checkNum(input.zeroRangeM, 'zeroRangeM', 10, 1000);
  
  // maxRangeM
  checkNum(input.maxRangeM, 'maxRangeM', 0, 3000, false, true);
  
  // shotAngleRad
  checkNum(input.shotAngleRad, 'shotAngleRad', -1.0472, 1.0472);
  
  // atmosphere
  checkNum(input.atmosphere.temperatureK, 'atmosphere.temperatureK', 213.15, 333.15);
  checkNum(input.atmosphere.pressurePa, 'atmosphere.pressurePa', 30000, 110000);
  checkNum(input.atmosphere.relativeHumidity, 'atmosphere.relativeHumidity', 0, 1);
  
  // wind
  checkNum(input.wind.speedMps, 'wind.speedMps', 0, 40);
  checkNum(input.wind.clock, 'wind.clock', 0, 12, false, true);
  
  // timeStepS
  if (input.timeStepS !== undefined) {
    checkNum(input.timeStepS, 'timeStepS', 0.00005, 0.005);
  }
  
  // coriolis
  if (input.coriolis !== null) {
    checkNum(input.coriolis.latitudeRad, 'coriolis.latitudeRad', -Math.PI / 2, Math.PI / 2);
  }

  return errors;
}

function findThresholdRange(samples: RawSample[], threshold: number): number | null {
  if (samples.length === 0) return null;
  
  const first = samples[0];
  if (first === undefined) return null;
  
  if (first.mach < threshold) {
    return first.rangeM;
  }
  
  for (let i = 1; i < samples.length; i++) {
    const curr = samples[i];
    const prev = samples[i - 1];
    if (curr === undefined || prev === undefined) continue;
    
    if (curr.mach < threshold) {
      // Interpolate between prev and curr
      const m1 = prev.mach;
      const m2 = curr.mach;
      const r1 = prev.rangeM;
      const r2 = curr.rangeM;
      
      if (m1 === m2) return r2;
      
      const t = (threshold - m1) / (m2 - m1);
      return r1 + t * (r2 - r1);
    }
  }
  
  return null;
}

export function solve(input: ShotInput): SolveResult {
  const errors = validate(input);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  let zeroAngleRad: number;
  try {
    zeroAngleRad = findZeroAngle(input);
  } catch {
    return {
      ok: false,
      errors: [{ field: 'zeroRangeM', message: 'The bullet cannot reach the zero range with these inputs.' }]
    };
  }

  const raw = integrate(input, zeroAngleRad);

  let stability: Stability | null = null;
  if (input.bulletLengthM !== null) {
    stability = millerStability({
      bulletMassKg: input.bulletMassKg,
      bulletDiameterM: input.bulletDiameterM,
      bulletLengthM: input.bulletLengthM,
      twistM: input.twistM,
      muzzleVelocityMps: input.muzzleVelocityMps,
      atmosphere: input.atmosphere
    });
  }

  const samples: TrajectorySample[] = raw.map((rs) => {
    const windDriftM = rs.position.z;
    const spinM = (input.spinDrift && stability !== null)
      ? spinDriftM(stability.sg, rs.timeS, input.twistDirection)
      : 0;
    const windageM = windDriftM + spinM;
    const energyJ = 0.5 * input.bulletMassKg * rs.speedMps * rs.speedMps;

    return {
      timeS: rs.timeS,
      position: rs.position,
      velocity: rs.velocity,
      speedMps: rs.speedMps,
      mach: rs.mach,
      rangeM: rs.rangeM,
      pathM: rs.pathM,
      windDriftM,
      spinDriftM: spinM,
      windageM,
      energyJ
    };
  });

  const transonicRangeM = findThresholdRange(raw, 1.2);
  const subsonicRangeM = findThresholdRange(raw, 1.0);

  const lastSample = samples[samples.length - 1];
  const reachedMaxRange = lastSample !== undefined && lastSample.rangeM >= input.maxRangeM;

  const notes: string[] = [];
  if (input.spinDrift && input.bulletLengthM === null) {
    notes.push('Spin drift not available: bullet length unknown.');
  }
  if (stability !== null) {
    if (stability.status === 'marginal') {
      notes.push('Stability is marginal for this twist rate. Accuracy and BC may suffer.');
    } else if (stability.status === 'unstable') {
      notes.push('This bullet is not stable at this twist rate.');
    }
  }
  if (!reachedMaxRange) {
    notes.push('The bullet did not reach the requested maximum range.');
  }

  const airDensityKgM3 = airDensity(input.atmosphere);
  const speedOfSoundMps = speedOfSound(input.atmosphere.temperatureK);

  return {
    ok: true,
    zeroAngleRad,
    airDensityKgM3,
    speedOfSoundMps,
    samples,
    stability,
    transonicRangeM,
    subsonicRangeM,
    reachedMaxRange,
    notes
  };
}

export function sampleAt(samples: TrajectorySample[], rangeM: number): TrajectorySample | null {
  if (samples.length === 0) return null;
  
  const first = samples[0];
  const last = samples[samples.length - 1];
  if (first === undefined || last === undefined) return null;

  if (rangeM < first.rangeM || rangeM > last.rangeM) {
    return null;
  }

  // Binary search for the right interval
  let lo = 0;
  let hi = samples.length - 1;
  
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const s = samples[mid];
    if (s === undefined) break;
    
    if (s.rangeM < rangeM) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  
  // lo is the index of the first sample with rangeM >= target
  if (lo === 0) {
    const s = samples[0];
    if (s === undefined) return null;
    if (s.rangeM === rangeM) return s;
    return null; // Should not happen if rangeM >= first.rangeM
  }

  const i1 = lo - 1;
  const i2 = lo;
  
  const s1 = samples[i1];
  const s2 = samples[i2];
  
  if (s1 === undefined || s2 === undefined) return null;

  if (s1.rangeM === rangeM) return s1;
  if (s2.rangeM === rangeM) return s2;

  const t = (rangeM - s1.rangeM) / (s2.rangeM - s1.rangeM);

  const lerp = (a: number, b: number) => a + t * (b - a);

  return {
    timeS: lerp(s1.timeS, s2.timeS),
    position: {
      x: lerp(s1.position.x, s2.position.x),
      y: lerp(s1.position.y, s2.position.y),
      z: lerp(s1.position.z, s2.position.z)
    },
    velocity: {
      x: lerp(s1.velocity.x, s2.velocity.x),
      y: lerp(s1.velocity.y, s2.velocity.y),
      z: lerp(s1.velocity.z, s2.velocity.z)
    },
    speedMps: lerp(s1.speedMps, s2.speedMps),
    mach: lerp(s1.mach, s2.mach),
    rangeM: rangeM,
    pathM: lerp(s1.pathM, s2.pathM),
    windDriftM: lerp(s1.windDriftM, s2.windDriftM),
    spinDriftM: lerp(s1.spinDriftM, s2.spinDriftM),
    windageM: lerp(s1.windageM, s2.windageM),
    energyJ: lerp(s1.energyJ, s2.energyJ)
  };
}
