/**
 * Planner contract. Fixed by the lead; do not edit.
 *
 * Every number in AppState is SI (metres, kg, m/s, kelvin, pascal, radians), the same as the
 * solver. Conversion to yards / fps / MIL happens only when a value is shown or typed.
 */
import type { DragModel } from '../solver/types';
import type { AngleUnit, UnitSystem } from '../units/units';

/** A library number with where it came from. value null = the maker does not publish it. */
export interface Sourced {
  value: number | null;
  /** Manufacturer page. null only when value is null. */
  sourceUrl: string | null;
  /** ISO date the page was read, for example "2026-11-10". */
  readOn: string | null;
}

/** One row of src/data/loads.json. */
export interface LibraryLoad {
  id: string;
  /** For example "Federal Gold Medal 168 gr Sierra MatchKing". */
  name: string;
  bulletMassKg: number;
  bulletDiameterM: number;
  bulletLengthM: Sourced;
  bcG1: Sourced;
  bcG7: Sourced;
  /** Maker's published muzzle velocity from its test barrel. */
  publishedVelocityMps: Sourced;
  /** Test barrel length. null = the maker does not state it. */
  testBarrelM: number | null;
  /** Shown next to the load, for example which standard atmosphere the BC is quoted against. */
  note: string | null;
}

/** src/data/loads.json */
export interface LoadLibrary {
  loads: LibraryLoad[];
  /** Velocity lost per metre of barrel shorter than the test barrel, with its source. */
  velocityLossMpsPerM: Sourced;
  velocityLossNote: string;
}

/** Where the value in a field came from. Drives the "source" link and the "your value" label. */
export type Origin = 'library' | 'user';

/** The load being shot. A copy, so the user can edit any field without changing the library. */
export interface ActiveLoad {
  /** Library id this was copied from, or null for a custom load. */
  libraryId: string | null;
  name: string;
  bulletMassKg: number;
  bulletDiameterM: number;
  bulletLengthM: number | null;
  bcG1: number | null;
  bcG7: number | null;
  dragModel: DragModel;
  muzzleVelocityMps: number;
  /** false = estimate. The app shows "estimated velocity" until the user enters a chronograph average. */
  velocityMeasured: boolean;
  origin: { bulletLengthM: Origin; bcG1: Origin; bcG7: Origin };
}

export interface Rifle {
  name: string;
  barrelLengthM: number;
  /** Metres of travel per full turn. 1:11" = 0.2794. */
  twistM: number;
  twistDirection: 'right' | 'left';
  /** false = show "unconfirmed" and the measuring steps. */
  twistConfirmed: boolean;
  sightHeightM: number;
  zeroRangeM: number;
  angleUnit: AngleUnit;
  /** Size of one scope click in angleUnit. Default 0.1 (MIL). */
  clickValue: number;
}

export interface Conditions {
  targetRangeM: number;
  windSpeedMps: number;
  /** Clock direction the wind comes from, > 0 and <= 12. */
  windClock: number;
  temperatureK: number;
  /** 'station' = use pressurePa. 'altitude' = use the standard-atmosphere pressure at altitudeM. */
  pressureMode: 'station' | 'altitude';
  pressurePa: number;
  altitudeM: number;
  /** 0 to 1. */
  relativeHumidity: number;
  /** Positive = uphill. */
  shotAngleRad: number;
}

export interface DopeRange {
  startM: number;
  endM: number;
  stepM: number;
}

export interface AppState {
  version: 1;
  unitSystem: UnitSystem;
  rifle: Rifle;
  load: ActiveLoad;
  customLoads: ActiveLoad[];
  conditions: Conditions;
  dope: DopeRange;
  spinDrift: boolean;
  targetType: 'steel' | 'paper';
  setupDone: boolean;
}

/** One correction, ready to show. */
export interface Correction {
  /** Offset of the bullet from the point of aim at the target, metres. Elevation: negative = low. Windage: negative = left. */
  offsetM: number;
  /** What to dial or hold, always >= 0, unrounded. */
  mil: number;
  moa: number;
  /** Direction to dial: elevation 'up' | 'down', windage 'left' | 'right'. 'none' when the offset is under 0.5 mm. */
  direction: 'up' | 'down' | 'left' | 'right' | 'none';
  /** Whole clicks in the rifle's angleUnit and clickValue. */
  clicks: number;
}

/** Everything the results panel shows for the target distance. */
export interface ShotResults {
  rangeM: number;
  elevation: Correction;
  windage: Correction;
  timeOfFlightS: number;
  velocityMps: number;
  energyJ: number;
  mach: number;
  /** null = not available (bullet length unknown or spin drift off). */
  spinDriftM: number | null;
  stabilitySg: number | null;
  stabilityStatus: 'stable' | 'marginal' | 'unstable' | null;
  transonicRangeM: number | null;
  subsonicRangeM: number | null;
  /** True when the target is past the Mach 1.2 range. */
  pastTransonic: boolean;
  velocityEstimated: boolean;
  notes: string[];
}

export interface DopeRow {
  rangeM: number;
  elevation: Correction;
  windage: Correction;
  timeOfFlightS: number;
  velocityMps: number;
}

export const PLANNING_NOTICE =
  'Planning aid only. Real impacts and your own recorded dope are the authority.';
