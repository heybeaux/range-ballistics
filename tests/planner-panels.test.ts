import { describe, expect, it } from 'vitest';
import loadsJson from '../src/data/loads.json';
import {
  addProfile,
  activeState,
  defaultState,
  loadSaved,
  saveCustomLoad,
  selectLibraryLoad
} from '../src/planner/storage';
import type { AppState, SavedState } from '../src/planner/types';
import {
  addRifleDialogHtml,
  cartridgeNoteHtml,
  deleteRifleDialogHtml,
  loadPickerHtml,
  loadSourcesHtml,
  pressureNoteHtml,
  rifleBarHtml,
  scopePanelHtml,
  sightHeightNoteHtml,
  twistNoteHtml,
  velocityNoteHtml
} from '../src/planner/panels';

function emptyStorage(): Pick<Storage, 'getItem'> {
  return { getItem: () => null };
}

function makeSaved(id: string, state: AppState): SavedState {
  return { version: 2, activeId: id, profiles: [{ id, state }] };
}

const rimfire = activeState(addProfile(loadSaved(emptyStorage()), '22-lr', 'Rimfire'));
const ar = activeState(addProfile(loadSaved(emptyStorage()), '556-nato', 'AR'));

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

  it('lists only the rimfire cartridge loads', () => {
    const html = loadPickerHtml(rimfire);
    expect(html.match(/<option value="lib:/g)).toHaveLength(15);
    expect(html).toContain('CCI Standard Velocity');
    expect(html).not.toContain('Federal Gold Medal 168');
  });

  it('has no library options for an "other" cartridge', () => {
    const state = activeState(addProfile(loadSaved(emptyStorage()), 'other', 'Other'));
    const html = loadPickerHtml(state);
    expect(html).not.toContain('<option value="lib:');
    expect(html).toContain('Custom (not saved)');
    expect(html).toContain('There are no library loads for this cartridge');
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

  it('shows the drag-model warning for a G1 BC without a stated model', () => {
    const html = loadSourcesHtml(rimfire);
    expect(html).toContain('G1 BC: 0.120');
    expect(html).toContain('Drag model not stated by the maker; treated as G1.');
    expect(html).toContain('G7 BC: not published by the maker');
    expect(html).not.toContain('RA4 BC');
  });

  it('shows the RA4 BC line for Eley Tenex', () => {
    const state = selectLibraryLoad(rimfire, 'eley-tenex');
    const html = loadSourcesHtml(state);
    expect(html).toContain('RA4 BC: 0.112');
    expect(html).toContain('G1 BC: not published by the maker');
    expect(html).toContain('Published velocity: not published by the maker');
  });

  it('lists every published barrel velocity', () => {
    const state = selectLibraryLoad(ar, 'pmc-556k');
    const html = loadSourcesHtml(state);
    expect(html).toContain('2920 fps from a 16 inch barrel; 3100 fps from a 20 inch barrel');
  });
});

describe('velocityNoteHtml', () => {
  it('explains the estimate when the test barrel is not stated', () => {
    const html = velocityNoteHtml(defaultState());
    expect(html).toContain('Estimate, not measured in your rifle.');
    expect(html).toContain('does not state its test barrel');
    expect(html).toContain('Expect less from a short barrel');
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
    const html = velocityNoteHtml(state);
    expect(html).toContain('Measured: your chronograph average.');
    expect(html).toContain('measure again');
  });

  it('uses the published figure for the same barrel length', () => {
    const state = selectLibraryLoad(ar, 'pmc-556k');
    const html = velocityNoteHtml(state);
    expect(html).toContain('from a 16 inch barrel, the same as yours');
    expect(html).toContain('2920 fps');
  });

  it('interpolates between two published barrel lengths', () => {
    let state = selectLibraryLoad(ar, 'pmc-556k');
    state = { ...state, rifle: { ...state.rifle, barrelLengthM: 0.4572 } };
    state = selectLibraryLoad(state, 'pmc-556k');
    const html = velocityNoteHtml(state);
    expect(html).toContain('straight-line figure between them for your 18 inch barrel');
    expect(html).toContain('3010 fps');
  });

  it('uses the nearest published barrel length outside the range', () => {
    let state = selectLibraryLoad(ar, 'pmc-556k');
    state = { ...state, rifle: { ...state.rifle, barrelLengthM: 0.6096 } };
    state = selectLibraryLoad(state, 'pmc-556k');
    const html = velocityNoteHtml(state);
    expect(html).toContain('nearest one, not for your 24 inch barrel');
    expect(html).toContain('3100 fps');
  });

  it('makes no correction when the cartridge has no loss figure', () => {
    const state = selectLibraryLoad(ar, 'hornady-fr260');
    const html = velocityNoteHtml(state);
    expect(html).toContain('The maker publishes 3060 fps from a 20 inch test barrel. No barrel-length correction was made.');
    expect(html).toContain('PMC');
  });

  it('says there is no published velocity for Eley Tenex', () => {
    const state = selectLibraryLoad(rimfire, 'eley-tenex');
    const html = velocityNoteHtml(state);
    expect(html).toContain('There is no published velocity for this load.');
  });
});

describe('twistNoteHtml', () => {
  it('shows the measuring steps when the twist is unconfirmed', () => {
    const html = twistNoteHtml(defaultState());
    expect(html).toContain('Unconfirmed.');
    expect(html).toContain('cleaning rod');
    expect(html).toContain('Tikka');
    expect(html.match(/<li>/g)).toHaveLength(2);
  });

  it('says confirmed when the user has confirmed the twist', () => {
    const state = defaultState();
    state.rifle = { ...state.rifle, twistConfirmed: true };
    const html = twistNoteHtml(state);
    expect(html).toContain('Twist confirmed by you.');
    expect(html).not.toContain('<li>');
  });

  it('shows the generic measuring steps for a non-default rifle', () => {
    const html = twistNoteHtml(rimfire);
    expect(html).toContain('Unconfirmed.');
    expect(html).toContain('cleaning rod');
    expect(html).not.toContain('Tikka');
    expect(html).not.toContain('<li>');
  });
});

describe('cartridgeNoteHtml', () => {
  it('shows the cartridge name without a safety note for .308', () => {
    const html = cartridgeNoteHtml(defaultState());
    expect(html).toContain('.308 Winchester');
    expect(html).not.toContain('safety-note');
  });

  it('shows the safety note for 5.56', () => {
    const html = cartridgeNoteHtml(ar);
    expect(html).toContain('5.56x45 NATO');
    expect(html).toContain('class="safety-note"');
    expect(html).toContain('chambered in 223 Remington');
    expect(html).toContain('href="https://saami.org/faqs/"');
  });

  it('says the cartridge is not in the library', () => {
    const state = activeState(addProfile(loadSaved(emptyStorage()), 'other', 'Other'));
    const html = cartridgeNoteHtml(state);
    expect(html).toContain('Cartridge not in the library');
  });
});

describe('rifleBarHtml', () => {
  it('shows one profile with the delete button disabled', () => {
    const html = rifleBarHtml(makeSaved('r1', defaultState()));
    expect(html.match(/<option/g)).toHaveLength(1);
    expect(html).toContain('id="riflePicker"');
    expect(html).toContain('id="addRifle"');
    expect(html).toContain('id="deleteRifle" disabled');
  });

  it('shows two profiles with the active one selected and delete enabled', () => {
    const saved: SavedState = {
      version: 2,
      activeId: 'r2',
      profiles: [
        { id: 'r1', state: defaultState() },
        { id: 'r2', state: ar }
      ]
    };
    const html = rifleBarHtml(saved);
    expect(html.match(/<option/g)).toHaveLength(2);
    expect(html).toContain('<option value="r2" selected>');
    expect(html).toContain('id="deleteRifle"');
    expect(html).not.toContain('id="deleteRifle" disabled');
  });

  it('escapes the rifle name', () => {
    const state = defaultState();
    state.rifle = { ...state.rifle, name: 'A <b> rifle' };
    const html = rifleBarHtml(makeSaved('r1', state));
    expect(html).toContain('A &lt;b&gt; rifle');
  });
});

describe('addRifleDialogHtml', () => {
  it('shows the dialog with the cartridge options', () => {
    const html = addRifleDialogHtml();
    expect(html).toContain('role="dialog"');
    expect(html).toContain('id="newRifleName"');
    // One option per library cartridge plus "other".
    expect(html.match(/<option/g)).toHaveLength(loadsJson.cartridges.length + 1);
    expect(html).toContain('id="addRifleConfirm"');
    expect(html).toContain('id="addRifleCancel"');
  });
});

describe('deleteRifleDialogHtml', () => {
  it('shows the dialog with the escaped rifle name', () => {
    const html = deleteRifleDialogHtml('A <b>');
    expect(html).toContain('A &lt;b&gt;');
    expect(html).toContain('id="deleteRifleConfirm"');
    expect(html).toContain('cannot be undone');
  });
});

describe('scopePanelHtml', () => {
  it('shows the library scope with its facts and note', () => {
    const html = scopePanelHtml(defaultState());
    expect(html).toContain('<option value="lib:vortex-venom-5-25x56-ebr7c-mrad" selected>');
    expect(html).toContain('Field of view 21.2 ft to 4.7 ft at 100 yd.');
    expect(html).toContain('href="https://vortexoptics.');
    expect(html).toContain('class="scope-note"');
    expect(html).toContain('for representation only');
  });

  it('shows the generic scope for a rifle without a library scope', () => {
    const html = scopePanelHtml(rimfire);
    expect(html).toContain('<option value="generic" selected>');
    expect(html).toContain('Generic crosshair');
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
