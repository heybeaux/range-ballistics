Write the app shell that ties the finished modules together: one HTML page, one stylesheet, one TypeScript entry. No tests for these files; the acceptance check is `npm run typecheck`, `npm test`, and `npm run build` all passing.

Files you own (create all three, touch nothing else):
  index.html          (repo root; Vite entry)
  src/styles.css
  src/main.ts

Read first, in full: src/planner/types.ts, src/scene/types.ts, and the exported function signatures of src/planner/model.ts, storage.ts, view.ts, fields.ts, panels.ts and src/scene/scene.ts. Use those functions. Do not re-implement physics, formatting, parsing, or HTML that they already provide.

## index.html

<!doctype html>, lang="en", <meta charset>, <meta name="viewport" content="width=device-width, initial-scale=1">, <title>Range Ballistics</title>, <link rel="stylesheet" href="/src/styles.css">, and at the end of body <script type="module" src="/src/main.ts"></script>.

Body structure (keep these ids exactly):

<header id="topbar">
  <h1>Range Ballistics</h1>
  <span id="rifleName"></span>
  <button type="button" id="runSetup">Run setup again</button>
</header>
<main id="app">
  <aside id="inputs"><form id="form" novalidate></form></aside>
  <section id="stage">
    <div id="scene"></div>
    <div id="sceneBar">
      <div class="bar-row">
        <button type="button" data-camera="shooter">Shooter's view</button>
        <button type="button" data-camera="side">Side view</button>
        <button type="button" data-camera="top">Top-down view</button>
        <button type="button" data-camera="reset">Reset view</button>
        <label>Drop and drift scale <input type="range" id="exaggeration" min="1" max="20" step="1" value="1"></label>
        <span id="exaggerationLabel"></span>
      </div>
      <div class="bar-row">
        <button type="button" id="play">Play</button>
        <button type="button" id="pause">Pause</button>
        <button type="button" id="replay">Replay</button>
        <label>Speed <select id="speed"><option value="0.1">0.1×</option><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label>
        <input type="range" id="timeline" min="0" max="1000" step="1" value="0" aria-label="Flight timeline">
        <span id="readout"></span>
      </div>
    </div>
    <section id="dopeSection">
      <div class="bar-row"><h2>Dope table</h2><button type="button" id="exportCsv">Export CSV</button><button type="button" id="printCard">Print card</button></div>
      <div id="dope"></div>
    </section>
  </section>
  <aside id="resultsPane"><div id="results"></div></aside>
</main>
<div id="printArea"></div>
<div id="setupRoot"></div>

## src/styles.css

Plain CSS, no framework, no web fonts (the app must work offline). font-family: system-ui, sans-serif. Dark neutral theme: page background #14171a, panels #1e2328, text #e8eaed, muted text #9aa3ad, accent #ffb000, error #ff6b6b.
- html, body: margin 0, height 100%. #app: display grid; grid-template-columns: 340px 1fr 340px; height: calc(100vh - 48px). #topbar: height 48px, flex row, centred vertically, gap 16px, padding 0 16px; h1 font-size 18px, margin 0; #runSetup pushed to the right with margin-left auto.
- #inputs and #resultsPane: overflow-y auto, padding 12px, background #1e2328.
- #stage: display flex, column, min-width 0, overflow-y auto. #scene: height 52vh, min-height 320px, position relative, background #000. #sceneBar and #dopeSection: padding 8px 12px.
- .bar-row: display flex, flex-wrap wrap, gap 8px, align-items center, margin-bottom 6px. #timeline: flex 1, min-width 160px. #readout: font-variant-numeric tabular-nums, color #9aa3ad.
- fieldset.group: border 1px solid #333a42, border-radius 8px, margin 0 0 12px, padding 8px 10px. legend: color #ffb000, font-weight 600.
- .field: margin-bottom 10px. label: display block, font-size 13px, font-weight 600, margin-bottom 3px. label.check: font-weight 400, display flex, gap 6px, align-items center. .input-row: display flex, gap 6px, align-items center. input[type=text], select: background #14171a, color #e8eaed, border 1px solid #3a424b, border-radius 6px, padding 6px 8px, font-size 14px, width 100%, box-sizing border-box. .unit: color #9aa3ad, min-width 44px, font-size 13px. .help: color #9aa3ad, font-size 12px, margin 3px 0 0. .error: color #ff6b6b, font-size 12px, margin 3px 0 0. .has-error input: border-color #ff6b6b.
- button: background #2a3037, color #e8eaed, border 1px solid #3a424b, border-radius 6px, padding 6px 10px, font-size 13px, cursor pointer. button:hover: border-color #ffb000.
- .results .notice, .print-card .notice: border 1px solid #ffb000, border-radius 6px, padding 6px 8px, font-size 12px, color #ffb000. .results.stale: opacity 0.55. .stale-mark, .warning: color #ff6b6b, font-weight 600. .estimate-mark, .velocity-note.estimate, .twist-note.unconfirmed: background #2b2410, border-left 3px solid #ffb000, padding 6px 8px, font-size 12px, border-radius 4px. .correction: background #14171a, border-radius 8px, padding 8px 10px, margin-bottom 8px. .correction h3: margin 0 0 4px, font-size 13px, color #9aa3ad. .dial: font-size 20px, margin 0. .equiv: font-size 12px, color #9aa3ad, margin 4px 0 0. dl.facts: display grid, grid-template-columns auto 1fr, gap 4px 10px, font-size 13px; dt color #9aa3ad; dd margin 0. .sources, .load-note, .pressure-note, .sight-note: font-size 12px, color #9aa3ad. a: color #ffb000.
- table.dope: border-collapse collapse, width 100%, font-size 13px, font-variant-numeric tabular-nums; th, td: padding 4px 8px, text-align right, border-bottom 1px solid #333a42; th color #9aa3ad.
- #exaggerationLabel: color #ffb000, font-weight 600.
- #printArea: display none.
- @media print: body background white, color black; #topbar, #app, #setupRoot: display none; #printArea: display block, width 9cm, font-size 9pt, color black; in print, .print-card .notice and table cells use black text and black borders.
- @media (max-width: 1100px): #app grid-template-columns 300px 1fr; #resultsPane grid-column 1 / -1.

## src/main.ts

import './styles.css'; plus the modules. No `any`. `noUncheckedIndexedAccess` is on.

Helper: function el<T extends HTMLElement>(id: string, ctor: new () => T): T — document.getElementById(id); throw new Error(`missing #${id}`) unless it is `instanceof ctor`. Use it for every element lookup (for example el('form', HTMLFormElement)).

Module state:
  let state: AppState = loadState(localStorage);
  let errors: Record<string, string> = {};
  let lastResults: ShotResults | null = null;   // last good result
  let lastRows: DopeRow[] = [];
  let stale = false;
  let exaggeration = 1;
  let durationS = 0;
  const scene = createRangeScene(el('scene', HTMLDivElement));

function renderForm(): void
  form.innerHTML = formHtml(state, errors). Then insert the panels with insertAdjacentHTML:
  - loadPickerHtml(state) + loadSourcesHtml(state): right after the <legend> of [data-group="load"].
  - velocityNoteHtml(state): at the end of [data-field="velocityMeasured"].
  - twistNoteHtml(state): at the end of [data-field="twistConfirmed"].
  - sightHeightNoteHtml(): at the end of [data-field="sightHeight"].
  - pressureNoteHtml(state): at the end of [data-field="pressureMode"].
  Use form.querySelector and skip an insert when the element is not found. Also set #rifleName text to state.rifle.name.

function recompute(): void
  input = toShotInput(state).
  - input null: errors[state.load.dragModel === 'G7' ? 'bcG7' : 'bcG1'] = 'Enter a BC for this drag model, or switch the drag model.'; stale = true.
  - else solved = solve(input):
    - solved.ok false: stale = true; for each solver error, map its `field` to a form field id with this table and set errors[id] = message (ignore fields not in the table):
        muzzleVelocityMps->muzzleVelocity, bc->(bcG7 or bcG1 by drag model), bulletMassKg->bulletMass, bulletLengthM->bulletLength, twistM->twist, sightHeightM->sightHeight, zeroRangeM->zeroRange, maxRangeM->targetRange, shotAngleRad->shotAngle, atmosphere.temperatureK->temperature, atmosphere.pressurePa->pressure, atmosphere.relativeHumidity->humidity, wind.speedMps->windSpeed, wind.clock->windClock
    - solved.ok true: r = shotResults(state, solved). If r is null: stale = true and errors.targetRange = 'The bullet does not reach this distance.'. Else: stale = false; lastResults = r; lastRows = dopeRows(state, solved); and call scene.update({ samples: solved.samples, targetRangeM: state.conditions.targetRangeM, shotAngleRad: state.conditions.shotAngleRad, sightHeightM: state.rifle.sightHeightM, transonicRangeM: solved.transonicRangeM, subsonicRangeM: solved.subsonicRangeM, windSpeedMps: state.conditions.windSpeedMps, windClock: state.conditions.windClock, unitSystem: state.unitSystem, targetType: state.targetType, exaggeration }).

function renderOutputs(): void
  #results innerHTML = resultsHtml(lastResults, state, stale). #dope innerHTML = dopeTableHtml(lastRows, state).
  #exaggerationLabel text = exaggeration === 1 ? 'True scale' : `Drop and drift drawn ${exaggeration}× larger than real`.

function refresh(): void
  saveState(localStorage, state); recompute(); renderForm(); renderOutputs().
  (recompute before renderForm, so solver errors show in the form.)

Form events: one 'change' listener on #form (event delegation). target must be an HTMLInputElement or HTMLSelectElement; name = target.name.
  - 'loadPicker': value starts with 'lib:' -> state = selectLibraryLoad(state, rest); starts with 'custom:' -> state = selectCustomLoad(state, rest). errors = {}. refresh().
  - 'loadName': state = { ...state, load: { ...state.load, name: target.value.trim() || 'My load', libraryId: null } }. refresh().
  - otherwise def = fieldById(name); if undefined return.
      kind 'number': p = parseInput(def, target.value, state.unitSystem). Not ok -> errors[def.id] = p.message; stale = true; renderForm(); renderOutputs(); return (do not change state). Ok -> delete errors[def.id]; state = applyField(state, def, p.value).
      kind 'select': state = applyField(state, def, target.value).
      kind 'checkbox' (target is an HTMLInputElement): state = applyField(state, def, target.checked).
      Before refresh(), remove from `errors` every key that came from the solver: simplest is to keep parse errors in a second object `parseErrors` and rebuild `errors = { ...parseErrors }` at the start of recompute(). Implement it that way.
      refresh().
  Also add a 'submit' listener on the form that calls preventDefault().

Click on #saveCustomLoad (delegate on #form, 'click', target instanceof HTMLElement with id 'saveCustomLoad'): state = saveCustomLoad(state); refresh().

Scene controls:
  - Every button with data-camera: on click, scene.setCamera(value) when value is 'shooter', 'side', 'top' or 'reset' (narrow the string; no `as`).
  - #play -> scene.play(); #pause -> scene.pause(); #replay -> scene.replay().
  - #speed change -> scene.setSpeed(Number(value)).
  - #exaggeration input -> exaggeration = Number(value); recompute(); renderOutputs(). (The numbers in the results panel must not change; only the drawing does.)
  - #timeline input -> scene.seek((Number(value) / 1000) * durationS).
  - scene.onReadout(r => { durationS = r.durationS; if the timeline is not the document.activeElement, set its value to String(Math.round((r.timeS / Math.max(r.durationS, 1e-9)) * 1000)); #readout text = `${r.timeS.toFixed(2)} s · ${format(r.rangeM, 'range', sys)} · ${format(r.speedMps, 'velocity', sys)} · ${format(Math.abs(r.pathM), 'smallLength', sys)} ${r.pathM <= 0 ? 'below' : 'above'} line of sight` }) with sys = state.unitSystem read at call time.

Export and print:
  - #exportCsv: csv = toCsv(state, lastRows, today) where today = new Date().toISOString().slice(0, 10). Download it: Blob([csv], { type: 'text/csv' }), URL.createObjectURL, a temporary <a download="dope-card.csv">, click, then URL.revokeObjectURL.
  - #printCard: #printArea innerHTML = printCardHtml(lastRows, state, today); window.print().

Setup hook (the setup wizard is a later task): export nothing, but include these two functions and wire #runSetup to the second:
  function getState(): AppState { return state; }
  function setState(next: AppState): void { state = next; parseErrors = {}; refresh(); }
  #runSetup click -> setState({ ...getState(), setupDone: false })   // a later task will open the wizard here

Start: call refresh() once at the end of the file. For screenshots and checks, also expose the scene on window: declare `interface Window { __rangeScene?: RangeScene }` inside `declare global { }` and set window.__rangeScene = scene. (Add `export {};` if the file needs to be a module for `declare global`.)

Finish by running `npm run typecheck`, `npm test`, and `npm run build`. All three must pass. Reply with what you built and anything you could not do.
