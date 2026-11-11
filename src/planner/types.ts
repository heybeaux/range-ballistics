/**
 * Planner contract. Fixed by the lead; do not edit.
 *
 * Every number in AppState is SI (metres, kg, m/s, kelvin, pascal, radians), the same as the
 * solver. Conversion to yards / fps / MIL happens only when a value is shown or typed.
 * The two exceptions are scope values, which stay in the scope's own angle unit:
 * Rifle.clickValue and ScopeProfile.availableElevation are in Rifle.angleUnit (MIL or MOA).
 *
 * AppState is ONE rifle with its load, conditions and settings. SavedState (version 2) is what
 * goes into browser storage: a list of AppStates, one per rifle, and which one is active.
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

/** A piece of text quoted from a source, shown with a link. */
export interface SourcedText {
  text: string;
  sourceUrl: string;
  readOn: string;
}

/** A maker-published muzzle velocity from one stated barrel length. */
export interface BarrelVelocity {
  barrelM: number;
  velocityMps: number;
}

/** One row of src/data/loads.json. */
export interface LibraryLoad {
  id: string;
  /** Id of a Cartridge in the same file, for example "308-win". */
  cartridgeId: string;
  /** For example "Federal Gold Medal 168 gr Sierra MatchKing". */
  name: string;
  bulletMassKg: number;
  bulletDiameterM: number;
  bulletLengthM: Sourced;
  bcG1: Sourced;
  bcG7: Sourced;
  /** BC against the RA4 rimfire drag model. Only Eley publishes this. */
  bcRA4: Sourced;
  /**
   * false = the maker gives the BC in bcG1 without naming a drag model. The app solves it as G1
   * and says "drag model not stated, treated as G1".
   */
  bcModelStated: boolean;
  /** Maker's published muzzle velocity from its test barrel. */
  publishedVelocityMps: Sourced;
  /** Test barrel length. null = the maker does not state it. */
  testBarrelM: number | null;
  /**
   * When the maker publishes the same load from more than one barrel length, every published
   * pair, shortest barrel first. Empty for most loads. Same source as publishedVelocityMps.
   */
  velocityByBarrel: BarrelVelocity[];
  /** Shown next to the load, for example which standard atmosphere the BC is quoted against. */
  note: string | null;
}

/** Default distances for a new rifle in this cartridge. */
export interface CartridgeDefaults {
  targetRangeM: number;
  zeroRangeM: number;
  dope: DopeRange;
  twistM: number;
  barrelLengthM: number;
}

export interface Cartridge {
  /** For example "308-win", "223-rem", "556-nato", "22-lr". */
  id: string;
  /** For example ".308 Winchester". */
  name: string;
  bulletDiameterM: number;
  /** Where the diameter comes from (SAAMI drawing). */
  diameterSource: SourcedText;
  /**
   * Velocity lost per metre of barrel shorter than the test barrel. value null = no sourced
   * figure: the app makes no barrel-length correction for this cartridge.
   */
  velocityLossMpsPerM: Sourced;
  /** Plain-language explanation of the figure, or of why there is none. */
  velocityLossNote: string;
  /** A published safety statement shown for this cartridge, in the source's own words. */
  safetyNote: SourcedText | null;
  defaults: CartridgeDefaults;
}

/** src/data/loads.json */
export interface LoadLibrary {
  cartridges: Cartridge[];
  loads: LibraryLoad[];
}

export type ReticleId = 'ebr-7c-mrad' | 'generic-mil' | 'generic-moa';

/** One row of src/data/scopes.json, and the scope stored on a rifle. */
export interface ScopeProfile {
  /** Library id, for example "vortex-venom-5-25x56-ebr7c-mrad". null = the user's own generic scope. */
  libraryId: string | null;
  name: string;
  magMin: number;
  magMax: number;
  focalPlane: 'first' | 'second';
  /** Angle across the full field of view at magMin, radians. */
  fovAtMinRad: number;
  /** Angle across the full field of view at magMax, radians. */
  fovAtMaxRad: number;
  /** Second focal plane only: the magnification where the reticle's marks are true. null for first focal plane. */
  trueSubtensionMag: number | null;
  reticleId: ReticleId;
  /**
   * How far the elevation turret can dial UP from the rifle's zero, in Rifle.angleUnit.
   * Depends on the mount and where the zero sits, so the user can edit it.
   */
  availableElevation: number;
  /** Shown under the scope, for example where the reticle drawing comes from. null = none. */
  note: SourcedText | null;
}

/** src/data/scopes.json */
export interface LibraryScope {
  scope: ScopeProfile;
  /** The unit and click the turrets use. Picking this scope sets Rifle.angleUnit and Rifle.clickValue. */
  angleUnit: AngleUnit;
  clickValue: number;
  /** One line per published figure, each with its source. Shown when the scope is picked. */
  facts: SourcedText[];
}

export interface ScopeLibrary {
  scopes: LibraryScope[];
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
  bcRA4: number | null;
  dragModel: DragModel;
  muzzleVelocityMps: number;
  /** false = estimate. The app shows "estimated velocity" until the user enters a chronograph average. */
  velocityMeasured: boolean;
  origin: { bulletLengthM: Origin; bcG1: Origin; bcG7: Origin; bcRA4: Origin };
}

export interface Rifle {
  name: string;
  /** Id of a Cartridge in the library, or "other" for a cartridge the library does not have. */
  cartridgeId: string;
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
  scope: ScopeProfile;
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

/** One rifle with everything that belongs to it. */
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
  /** Scope-view magnification. Kept between rifle.scope.magMin and magMax. */
  magnification: number;
}

/** One saved rifle. */
export interface SavedProfile {
  /** Stable id, for example "r1". Never shown. */
  id: string;
  state: AppState;
}

/** What goes into browser storage. */
export interface SavedState {
  version: 2;
  activeId: string;
  profiles: SavedProfile[];
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
  /**
   * Elevation only. true = this is more than the scope can dial up from zero
   * (rifle.scope.availableElevation). Always false for windage and for 'down' corrections.
   */
  beyondDial: boolean;
  /** When beyondDial: how much is left to hold after dialling everything, in the rifle's angleUnit. Otherwise 0. */
  holdRemaining: number;
}

/** Where the bullet is, relative to the speed of sound, as it leaves the muzzle. */
export type MuzzleRegime = 'supersonic' | 'transonic' | 'subsonic';

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
  /** Mach at the muzzle: >= 1.2 supersonic, >= 1.0 transonic, else subsonic. */
  muzzleRegime: MuzzleRegime;
  transonicRangeM: number | null;
  subsonicRangeM: number | null;
  /**
   * True when a load that starts supersonic has dropped below Mach 1.2 before the target.
   * Always false when muzzleRegime is 'transonic' or 'subsonic' (those loads never had a
   * supersonic stretch to leave).
   */
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
