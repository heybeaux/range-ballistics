Write one pure TypeScript module and its Vitest test. It builds small HTML strings that explain where the numbers come from. No DOM access. No `any`.

Files you own (create both, touch nothing else):
  src/planner/panels.ts
  tests/planner-panels.test.ts

Read first, in full: src/planner/types.ts, src/planner/storage.ts, src/data/rifle.json. Read `escapeHtml` in src/planner/view.ts, `effectivePressurePa` and `estimateVelocityMps` in src/planner/model.ts, and `format` in src/units/units.ts. Import and use them; do not rewrite them.

Imports allowed: './types', './storage' (use its `library`), './view', './model', '../units/units', and `import rifleJson from '../data/rifle.json'`.

PURPOSE: a new shooter must see where each number came from, which ones are estimates, and what to measure. These are the panels that say so.

Helper (not exported): link(url: string): string -> <a href="{escaped url}" target="_blank" rel="noopener">source</a>

EXPORTS of src/planner/panels.ts

1. export function loadPickerHtml(state: AppState): string
   <div class="field" data-field="loadPicker"><label for="loadPicker">Load</label><select id="loadPicker" name="loadPicker">{options}</select>
   <p class="help">Pick the ammunition you are shooting, or a bullet if you load your own.</p></div>
   <div class="field" data-field="loadName"><label for="loadName">Load name</label><span class="input-row"><input type="text" id="loadName" name="loadName" value="{escaped state.load.name}"><button type="button" id="saveCustomLoad">Save as my load</button></span>
   <p class="help">Change any value below, give it a name, and save it to keep it in the list.</p></div>
   Options, in this order:
   - Only when state.load.libraryId is null AND no custom load has state.load.name: <option value="" selected>Custom (not saved)</option>
   - One per library load: <option value="lib:{id}"{ selected when id === state.load.libraryId}>{escaped name}</option>
   - One per state.customLoads entry: <option value="custom:{escaped name}"{ selected when state.load.libraryId is null and name === state.load.name}>My load: {escaped name}</option>

2. export function loadSourcesHtml(state: AppState): string
   lib = the library load whose id is state.load.libraryId (undefined when libraryId is null or not found).
   No lib: return <p class="sources">Custom load: every value is your value.</p>
   With lib: <ul class="sources"> four <li>, then </ul>, then when lib.note is not null <p class="load-note">{escaped note}</p>.
   The four lines, each built by one helper line(label, sourced, origin, text):
     - origin === 'user'            -> <li>{label}: your value</li>
     - sourced.value === null       -> <li>{label}: not published by the maker</li>
     - else                         -> <li>{label}: {text} {link(sourceUrl)} (read {readOn})</li>
   Lines:
     'G7 BC'              lib.bcG7              origin.bcG7           text = value.toFixed(3)
     'G1 BC'              lib.bcG1              origin.bcG1           text = value.toFixed(3)
     'Bullet length'      lib.bulletLengthM     origin.bulletLengthM  text = format(value, 'smallLength', sys) but with 3 decimals: use (value / 0.0254).toFixed(3) + ' in' for imperial and (value * 1000).toFixed(2) + ' mm' for metric
     'Published velocity' lib.publishedVelocityMps  always 'library'  text = format(value, 'velocity', sys) + (lib.testBarrelM === null ? ', test barrel not stated' : ` from a ${(lib.testBarrelM / 0.0254).toFixed(0)} inch test barrel`)

3. export function velocityNoteHtml(state: AppState): string
   sys = state.unitSystem. barrelIn = (state.rifle.barrelLengthM / 0.0254).toFixed(0).
   a. state.load.velocityMeasured -> <p class="velocity-note measured">Measured: your chronograph average.</p>
   b. Otherwise <p class="velocity-note estimate"><strong>Estimate, not measured in your rifle.</strong> {text} Shoot over a chronograph and enter your average.</p> where text is:
      - no lib, or lib.publishedVelocityMps.value is null: 'There is no published velocity for this load.'
      - lib has a velocity but lib.testBarrelM is null: `The maker publishes ${format(v, 'velocity', sys)} and does not state its test barrel, so no barrel-length correction was made. Expect less from a ${barrelIn} inch barrel.`
      - lib has both, and library.velocityLossMpsPerM.value is not null: est = estimateVelocityMps(v, lib.testBarrelM, state.rifle.barrelLengthM, loss). Text:
        `The maker publishes ${format(v, 'velocity', sys)} from a ${testIn} inch test barrel. Less ${format(loss * 0.0254, 'velocity', sys)} per inch for your ${barrelIn} inch barrel gives ${format(est, 'velocity', sys)}. ${escaped library.velocityLossNote} ${link(library.velocityLossMpsPerM.sourceUrl)}`
        (testIn = (lib.testBarrelM / 0.0254).toFixed(0). Only add the link when sourceUrl is not null. If est is null use the previous case's text.)

4. export function twistNoteHtml(state: AppState): string
   state.rifle.twistConfirmed -> <p class="twist-note confirmed">Twist confirmed by you.</p>
   else <div class="twist-note unconfirmed"><p><strong>Unconfirmed.</strong> {escaped rifleJson.twistNote}</p><ul>{one <li>{escaped label} {link(url)}</li> per rifleJson.twistSources entry}</ul></div>

5. export function pressureNoteHtml(state: AppState): string
   conditions.pressureMode === 'altitude' -> <p class="pressure-note">Using {format(effectivePressurePa(conditions), 'pressure', sys)}: a standard-atmosphere estimate for {format(conditions.altitudeM, 'altitude', sys)}. A measured station pressure is better.</p>
   else ''.

6. export function sightHeightNoteHtml(): string
   <p class="sight-note">{escaped rifleJson.sightHeightNote}</p>

TESTS in tests/planner-panels.test.ts. Use `defaultState`, `selectLibraryLoad`, `saveCustomLoad` from '../src/planner/storage'.

Write exactly these tests:
 1. loadPickerHtml(defaultState()): contains '<option value="lib:federal-gm308m" selected>'; contains 10 occurrences of '<option value="lib:'; does not contain 'Custom (not saved)'; contains 'id="saveCustomLoad"' and 'id="loadName"'.
 2. With load.libraryId null and load.name 'Mine' and no custom loads: contains '<option value="" selected>Custom (not saved)</option>'.
 3. After saveCustomLoad on a state with load.name 'Mine': contains '<option value="custom:Mine" selected>My load: Mine</option>' and does not contain 'Custom (not saved)'.
 4. A load name is escaped: with load.name 'A "quoted" <name>' the HTML contains 'value="A &quot;quoted&quot; &lt;name&gt;"'.
 5. loadSourcesHtml(defaultState()): contains 'G7 BC: 0.224'; contains 'href="https://sierrabullets.com/30-cal-168-gr-hpbt-matchking-smk/"'; contains '(read 2026-11-10)'; contains 'Bullet length: 1.220 in'; contains 'Published velocity: 2650 fps, test barrel not stated'; contains 'class="load-note"'.
 6. loadSourcesHtml for 'bullet-nosler-53164': contains 'G7 BC: not published by the maker' and 'Published velocity: not published by the maker'.
 7. loadSourcesHtml for 'hornady-80966': contains 'Published velocity: 2700 fps from a 24 inch test barrel' and 'Bullet length: not published by the maker'.
 8. With load.origin.bcG7 'user' (default state otherwise): contains 'G7 BC: your value' and still contains 'G1 BC: 0.462'.
 9. With load.libraryId null: loadSourcesHtml is '<p class="sources">Custom load: every value is your value.</p>'.
10. velocityNoteHtml(defaultState()): contains 'Estimate, not measured in your rifle.'; contains 'does not state its test barrel'; contains 'Expect less from a 16 inch barrel'; contains 'Shoot over a chronograph'.
11. velocityNoteHtml for 'hornady-80966': contains 'The maker publishes 2700 fps from a 24 inch test barrel.'; contains 'Less 21 fps per inch for your 16 inch barrel gives 2533 fps.'; contains 'href="https://rifleshooter.com/'.
12. velocityNoteHtml for 'bullet-nosler-53164': contains 'There is no published velocity for this load.'
13. velocityNoteHtml with load.velocityMeasured true: is '<p class="velocity-note measured">Measured: your chronograph average.</p>'.
14. twistNoteHtml(defaultState()): contains 'Unconfirmed.', 'cleaning rod', and exactly 2 '<li>'. With rifle.twistConfirmed true: contains 'Twist confirmed by you.' and no '<li>'.
15. pressureNoteHtml(defaultState()) is ''. With pressureMode 'altitude' and altitudeM 1500: contains 'standard-atmosphere estimate for 4921 ft' and 'inHg'.
16. sightHeightNoteHtml() contains 'not a measurement'.

If a test fails, check your code against this task first. Do not edit any file you do not own. If you think the task itself is wrong, leave the test failing and say which and why.

Finish by running `npm run typecheck` and `npm test`. Reply with the test count and anything you left failing.
