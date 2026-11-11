/**
 * Solver contract. Everything in src/solver is SI and UI-free.
 *
 * WORLD FRAME (origin at the muzzle):
 *   x = horizontal, downrange toward the target
 *   y = up (gravity is -y, g = 9.80665 m/s^2)
 *   z = horizontal, to the shooter's right
 *
 * LINE OF SIGHT (LOS):
 *   theta = shotAngleRad (positive = uphill)
 *   u = (cos theta, sin theta, 0)        unit vector along the LOS
 *   n = (-sin theta, cos theta, 0)       unit vector at right angles to the LOS, "up"
 *   LOS origin o = sightHeightM * n      (the scope sits above the muzzle)
 *   For a bullet position p:  rangeM = (p - o) . u   and   pathM = (p - o) . n
 *   pathM is negative when the bullet is below the LOS.
 *
 * BORE: the muzzle velocity direction is u rotated up by zeroAngleRad about z:
 *   (cos(theta + zeroAngle), sin(theta + zeroAngle), 0)
 *
 * WIND: `clock` is where the wind comes FROM. 12 = from the target toward the shooter
 *   (headwind). 3 = from the shooter's right. phi = clock * 30 degrees.
 *   Air velocity vector = -speedMps * (cos phi, 0, sin phi). Wind is always horizontal.
 *
 * DRAG: vr = v - airVelocity; M = |vr| / speedOfSound;
 *   acceleration = -(PI / 8) * rho * |vr| * Cd(M) / (bc * 703.0696) * vr
 *   Cd(M) is linear interpolation in the G1, G7 or RA4 table (src/data/g1.json, g7.json, ra4.json),
 *   clamped to the first / last point outside the table.
 *
 * AIR ALONG THE FLIGHT: the input atmosphere is the air at the muzzle. As the bullet climbs or
 *   falls (position.y), the air follows the standard lapse rate:
 *   T(y) = T0 - 0.0065 * y;  rho(y) = rho0 * (T(y) / T0) ^ 4.25588;  speed of sound from T(y).
 *   This matters on steep shots: 20 degrees downhill at 900 m is about 3% more drag.
 */

/** RA4 is the rimfire drag model Eley publishes .22 LR BCs against. */
export type DragModel = 'G1' | 'G7' | 'RA4';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Atmosphere {
  /** Air temperature, kelvin. */
  temperatureK: number;
  /** Absolute (station) pressure, pascal. Not sea-level-corrected. */
  pressurePa: number;
  /** Relative humidity, 0 to 1. */
  relativeHumidity: number;
}

export interface Wind {
  speedMps: number;
  /** Clock direction the wind comes from. Any value > 0 and <= 12. Halves allowed (1.5 = 1:30). */
  clock: number;
}

export interface CoriolisInput {
  /** Latitude, radians. North positive. */
  latitudeRad: number;
  /** Direction of fire, radians clockwise from true north. */
  azimuthRad: number;
}

export interface ShotInput {
  muzzleVelocityMps: number;
  /** Ballistic coefficient in lb/in^2 for `dragModel`. */
  bc: number;
  dragModel: DragModel;
  bulletMassKg: number;
  bulletDiameterM: number;
  /** Bullet overall length. null = unknown: no stability factor and no spin drift. */
  bulletLengthM: number | null;
  /** Barrel twist: metres of travel per full turn (1:11" = 0.2794). */
  twistM: number;
  twistDirection: 'right' | 'left';
  /** Scope centre above bore centre. */
  sightHeightM: number;
  zeroRangeM: number;
  /** Solve out to this distance along the LOS. */
  maxRangeM: number;
  /** Positive = uphill. */
  shotAngleRad: number;
  atmosphere: Atmosphere;
  wind: Wind;
  /** Add the spin-drift estimate to windage. Needs bulletLengthM. */
  spinDrift: boolean;
  /** null = Coriolis off (the default). */
  coriolis: CoriolisInput | null;
  /** RK4 step, seconds. Default 0.0005. */
  timeStepS?: number;
  /** Test hook. false = no drag (vacuum). Default true. */
  dragEnabled?: boolean;
}

export interface TrajectorySample {
  timeS: number;
  /** World frame, metres. */
  position: Vec3;
  /** World frame, m/s. */
  velocity: Vec3;
  speedMps: number;
  mach: number;
  /** Distance along the LOS, metres. */
  rangeM: number;
  /** Height relative to the LOS, metres. Negative = below. */
  pathM: number;
  /** Horizontal offset from wind and Coriolis (position.z), metres. Positive = right. */
  windDriftM: number;
  /** Spin-drift estimate, metres. Positive = right. 0 when off or not available. */
  spinDriftM: number;
  /** windDriftM + spinDriftM. */
  windageM: number;
  energyJ: number;
}

export interface Stability {
  /** Miller gyroscopic stability factor, corrected for velocity and atmosphere. */
  sg: number;
  /** sg >= 1.5 stable; 1.0 <= sg < 1.5 marginal; sg < 1.0 unstable. */
  status: 'stable' | 'marginal' | 'unstable';
}

export interface SolveError {
  /** Name of the ShotInput field, dotted for nested fields (for example "atmosphere.pressurePa"). */
  field: string;
  message: string;
}

export interface SolveSuccess {
  ok: true;
  /** Bore elevation above the LOS that zeroes the rifle at zeroRangeM (level, no wind). */
  zeroAngleRad: number;
  airDensityKgM3: number;
  speedOfSoundMps: number;
  /** One sample per RK4 step, starting at t = 0, ending at the first step past maxRangeM. */
  samples: TrajectorySample[];
  /** null when bulletLengthM is null. */
  stability: Stability | null;
  /** LOS range where Mach first drops below 1.2. null if it never does within the solve. */
  transonicRangeM: number | null;
  /** LOS range where Mach first drops below 1.0. null if it never does within the solve. */
  subsonicRangeM: number | null;
  /** True when the bullet reached maxRangeM. */
  reachedMaxRange: boolean;
  /** Plain-language notes, for example "Spin drift not available: bullet length unknown." */
  notes: string[];
}

export interface SolveFailure {
  ok: false;
  errors: SolveError[];
}

export type SolveResult = SolveSuccess | SolveFailure;
