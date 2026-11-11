import './styles.css';
import type { AppState, DopeRow, ShotResults } from './planner/types';
import { loadState, saveState, selectLibraryLoad, selectCustomLoad, saveCustomLoad } from './planner/storage';
import { dopeRows, shotResults, toCsv, toShotInput } from './planner/model';
import { applyField, fieldById, formHtml, parseInput } from './planner/fields';
import { dopeTableHtml, printCardHtml, resultsHtml, windClockSvg } from './planner/view';
import { openSetup } from './planner/setup';
import {
  loadPickerHtml,
  loadSourcesHtml,
  pressureNoteHtml,
  sightHeightNoteHtml,
  twistNoteHtml,
  velocityNoteHtml
} from './planner/panels';
import { solve } from './solver/solve';
import type { TrajectorySample } from './solver/types';
import { format } from './units/units';
import { createRangeScene } from './scene/scene';
import type { RangeScene } from './scene/types';
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
const rifleName = el('rifleName', HTMLSpanElement);
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

let state: AppState = loadState(localStorage);
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
  return state.load.dragModel === 'G7' ? 'bcG7' : 'bcG1';
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
  rifleName.textContent = state.rifle.name;
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
    showDialed
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
  sceneNoteEl.textContent =
    showDialed
      ? 'Showing the shot after you dial the correction: the bullet rises above your line of sight (dashed) and comes down onto the target. Blue arrows show which way the wind blows.'
      : 'Showing the shot with the scope still at its zero: the red dot is where the bullet would land, the green dot is where you aimed. Blue arrows show which way the wind blows.';
}

function refresh(): void {
  saveState(localStorage, state);
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
  const def = fieldById(name);
  if (def === undefined) return;
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
      scene.setCamera(value);
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
  const today = new Date().toISOString().slice(0, 10);
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
  const today = new Date().toISOString().slice(0, 10);
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

if (!state.setupDone) {
  openSetup(el('setupRoot', HTMLDivElement), getState, setState);
}

export {};
