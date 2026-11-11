import type { AppState } from './types';
import type { Quantity, UnitSystem } from '../units/units';
import { unitFor } from '../units/units';
import { escapeHtml } from './view';

export type Group = 'shot' | 'air' | 'load' | 'rifle' | 'table' | 'display';

export interface FieldDef {
  id: string;
  group: Group;
  label: string;
  help: string;
  kind: 'number' | 'select' | 'checkbox';
  path: string;
  quantity?: Quantity;
  unitLabel?: string;
  scale?: number;
  decimals?: number;
  minSi?: number;
  maxSi?: number;
  nullable?: boolean;
  options?: Array<{ value: string; label: string }>;
}

export type ParseResult = { ok: true; value: number | null } | { ok: false; message: string };

const D2R = Math.PI / 180;

export const FIELDS: FieldDef[] = [
  {
    id: 'targetRange',
    group: 'shot',
    kind: 'number',
    path: 'conditions.targetRangeM',
    quantity: 'range',
    minSi: 10,
    maxSi: 1500,
    label: 'Target distance',
    help: 'How far away the target is.'
  },
  {
    id: 'windSpeed',
    group: 'shot',
    kind: 'number',
    path: 'conditions.windSpeedMps',
    quantity: 'windSpeed',
    minSi: 0,
    maxSi: 30,
    label: 'Wind speed',
    help: 'Average wind between you and the target.'
  },
  {
    id: 'windClock',
    group: 'shot',
    kind: 'number',
    path: 'conditions.windClock',
    unitLabel: "o'clock",
    decimals: 1,
    minSi: 0.5,
    maxSi: 12,
    label: 'Wind direction',
    help: 'Where the wind comes from, as a clock face. 12 is from the target toward you, 3 is from your right, 6 is from behind you, 9 is from your left.'
  },
  {
    id: 'shotAngle',
    group: 'shot',
    kind: 'number',
    path: 'conditions.shotAngleRad',
    unitLabel: 'degrees',
    scale: 180 / Math.PI,
    decimals: 1,
    minSi: -45 * D2R,
    maxSi: 45 * D2R,
    label: 'Shot angle',
    help: 'Uphill is positive, downhill is negative. Use 0 on a flat range.'
  },
  {
    id: 'temperature',
    group: 'air',
    kind: 'number',
    path: 'conditions.temperatureK',
    quantity: 'temperature',
    minSi: 233.15,
    maxSi: 323.15,
    label: 'Temperature',
    help: 'Air temperature at the firing line.'
  },
  {
    id: 'pressureMode',
    group: 'air',
    kind: 'select',
    path: 'conditions.pressureMode',
    options: [
      { value: 'station', label: 'Station pressure' },
      { value: 'altitude', label: 'Altitude (estimate)' }
    ],
    label: 'Air pressure from',
    help: 'Station pressure is the actual pressure where you are, from a Kestrel or phone barometer. If you only know your altitude, the app estimates the pressure from a standard atmosphere.'
  },
  {
    id: 'pressure',
    group: 'air',
    kind: 'number',
    path: 'conditions.pressurePa',
    quantity: 'pressure',
    minSi: 50000,
    maxSi: 110000,
    label: 'Station pressure',
    help: 'The actual air pressure where you are standing. Not the sea-level figure from a weather report.'
  },
  {
    id: 'altitude',
    group: 'air',
    kind: 'number',
    path: 'conditions.altitudeM',
    quantity: 'altitude',
    minSi: -400,
    maxSi: 5000,
    label: 'Altitude',
    help: 'Height above sea level.'
  },
  {
    id: 'humidity',
    group: 'air',
    kind: 'number',
    path: 'conditions.relativeHumidity',
    unitLabel: '%',
    scale: 100,
    decimals: 0,
    minSi: 0,
    maxSi: 1,
    label: 'Humidity',
    help: 'Relative humidity. It has a small effect.'
  },
  {
    id: 'muzzleVelocity',
    group: 'load',
    kind: 'number',
    path: 'load.muzzleVelocityMps',
    quantity: 'velocity',
    minSi: 100,
    maxSi: 1500,
    label: 'Muzzle velocity',
    help: 'Bullet speed at the muzzle. The best value is the average from your own chronograph.'
  },
  {
    id: 'velocityMeasured',
    group: 'load',
    kind: 'checkbox',
    path: 'load.velocityMeasured',
    label: 'This is my chronograph average',
    help: 'Tick this once you have measured the velocity in your own rifle.'
  },
  {
    id: 'bulletMass',
    group: 'load',
    kind: 'number',
    path: 'load.bulletMassKg',
    quantity: 'mass',
    minSi: 0.001,
    maxSi: 0.05,
    label: 'Bullet weight',
    help: 'Printed on the ammunition box, in grains.'
  },
  {
    id: 'dragModel',
    group: 'load',
    kind: 'select',
    path: 'load.dragModel',
    options: [
      { value: 'G7', label: 'G7 (boat-tail match bullets)' },
      { value: 'G1', label: 'G1 (flat-base bullets)' }
    ],
    label: 'Drag model',
    help: 'Which standard bullet shape the BC is measured against. Use G7 for long boat-tail match bullets when the maker publishes it.'
  },
  {
    id: 'bcG7',
    group: 'load',
    kind: 'number',
    path: 'load.bcG7',
    decimals: 3,
    nullable: true,
    minSi: 0.05,
    maxSi: 1.2,
    label: 'G7 BC',
    help: 'Ballistic coefficient against the G7 shape. Higher means less drag.'
  },
  {
    id: 'bcG1',
    group: 'load',
    kind: 'number',
    path: 'load.bcG1',
    decimals: 3,
    nullable: true,
    minSi: 0.05,
    maxSi: 1.2,
    label: 'G1 BC',
    help: 'Ballistic coefficient against the G1 shape. Higher means less drag.'
  },
  {
    id: 'bulletLength',
    group: 'load',
    kind: 'number',
    path: 'load.bulletLengthM',
    quantity: 'smallLength',
    decimals: 3,
    nullable: true,
    minSi: 0.005,
    maxSi: 0.06,
    label: 'Bullet length',
    help: 'Length of the bullet alone, not the cartridge. Needed for spin drift. Leave empty if you do not know it.'
  },
  {
    id: 'spinDrift',
    group: 'load',
    kind: 'checkbox',
    path: 'spinDrift',
    label: 'Include spin drift',
    help: 'A spinning bullet drifts slightly toward the direction of its twist. Needs the bullet length.'
  },
  {
    id: 'zeroRange',
    group: 'rifle',
    kind: 'number',
    path: 'rifle.zeroRangeM',
    quantity: 'range',
    minSi: 10,
    maxSi: 500,
    label: 'Zero distance',
    help: 'The distance where your point of aim and point of impact meet.'
  },
  {
    id: 'sightHeight',
    group: 'rifle',
    kind: 'number',
    path: 'rifle.sightHeightM',
    quantity: 'smallLength',
    decimals: 2,
    minSi: 0.01,
    maxSi: 0.15,
    label: 'Sight height',
    help: 'Centre of the scope above the centre of the bore.'
  },
  {
    id: 'twist',
    group: 'rifle',
    kind: 'number',
    path: 'rifle.twistM',
    quantity: 'twist',
    minSi: 0.1,
    maxSi: 0.6,
    label: 'Barrel twist',
    help: 'Distance the rifling takes to make one full turn. A 1:11 barrel is 11 inches.'
  },
  {
    id: 'twistDirection',
    group: 'rifle',
    kind: 'select',
    path: 'rifle.twistDirection',
    options: [
      { value: 'right', label: 'Right-hand' },
      { value: 'left', label: 'Left-hand' }
    ],
    label: 'Twist direction',
    help: 'Almost all factory rifles are right-hand.'
  },
  {
    id: 'twistConfirmed',
    group: 'rifle',
    kind: 'checkbox',
    path: 'rifle.twistConfirmed',
    label: 'I have measured or confirmed this twist',
    help: 'Tick this once you have checked the twist on your own barrel.'
  },
  {
    id: 'angleUnit',
    group: 'rifle',
    kind: 'select',
    path: 'rifle.angleUnit',
    options: [
      { value: 'MIL', label: 'MIL' },
      { value: 'MOA', label: 'MOA' }
    ],
    label: 'Scope adjusts in',
    help: 'The unit marked on your scope turrets.'
  },
  {
    id: 'clickValue',
    group: 'rifle',
    kind: 'number',
    path: 'rifle.clickValue',
    decimals: 3,
    minSi: 0.01,
    maxSi: 1,
    label: 'One click equals',
    help: 'How much one turret click moves the impact, in the unit above. Most MIL scopes are 0.1.'
  },
  {
    id: 'dopeStart',
    group: 'table',
    kind: 'number',
    path: 'dope.startM',
    quantity: 'range',
    minSi: 10,
    maxSi: 1500,
    label: 'Table from',
    help: 'First distance in the dope table.'
  },
  {
    id: 'dopeEnd',
    group: 'table',
    kind: 'number',
    path: 'dope.endM',
    quantity: 'range',
    minSi: 10,
    maxSi: 1500,
    label: 'Table to',
    help: 'Last distance in the dope table.'
  },
  {
    id: 'dopeStep',
    group: 'table',
    kind: 'number',
    path: 'dope.stepM',
    quantity: 'range',
    minSi: 5,
    maxSi: 500,
    label: 'Table step',
    help: 'Distance between rows.'
  },
  {
    id: 'unitSystem',
    group: 'display',
    kind: 'select',
    path: 'unitSystem',
    options: [
      { value: 'imperial', label: 'Imperial (yards, fps, °F)' },
      { value: 'metric', label: 'Metric (metres, m/s, °C)' }
    ],
    label: 'Units',
    help: 'Switching units converts what you see. It does not change the shot.'
  },
  {
    id: 'targetType',
    group: 'display',
    kind: 'select',
    path: 'targetType',
    options: [
      { value: 'steel', label: 'Steel plate' },
      { value: 'paper', label: 'Paper target' }
    ],
    label: 'Target',
    help: 'What to draw at the target distance.'
  }
];

export const GROUP_TITLES: Record<Group, string> = {
  shot: 'The shot',
  air: 'The air',
  load: 'Your load',
  rifle: 'Your rifle',
  table: 'Dope table',
  display: 'Display'
};

export function fieldById(id: string): FieldDef | undefined {
  return FIELDS.find((f) => f.id === id);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function getPath(state: AppState, path: string): unknown {
  let v: unknown = state;
  for (const part of path.split('.')) {
    if (!isRecord(v)) return undefined;
    v = v[part];
  }
  return v;
}

export function setPath(state: AppState, path: string, value: number | string | boolean | null): AppState {
  const copy: unknown = JSON.parse(JSON.stringify(state));
  const parts = path.split('.');
  let v: unknown = copy;
  for (const part of parts.slice(0, -1)) {
    if (!isRecord(v)) return state;
    v = v[part];
  }
  const last = parts[parts.length - 1];
  if (isRecord(v) && last !== undefined) {
    v[last] = value;
  }
  return copy as AppState;
}

export function unitLabelFor(def: FieldDef, state: AppState): string {
  if (def.quantity !== undefined) {
    return unitFor(def.quantity, state.unitSystem).label;
  }
  if (def.id === 'clickValue') {
    return state.rifle.angleUnit;
  }
  return def.unitLabel ?? '';
}

export function displayValue(def: FieldDef, state: AppState): string {
  const v = getPath(state, def.path);
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    return '';
  }
  let text: string;
  if (def.quantity !== undefined) {
    const u = unitFor(def.quantity, state.unitSystem);
    text = u.toDisplay(v).toFixed(def.decimals ?? u.decimals);
  } else {
    text = (v * (def.scale ?? 1)).toFixed(def.decimals ?? 0);
  }
  if (parseFloat(text) === 0) {
    const decimals = def.quantity !== undefined ? (def.decimals ?? unitFor(def.quantity, state.unitSystem).decimals) : (def.decimals ?? 0);
    return (0).toFixed(decimals);
  }
  return text;
}

function limitText(def: FieldDef, system: UnitSystem, si: number): string {
  if (def.quantity !== undefined) {
    const u = unitFor(def.quantity, system);
    return u.toDisplay(si).toFixed(def.decimals ?? u.decimals);
  }
  return (si * (def.scale ?? 1)).toFixed(def.decimals ?? 0);
}

export function parseInput(def: FieldDef, text: string, system: UnitSystem): ParseResult {
  const t = text.trim();
  if (t === '') {
    return def.nullable ? { ok: true, value: null } : { ok: false, message: 'Enter a value.' };
  }
  const n = Number(t);
  if (!Number.isFinite(n)) {
    return { ok: false, message: 'Enter a number.' };
  }
  const si = def.quantity !== undefined ? unitFor(def.quantity, system).fromDisplay(n) : n / (def.scale ?? 1);
  const minSi = def.minSi;
  const maxSi = def.maxSi;
  if (minSi !== undefined && maxSi !== undefined) {
    if (si < minSi - 1e-9 || si > maxSi + 1e-9) {
      const label = def.quantity !== undefined ? unitFor(def.quantity, system).label : (def.unitLabel ?? '');
      const unit = label === '' ? '' : ` ${label}`;
      return { ok: false, message: `Must be between ${limitText(def, system, minSi)} and ${limitText(def, system, maxSi)}${unit}.` };
    }
  }
  return { ok: true, value: si };
}

export function applyField(state: AppState, def: FieldDef, value: number | string | boolean | null): AppState {
  const next = setPath(state, def.path, value);
  if (def.id === 'bcG1' || def.id === 'bcG7' || def.id === 'bulletLength') {
    if (def.id === 'bcG1') {
      next.load.origin.bcG1 = 'user';
    } else if (def.id === 'bcG7') {
      next.load.origin.bcG7 = 'user';
    } else {
      next.load.origin.bulletLengthM = 'user';
    }
  }
  if (def.id === 'muzzleVelocity' && typeof value === 'number') {
    if (Math.abs(value - state.load.muzzleVelocityMps) > 0.01) {
      next.load.velocityMeasured = false;
    }
  }
  return next;
}

export function fieldHtml(def: FieldDef, state: AppState, error: string | undefined): string {
  const id = def.id;
  const parts: string[] = [];
  if (def.kind === 'number') {
    parts.push(`<label for="${id}">${escapeHtml(def.label)}</label>`);
    parts.push(
      `<span class="input-row"><input type="text" inputmode="decimal" id="${id}" name="${id}" value="${escapeHtml(displayValue(def, state))}" autocomplete="off"><span class="unit">${escapeHtml(unitLabelFor(def, state))}</span></span>`
    );
  } else if (def.kind === 'select') {
    parts.push(`<label for="${id}">${escapeHtml(def.label)}</label>`);
    const current = String(getPath(state, def.path));
    const options = (def.options ?? [])
      .map((o) => `<option value="${escapeHtml(o.value)}"${current === o.value ? ' selected' : ''}>${escapeHtml(o.label)}</option>`)
      .join('');
    parts.push(`<select id="${id}" name="${id}">${options}</select>`);
  } else {
    const checked = getPath(state, def.path) === true ? ' checked' : '';
    parts.push(`<label class="check"><input type="checkbox" id="${id}" name="${id}"${checked}> ${escapeHtml(def.label)}</label>`);
  }
  parts.push(`<p class="help">${escapeHtml(def.help)}</p>`);
  if (error !== undefined) {
    parts.push(`<p class="error" role="alert">${escapeHtml(error)}</p>`);
  }
  return `<div class="field${error !== undefined ? ' has-error' : ''}" data-field="${id}">${parts.join('')}</div>`;
}

export function formHtml(state: AppState, errors: Record<string, string>): string {
  const groups: Group[] = ['shot', 'air', 'load', 'rifle', 'table', 'display'];
  const out: string[] = [];
  for (const group of groups) {
    const fields = FIELDS.filter((f) => {
      if (f.group !== group) return false;
      if (f.id === 'pressure' && state.conditions.pressureMode === 'altitude') return false;
      if (f.id === 'altitude' && state.conditions.pressureMode === 'station') return false;
      return true;
    });
    const body = fields.map((f) => fieldHtml(f, state, errors[f.id])).join('');
    out.push(`<fieldset class="group" data-group="${group}"><legend>${escapeHtml(GROUP_TITLES[group])}</legend>${body}</fieldset>`);
  }
  return out.join('');
}
