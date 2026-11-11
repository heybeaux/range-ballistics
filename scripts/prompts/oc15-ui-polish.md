UI polish pass. The app works; this makes it read like a finished product.

Files you own (edit only these):
  src/planner/view.ts
  tests/planner-view.test.ts
  src/planner/setup.ts
  tests/planner-setup.test.ts   (only if a changed order breaks an assertion; it should not)
  src/main.ts
  index.html
  src/styles.css

Read first: the files you own, and src/planner/types.ts.

## 1. Results: lead with what the shooter dials (src/planner/view.ts, correctionHtml)

New markup. u = state.rifle.angleUnit, a = angle in u, dir = direction word:
  <div class="correction">
    <h3>{title}</h3>
    <p class="dial"><strong>{a.toFixed(1)} {u} {dir}</strong></p>
    <p class="clicks">{c.clicks} clicks {dir} · exact {a.toFixed(2)} {u}</p>
    <p class="equiv">{c.mil.toFixed(2)} MIL · {c.moa.toFixed(2)} MOA · {inches} in · {cm} cm</p>
  </div>
When c.direction is 'none': <p class="dial"><strong>No correction</strong></p> and no .clicks line.
Keep using the same separator the file already uses between values.

Update tests/planner-view.test.ts test 2 to expect: '<h3>Elevation</h3>', '1.0 MIL up', '10 clicks up', 'exact 1.00 MIL', '3.44 MOA', '19.7 in', '50.0 cm'. Test 3 stays as it is.

## 2. Dope table: highlight the target row (view.ts, dopeTableHtml)

A row whose rangeM is within 0.5 m of state.conditions.targetRangeM gets <tr class="current">. Other rows stay <tr>.
Update test 12: count occurrences of '<tr' (without the closing bracket) and expect 12; and add: the HTML contains exactly one 'class="current"' for defaultState() (target 300 yd is a table row).

## 3. Wind indicator (view.ts)

export function windClockSvg(windClock: number, speedText: string): string
  A small clock face showing where the wind comes from. Returns:
  <svg class="wind-clock" viewBox="0 0 96 112" width="96" height="112" role="img" aria-label="Wind {escaped speedText} from {windClock} o'clock">
    <circle cx="48" cy="48" r="40" fill="rgba(20,23,26,0.72)" stroke="#e8eaed" stroke-width="1.5"/>
    <text x="48" y="18" class="wc-num">12</text><text x="82" y="52" class="wc-num">3</text><text x="48" y="86" class="wc-num">6</text><text x="14" y="52" class="wc-num">9</text>
    <g transform="rotate({windClock * 30} 48 48)">
      <line x1="48" y1="14" x2="48" y2="44" stroke="#4aa8ff" stroke-width="4" stroke-linecap="round"/>
      <path d="M48 52 L40 38 L56 38 Z" fill="#4aa8ff"/>
    </g>
    <circle cx="48" cy="48" r="3" fill="#e8eaed"/>
    <text x="48" y="106" class="wc-speed">{escaped speedText}</text>
  </svg>
  (The arrow starts at the rim where the wind comes from and points at the centre, where the shooter's line of fire is. 12 is toward the target.)
  When speedText is '' use 'No wind' for the bottom text.

Tests to add in planner-view.test.ts:
 16. windClockSvg(3, '10 mph') contains '<svg', 'rotate(90 48 48)', '>10 mph</text>', and 'aria-label="Wind 10 mph from 3 o&#39;clock"'.
 17. windClockSvg(12, '5 mph') contains 'rotate(360 48 48)'. windClockSvg(6, '') contains '>No wind</text>'.

## 4. Scene overlay (index.html, main.ts)

index.html: inside <div id="scene"> add <div id="hud"><div id="windHud"></div><div id="scaleHud"></div></div>.
main.ts, in renderOutputs():
  - #windHud innerHTML = windClockSvg(state.conditions.windClock, state.conditions.windSpeedMps < 0.05 ? '' : format(state.conditions.windSpeedMps, 'windSpeed', state.unitSystem))
  - #scaleHud text = exaggeration === 1 ? '' : `Drawn ${exaggeration}× larger than real`
The scene module appends its canvases to #scene; do not remove or reorder them.

## 5. Setup: notes next to their fields (src/planner/setup.ts, setupStepHtml)

Build the body field by field. Right after the field 'twistConfirmed' insert twistNoteHtml(state). Right after 'sightHeight' insert sightHeightNoteHtml(). Right after 'velocityMeasured' insert velocityNoteHtml(state). The 'load' step keeps loadPickerHtml + loadSourcesHtml. Nothing is appended at the end of the 'rifle' and 'velocity' steps any more.

## 6. index.html head

Add a favicon so the browser does not request a missing file:
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='12' fill='none' stroke='%23ffb000' stroke-width='3'/%3E%3Cpath d='M16 2v9M16 21v9M2 16h9M21 16h9' stroke='%23ffb000' stroke-width='3'/%3E%3C/svg%3E">

## 7. src/styles.css (append; these override earlier rules)

/* Sidebar: show a field's help only while that field is in use. Setup keeps all help visible. */
#form .help { display: none; }
#form .field:focus-within .help { display: block; }
#form .field { margin-bottom: 8px; }
/* Results */
#results h2 { font-size: 22px; margin: 10px 0 8px; }
.correction { border: 1px solid #333a42; }
.correction h3 { text-transform: uppercase; letter-spacing: 0.06em; font-size: 11px; }
.dial { font-size: 28px; line-height: 1.1; font-variant-numeric: tabular-nums; }
.dial strong { color: #ffb000; }
.clicks { margin: 4px 0 0; font-size: 14px; color: #e8eaed; font-variant-numeric: tabular-nums; }
dl.facts dd { font-variant-numeric: tabular-nums; }
/* Dope table */
table.dope tr.current td { background: #2b2410; color: #ffb000; font-weight: 600; }
table.dope tbody tr:hover td { background: #232a31; }
/* Scene overlay */
#hud { position: absolute; left: 10px; top: 10px; z-index: 3; pointer-events: none; display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.wind-clock .wc-num { fill: #9aa3ad; font: 600 10px system-ui, sans-serif; text-anchor: middle; }
.wind-clock .wc-speed { fill: #ffffff; font: 600 13px system-ui, sans-serif; text-anchor: middle; paint-order: stroke; stroke: rgba(0,0,0,0.75); stroke-width: 3px; }
#scaleHud { background: #ffb000; color: #14171a; font: 600 12px system-ui, sans-serif; padding: 3px 8px; border-radius: 4px; }
#scaleHud:empty { display: none; }
/* Buttons and focus */
button:focus-visible, input:focus-visible, select:focus-visible { outline: 2px solid #ffb000; outline-offset: 1px; }
#sceneBar button[data-camera] { min-width: 96px; }
#topbar { border-bottom: 1px solid #333a42; background: #1e2328; }
#rifleName { color: #9aa3ad; font-size: 13px; }

Finish by running `npm run typecheck`, `npm test`, and `npm run build`. All three must pass. Reply with what you changed and anything you could not do.
