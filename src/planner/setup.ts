import type { AppState } from './types';
import { applyField, fieldById, fieldHtml, parseInput } from './fields';
import { selectCustomLoad, selectLibraryLoad } from './storage';
import { escapeHtml } from './view';
import {
  loadPickerHtml,
  loadSourcesHtml,
  sightHeightNoteHtml,
  twistNoteHtml,
  velocityNoteHtml
} from './panels';

export interface SetupStep {
  key: 'rifle' | 'load' | 'velocity' | 'zero';
  title: string;
  intro: string;
  fieldIds: string[];
}

export const SETUP_STEPS: SetupStep[] = [
  {
    key: 'rifle',
    title: 'Confirm your rifle',
    intro:
      'These describe your rifle and scope. The defaults are for a Tikka T3x CTR in .308 with a 16 inch barrel. Change anything that is different on yours.',
    fieldIds: ['twist', 'twistDirection', 'twistConfirmed', 'sightHeight', 'angleUnit', 'clickValue']
  },
  {
    key: 'load',
    title: 'Pick your load',
    intro:
      'Choose the ammunition you shoot. Each number shows the maker page it came from. If yours is not listed, pick the closest one now and edit the values afterwards.',
    fieldIds: []
  },
  {
    key: 'velocity',
    title: 'Set the muzzle velocity',
    intro:
      'Muzzle velocity is how fast the bullet leaves the barrel. It changes the answer more than anything else here. Makers measure it in long test barrels, so a 16 inch barrel will be slower than the box says. The best number is the average from your own chronograph.',
    fieldIds: ['muzzleVelocity', 'velocityMeasured']
  },
  {
    key: 'zero',
    title: 'Set your zero',
    intro:
      'Your zero is the distance where the bullet hits exactly where you aim, with the scope dials at zero. Most people zero at 100 yards. Enter the distance you actually zeroed at.',
    fieldIds: ['zeroRange']
  }
];

export function setupStepHtml(state: AppState, stepIndex: number, errors: Record<string, string>): string {
  const step = SETUP_STEPS[stepIndex];
  if (step === undefined) return '';
  const body: string[] = [];
  for (const id of step.fieldIds) {
    const def = fieldById(id);
    if (def === undefined) continue;
    body.push(fieldHtml(def, state, errors[id]));
  }
  if (step.key === 'rifle') {
    body.push(twistNoteHtml(state) + sightHeightNoteHtml());
  } else if (step.key === 'load') {
    body.push(loadPickerHtml(state) + loadSourcesHtml(state));
  } else if (step.key === 'velocity') {
    body.push(velocityNoteHtml(state));
  }
  const back = stepIndex > 0 ? '<button type="button" id="setupBack">Back</button>' : '';
  const next =
    stepIndex < 3
      ? '<button type="button" id="setupNext" class="primary">Next</button>'
      : '<button type="button" id="setupFinish" class="primary">Finish</button>';
  return (
    '<div class="setup-backdrop"><div class="setup-dialog" role="dialog" aria-modal="true" aria-labelledby="setupTitle">' +
    `<p class="setup-progress">Step ${stepIndex + 1} of 4</p>` +
    `<h2 id="setupTitle">${escapeHtml(step.title)}</h2>` +
    `<p class="setup-intro">${escapeHtml(step.intro)}</p>` +
    `<form id="setupForm" novalidate>${body.join('')}</form>` +
    '<div class="setup-actions">' +
    '<button type="button" id="setupSkip">Skip setup</button>' +
    back +
    next +
    '</div>' +
    '</div></div>'
  );
}

export function openSetup(
  root: HTMLElement,
  getState: () => AppState,
  setState: (next: AppState) => void
): void {
  let stepIndex = 0;
  let errors: Record<string, string> = {};

  const render = (): void => {
    root.innerHTML = setupStepHtml(getState(), stepIndex, errors);
  };

  const close = (): void => {
    root.innerHTML = '';
    setState({ ...getState(), setupDone: true });
    root.removeEventListener('change', onChange);
    root.removeEventListener('click', onClick);
  };

  const onChange = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    const name = target.name;
    if (name === 'loadPicker') {
      const value = target.value;
      if (value.startsWith('lib:')) {
        setState(selectLibraryLoad(getState(), value.slice(4)));
      } else if (value.startsWith('custom:')) {
        setState(selectCustomLoad(getState(), value.slice(7)));
      } else {
        return;
      }
      render();
      return;
    }
    if (name === 'loadName') return;
    const def = fieldById(name);
    if (def === undefined) return;
    if (def.kind === 'number') {
      const p = parseInput(def, target.value, getState().unitSystem);
      if (!p.ok) {
        errors[def.id] = p.message;
        render();
        return;
      }
      delete errors[def.id];
      setState(applyField(getState(), def, p.value));
      render();
    } else if (def.kind === 'select') {
      setState(applyField(getState(), def, target.value));
      render();
    } else if (def.kind === 'checkbox') {
      const input = target as HTMLInputElement;
      setState(applyField(getState(), def, input.checked));
      render();
    }
  };

  const onClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.id === 'setupNext') {
      if (Object.keys(errors).length === 0) {
        stepIndex += 1;
        render();
      }
    } else if (target.id === 'setupBack') {
      stepIndex -= 1;
      errors = {};
      render();
    } else if (target.id === 'setupSkip' || target.id === 'setupFinish') {
      close();
    }
  };

  root.addEventListener('change', onChange);
  root.addEventListener('click', onClick);
  render();
}
