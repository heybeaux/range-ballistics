import type { ShotInput, Vec3, Wind } from './types';
import { STANDARD_GRAVITY } from './atmosphere';
import { makeAirModel } from './integrate-air';
import { dragFactor } from './drag';

export interface RawSample {
  timeS: number;
  position: Vec3;
  velocity: Vec3;
  speedMps: number;
  mach: number;
  rangeM: number;
  pathM: number;
}

export function airVelocity(wind: Wind): Vec3 {
  const phi = wind.clock * 30 * (Math.PI / 180);
  return {
    x: -wind.speedMps * Math.cos(phi),
    y: 0,
    z: -wind.speedMps * Math.sin(phi),
  };
}

function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function vec3Scale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function vec3Dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function vec3Norm(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function vec3Sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function integrate(input: ShotInput, zeroAngleRad: number): RawSample[] {
  const dt = input.timeStepS ?? 0.0005;
  const dragEnabled = input.dragEnabled ?? true;
  // Air at the bullet's height above the muzzle (standard lapse rate). See types.ts.
  const airAt = makeAirModel(input.atmosphere);
  const w = airVelocity(input.wind);

  const theta = input.shotAngleRad;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const u: Vec3 = { x: cosT, y: sinT, z: 0 };
  const n: Vec3 = { x: -sinT, y: cosT, z: 0 };
  const o: Vec3 = {
    x: input.sightHeightM * n.x,
    y: input.sightHeightM * n.y,
    z: input.sightHeightM * n.z,
  };

  const launchAngle = theta + zeroAngleRad;
  const v0: Vec3 = {
    x: input.muzzleVelocityMps * Math.cos(launchAngle),
    y: input.muzzleVelocityMps * Math.sin(launchAngle),
    z: 0,
  };

  const p0: Vec3 = { x: 0, y: 0, z: 0 };

  const samples: RawSample[] = [];

  let p = p0;
  let v = v0;
  let t = 0;

  function computeSample(pos: Vec3, vel: Vec3, time: number): RawSample {
    const rel = vec3Sub(pos, o);
    const rangeM = vec3Dot(rel, u);
    const pathM = vec3Dot(rel, n);
    const speedMps = vec3Norm(vel);
    const vr = vec3Sub(vel, w);
    const mach = vec3Norm(vr) / airAt(pos.y).speedOfSoundMps;
    return {
      timeS: time,
      position: { x: pos.x, y: pos.y, z: pos.z },
      velocity: { x: vel.x, y: vel.y, z: vel.z },
      speedMps,
      mach,
      rangeM,
      pathM,
    };
  }

  function acceleration(vel: Vec3, heightM: number): Vec3 {
    const vr = vec3Sub(vel, w);
    const speedVr = vec3Norm(vr);
    const air = airAt(heightM);
    const mach = speedVr / air.speedOfSoundMps;
    const k = dragFactor(input.dragModel, mach, input.bc, air.densityKgM3);
    const dragAcc = vec3Scale(vr, -k * speedVr);
    const grav: Vec3 = { x: 0, y: -STANDARD_GRAVITY, z: 0 };
    if (!dragEnabled) {
      return { x: grav.x, y: grav.y, z: grav.z };
    }
    return {
      x: grav.x + dragAcc.x,
      y: grav.y + dragAcc.y,
      z: grav.z + dragAcc.z,
    };
  }

  function rk4Step(pos: Vec3, vel: Vec3, time: number, h: number): { pos: Vec3; vel: Vec3; time: number } {
    const k1v = acceleration(vel, pos.y);
    const k1p = vel;

    const v2 = vec3Add(vel, vec3Scale(k1v, h / 2));
    const p2 = vec3Add(pos, vec3Scale(k1p, h / 2));
    const k2v = acceleration(v2, p2.y);
    const k2p = v2;

    const v3 = vec3Add(vel, vec3Scale(k2v, h / 2));
    const p3 = vec3Add(pos, vec3Scale(k2p, h / 2));
    const k3v = acceleration(v3, p3.y);
    const k3p = v3;

    const v4 = vec3Add(vel, vec3Scale(k3v, h));
    const p4 = vec3Add(pos, vec3Scale(k3p, h));
    const k4v = acceleration(v4, p4.y);
    const k4p = v4;

    const newVel = vec3Add(
      vel,
      vec3Scale(
        {
          x: k1v.x + 2 * k2v.x + 2 * k3v.x + k4v.x,
          y: k1v.y + 2 * k2v.y + 2 * k3v.y + k4v.y,
          z: k1v.z + 2 * k2v.z + 2 * k3v.z + k4v.z,
        },
        h / 6,
      ),
    );

    const newPos = vec3Add(
      pos,
      vec3Scale(
        {
          x: k1p.x + 2 * k2p.x + 2 * k3p.x + k4p.x,
          y: k1p.y + 2 * k2p.y + 2 * k3p.y + k4p.y,
          z: k1p.z + 2 * k2p.z + 2 * k3p.z + k4p.z,
        },
        h / 6,
      ),
    );

    return { pos: newPos, vel: newVel, time: time + h };
  }

  // Push initial sample
  const initialSample = computeSample(p, v, t);
  samples.push(initialSample);

  if (initialSample.rangeM >= input.maxRangeM) {
    return samples;
  }

  while (true) {
    const next = rk4Step(p, v, t, dt);
    p = next.pos;
    v = next.vel;
    t = next.time;

    const sample = computeSample(p, v, t);
    samples.push(sample);

    if (sample.rangeM >= input.maxRangeM) {
      break;
    }

    if (t > 30 || sample.speedMps < 30 || p.y < -2000) {
      break;
    }
  }

  return samples;
}

export function sampleAtRange(samples: RawSample[], rangeM: number): RawSample | null {
  if (samples.length === 0) return null;

  const first = samples[0];
  const last = samples[samples.length - 1];
  if (first === undefined || last === undefined) return null;

  if (rangeM < first.rangeM || rangeM > last.rangeM) {
    return null;
  }

  // Binary search for the bracket
  let lo = 0;
  let hi = samples.length - 1;

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const midSample = samples[mid];
    if (midSample === undefined) break;
    if (midSample.rangeM < rangeM) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  // lo is the first index where rangeM >= target
  if (lo === 0) {
    // target is at or before first sample
    if (rangeM === first.rangeM) {
      return {
        timeS: first.timeS,
        position: { ...first.position },
        velocity: { ...first.velocity },
        speedMps: first.speedMps,
        mach: first.mach,
        rangeM: first.rangeM,
        pathM: first.pathM,
      };
    }
    return null;
  }

  const i1 = lo - 1;
  const i2 = lo;
  const s1 = samples[i1];
  const s2 = samples[i2];
  if (s1 === undefined || s2 === undefined) return null;

  const r1 = s1.rangeM;
  const r2 = s2.rangeM;
  const denom = r2 - r1;
  if (denom === 0) {
    return {
      timeS: s1.timeS,
      position: { ...s1.position },
      velocity: { ...s1.velocity },
      speedMps: s1.speedMps,
      mach: s1.mach,
      rangeM: s1.rangeM,
      pathM: s1.pathM,
    };
  }

  const alpha = (rangeM - r1) / denom;

  const lerp = (a: number, b: number): number => a + alpha * (b - a);

  return {
    timeS: lerp(s1.timeS, s2.timeS),
    position: {
      x: lerp(s1.position.x, s2.position.x),
      y: lerp(s1.position.y, s2.position.y),
      z: lerp(s1.position.z, s2.position.z),
    },
    velocity: {
      x: lerp(s1.velocity.x, s2.velocity.x),
      y: lerp(s1.velocity.y, s2.velocity.y),
      z: lerp(s1.velocity.z, s2.velocity.z),
    },
    speedMps: lerp(s1.speedMps, s2.speedMps),
    mach: lerp(s1.mach, s2.mach),
    rangeM,
    pathM: lerp(s1.pathM, s2.pathM),
  };
}
