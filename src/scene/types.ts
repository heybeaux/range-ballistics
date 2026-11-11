/**
 * Scene contract. Fixed by the lead; do not edit.
 *
 * The scene uses the solver's world frame directly, in metres at true scale:
 *   x = downrange, y = up, z = to the shooter's right. Origin at the muzzle.
 * three.js is also right-handed with y up, so solver positions go straight into three.js vectors.
 *
 * The scene never computes physics. It draws SceneView.samples, which come from solve().
 */
import type { TrajectorySample, Vec3 } from '../solver/types';
import type { UnitSystem } from '../units/units';

export interface SceneView {
  /** Solver samples, muzzle first. */
  samples: TrajectorySample[];
  targetRangeM: number;
  shotAngleRad: number;
  sightHeightM: number;
  transonicRangeM: number | null;
  subsonicRangeM: number | null;
  windSpeedMps: number;
  /** Clock direction the wind comes from. */
  windClock: number;
  unitSystem: UnitSystem;
  targetType: 'steel' | 'paper';
  /** Display-only multiplier for drop and drift away from the line of sight. 1 = true scale. */
  exaggeration: number;
  /** true = draw the shot after the shooter dials the correction, so it lands on the target. */
  showDialed: boolean;
}

export type CameraPreset = 'shooter' | 'side' | 'top' | 'reset';

export interface CameraPose {
  position: Vec3;
  target: Vec3;
  /** Camera up vector. */
  up: Vec3;
}

export type FlightRegime = 'supersonic' | 'transonic' | 'subsonic';

/** A run of path points in one flight regime. Neighbouring runs share their boundary point. */
export interface PathRun {
  regime: FlightRegime;
  points: Vec3[];
}

export interface FlagPose {
  /** Unit vector the flag streams toward (downwind), horizontal. */
  downwind: Vec3;
  /** 0 = hanging straight down (no wind). PI / 2 = level (20 mph or more). */
  liftRad: number;
  /** How fast the flag flutters, cycles per second. */
  flutterHz: number;
}

export interface DistanceMarker {
  rangeM: number;
  /** For example "300 yd". */
  label: string;
}

/** What the timeline readout shows at the current animation time. */
export interface Readout {
  timeS: number;
  durationS: number;
  rangeM: number;
  speedMps: number;
  /** Height relative to the line of sight, metres. Negative = below. */
  pathM: number;
  playing: boolean;
}

/** The object returned by createRangeScene(container). */
export interface RangeScene {
  /** Redraw for a new solve. Restarts the animation from the muzzle. */
  update(view: SceneView): void;
  setCamera(preset: CameraPreset): void;
  play(): void;
  pause(): void;
  replay(): void;
  /** Playback speed multiplier, for example 0.25, 1, 2. */
  setSpeed(multiplier: number): void;
  /** Jump to a time in seconds, clamped to 0..duration. Pauses playback. */
  seek(timeS: number): void;
  /** Called on every frame while playing, and after update / seek. */
  onReadout(callback: (readout: Readout) => void): void;
  /** Average frames per second over the last second. */
  fps(): number;
  dispose(): void;
}
