import { describe, expect, it } from 'vitest';
import { defaultState } from '../src/planner/storage';
import type { AppState } from '../src/planner/types';
import {
  FIELDS,
  applyField,
  displayValue,
  fieldById,
  fieldHtml,
  formHtml,
  getPath,
  parseInput,
  setPath
} from '../src/planner/fields';

describe('planner fields', () => {
  it('FIELDS has 29 unique rows with sane limits and options', () => {
    expect(FIELDS).toHaveLength(29);
    const ids = FIELDS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const def of FIELDS) {
      expect(def.label.length).toBeGreaterThan(0);
      expect(def.help.length).toBeGreaterThan(0);
      if (def.kind === 'number') {
        expect(def.minSi, `${def.id} minSi`).toBeDefined();
        expect(def.maxSi, `${def.id} maxSi`).toBeDefined();
        expect(def.minSi!).toBeLessThan(def.maxSi!);
      }
      if (def.kind === 'select') {
        expect(def.options?.length ?? 0).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('every FIELDS path resolves in defaultState', () => {
    const s = defaultState();
    for (const def of FIELDS) {
      expect(getPath(s, def.path), def.path).not.toBeUndefined();
    }
  });

  it('displayValue in imperial for defaultState', () => {
    const s = defaultState();
    const byId = (id: string) => {
      const def = fieldById(id);
      if (def === undefined) throw new Error(`no field ${id}`);
      return def;
    };
    expect(displayValue(byId('targetRange'), s)).toBe('300');
    expect(displayValue(byId('windSpeed'), s)).toBe('5');
    expect(displayValue(byId('windClock'), s)).toBe('3.0');
    expect(displayValue(byId('temperature'), s)).toBe('59');
    expect(displayValue(byId('pressure'), s)).toBe('29.92');
    expect(displayValue(byId('humidity'), s)).toBe('50');
    expect(displayValue(byId('muzzleVelocity'), s)).toBe('2650');
    expect(displayValue(byId('bulletMass'), s)).toBe('168');
    expect(displayValue(byId('bcG7'), s)).toBe('0.224');
    expect(displayValue(byId('sightHeight'), s)).toBe('1.75');
    expect(displayValue(byId('twist'), s)).toBe('11.0');
    expect(displayValue(byId('zeroRange'), s)).toBe('100');
    expect(displayValue(byId('clickValue'), s)).toBe('0.100');
    expect(displayValue(byId('shotAngle'), s)).toBe('0.0');
    expect(displayValue(byId('dopeStep'), s)).toBe('50');
  });

  it('displayValue in metric', () => {
    const s: AppState = { ...defaultState(), unitSystem: 'metric' };
    const byId = (id: string) => {
      const def = fieldById(id);
      if (def === undefined) throw new Error(`no field ${id}`);
      return def;
    };
    expect(displayValue(byId('targetRange'), s)).toBe('274');
    expect(displayValue(byId('temperature'), s)).toBe('15');
    expect(displayValue(byId('pressure'), s)).toBe('1013');
    expect(displayValue(byId('muzzleVelocity'), s)).toBe('808');
  });

  it('displayValue of bulletLength is empty when null', () => {
    const s = defaultState();
    const def = fieldById('bulletLength');
    if (def === undefined) throw new Error('no bulletLength');
    const n = setPath(s, def.path, null);
    expect(displayValue(def, n)).toBe('');
  });

  it('parseInput converts targetRange from display units', () => {
    const def = fieldById('targetRange');
    if (def === undefined) throw new Error('no targetRange');
    const imp = parseInput(def, '600', 'imperial');
    expect(imp.ok).toBe(true);
    if (imp.ok) {
      expect(imp.value).toBeCloseTo(548.64, 9);
    }
    const met = parseInput(def, '600', 'metric');
    expect(met.ok).toBe(true);
    if (met.ok) {
      expect(met.value).toBe(600);
    }
  });

  it('parseInput rejects empty and non-numeric input', () => {
    const def = fieldById('targetRange');
    if (def === undefined) throw new Error('no targetRange');
    expect(parseInput(def, '', 'imperial')).toEqual({ ok: false, message: 'Enter a value.' });
    expect(parseInput(def, 'abc', 'imperial')).toEqual({ ok: false, message: 'Enter a number.' });
  });

  it('parseInput reports limits in display units', () => {
    const def = fieldById('targetRange');
    if (def === undefined) throw new Error('no targetRange');
    const low = parseInput(def, '5', 'imperial');
    expect(low.ok).toBe(false);
    if (!low.ok) {
      expect(low.message).toBe('Must be between 11 and 1640 yd.');
    }
    const high = parseInput(def, '5000', 'metric');
    expect(high.ok).toBe(false);
    if (!high.ok) {
      expect(high.message).toBe('Must be between 10 and 1500 m.');
    }
  });

  it('parseInput handles nullable and scaled fields', () => {
    const bc = fieldById('bcG7');
    if (bc === undefined) throw new Error('no bcG7');
    expect(parseInput(bc, '', 'imperial')).toEqual({ ok: true, value: null });
    const bcVal = parseInput(bc, '0.243', 'imperial');
    expect(bcVal.ok).toBe(true);
    if (bcVal.ok) {
      expect(bcVal.value).toBe(0.243);
    }
    const hum = fieldById('humidity');
    if (hum === undefined) throw new Error('no humidity');
    const humVal = parseInput(hum, '50', 'imperial');
    expect(humVal.ok).toBe(true);
    if (humVal.ok) {
      expect(humVal.value).toBeCloseTo(0.5, 12);
    }
    const angle = fieldById('shotAngle');
    if (angle === undefined) throw new Error('no shotAngle');
    const angleVal = parseInput(angle, '10', 'imperial');
    expect(angleVal.ok).toBe(true);
    if (angleVal.ok) {
      expect(angleVal.value).toBeCloseTo((10 * Math.PI) / 180, 12);
    }
    const clock = fieldById('windClock');
    if (clock === undefined) throw new Error('no windClock');
    expect(parseInput(clock, '13', 'imperial').ok).toBe(false);
  });

  it('displayValue then parseInput round trips', () => {
    const s = defaultState();
    for (const def of FIELDS) {
      if (def.kind !== 'number') continue;
      const text = displayValue(def, s);
      if (text === '') continue;
      const r = parseInput(def, text, 'imperial');
      expect(r.ok, def.id).toBe(true);
    }
  });

  it('setPath does not mutate the argument', () => {
    const s = defaultState();
    const n = setPath(s, 'conditions.targetRangeM', 500);
    expect(n.conditions.targetRangeM).toBe(500);
    expect(s.conditions.targetRangeM).toBe(274.32);
    expect(n).not.toBe(s);
    expect(setPath(s, 'unitSystem', 'metric').unitSystem).toBe('metric');
  });

  it('applyField marks user origin for load fields', () => {
    const s = defaultState();
    const def = fieldById('bcG7');
    if (def === undefined) throw new Error('no bcG7');
    const n = applyField(s, def, 0.25);
    expect(n.load.bcG7).toBe(0.25);
    expect(n.load.origin.bcG7).toBe('user');
    expect(n.load.origin.bcG1).toBe('library');
  });

  it('applyField resets velocityMeasured when velocity changes', () => {
    const s: AppState = { ...defaultState(), load: { ...defaultState().load, velocityMeasured: true } };
    const def = fieldById('muzzleVelocity');
    if (def === undefined) throw new Error('no muzzleVelocity');
    const n = applyField(s, def, 760);
    expect(n.load.velocityMeasured).toBe(false);
    const same = applyField(s, def, s.load.muzzleVelocityMps);
    expect(same.load.velocityMeasured).toBe(true);
  });

  it('fieldHtml renders a number field', () => {
    const s = defaultState();
    const def = fieldById('targetRange');
    if (def === undefined) throw new Error('no targetRange');
    const html = fieldHtml(def, s, undefined);
    expect(html).toContain('id="targetRange"');
    expect(html).toContain('value="300"');
    expect(html).toContain('<span class="unit">yd</span>');
    expect(html).toContain('How far away the target is.');
    expect(html).not.toContain('class="error"');
  });

  it('fieldHtml renders an error', () => {
    const s = defaultState();
    const def = fieldById('targetRange');
    if (def === undefined) throw new Error('no targetRange');
    const html = fieldHtml(def, s, 'Enter a value.');
    expect(html).toContain('has-error');
    expect(html).toContain('<p class="error" role="alert">Enter a value.</p>');
  });

  it('fieldHtml renders selects and checkboxes', () => {
    const s = defaultState();
    const drag = fieldById('dragModel');
    if (drag === undefined) throw new Error('no dragModel');
    expect(fieldHtml(drag, s, undefined)).toContain('<option value="G7" selected>');
    const measured = fieldById('velocityMeasured');
    if (measured === undefined) throw new Error('no velocityMeasured');
    const measuredHtml = fieldHtml(measured, s, undefined);
    expect(measuredHtml).toContain('type="checkbox"');
    expect(measuredHtml).not.toContain(' checked');
    const spin = fieldById('spinDrift');
    if (spin === undefined) throw new Error('no spinDrift');
    expect(fieldHtml(spin, s, undefined)).toContain(' checked');
  });

  it('fieldHtml shows the angle unit for clickValue', () => {
    const s = defaultState();
    const def = fieldById('clickValue');
    if (def === undefined) throw new Error('no clickValue');
    expect(fieldHtml(def, s, undefined)).toContain('<span class="unit">MIL</span>');
  });

  it('formHtml groups fields and hides the inactive pressure field', () => {
    const s = defaultState();
    const html = formHtml(s, {});
    expect(html.match(/<fieldset/g)).toHaveLength(6);
    expect(html).toContain('<legend>The shot</legend>');
    expect(html).toContain('id="pressure"');
    expect(html).not.toContain('id="altitude"');
    const alt: AppState = { ...s, conditions: { ...s.conditions, pressureMode: 'altitude' } };
    const htmlAlt = formHtml(alt, {});
    expect(htmlAlt).toContain('id="altitude"');
    expect(htmlAlt).not.toContain('id="pressure"');
  });

  it('formHtml shows each error once', () => {
    const s = defaultState();
    const html = formHtml(s, { windSpeed: 'Enter a number.' });
    expect(html.split('Enter a number.').length - 1).toBe(1);
  });
});
