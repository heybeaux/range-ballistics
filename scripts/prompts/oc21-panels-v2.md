The planner contract changed (src/planner/types.ts). Update the source panels and their tests, and add the panels for rifles, cartridges and scopes. Modules after this one (view, setup, main) are still on the old contract and will not typecheck yet; that is NOT your job here.

Files you own (edit only these):
  src/planner/panels.ts
  tests/planner-panels.test.ts

Read first, in full: src/planner/types.ts, src/planner/panels.ts, tests/planner-panels.test.ts, tests/helpers/fixtures.ts, src/data/rifle.json, src/data/scopes.json, and the exported signatures of src/planner/model.ts and src/planner/storage.ts (use `library`, `scopeLibrary`, `cartridgeById`, `loadsForCartridge`, `velocityForBarrel`, `activeState`, `defaultState`, `addProfile`, `loadSaved`).

All text from state, the library, or a source goes through escapeHtml. Keep the existing helper link(url) -> <a href="…" target="_blank" rel="noopener">source</a>.

CHANGES TO EXISTING FUNCTIONS

1. loadPickerHtml(state): list only the loads of the rifle's cartridge (loadsForCartridge(state.rifle.cartridgeId)), then the custom loads, as now. When the cartridge has no library loads, the list is just the "Custom (not saved)" option (when it applies) and the custom loads, and the help text becomes: "There are no library loads for this cartridge. Enter your load's values below."

2. loadSourcesHtml(state): the list now has five lines, in this order: G7 BC, G1 BC, RA4 BC, Bullet length, Published velocity.
   - 'RA4 BC' uses lib.bcRA4 and origin.bcRA4, text value.toFixed(3). Leave the RA4 line OUT entirely when lib.bcRA4.value is null and origin.bcRA4 is 'library' (most loads have none).
   - On the 'G1 BC' line, when lib.bcModelStated is false and the value is shown from the library, add after the read date: " Drag model not stated by the maker; treated as G1."
   - 'Bullet length': show in inches to 3 decimals or millimetres to 2 decimals as now.
   - 'Published velocity': when lib.velocityByBarrel has entries, the text lists every pair: `${format(v)} from a ${inches} inch barrel` joined with '; '. Otherwise as now.

3. velocityNoteHtml(state): rewrite around velocityForBarrel.
   Measured -> <p class="velocity-note measured">Measured: your chronograph average. If you change the barrel or the ammunition lot, measure again.</p>
   Otherwise <p class="velocity-note estimate"><strong>Estimate, not measured in your rifle.</strong> {text} Shoot over a chronograph and enter your average.</p>
   lib = library load for state.load.libraryId; c = cartridgeById(lib.cartridgeId); r = velocityForBarrel(lib, rifle.barrelLengthM, c); barrelIn = (rifle.barrelLengthM / 0.0254).toFixed(0); v = lib.publishedVelocityMps.value.
   {text} by case:
   - no lib, or r.basis 'none': 'There is no published velocity for this load.'
   - 'published-barrel': `The maker publishes ${format(r.velocityMps)} for this load from a ${barrelIn} inch barrel, the same as yours.`
   - 'interpolated': `The maker publishes this load from two barrel lengths. ${format(r.velocityMps)} is the straight-line figure between them for your ${barrelIn} inch barrel.`
   - 'nearest-barrel': `The maker publishes this load from other barrel lengths only. ${format(r.velocityMps)} is the figure for the nearest one, not for your ${barrelIn} inch barrel.`
   - 'estimated': `The maker publishes ${format(v)} from a ${testIn} inch test barrel. Less ${format(loss * 0.0254, 'velocity', sys)} per inch for your ${barrelIn} inch barrel gives ${format(r.velocityMps)}. ${escaped c.velocityLossNote} ${link(c.velocityLossMpsPerM.sourceUrl) when not null}`
   - 'published' with lib.testBarrelM null: `The maker publishes ${format(v)} and does not state its test barrel, so no barrel-length correction was made. Expect less from a short barrel.`
   - 'published' with a test barrel: `The maker publishes ${format(v)} from a ${testIn} inch test barrel. No barrel-length correction was made. ${escaped c.velocityLossNote when c exists}`
   (format = format(x, 'velocity', state.unitSystem).)

4. twistNoteHtml(state): the Tikka wording and the two Tikka sources apply only to the default rifle. Show them only when state.rifle.cartridgeId === '308-win' && state.rifle.name === rifleJson.name. For any other rifle the unconfirmed panel is <div class="twist-note unconfirmed"><p><strong>Unconfirmed.</strong> {escaped rifleJson.genericTwistNote}</p></div> with no list. The confirmed case is unchanged.

NEW FUNCTIONS

5. export function cartridgeNoteHtml(state: AppState): string
   c = cartridgeById(state.rifle.cartridgeId).
   No c: <p class="cartridge-note">Cartridge not in the library. Enter your own load values.</p>
   With c: <p class="cartridge-note">Cartridge: <strong>{c.name}</strong></p> and, when c.safetyNote is not null:
   <blockquote class="safety-note"><p><strong>Safety, in the standards body's words:</strong> {escaped c.safetyNote.text}</p><p>{link(c.safetyNote.sourceUrl)}</p></blockquote>

6. export function rifleBarHtml(saved: SavedState): string
   <label for="riflePicker">Rifle</label>
   <select id="riflePicker" name="riflePicker">{one <option value="{id}"{ selected when id === saved.activeId}>{escaped state.rifle.name}</option> per profile}</select>
   <button type="button" id="addRifle">Add rifle</button>
   <button type="button" id="duplicateRifle">Duplicate</button>
   <button type="button" id="deleteRifle"{ disabled when there is only one profile}>Delete</button>

7. export function addRifleDialogHtml(): string
   <div class="setup-backdrop"><div class="setup-dialog" role="dialog" aria-modal="true" aria-labelledby="addRifleTitle">
     <h2 id="addRifleTitle">Add a rifle</h2>
     <p class="setup-intro">Each rifle keeps its own load, zero, scope and conditions. Setup runs next so you can check the defaults.</p>
     <div class="field"><label for="newRifleName">Rifle name</label><input type="text" id="newRifleName" value="My rifle" autocomplete="off"></div>
     <div class="field"><label for="newRifleCartridge">Cartridge</label><select id="newRifleCartridge">{one <option value="{id}">{escaped name}</option> per library cartridge, then <option value="other">Other (enter your own load)</option>}</select></div>
     <div class="setup-actions"><button type="button" id="addRifleCancel">Cancel</button><button type="button" id="addRifleConfirm" class="primary">Add rifle</button></div>
   </div></div>

8. export function deleteRifleDialogHtml(name: string): string
   Same dialog frame, aria-labelledby "deleteRifleTitle": <h2 id="deleteRifleTitle">Delete this rifle?</h2><p class="setup-intro">"{escaped name}" and its loads, zero and conditions will be removed from this browser. This cannot be undone.</p> with buttons id="deleteRifleCancel" (Cancel) and id="deleteRifleConfirm" class="primary" (Delete rifle).

9. export function scopePanelHtml(state: AppState): string
   <div class="field" data-field="scopePicker"><label for="scopePicker">Scope</label><select id="scopePicker" name="scopePicker">
     {one <option value="lib:{libraryId}"{ selected when it equals state.rifle.scope.libraryId}>{escaped name}</option> per scopeLibrary entry}
     <option value="generic"{ selected when state.rifle.scope.libraryId is null}>Generic scope (enter your own figures)</option>
   </select><p class="help">Pick your scope so the scope view shows its reticle and field of view.</p></div>
   Then, when the rifle's scope is a library scope (find the LibraryScope by libraryId):
     <ul class="sources">{one <li>{escaped fact.text} {link(fact.sourceUrl)}</li> per fact}</ul>
     and when scope.note is not null: <p class="scope-note">{escaped note.text} {link(note.sourceUrl)}</p>
   When it is the generic scope: <p class="scope-note">Generic crosshair. One mark is 1 MIL (or 2 MOA). Enter your scope's figures below.</p>

TESTS (tests/planner-panels.test.ts)
Keep the existing tests, updated only where the contract or the new wording forces it (for example the default-state velocity note still contains 'does not state its test barrel' and 'Shoot over a chronograph'; 'Expect less from a 16 inch barrel' becomes 'Expect less from a short barrel'; the Hornady 80966 note still contains 'Less 21 fps per inch for your 16 inch barrel gives 2533 fps.' and the rifleshooter.com link). The load picker for defaultState() now has 10 library options (the .308 loads only).
Add (rimfire = activeState(addProfile(loadSaved(emptyStorage), '22-lr', 'Rimfire')); ar = the same for '556-nato', name 'AR'; use selectLibraryLoad to pick loads):
 17. loadPickerHtml(rimfire): 15 '<option value="lib:' and contains 'CCI Standard Velocity'; does not contain 'Federal Gold Medal 168'.
 18. loadPickerHtml for a rifle added with cartridge 'other': no '<option value="lib:'; contains 'Custom (not saved)' and 'There are no library loads for this cartridge'.
 19. loadSourcesHtml(rimfire) (CCI 32): contains 'G1 BC: 0.120', 'Drag model not stated by the maker; treated as G1.', 'G7 BC: not published by the maker'; does not contain 'RA4 BC'.
 20. loadSourcesHtml for 'eley-tenex': contains 'RA4 BC: 0.112', 'G1 BC: not published by the maker', 'Published velocity: not published by the maker'.
 21. loadSourcesHtml for 'pmc-556k' on ar: contains '2920 fps from a 16 inch barrel; 3100 fps from a 20 inch barrel'.
 22. velocityNoteHtml(ar with 'pmc-556k'): contains 'from a 16 inch barrel, the same as yours' and '2920 fps'.
 23. velocityNoteHtml for 'pmc-556k' with rifle.barrelLengthM 0.4572 (re-select the load after changing the barrel, or set muzzleVelocityMps yourself): contains 'straight-line figure between them for your 18 inch barrel' and '3010 fps'. With barrelLengthM 0.6096: contains 'nearest one, not for your 24 inch barrel' and '3100 fps'.
 24. velocityNoteHtml(ar with 'hornady-fr260') (20 inch test barrel, no figure for 5.56): contains 'The maker publishes 3060 fps from a 20 inch test barrel. No barrel-length correction was made.' and 'PMC'.
 25. velocityNoteHtml for 'eley-tenex': contains 'There is no published velocity for this load.'
 26. velocityNoteHtml measured: contains 'Measured: your chronograph average.' and 'measure again'.
 27. twistNoteHtml(defaultState()) still contains 'Tikka' and 2 '<li>'. twistNoteHtml(rimfire) contains 'Unconfirmed.' and 'cleaning rod', and does not contain 'Tikka' or '<li>'.
 28. cartridgeNoteHtml(defaultState()) contains '.308 Winchester' and no 'safety-note'. cartridgeNoteHtml(ar) contains '5.56x45 NATO', 'class="safety-note"', 'chambered in 223 Remington', and 'href="https://saami.org/faqs/"'. For an 'other' rifle: 'Cartridge not in the library'.
 29. rifleBarHtml: for one profile: one '<option', 'id="riflePicker"', 'id="addRifle"', and the delete button contains ' disabled'. For two profiles: two options, the active one has ' selected', and the delete button has no ' disabled'. A rifle name with '<' in it is escaped.
 30. addRifleDialogHtml(): contains 'role="dialog"', 'id="newRifleName"', 5 '<option' (4 cartridges and Other), 'id="addRifleConfirm"', 'id="addRifleCancel"'.
 31. deleteRifleDialogHtml('A <b>'): contains 'A &lt;b&gt;', 'id="deleteRifleConfirm"', 'cannot be undone'.
 32. scopePanelHtml(defaultState()): contains '<option value="lib:vortex-venom-5-25x56-ebr7c-mrad" selected>', 'Field of view 21.2 ft to 4.7 ft at 100 yd.', 'href="https://vortexoptics.', 'class="scope-note"', and 'for representation only'. scopePanelHtml(rimfire) (generic scope): contains '<option value="generic" selected>' and 'Generic crosshair'.

ACCEPTANCE (the whole project will NOT typecheck yet; check only your files)
- `npx tsc --noEmit 2>&1 | grep -E "src/planner/panels|tests/planner-panels"` prints nothing.
- `npx vitest run tests/planner-panels.test.ts` passes.
If an expectation fails and your code matches the definition, leave the test failing and report the actual value. Do not edit any other file.

Reply with the test count for your file and anything left failing.
