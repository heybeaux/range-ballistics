import { describe, it, expect } from 'vitest';
import { solve } from '../src/solver/solve';
import type { AppState, ShotResults, DopeRow } from '../src/planner/types';
import { PLANNING_NOTICE } from '../src/planner/types';
import { toShotInput, shotResults, dopeRows } from '../src/planner/model';
import { defaultState, loadSaved, activeState, addProfile, selectLibraryLoad } from '../src/planner/storage';
import { escapeHtml, correctionHtml, resultsHtml, dopeTableHtml, cardHeaderLines, printCardHtml, windClockSvg } from '../src/planner/view';

const emptyStorage: Pick<Storage, 'getItem'> = { getItem: () => null };

function compute(state: AppState): { results: ShotResults; rows: DopeRow[] } {
  const input = toShotInput(state);
  if (input === null) throw new Error('no input');
  const solved = solve(input);
  if (!solved.ok) throw new Error(JSON.stringify(solved.errors));
  const results = shotResults(state, solved);
  if (results === null) throw new Error('no results');
  return { results, rows: dopeRows(state, solved) };
}

describe('escapeHtml', () => {
  it('escapes all five characters', () => {
    expect(escapeHtml('<a href="x">Tom & \'Jo\'</a>')).toBe('&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jo&#39;&lt;/a&gt;');
  });
});

describe('correctionHtml', () => {
  it('shows clicks, direction, and the full equivalences', () => {
    const html = correctionHtml(
      'Elevation',
      { offsetM: -0.5, mil: 1.0, moa: 3.4377, direction: 'up', clicks: 10, beyondDial: false, holdRemaining: 0 },
      defaultState()
    );
    expect(html).toContain('<h3>Elevation</h3>');
    expect(html).toContain('1.0 MIL up');
    expect(html).toContain('10 clicks up');
    expect(html).toContain('exact 1.00 MIL');
    expect(html).toContain('3.44 MOA');
    expect(html).toContain('19.7 in');
    expect(html).toContain('50.0 cm');
  });

  it('says No correction when the direction is none', () => {
    const html = correctionHtml(
      'Windage',
      { offsetM: 0, mil: 0, moa: 0, direction: 'none', clicks: 0, beyondDial: false, holdRemaining: 0 },
      defaultState()
    );
    expect(html).toContain('No correction');
    expect(html).not.toContain('clicks');
  });

  it('shows the dial-limit warning when the correction is beyond the dial', () => {
    const html = correctionHtml(
      'Elevation',
      { offsetM: -10, mil: 20, moa: 68.75, direction: 'up', clicks: 200, beyondDial: true, holdRemaining: 1 },
      defaultState()
    );
    expect(html).toContain('class="warning dial-limit"');
    expect(html).toContain('Your scope dials 19.0 MIL up from zero');
    expect(html).toContain('hold the remaining 1.0 MIL');
    const notBeyond = correctionHtml(
      'Elevation',
      { offsetM: -10, mil: 20, moa: 68.75, direction: 'up', clicks: 200, beyondDial: false, holdRemaining: 0 },
      defaultState()
    );
    expect(notBeyond).not.toContain('dial-limit');
  });
});

describe('resultsHtml', () => {
  it('shows the empty state when results is null', () => {
    const html = resultsHtml(null, defaultState(), false);
    expect(html).toContain(PLANNING_NOTICE);
    expect(html).toContain('Fix the highlighted inputs');
  });

  it('shows the full results panel for the default state', () => {
    const state = defaultState();
    const { results } = compute(state);
    const html = resultsHtml(results, state, false);
    expect(html).toContain(PLANNING_NOTICE);
    expect(html).toContain('At 300 yd');
    expect(html).toContain('Estimated velocity');
    expect(html).toContain('<h3>Elevation</h3>');
    expect(html).toContain('<h3>Windage</h3>');
    expect(html).toContain('Time of flight');
    expect(html).toContain('Stays supersonic to 300 yd');
    expect(html).not.toContain('Out of date');
    expect(html).not.toContain('class="warning"');
  });

  it('puts the notice before the heading', () => {
    const state = defaultState();
    const { results } = compute(state);
    const html = resultsHtml(results, state, false);
    expect(html.indexOf(PLANNING_NOTICE)).toBeLessThan(html.indexOf('<h2>'));
  });

  it('marks the panel stale', () => {
    const state = defaultState();
    const { results } = compute(state);
    const html = resultsHtml(results, state, true);
    expect(html).toContain('class="results stale"');
    expect(html).toContain('Out of date');
  });

  it('drops the estimate mark when the velocity was measured', () => {
    const state = { ...defaultState(), load: { ...defaultState().load, velocityMeasured: true } };
    const { results } = compute(state);
    const html = resultsHtml(results, state, false);
    expect(html).not.toContain('Estimated velocity');
  });

  it('warns when the target is past the transonic range', () => {
    const base = defaultState();
    const state = {
      ...base,
      conditions: { ...base.conditions, targetRangeM: 900 },
      dope: { ...base.dope, endM: 900 }
    };
    const { results } = compute(state);
    const html = resultsHtml(results, state, false);
    expect(html).toContain('class="warning"');
    expect(html).toContain('Goes transonic at');
    expect(html).not.toContain('Stays supersonic');
  });

  it('shows metric units in the metric system', () => {
    const base = defaultState();
    const state = { ...base, unitSystem: 'metric' as const };
    const { results } = compute(state);
    const html = resultsHtml(results, state, false);
    expect(html).toContain('At 274 m');
    expect(html).toContain('m/s');
  });

  it('escapes notes', () => {
    const state = defaultState();
    const { results } = compute(state);
    const html = resultsHtml({ ...results, notes: ['a <b> note'] }, state, false);
    expect(html).toContain('a &lt;b&gt; note');
  });

  it('shows the subsonic speed range for a subsonic load', () => {
    const rimfire = activeState(addProfile(loadSaved(emptyStorage), '22-lr', 'Rimfire'));
    const state = { ...rimfire, conditions: { ...rimfire.conditions, targetRangeM: 91.44 } };
    const { results } = compute(state);
    const html = resultsHtml(results, state, false);
    expect(html).toContain('At 100 yd');
    expect(html).toContain('Subsonic from the muzzle');
    expect(html).not.toContain('Goes transonic at');
    expect(html).not.toContain('Goes subsonic at');
    expect(html).not.toContain('Stays supersonic');
    expect(html).not.toContain('class="warning"');
  });

  it('shows the transonic speed range for a load that starts transonic', () => {
    const rimfire = activeState(addProfile(loadSaved(emptyStorage), '22-lr', 'Rimfire'));
    const state = selectLibraryLoad(rimfire, 'cci-30');
    const { results } = compute(state);
    const html = resultsHtml(results, state, false);
    expect(html).toContain('Starts in the transonic range');
    expect(html).toContain('Goes subsonic at');
    expect(html).toContain('class="regime-note"');
    expect(html).not.toContain('Goes transonic at');
    expect(html).not.toContain('class="warning"');
  });

  it('keeps the supersonic rows for the default state', () => {
    const state = defaultState();
    const { results } = compute(state);
    const html = resultsHtml(results, state, false);
    expect(html).toContain('Stays supersonic to 300 yd');
    expect(html).not.toContain('Subsonic from the muzzle');
    expect(html).not.toContain('regime-note');
  });
});

describe('dopeTableHtml', () => {
  it('renders one row per distance', () => {
    const state = defaultState();
    const { rows } = compute(state);
    const html = dopeTableHtml(rows, state);
    expect(html.match(/<tr/g)?.length).toBe(12);
    expect(html.match(/class="current"/g)?.length).toBe(1);
    expect(html).toContain('<th>Distance (yd)</th>');
    expect(html).toContain('<th>Elevation (MIL)</th>');
    expect(html).toContain('<td>100</td>');
    expect(html).toContain('<td>600</td>');
  });

  it('shows an empty message with no rows', () => {
    const html = dopeTableHtml([], defaultState());
    expect(html).toContain('No rows');
  });

  it('marks beyond-dial rows and adds the note when any row is beyond the dial', () => {
    const base = defaultState();
    const state = {
      ...base,
      rifle: { ...base.rifle, scope: { ...base.rifle.scope, availableElevation: 2 } },
      dope: { startM: 91.44, endM: 548.64, stepM: 45.72 }
    };
    const { rows } = compute(state);
    const html = dopeTableHtml(rows, state);
    const beyondCount = (html.match(/class="(current )?beyond"/g) ?? []).length;
    expect(beyondCount).toBeGreaterThanOrEqual(5);
    expect(html).toContain('<p class="dope-note">');
    expect(html).toContain('2.0 MIL');
    const wide = { ...base, rifle: { ...base.rifle, scope: { ...base.rifle.scope, availableElevation: 19 } } };
    const { rows: wideRows } = compute(wide);
    const wideHtml = dopeTableHtml(wideRows, wide);
    expect(wideHtml).not.toContain('beyond');
    expect(wideHtml).not.toContain('dope-note');
  });

  it('asterisks only the elevation clicks of beyond-dial rows', () => {
    const base = defaultState();
    const state = {
      ...base,
      rifle: { ...base.rifle, scope: { ...base.rifle.scope, availableElevation: 2 } },
      dope: { startM: 91.44, endM: 548.64, stepM: 45.72 }
    };
    const { rows } = compute(state);
    const html = dopeTableHtml(rows, state);
    const row100 = html.split('<tr').find((r) => r.includes('<td>100</td>'));
    expect(row100).toContain('<td>0</td>');
    const row600 = html.split('<tr').find((r) => r.includes('<td>600</td>'));
    expect(row600).toContain('48*');
  });
});

describe('cardHeaderLines', () => {
  it('returns the six header lines', () => {
    const state = defaultState();
    const lines = cardHeaderLines(state, '2026-11-10');
    expect(lines).toHaveLength(6);
    expect(lines[0]).toBe(state.load.name);
    expect(lines[1]).toContain('2650 fps');
    expect(lines[1]).toContain('(estimated velocity)');
    expect(lines[2]).toBe('Zero 100 yd');
    expect(lines[3]).toBe("Wind 5 mph from 3 o'clock");
    expect(lines[5]).toBe('2026-11-10');
  });
});

describe('printCardHtml', () => {
  it('wraps the header lines, table, and notice in the card', () => {
    const state = defaultState();
    const { rows } = compute(state);
    const html = printCardHtml(rows, state, '2026-11-10');
    expect(html).toContain('class="print-card"');
    expect(html).toContain(PLANNING_NOTICE);
    expect(html).toContain('(estimated velocity)');
    expect(html).toContain('<table class="dope">');
    expect(html).toContain('2026-11-10');
  });

  it('prints the dial-limit note when a row is beyond the dial', () => {
    const base = defaultState();
    const state = {
      ...base,
      rifle: { ...base.rifle, scope: { ...base.rifle.scope, availableElevation: 2 } },
      dope: { startM: 91.44, endM: 548.64, stepM: 45.72 }
    };
    const { rows } = compute(state);
    const html = printCardHtml(rows, state, '2026-11-10');
    expect(html).toContain('dope-note');
  });
});

describe('windClockSvg', () => {
  it('renders the arrow rotated to the wind clock direction', () => {
    const svg = windClockSvg(3, '10 mph');
    expect(svg).toContain('<svg');
    expect(svg).toContain('rotate(90 48 48)');
    expect(svg).toContain('>10 mph</text>');
    expect(svg).toContain('aria-label="Wind 10 mph from 3 o&#39;clock"');
  });

  it('handles 12 o\'clock and empty speed', () => {
    expect(windClockSvg(12, '5 mph')).toContain('rotate(360 48 48)');
    expect(windClockSvg(6, '')).toContain('>No wind</text>');
  });
});
