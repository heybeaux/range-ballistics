Write the first-run setup: one module with a pure HTML builder and a small DOM controller, its Vitest test, some CSS, and a three-line hook in main.ts.

Files you own:
  src/planner/setup.ts            (create)
  tests/planner-setup.test.ts     (create)
  src/styles.css                  (append only; do not change existing rules)
  src/main.ts                     (only the edits listed under "main.ts edits")

Read first, in full: src/planner/types.ts, src/main.ts, and the exported signatures of src/planner/fields.ts, panels.ts, storage.ts, view.ts.

PURPOSE: a person who has never used a ballistics app opens this for the first time. Four short steps get them to a solved shot. Each step says in plain words what the value is and where to find it. They can skip, and run it again later.

## src/planner/setup.ts

export interface SetupStep { key: 'rifle' | 'load' | 'velocity' | 'zero'; title: string; intro: string; fieldIds: string[] }

export const SETUP_STEPS: SetupStep[] = exactly these four, in order:
 1. key 'rifle', title 'Confirm your rifle',
    intro 'These describe your rifle and scope. The defaults are for a Tikka T3x CTR in .308 with a 16 inch barrel. Change anything that is different on yours.',
    fieldIds ['twist', 'twistDirection', 'twistConfirmed', 'sightHeight', 'angleUnit', 'clickValue']
 2. key 'load', title 'Pick your load',
    intro 'Choose the ammunition you shoot. Each number shows the maker page it came from. If yours is not listed, pick the closest one now and edit the values afterwards.',
    fieldIds []
 3. key 'velocity', title 'Set the muzzle velocity',
    intro 'Muzzle velocity is how fast the bullet leaves the barrel. It changes the answer more than anything else here. Makers measure it in long test barrels, so a 16 inch barrel will be slower than the box says. The best number is the average from your own chronograph.',
    fieldIds ['muzzleVelocity', 'velocityMeasured']
 4. key 'zero', title 'Set your zero',
    intro 'Your zero is the distance where the bullet hits exactly where you aim, with the scope dials at zero. Most people zero at 100 yards. Enter the distance you actually zeroed at.',
    fieldIds ['zeroRange']

export function setupStepHtml(state: AppState, stepIndex: number, errors: Record<string, string>): string
  step = SETUP_STEPS[stepIndex]; if undefined return ''.
  <div class="setup-backdrop"><div class="setup-dialog" role="dialog" aria-modal="true" aria-labelledby="setupTitle">
    <p class="setup-progress">Step {stepIndex + 1} of 4</p>
    <h2 id="setupTitle">{title}</h2>
    <p class="setup-intro">{intro}</p>
    <form id="setupForm" novalidate>{body}</form>
    <div class="setup-actions">
      <button type="button" id="setupSkip">Skip setup</button>
      {stepIndex > 0 ? <button type="button" id="setupBack">Back</button> : nothing}
      {stepIndex < 3 ? <button type="button" id="setupNext" class="primary">Next</button> : <button type="button" id="setupFinish" class="primary">Finish</button>}
    </div>
  </div></div>
  body:
   - for each id in step.fieldIds: fieldHtml(fieldById(id), state, errors[id]) (skip an id that is not found)
   - then by step key:  'rifle' -> twistNoteHtml(state) + sightHeightNoteHtml();  'load' -> loadPickerHtml(state) + loadSourcesHtml(state);  'velocity' -> velocityNoteHtml(state);  'zero' -> nothing.
  Escape title and intro with escapeHtml.

export function openSetup(root: HTMLElement, getState: () => AppState, setState: (next: AppState) => void): void
  Local variables: stepIndex = 0, errors: Record<string, string> = {}.
  render(): root.innerHTML = setupStepHtml(getState(), stepIndex, errors).
  close(): root.innerHTML = ''; setState({ ...getState(), setupDone: true }).
  Attach listeners to `root` ONCE per openSetup call, and remove them in close() (keep the handler functions in variables and use removeEventListener), so opening setup twice does not double-handle events.
  'change' listener (target instanceof HTMLInputElement or HTMLSelectElement):
    - name 'loadPicker': 'lib:<id>' -> setState(selectLibraryLoad(getState(), id)); 'custom:<name>' -> setState(selectCustomLoad(getState(), name)); render().
    - name 'loadName': ignore.
    - else def = fieldById(name); undefined -> return.
        number: p = parseInput(def, target.value, getState().unitSystem); not ok -> errors[def.id] = p.message; render(); return. ok -> delete errors[def.id]; setState(applyField(getState(), def, p.value)); render().
        select: setState(applyField(getState(), def, target.value)); render().
        checkbox: setState(applyField(getState(), def, target.checked)); render().
  'click' listener (target instanceof HTMLElement), by target.id:
    'setupNext'  -> if Object.keys(errors).length === 0: stepIndex += 1; render().
    'setupBack'  -> stepIndex -= 1; errors = {}; render().
    'setupSkip', 'setupFinish' -> close().
  Finally call render().

## tests/planner-setup.test.ts  (tests the pure parts only; do not test openSetup)

Use `defaultState` from '../src/planner/storage'.
 1. SETUP_STEPS has 4 steps with keys ['rifle', 'load', 'velocity', 'zero']. Every fieldId in every step is found by fieldById.
 2. setupStepHtml(defaultState(), 0, {}): contains 'Step 1 of 4', 'Confirm your rifle', 'id="twist"', 'id="clickValue"', 'Unconfirmed.', 'id="setupNext"', 'id="setupSkip"'; does not contain 'id="setupBack"' or 'id="setupFinish"'.
 3. Step index 1: contains 'Step 2 of 4', 'id="loadPicker"', 'class="sources"', 'id="setupBack"'.
 4. Step index 2: contains 'Step 3 of 4', 'id="muzzleVelocity"', 'value="2650"', 'Estimate, not measured in your rifle.'.
 5. Step index 3: contains 'Step 4 of 4', 'id="zeroRange"', 'value="100"', 'id="setupFinish"'; does not contain 'id="setupNext"'.
 6. setupStepHtml(defaultState(), 0, { twist: 'Enter a number.' }) contains '<p class="error" role="alert">Enter a number.</p>'.
 7. setupStepHtml(defaultState(), 9, {}) is ''.
 8. Every step's HTML contains 'role="dialog"' and 'aria-modal="true"'.

## src/styles.css  (append)

.setup-backdrop: position fixed, inset 0, background rgba(0,0,0,0.7), display flex, align-items center, justify-content center, z-index 100.
.setup-dialog: background #1e2328, color #e8eaed, border 1px solid #3a424b, border-radius 12px, padding 20px 24px, width min(560px, 92vw), max-height 88vh, overflow-y auto.
.setup-progress: color #ffb000, font-size 12px, font-weight 600, margin 0 0 4px, text-transform uppercase, letter-spacing 0.06em.
.setup-dialog h2: margin 0 0 8px, font-size 20px. .setup-intro: color #c5cbd3, font-size 14px, line-height 1.45, margin 0 0 14px.
.setup-actions: display flex, gap 8px, justify-content flex-end, margin-top 14px. #setupSkip: margin-right auto.
button.primary: background #ffb000, color #14171a, border-color #ffb000, font-weight 600.

## main.ts edits  (only these)

1. import { openSetup } from './planner/setup';
2. Replace the body of the #runSetup click handler with: openSetup(el('setupRoot', HTMLDivElement), getState, setState);
3. After the first refresh() at the end of the file add: if (!state.setupDone) { openSetup(el('setupRoot', HTMLDivElement), getState, setState); }

If a test fails, check your code against this task first. If you think the task itself is wrong, leave the test failing and say which and why.

Finish by running `npm run typecheck`, `npm test`, and `npm run build`. Reply with the test count and anything you left failing.
