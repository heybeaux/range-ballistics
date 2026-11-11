import './styles.css';
import type { AppState, DopeRow, SavedState, ShotResults } from './planner/types';
import {
  addProfile,
  activeState,
  deleteProfile,
  duplicateProfile,
  loadSaved,
  saveSaved,
  selectCustomLoad,
  selectGenericScope,
  selectLibraryLoad,
  selectLibraryScope,
  selectProfile,
  saveCustomLoad,
  withActiveState
} from './planner/storage';
import { clampMagnification, dopeRows, shotResults, toCsv, toShotInput } from './planner/model';
import { applyField, fieldById, formHtml, parseInput } from './planner/fields';
import { dopeTableHtml, printCardHtml, resultsHtml, windClockSvg } from './planner/view';
import { openSetup } from './planner/setup';
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
} from './planner/panels';
import { solve } from './solver/solve';
import type { TrajectorySample } from './solver/types';
import { format } from './units/units';
import { createRangeScene } from './scene/scene';
import type { CameraPreset, RangeScene } from './scene/types';
import { NICE_SCALES, autoExaggeration, dialSamples, trimToRange } from './scene/geometry';

declare global {
  interface Window {
    __rangeScene?: RangeScene;
  }
}

function el<T extends HTMLElement>(id: string, ctor: new () => T): T {
  const node = document.getElementById(id);
  if (node === null || !(node instanceof ctor)) {
    throw new Error(`missing #${id}`);
  }
  return node;
}

const form = el('form', HTMLFormElement);
const rifleBar = el('rifleBar', HTMLDivElement);
const dialogRoot = el('dialogRoot', HTMLDivElement);
const resultsEl = el('results', HTMLDivElement);
const dopeEl = el('dope', HTMLDivElement);
const exaggerationEl = el('exaggeration', HTMLInputElement);
const exaggerationLabel = el('exaggerationLabel', HTMLSpanElement);
const timelineEl = el('timeline', HTMLInputElement);
const readoutEl = el('readout', HTMLSpanElement);
const printArea = el('printArea', HTMLDivElement);
const windHud = el('windHud', HTMLDivElement);
const scaleHud = el('scaleHud', HTMLDivElement);
const sceneBar = el('sceneBar', HTMLDivElement);
const showDialedEl = el('showDialed', HTMLInputElement);
const sceneNoteEl = el('sceneNote', HTMLParagraphElement);
const speedEl = el('speed', HTMLSelectElement);
const playBtn = el('play', HTMLButtonElement);
const pauseBtn = el('pause', HTMLButtonElement);
const replayBtn = el('replay', HTMLButtonElement);
const exportCsvBtn = el('exportCsv', HTMLButtonElement);
const printCardBtn = el('printCard', HTMLButtonElement);
const runSetupBtn = el('runSetup', HTMLButtonElement);
const magnificationLabel = el('magnificationLabel', HTMLLabelElement);
const magnificationEl = el('magnification', HTMLInputElement);
const magnificationValueEl = el('magnificationValue', HTMLSpanElement);

let saved: SavedState = loadSaved(localStorage);
let state: AppState = activeState(saved);
let currentPreset: CameraPreset = 'reset';
let parseErrors: Record<string, string> = {};
let errors: Record<string, string> = {};
let lastResults: ShotResults | null = null;
let lastRows: DopeRow[] = [];
let stale = false;
let exaggeration = 1;
let showDialed = true;
let durationS = 0;
let lastSamples: TrajectorySample[] = [];
const scene = createRangeScene(el('scene', HTMLDivElement));

const SOLVER_FIELD_TO_FORM: Record<string, string | 'bc'> = {
  muzzleVelocityMps: 'muzzleVelocity',
  bc: 'bc',
  bulletMassKg: 'bulletMass',
  bulletLengthM: 'bulletLength',
  twistM: 'twist',
  sightHeightM: 'sightHeight',
  zeroRangeM: 'zeroRange',
  maxRangeM: 'targetRange',
  shotAngleRad: 'shotAngle',
  'atmosphere.temperatureK': 'temperature',
  'atmosphere.pressurePa': 'pressure',
  'atmosphere.relativeHumidity': 'humidity',
  'wind.speedMps': 'windSpeed',
  'wind.clock': 'windClock'
};

function bcFieldId(): string {
  if (state.load.dragModel === 'G7') return 'bcG7';
  if (state.load.dragModel === 'RA4') return 'bcRA4';
  return 'bcG1';
}

function renderForm(): void {
  form.innerHTML = formHtml(state, errors);
  const insert = (selector: string, html: string): void => {
    const target = form.querySelector(selector);
    if (target !== null) {
      target.insertAdjacentHTML('beforeend', html);
    }
  };
  const loadGroup = form.querySelector('fieldset[data-group="load"]');
  if (loadGroup !== null) {
    const legend = loadGroup.querySelector('legend');
    if (legend !== null) {
      legend.insertAdjacentHTML('afterend', loadPickerHtml(state) + loadSourcesHtml(state));
    }
  }
  insert('[data-field="velocityMeasured"]', velocityNoteHtml(state));
  insert('[data-field="twistConfirmed"]', twistNoteHtml(state));
  insert('[data-field="sightHeight"]', sightHeightNoteHtml());
  insert('[data-field="pressureMode"]', pressureNoteHtml(state));
  const rifleGroup = form.querySelector('fieldset[data-group="rifle"]');
  const rifleLegend = rifleGroup === null ? null : rifleGroup.querySelector('legend');
  if (rifleLegend !== null) {
    rifleLegend.insertAdjacentHTML('afterend', cartridgeNoteHtml(state));
  }
  const scopeGroup = form.querySelector('fieldset[data-group="scope"]');
  const scopeLegend = scopeGroup === null ? null : scopeGroup.querySelector('legend');
  if (scopeLegend !== null) {
    scopeLegend.insertAdjacentHTML('afterend', scopePanelHtml(state));
  }
  rifleBar.innerHTML = rifleBarHtml(saved);
}

function recompute(): void {
  errors = { ...parseErrors };
  const input = toShotInput(state);
  if (input === null) {
    errors[bcFieldId()] = 'Enter a BC for this drag model, or switch the drag model.';
    stale = true;
    return;
  }
  const solved = solve(input);
  if (!solved.ok) {
    stale = true;
    for (const err of solved.errors) {
      const id = SOLVER_FIELD_TO_FORM[err.field];
      if (id === undefined) continue;
      errors[id === 'bc' ? bcFieldId() : id] = err.message;
    }
    return;
  }
  const r = shotResults(state, solved);
  if (r === null) {
    stale = true;
    errors.targetRange = 'The bullet does not reach this distance.';
    return;
  }
  stale = false;
  lastResults = r;
  lastRows = dopeRows(state, solved);
  lastSamples = solved.samples;
  scene.update({
    samples: solved.samples,
    targetRangeM: state.conditions.targetRangeM,
    shotAngleRad: state.conditions.shotAngleRad,
    sightHeightM: state.rifle.sightHeightM,
    transonicRangeM: solved.transonicRangeM,
    subsonicRangeM: solved.subsonicRangeM,
    windSpeedMps: state.conditions.windSpeedMps,
    windClock: state.conditions.windClock,
    unitSystem: state.unitSystem,
    targetType: state.targetType,
    exaggeration,
    showDialed,
    scope: state.rifle.scope,
    magnification: state.magnification
  });
}

function drawnSamples(): TrajectorySample[] {
  const t = trimToRange(lastSamples, state.conditions.targetRangeM);
  return showDialed ? dialSamples(t, state.conditions.targetRangeM) : t;
}

function setExaggeration(value: number): void {
  exaggeration = value;
  exaggerationEl.value = String(Math.max(0, NICE_SCALES.indexOf(value)));
  recompute();
  renderOutputs();
}

function renderOutputs(): void {
  resultsEl.innerHTML = resultsHtml(lastResults, state, stale);
  dopeEl.innerHTML = dopeTableHtml(lastRows, state);
  windHud.innerHTML = windClockSvg(
    state.conditions.windClock,
    state.conditions.windSpeedMps < 0.05 ? '' : format(state.conditions.windSpeedMps, 'windSpeed', state.unitSystem)
  );
  scaleHud.textContent = exaggeration === 1 ? '' : `Drawn ${exaggeration}× larger than real`;
  exaggerationLabel.textContent =
    exaggeration === 1
      ? 'True scale'
      : `Drop and drift drawn ${exaggeration}× larger than real. The numbers are not changed.`;
  if (currentPreset === 'shooter') {
    sceneNoteEl.textContent = showDialed
      ? 'Scope view through your scope. The bullet rises above the crosshair and comes down onto the target.'
      : 'Scope view with the scope still at its zero. The red dot is where the bullet lands. Read the hold off the reticle at that dot.';
  } else {
    sceneNoteEl.textContent = showDialed
      ? 'Showing the shot after you dial the correction: the bullet rises above your line of sight (dashed) and comes down onto the target. Blue arrows show which way the wind blows.'
      : 'Showing the shot with the scope still at its zero: the red dot is where the bullet would land, the green dot is where you aimed. Blue arrows show which way the wind blows.';
  }
}

function syncMagnification(): void {
  const scope = state.rifle.scope;
  const value = clampMagnification(state.magnification, scope);
  magnificationEl.min = String(scope.magMin);
  magnificationEl.max = String(scope.magMax);
  magnificationEl.value = String(value);
  magnificationValueEl.textContent = `${value % 1 === 0 ? String(value) : value.toFixed(1)}×`;
  scene.setMagnification(state.magnification);
}

function refresh(): void {
  saved = withActiveState(saved, state);
  saveSaved(localStorage, saved);
  recompute();
  renderForm();
  renderOutputs();
}

form.addEventListener('change', (event: Event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
  const name = target.name;
  if (name === 'loadPicker') {
    const value = target.value;
    if (value.startsWith('lib:')) {
      state = selectLibraryLoad(state, value.slice(4));
    } else if (value.startsWith('custom:')) {
      state = selectCustomLoad(state, value.slice(7));
    } else {
      return;
    }
    parseErrors = {};
    refresh();
    return;
  }
  if (name === 'loadName') {
    state = { ...state, load: { ...state.load, name: target.value.trim() || 'My load', libraryId: null } };
    parseErrors = {};
    refresh();
    return;
  }
  if (name === 'scopePicker') {
    const value = target.value;
    if (value === 'generic') {
      state = selectGenericScope(state);
    } else if (value.startsWith('lib:')) {
      state = selectLibraryScope(state, value.slice(4));
    } else {
      return;
    }
    parseErrors = {};
    refresh();
    syncMagnification();
    return;
  }
  const def = fieldById(name);
  if (def === undefined) return;
  if (def.kind === 'text') {
    const input = target as HTMLInputElement;
    state = applyField(state, def, input.value);
    refresh();
    return;
  }
  if (def.kind === 'number') {
    const p = parseInput(def, target.value, state.unitSystem);
    if (!p.ok) {
      parseErrors[def.id] = p.message;
      stale = true;
      renderForm();
      renderOutputs();
      return;
    }
    delete parseErrors[def.id];
    state = applyField(state, def, p.value);
  } else if (def.kind === 'select') {
    state = applyField(state, def, target.value);
  } else if (def.kind === 'checkbox') {
    const input = target as HTMLInputElement;
    state = applyField(state, def, input.checked);
  }
  refresh();
  if (def.group === 'scope' || name === 'angleUnit') {
    syncMagnification();
  }
});

form.addEventListener('submit', (event: Event) => {
  event.preventDefault();
});

form.addEventListener('click', (event: Event) => {
  const target = event.target;
  if (target instanceof HTMLElement && target.id === 'saveCustomLoad') {
    state = saveCustomLoad(state);
    parseErrors = {};
    refresh();
  }
});

rifleBar.addEventListener('change', (event: Event) => {
  const target = event.target;
  if (target instanceof HTMLSelectElement && target.id === 'riflePicker') {
    saved = withActiveState(saved, state);
    saved = selectProfile(saved, target.value);
    state = activeState(saved);
    parseErrors = {};
    lastResults = null;
    lastRows = [];
    refresh();
    syncMagnification();
    if (!state.setupDone) {
      openSetup(el('setupRoot', HTMLDivElement), getState, setState);
    }
  }
});

rifleBar.addEventListener('click', (event: Event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.id === 'addRifle') {
    dialogRoot.innerHTML = addRifleDialogHtml();
    el('newRifleName', HTMLInputElement).focus();
  } else if (target.id === 'duplicateRifle') {
    saved = duplicateProfile(withActiveState(saved, state));
    state = activeState(saved);
    refresh();
  } else if (target.id === 'deleteRifle') {
    dialogRoot.innerHTML = deleteRifleDialogHtml(state.rifle.name);
  }
});

dialogRoot.addEventListener('click', (event: Event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const id = target.id;
  if (id === 'addRifleCancel' || id === 'deleteRifleCancel') {
    dialogRoot.innerHTML = '';
  } else if (id === 'addRifleConfirm') {
    const name = el('newRifleName', HTMLInputElement).value.trim() || 'My rifle';
    const cartridge = el('newRifleCartridge', HTMLSelectElement).value;
    saved = addProfile(withActiveState(saved, state), cartridge, name);
    state = activeState(saved);
    dialogRoot.innerHTML = '';
    parseErrors = {};
    lastResults = null;
    lastRows = [];
    refresh();
    syncMagnification();
    openSetup(el('setupRoot', HTMLDivElement), getState, setState);
  } else if (id === 'deleteRifleConfirm') {
    saved = deleteProfile(withActiveState(saved, state), saved.activeId);
    state = activeState(saved);
    dialogRoot.innerHTML = '';
    parseErrors = {};
    lastResults = null;
    lastRows = [];
    refresh();
    syncMagnification();
  }
});

document.addEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape' && dialogRoot.innerHTML !== '') {
    dialogRoot.innerHTML = '';
  }
});

for (const button of sceneBar.querySelectorAll<HTMLButtonElement>('button[data-camera]')) {
  button.addEventListener('click', () => {
    const value = button.dataset.camera;
    if (value === 'shooter' || value === 'side' || value === 'top' || value === 'reset') {
      const R = state.conditions.targetRangeM;
      if (value === 'side') {
        setExaggeration(autoExaggeration(drawnSamples(), R, 'path'));
      } else if (value === 'top') {
        setExaggeration(autoExaggeration(drawnSamples(), R, 'windage'));
      } else {
        setExaggeration(1);
      }
      currentPreset = value;
      scene.setCamera(value);
      magnificationLabel.hidden = currentPreset !== 'shooter';
      renderOutputs();
    }
  });
}

playBtn.addEventListener('click', () => scene.play());
pauseBtn.addEventListener('click', () => scene.pause());
replayBtn.addEventListener('click', () => scene.replay());

speedEl.addEventListener('change', () => {
  scene.setSpeed(Number(speedEl.value));
});

exaggerationEl.addEventListener('input', () => {
  setExaggeration(NICE_SCALES[Number(exaggerationEl.value)] ?? 1);
});

magnificationEl.addEventListener('input', () => {
  state = { ...state, magnification: clampMagnification(Number(magnificationEl.value), state.rifle.scope) };
  magnificationValueEl.textContent = `${state.magnification % 1 === 0 ? String(state.magnification) : state.magnification.toFixed(1)}×`;
  scene.setMagnification(state.magnification);
  saved = withActiveState(saved, state);
  saveSaved(localStorage, saved);
});

showDialedEl.addEventListener('change', () => {
  showDialed = showDialedEl.checked;
  recompute();
  renderOutputs();
});

timelineEl.addEventListener('input', () => {
  scene.seek((Number(timelineEl.value) / 1000) * durationS);
});

scene.onReadout((r) => {
  durationS = r.durationS;
  if (document.activeElement !== timelineEl) {
    timelineEl.value = String(Math.round((r.timeS / Math.max(r.durationS, 1e-9)) * 1000));
  }
  const sys = state.unitSystem;
  readoutEl.textContent =
    `${r.timeS.toFixed(2)} s · ${format(r.rangeM, 'range', sys)} · ` +
    `${format(r.speedMps, 'velocity', sys)} · ${format(Math.abs(r.pathM), 'smallLength', sys)} ` +
    `${r.pathM <= 0 ? 'below' : 'above'} line of sight`;
});

exportCsvBtn.addEventListener('click', () => {
  const today = localDateIso();
  const csv = toCsv(state, lastRows, today);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dope-card.csv';
  a.click();
  URL.revokeObjectURL(url);
});

printCardBtn.addEventListener('click', () => {
  const today = localDateIso();
  printArea.innerHTML = printCardHtml(lastRows, state, today);
  window.print();
});

function getState(): AppState {
  return state;
}

function setState(next: AppState): void {
  state = next;
  parseErrors = {};
  refresh();
}

runSetupBtn.addEventListener('click', () => {
  openSetup(el('setupRoot', HTMLDivElement), getState, setState);
});

window.__rangeScene = scene;

refresh();
syncMagnification();

if (!state.setupDone) {
  openSetup(el('setupRoot', HTMLDivElement), getState, setState);
}

export {};

/** Today's date in the user's own time zone, as YYYY-MM-DD. */
function localDateIso(): string {
  const d = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
