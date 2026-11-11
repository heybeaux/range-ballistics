Wire the new features into the app: several rifles, cartridge and scope panels, the scope's magnification, and setup for a new rifle. After this task the WHOLE project must typecheck, test and build again.

Files you own (edit only these):
  src/main.ts
  src/planner/setup.ts
  tests/planner-setup.test.ts
  index.html
  src/styles.css        (append only)

Read first, in full: src/planner/types.ts, src/scene/types.ts, src/main.ts, src/planner/setup.ts, index.html, and the exported signatures of src/planner/storage.ts, model.ts, fields.ts, panels.ts, view.ts and src/scene/scene.ts. Use their functions; do not re-implement them.

IMPORTANT JavaScript rule for main.ts: declare every `const` / `let` BEFORE any function call that uses it. Typecheck does not catch a use-before-declaration at start-up.

## index.html

- In #topbar, replace <span id="rifleName"></span> with <div id="rifleBar"></div>. Keep #runSetup.
- In the second .bar-row of #sceneBar, before the Play button, add:
    <label id="magnificationLabel" hidden>Magnification <input type="range" id="magnification" min="5" max="25" step="0.5" value="10"> <span id="magnificationValue"></span></label>
- Before </body>, next to #setupRoot, add <div id="dialogRoot"></div>.
- Keep every other id.

## src/main.ts

State:
  let saved: SavedState = loadSaved(localStorage);
  let state: AppState = activeState(saved);
  let currentPreset: CameraPreset = 'reset';
(`state` stays the working copy of the active rifle, exactly as the rest of the file already uses it.)

Saving: replace saveState(localStorage, state) with
  saved = withActiveState(saved, state); saveSaved(localStorage, saved);
Do this inside refresh() where the old save was.

getState / setState: unchanged in meaning (setState replaces the active rifle's state and refreshes).

renderForm(): keep the existing inserts and add, using the same `insert` helper (skip when the target is missing):
  - cartridgeNoteHtml(state): right after the <legend> of fieldset[data-group="rifle"].
  - scopePanelHtml(state): right after the <legend> of fieldset[data-group="scope"].
  Replace `rifleName.textContent = ...` with: #rifleBar innerHTML = rifleBarHtml(saved).
  bcFieldId(): 'bcG7' for 'G7', 'bcRA4' for 'RA4', else 'bcG1'.

Form 'change' handler, new names (before the generic field handling):
  - 'scopePicker': value 'generic' -> state = selectGenericScope(state); value 'lib:<id>' -> state = selectLibraryScope(state, id). Then parseErrors = {}; refresh(); syncMagnification().
  - a field of kind 'text' (def.kind === 'text', target is an HTMLInputElement): state = applyField(state, def, target.value); refresh().
  Everything else as now. After any change to a field in the 'scope' group or to 'angleUnit', call syncMagnification().

Rifle bar (delegate on #rifleBar):
  - 'change' on #riflePicker: saved = withActiveState(saved, state); saved = selectProfile(saved, target.value); state = activeState(saved); parseErrors = {}; lastResults = null; lastRows = []; refresh(); syncMagnification(); if (!state.setupDone) openSetup(...).
  - click #addRifle: #dialogRoot innerHTML = addRifleDialogHtml(); focus #newRifleName.
  - click #duplicateRifle: saved = duplicateProfile(withActiveState(saved, state)); state = activeState(saved); refresh().
  - click #deleteRifle: #dialogRoot innerHTML = deleteRifleDialogHtml(state.rifle.name).
Dialogs (delegate 'click' on #dialogRoot, by target id):
  - 'addRifleCancel', 'deleteRifleCancel': #dialogRoot innerHTML = ''.
  - 'addRifleConfirm': name = #newRifleName value trimmed, or 'My rifle' when empty; cartridge = #newRifleCartridge value. saved = addProfile(withActiveState(saved, state), cartridge, name); state = activeState(saved); close the dialog; parseErrors = {}; lastResults = null; lastRows = []; refresh(); syncMagnification(); openSetup(el('setupRoot', HTMLDivElement), getState, setState).
  - 'deleteRifleConfirm': saved = deleteProfile(withActiveState(saved, state), saved.activeId); state = activeState(saved); close the dialog; parseErrors = {}; lastResults = null; lastRows = []; refresh(); syncMagnification().
  Also close a dialog on the Escape key (a 'keydown' listener on document that empties #dialogRoot when it is not empty).

Scene:
  - Pass scope: state.rifle.scope and magnification: state.magnification in the object given to scene.update(...).
  - Camera buttons: remember the preset in currentPreset. Show the #magnificationLabel only in the scope view: el.hidden = currentPreset !== 'shooter'.
  - function syncMagnification(): set #magnification min, max to the scope's magMin and magMax, value to state.magnification (after clampMagnification), #magnificationValue text to `${value}×` (no trailing ".0"), and call scene.setMagnification(state.magnification).
  - #magnification 'input': state = { ...state, magnification: clampMagnification(Number(value), state.rifle.scope) }; update #magnificationValue; scene.setMagnification(state.magnification); save (saved = withActiveState(saved, state); saveSaved(...)). Do NOT call refresh() here: the animation must not restart while the user drags the slider.
  - #sceneNote text in the scope view (currentPreset === 'shooter'): showDialed
        ? 'Scope view through your scope. The bullet rises above the crosshair and comes down onto the target.'
        : 'Scope view with the scope still at its zero. The red dot is where the bullet lands. Read the hold off the reticle at that dot.'
    In the other views keep the existing two sentences. Re-render the note when the preset changes.
  - Call syncMagnification() once at start-up, after the first refresh().

## src/planner/setup.ts

- Step 'rifle': fieldIds become ['rifleName', 'barrelLength', 'twist', 'twistDirection', 'twistConfirmed', 'sightHeight']. intro: 'These describe your rifle. Change anything that is different on yours. Barrel length matters because shorter barrels give lower velocity.' Body: cartridgeNoteHtml(state) first, then the fields with the notes beside them as now (twist note after twistConfirmed, sight-height note after sightHeight).
- New step after 'rifle': key 'scope', title 'Pick your scope', intro 'Choose your scope so the app speaks its language: the unit on your turrets, the size of one click, how far the turret can dial, and the reticle you see.' fieldIds ['angleUnit', 'clickValue', 'availableElevation']. Body: scopePanelHtml(state) first, then the fields.
- Steps are now five: rifle, scope, load, velocity, zero. "Step n of 5". The Next / Finish logic follows the number of steps (use SETUP_STEPS.length, not a literal).
- SetupStep.key type: 'rifle' | 'scope' | 'load' | 'velocity' | 'zero'.
- The change listener in openSetup also handles: name 'scopePicker' ('generic' -> selectGenericScope, 'lib:<id>' -> selectLibraryScope) then render(); and fields of kind 'text' (applyField with target.value).
- Zero step intro: replace 'Most people zero at 100 yards.' with 'Most centrefire shooters zero at 100 yards, and most .22 shooters at 50.'

tests/planner-setup.test.ts: update to five steps (keys ['rifle', 'scope', 'load', 'velocity', 'zero'], 'Step 1 of 5' … 'Step 5 of 5'), step 0 contains 'id="rifleName"', 'id="barrelLength"', 'id="twist"', '.308 Winchester'; step 1 contains 'id="scopePicker"', 'id="clickValue"', 'id="availableElevation"', 'Vortex Venom'; step 2 is the load step; step 3 velocity; step 4 zero with 'id="setupFinish"'. Keep the other assertions (dialog role, error rendering, out-of-range index gives '').

## src/styles.css (append)

#rifleBar { display: flex; align-items: center; gap: 8px; }
#rifleBar label { margin: 0; font-size: 13px; color: #9aa3ad; font-weight: 400; }
#rifleBar select { width: auto; min-width: 220px; }
#rifleBar button:disabled { opacity: 0.4; cursor: default; }
.cartridge-note { font-size: 12px; color: #9aa3ad; margin: 0 0 8px; }
.safety-note { margin: 0 0 10px; padding: 6px 8px; border-left: 3px solid #ff6b6b; background: #2a1a1a; border-radius: 4px; font-size: 12px; }
.safety-note p { margin: 0 0 4px; }
.scope-note, .regime-note, .dope-note { font-size: 12px; color: #9aa3ad; }
.dial-limit { font-size: 12px; margin: 4px 0 0; }
table.dope tr.beyond td { color: #ff6b6b; }
#magnificationLabel[hidden] { display: none; }
#magnificationValue { min-width: 36px; font-variant-numeric: tabular-nums; }

ACCEPTANCE: all three must pass, for the whole project:
  npm run typecheck
  npm test
  npm run build
If a failure is in a file you do not own, do not edit that file: stop and report the file, the line and the message.

Reply with what you changed and anything you could not do.
