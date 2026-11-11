import { describe, expect, it } from 'vitest';
import { defaultState, saveCustomLoad, selectLibraryLoad } from '../src/planner/storage';
import {
  loadPickerHtml,
  loadSourcesHtml,
  pressureNoteHtml,
  sightHeightNoteHtml,
  twistNoteHtml,
  velocityNoteHtml
} from '../src/planner/panels';

describe('loadPickerHtml', () => {
  it('shows the library options with the default load selected', () => {
    const html = loadPickerHtml(defaultState());
    expect(html).toContain('<option value="lib:federal-gm308m" selected>');
    expect(html.match(/<option value="lib:/g)).toHaveLength(10);
    expect(html).not.toContain('Custom (not saved)');
    expect(html).toContain('id="saveCustomLoad"');
    expect(html).toContain('id="loadName"');
  });

  it('shows a custom (not saved) option for an unsaved load', () => {
    const state = defaultState();
    state.load = { ...state.load, libraryId: null, name: 'Mine' };
    const html = loadPickerHtml(state);
    expect(html).toContain('<option value="" selected>Custom (not saved)</option>');
  });

  it('shows the saved custom load as selected', () => {
    let state = defaultState();
    state = { ...state, load: { ...state.load, libraryId: null, name: 'Mine' } };
    state = saveCustomLoad(state);
    const html = loadPickerHtml(state);
    expect(html).toContain('<option value="custom:Mine" selected>My load: Mine</option>');
    expect(html).not.toContain('Custom (not saved)');
  });

  it('escapes the load name', () => {
    const state = defaultState();
    state.load = { ...state.load, name: 'A "quoted" <name>' };
    const html = loadPickerHtml(state);
    expect(html).toContain('value="A &quot;quoted&quot; &lt;name&gt;"');
  });
});

describe('loadSourcesHtml', () => {
  it('shows the sources for the default load', () => {
    const html = loadSourcesHtml(defaultState());
    expect(html).toContain('G7 BC: 0.224');
    expect(html).toContain('href="https://sierrabullets.com/30-cal-168-gr-hpbt-matchking-smk/"');
    expect(html).toContain('(read 2026-11-10)');
    expect(html).toContain('Bullet length: 1.220 in');
    expect(html).toContain('Published velocity: 2650 fps, test barrel not stated');
    expect(html).toContain('class="load-note"');
  });

  it('says "not published" for values the maker does not publish', () => {
    const state = selectLibraryLoad(defaultState(), 'bullet-nosler-53164');
    const html = loadSourcesHtml(state);
    expect(html).toContain('G7 BC: not published by the maker');
    expect(html).toContain('Published velocity: not published by the maker');
  });

  it('shows the test barrel when the maker states it', () => {
    const state = selectLibraryLoad(defaultState(), 'hornady-80966');
    const html = loadSourcesHtml(state);
    expect(html).toContain('Published velocity: 2700 fps from a 24 inch test barrel');
    expect(html).toContain('Bullet length: not published by the maker');
  });

  it('labels user values as "your value"', () => {
    const state = defaultState();
    state.load = { ...state.load, origin: { ...state.load.origin, bcG7: 'user' } };
    const html = loadSourcesHtml(state);
    expect(html).toContain('G7 BC: your value');
    expect(html).toContain('G1 BC: 0.462');
  });

  it('says every value is yours for a custom load', () => {
    const state = defaultState();
    state.load = { ...state.load, libraryId: null };
    expect(loadSourcesHtml(state)).toBe('<p class="sources">Custom load: every value is your value.</p>');
  });
});

describe('velocityNoteHtml', () => {
  it('explains the estimate when the test barrel is not stated', () => {
    const html = velocityNoteHtml(defaultState());
    expect(html).toContain('Estimate, not measured in your rifle.');
    expect(html).toContain('does not state its test barrel');
    expect(html).toContain('Expect less from a 16 inch barrel');
    expect(html).toContain('Shoot over a chronograph');
  });

  it('shows the barrel-length correction when the maker states the test barrel', () => {
    const state = selectLibraryLoad(defaultState(), 'hornady-80966');
    const html = velocityNoteHtml(state);
    expect(html).toContain('The maker publishes 2700 fps from a 24 inch test barrel.');
    expect(html).toContain('Less 21 fps per inch for your 16 inch barrel gives 2533 fps.');
    expect(html).toContain('href="https://rifleshooter.com/');
  });

  it('says there is no published velocity for a component bullet', () => {
    const state = selectLibraryLoad(defaultState(), 'bullet-nosler-53164');
    const html = velocityNoteHtml(state);
    expect(html).toContain('There is no published velocity for this load.');
  });

  it('says measured when the user has entered a chronograph average', () => {
    const state = defaultState();
    state.load = { ...state.load, velocityMeasured: true };
    expect(velocityNoteHtml(state)).toBe('<p class="velocity-note measured">Measured: your chronograph average.</p>');
  });
});

describe('twistNoteHtml', () => {
  it('shows the measuring steps when the twist is unconfirmed', () => {
    const html = twistNoteHtml(defaultState());
    expect(html).toContain('Unconfirmed.');
    expect(html).toContain('cleaning rod');
    expect(html.match(/<li>/g)).toHaveLength(2);
  });

  it('says confirmed when the user has confirmed the twist', () => {
    const state = defaultState();
    state.rifle = { ...state.rifle, twistConfirmed: true };
    const html = twistNoteHtml(state);
    expect(html).toContain('Twist confirmed by you.');
    expect(html).not.toContain('<li>');
  });
});

describe('pressureNoteHtml', () => {
  it('is empty in station mode', () => {
    expect(pressureNoteHtml(defaultState())).toBe('');
  });

  it('explains the altitude estimate in altitude mode', () => {
    const state = defaultState();
    state.conditions = { ...state.conditions, pressureMode: 'altitude', altitudeM: 1500 };
    const html = pressureNoteHtml(state);
    expect(html).toContain('standard-atmosphere estimate for 4921 ft');
    expect(html).toContain('inHg');
  });
});

describe('sightHeightNoteHtml', () => {
  it('explains that the sight height is not a measurement', () => {
    expect(sightHeightNoteHtml()).toContain('not a measurement');
  });
});
