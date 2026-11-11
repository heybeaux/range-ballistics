import { describe, expect, it } from 'vitest';
import { addProfile, defaultState, loadSaved, selectLibraryLoad } from '../src/planner/storage';
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
  setPath,
  unitLabelFor
} from '../src/planner/fields';

describe('planner fields', () => {
  it('FIELDS has 39 unique rows with sane limits and options', () => {
    expect(FIELDS).toHaveLength(39);
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
    expect(html.match(/<fieldset/g)).toHaveLength(7);
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

  it('FIELDS rifle group starts with rifleName then barrelLength; every path resolves', () => {
    const ids = FIELDS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    const rifleIds = FIELDS.filter((f) => f.group === 'rifle').map((f) => f.id);
    expect(rifleIds[0]).toBe('rifleName');
    expect(rifleIds[1]).toBe('barrelLength');
    const s = defaultState();
    for (const def of FIELDS) {
      expect(getPath(s, def.path), def.path).not.toBeUndefined();
    }
  });

  it('displayValue for the new fields in defaultState', () => {
    const s = defaultState();
    const byId = (id: string) => {
      const def = fieldById(id);
      if (def === undefined) throw new Error(`no field ${id}`);
      return def;
    };
    expect(displayValue(byId('barrelLength'), s)).toBe('16.0');
    expect(displayValue(byId('bulletDiameter'), s)).toBe('0.308');
    expect(displayValue(byId('availableElevation'), s)).toBe('19.0');
    expect(displayValue(byId('bcRA4'), s)).toBe('');
    const m: AppState = { ...s, unitSystem: 'metric' };
    expect(displayValue(byId('barrelLength'), m)).toBe('16.0');
    expect(unitLabelFor(byId('barrelLength'), m)).toBe('in');
  });

  it('unitLabelFor(availableElevation) is the angle unit', () => {
    const def = fieldById('availableElevation');
    if (def === undefined) throw new Error('no availableElevation');
    expect(unitLabelFor(def, defaultState())).toBe('MIL');
  });

  it('parseInput barrelLength converts inches and reports limits in inches', () => {
    const def = fieldById('barrelLength');
    if (def === undefined) throw new Error('no barrelLength');
    const ok = parseInput(def, '20', 'imperial');
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.value).toBeCloseTo(0.508, 9);
    }
    const low = parseInput(def, '2', 'imperial');
    expect(low.ok).toBe(false);
    if (!low.ok) {
      expect(low.message).toContain('Must be between 3.9 and 39.4 in');
    }
  });

  it('applyField rifleName sets the name and blanks become My rifle', () => {
    const s = defaultState();
    const def = fieldById('rifleName');
    if (def === undefined) throw new Error('no rifleName');
    expect(applyField(s, def, 'Savage').rifle.name).toBe('Savage');
    expect(applyField(s, def, '   ').rifle.name).toBe('My rifle');
  });

  it('fieldHtml renders the rifleName text field', () => {
    const s = defaultState();
    const def = fieldById('rifleName');
    if (def === undefined) throw new Error('no rifleName');
    const html = fieldHtml(def, s, undefined);
    expect(html).toContain('type="text"');
    expect(html).toContain('id="rifleName"');
    expect(html).toContain(`value="${s.rifle.name}"`);
  });

  it('barrel length re-estimates an estimated velocity', () => {
    const s = selectLibraryLoad(defaultState(), 'hornady-80966');
    const def = fieldById('barrelLength');
    if (def === undefined) throw new Error('no barrelLength');
    const a = applyField(s, def, 0.508);
    expect(a.load.muzzleVelocityMps).toBeCloseTo(2700 * 0.3048 - 250.8 * (0.6096 - 0.508), 2);
    const b = applyField(s, def, 0.6096);
    expect(b.load.muzzleVelocityMps).toBeCloseTo(822.96, 2);
  });

  it('barrel length does not touch a measured velocity', () => {
    const s0 = selectLibraryLoad(defaultState(), 'hornady-80966');
    const s: AppState = {
      ...s0,
      load: { ...s0.load, velocityMeasured: true, muzzleVelocityMps: 760 }
    };
    const def = fieldById('barrelLength');
    if (def === undefined) throw new Error('no barrelLength');
    const n = applyField(s, def, 0.508);
    expect(n.load.muzzleVelocityMps).toBe(760);
  });

  it('barrel length with a custom load leaves the velocity unchanged', () => {
    const s0 = selectLibraryLoad(defaultState(), 'hornady-80966');
    const s: AppState = {
      ...s0,
      load: { ...s0.load, libraryId: null, muzzleVelocityMps: 760 }
    };
    const def = fieldById('barrelLength');
    if (def === undefined) throw new Error('no barrelLength');
    const n = applyField(s, def, 0.508);
    expect(n.load.muzzleVelocityMps).toBe(760);
  });

  it('PMC two-barrel load uses the nearest published velocity', () => {
    const saved = addProfile(loadSaved({ getItem: () => null }), '556-nato', 'AR');
    const s = selectLibraryLoad(saved.profiles[0]?.state ?? defaultState(), 'pmc-556k');
    const def = fieldById('barrelLength');
    if (def === undefined) throw new Error('no barrelLength');
    expect(s.load.muzzleVelocityMps).toBeCloseTo(2920 * 0.3048, 2);
    const a = applyField(s, def, 0.508);
    expect(a.load.muzzleVelocityMps).toBeCloseTo(3100 * 0.3048, 2);
    const b = applyField(s, def, 0.4572);
    expect(b.load.muzzleVelocityMps).toBeCloseTo(3010 * 0.3048, 2);
  });

  it('applyField bcRA4 sets the value and user origin', () => {
    const s = defaultState();
    const def = fieldById('bcRA4');
    if (def === undefined) throw new Error('no bcRA4');
    const n = applyField(s, def, 0.112);
    expect(n.load.bcRA4).toBe(0.112);
    expect(n.load.origin.bcRA4).toBe('user');
  });

  it('fieldHtml dragModel includes the RA4 option', () => {
    const def = fieldById('dragModel');
    if (def === undefined) throw new Error('no dragModel');
    expect(fieldHtml(def, defaultState(), undefined)).toContain('<option value="RA4"');
  });

  it('formHtml hides a library scope published figures but keeps availableElevation', () => {
    const s = defaultState();
    const html = formHtml(s, {});
    expect(html.match(/<fieldset/g)).toHaveLength(7);
    expect(html).toContain('<legend>Your scope</legend>');
    expect(html).toContain('id="availableElevation"');
    expect(html).not.toContain('id="magMin"');
    expect(html).not.toContain('id="fovAtMin"');
    const generic: AppState = { ...s, rifle: { ...s.rifle, scope: { ...s.rifle.scope, libraryId: null } } };
    const htmlGeneric = formHtml(generic, {});
    expect(htmlGeneric).toContain('id="magMin"');
    expect(htmlGeneric).toContain('id="magMax"');
    expect(htmlGeneric).toContain('id="focalPlane"');
    expect(htmlGeneric).toContain('id="fovAtMin"');
    expect(htmlGeneric).toContain('id="fovAtMax"');
  });

  it('applyField magMax clamps the magnification', () => {
    const s0 = defaultState();
    const s: AppState = {
      ...s0,
      magnification: 20,
      rifle: { ...s0.rifle, scope: { ...s0.rifle.scope, libraryId: null, magMin: 5, magMax: 25 } }
    };
    const def = fieldById('magMax');
    if (def === undefined) throw new Error('no magMax');
    const n = applyField(s, def, 12);
    expect(n.magnification).toBe(12);
  });

  it('applyField angleUnit converts availableElevation and sets the generic reticle', () => {
    const s0 = defaultState();
    const s: AppState = {
      ...s0,
      rifle: { ...s0.rifle, scope: { ...s0.rifle.scope, libraryId: null, reticleId: 'generic-mil', availableElevation: 15 } }
    };
    const def = fieldById('angleUnit');
    if (def === undefined) throw new Error('no angleUnit');
    const moa = applyField(s, def, 'MOA');
    expect(moa.rifle.scope.reticleId).toBe('generic-moa');
    expect(moa.rifle.scope.availableElevation).toBeCloseTo(51.57, 2);
    const mil = applyField(moa, def, 'MIL');
    expect(mil.rifle.scope.reticleId).toBe('generic-mil');
    expect(mil.rifle.scope.availableElevation).toBeCloseTo(15, 2);
    const lib = applyField(s0, def, 'MOA');
    expect(lib.rifle.scope.reticleId).toBe(s0.rifle.scope.reticleId);
  });

  it('setPath handles a three-part scope path without mutating', () => {
    const s = defaultState();
    const n = setPath(s, 'rifle.scope.magMin', 4);
    expect(n.rifle.scope.magMin).toBe(4);
    expect(s.rifle.scope.magMin).toBe(5);
  });
});
