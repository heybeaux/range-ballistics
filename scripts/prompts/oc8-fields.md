Write one pure TypeScript module and its Vitest test. It defines the planner's input fields and builds the form as an HTML string. No DOM access, no `document`. No `any`.

Files you own (create both, touch nothing else):
  src/planner/fields.ts
  tests/planner-fields.test.ts

Read first, in full: src/planner/types.ts. Read `unitFor`, `Quantity`, `UnitSystem` in src/units/units.ts, and `escapeHtml` in src/planner/view.ts (import it; do not rewrite it).

PURPOSE: every input the shooter can change is one row in a table (FIELDS). The same table drives the form HTML, parsing what the user typed, limits, and help text. State is always SI; the user types display units.

TYPES to export

export type Group = 'shot' | 'air' | 'load' | 'rifle' | 'table' | 'display';
export interface FieldDef {
  id: string;                 // also the HTML input id and name
  group: Group;
  label: string;
  help: string;
  kind: 'number' | 'select' | 'checkbox';
  path: string;               // 'a.b' path into AppState, for example 'conditions.targetRangeM'
  quantity?: Quantity;        // number fields that follow the unit system
  unitLabel?: string;         // number fields with a fixed unit (shown after the input)
  scale?: number;             // number fields without quantity: display = si * scale. Default 1.
  decimals?: number;          // overrides the unit's decimals
  minSi?: number;             // limits in SI, inclusive
  maxSi?: number;
  nullable?: boolean;         // empty input means null
  options?: Array<{ value: string; label: string }>;   // select fields
}
export type ParseResult = { ok: true; value: number | null } | { ok: false; message: string };

EXPORT const FIELDS: FieldDef[] with exactly these rows, in this order.
(D2R = Math.PI / 180. "q:" = quantity. Limits are SI.)

id | group | kind | path | unit | limits | label | help
targetRange | shot | number | conditions.targetRangeM | q: range | 10..1500 | Target distance | How far away the target is.
windSpeed | shot | number | conditions.windSpeedMps | q: windSpeed | 0..30 | Wind speed | Average wind between you and the target.
windClock | shot | number | conditions.windClock | unitLabel "o'clock", decimals 1 | 0.5..12 | Wind direction | Where the wind comes from, as a clock face. 12 is from the target toward you, 3 is from your right, 6 is from behind you, 9 is from your left.
shotAngle | shot | number | conditions.shotAngleRad | unitLabel "degrees", scale 180 / Math.PI, decimals 1 | -45*D2R..45*D2R | Shot angle | Uphill is positive, downhill is negative. Use 0 on a flat range.
temperature | air | number | conditions.temperatureK | q: temperature | 233.15..323.15 | Temperature | Air temperature at the firing line.
pressureMode | air | select | conditions.pressureMode | options station="Station pressure", altitude="Altitude (estimate)" | | Air pressure from | Station pressure is the actual pressure where you are, from a Kestrel or phone barometer. If you only know your altitude, the app estimates the pressure from a standard atmosphere.
pressure | air | number | conditions.pressurePa | q: pressure | 50000..110000 | Station pressure | The actual air pressure where you are standing. Not the sea-level figure from a weather report.
altitude | air | number | conditions.altitudeM | q: altitude | -400..5000 | Altitude | Height above sea level.
humidity | air | number | conditions.relativeHumidity | unitLabel "%", scale 100, decimals 0 | 0..1 | Humidity | Relative humidity. It has a small effect.
muzzleVelocity | load | number | load.muzzleVelocityMps | q: velocity | 100..1500 | Muzzle velocity | Bullet speed at the muzzle. The best value is the average from your own chronograph.
velocityMeasured | load | checkbox | load.velocityMeasured | | | This is my chronograph average | Tick this once you have measured the velocity in your own rifle.
bulletMass | load | number | load.bulletMassKg | q: mass | 0.001..0.05 | Bullet weight | Printed on the ammunition box, in grains.
dragModel | load | select | load.dragModel | options G7="G7 (boat-tail match bullets)", G1="G1 (flat-base bullets)" | | Drag model | Which standard bullet shape the BC is measured against. Use G7 for long boat-tail match bullets when the maker publishes it.
bcG7 | load | number | load.bcG7 | decimals 3, nullable | 0.05..1.2 | G7 BC | Ballistic coefficient against the G7 shape. Higher means less drag.
bcG1 | load | number | load.bcG1 | decimals 3, nullable | 0.05..1.2 | G1 BC | Ballistic coefficient against the G1 shape. Higher means less drag.
bulletLength | load | number | load.bulletLengthM | q: smallLength, decimals 3, nullable | 0.005..0.06 | Bullet length | Length of the bullet alone, not the cartridge. Needed for spin drift. Leave empty if you do not know it.
spinDrift | load | checkbox | spinDrift | | | Include spin drift | A spinning bullet drifts slightly toward the direction of its twist. Needs the bullet length.
zeroRange | rifle | number | rifle.zeroRangeM | q: range | 10..500 | Zero distance | The distance where your point of aim and point of impact meet.
sightHeight | rifle | number | rifle.sightHeightM | q: smallLength, decimals 2 | 0.01..0.15 | Sight height | Centre of the scope above the centre of the bore.
twist | rifle | number | rifle.twistM | q: twist | 0.1..0.6 | Barrel twist | Distance the rifling takes to make one full turn. A 1:11 barrel is 11 inches.
twistDirection | rifle | select | rifle.twistDirection | options right="Right-hand", left="Left-hand" | | Twist direction | Almost all factory rifles are right-hand.
twistConfirmed | rifle | checkbox | rifle.twistConfirmed | | | I have measured or confirmed this twist | Tick this once you have checked the twist on your own barrel.
angleUnit | rifle | select | rifle.angleUnit | options MIL="MIL", MOA="MOA" | | Scope adjusts in | The unit marked on your scope turrets.
clickValue | rifle | number | rifle.clickValue | decimals 3 | 0.01..1 | One click equals | How much one turret click moves the impact, in the unit above. Most MIL scopes are 0.1.
dopeStart | table | number | dope.startM | q: range | 10..1500 | Table from | First distance in the dope table.
dopeEnd | table | number | dope.endM | q: range | 10..1500 | Table to | Last distance in the dope table.
dopeStep | table | number | dope.stepM | q: range | 5..500 | Table step | Distance between rows.
unitSystem | display | select | unitSystem | options imperial="Imperial (yards, fps, °F)", metric="Metric (metres, m/s, °C)" | | Units | Switching units converts what you see. It does not change the shot.
targetType | display | select | targetType | options steel="Steel plate", paper="Paper target" | | Target | What to draw at the target distance.

FUNCTIONS to export

1. export function fieldById(id: string): FieldDef | undefined

2. export function getPath(state: AppState, path: string): unknown
   Split on '.', walk the object. Use a helper `isRecord(v: unknown): v is Record<string, unknown>`. Missing -> undefined.

3. export function setPath(state: AppState, path: string, value: number | string | boolean | null): AppState
   Returns a NEW state; never mutates the argument. Paths have 1 or 2 parts.
   Implement with a JSON round trip to stay type-safe without `any`:
     const copy: unknown = JSON.parse(JSON.stringify(state)); walk `copy` with isRecord, set the last key, then `return copy as AppState;` (this one `as` is allowed).

4. export function unitLabelFor(def: FieldDef, state: AppState): string
   def.quantity set -> unitFor(def.quantity, state.unitSystem).label.
   def.id === 'clickValue' -> state.rifle.angleUnit.
   else def.unitLabel ?? ''.

5. export function displayValue(def: FieldDef, state: AppState): string
   For kind 'number' only. v = getPath(state, def.path). If v is not a finite number -> ''.
   quantity set: u = unitFor(quantity, system); (u.toDisplay(v)).toFixed(def.decimals ?? u.decimals).
   else: (v * (def.scale ?? 1)).toFixed(def.decimals ?? 0).
   Then strip a negative zero: if parseFloat(text) === 0, return (0).toFixed(the same decimals).

6. export function parseInput(def: FieldDef, text: string, system: UnitSystem): ParseResult
   For kind 'number'. t = text.trim().
   t === '' -> def.nullable ? { ok: true, value: null } : { ok: false, message: 'Enter a value.' }
   n = Number(t); not finite -> { ok: false, message: 'Enter a number.' }
   si = quantity set ? unitFor(quantity, system).fromDisplay(n) : n / (def.scale ?? 1)
   If si < minSi - 1e-9 or si > maxSi + 1e-9 -> { ok: false, message: `Must be between ${lo} and ${hi}${unit}.` } where lo and hi are the limits shown in display units with the same decimals rule as displayValue, and unit is ' ' + label when the label is not empty. (For quantity fields label = unitFor(...).label; else def.unitLabel ?? ''.)
   Else { ok: true, value: si }.

7. export function applyField(state: AppState, def: FieldDef, value: number | string | boolean | null): AppState
   next = setPath(state, def.path, value). Then:
   - def.id 'bcG1', 'bcG7', 'bulletLength': set next.load.origin.bcG1 / bcG7 / bulletLengthM to 'user' (next is already a fresh copy, so assigning on it is fine).
   - def.id 'muzzleVelocity': set next.load.velocityMeasured = false when the value differs from state.load.muzzleVelocityMps by more than 0.01.
   Return next.

8. export function fieldHtml(def: FieldDef, state: AppState, error: string | undefined): string
   id = def.id. Wrapper: <div class="field{error ? ' has-error' : ''}" data-field="{id}"> ... </div>
   number:   <label for="{id}">{label}</label><span class="input-row"><input type="text" inputmode="decimal" id="{id}" name="{id}" value="{displayValue}" autocomplete="off"><span class="unit">{unitLabelFor}</span></span>
   select:   <label for="{id}">{label}</label><select id="{id}" name="{id}"> one <option value="{value}"{ selected when String(getPath(state, path)) === value}>{label}</option> per option </select>
   checkbox: <label class="check"><input type="checkbox" id="{id}" name="{id}"{ checked when getPath(...) === true}> {label}</label>
   then always: <p class="help">{help}</p>
   then when error: <p class="error" role="alert">{error}</p>
   Escape label, help, error, option labels, and values with escapeHtml.

9. export const GROUP_TITLES: Record<Group, string> = { shot: 'The shot', air: 'The air', load: 'Your load', rifle: 'Your rifle', table: 'Dope table', display: 'Display' };

10. export function formHtml(state: AppState, errors: Record<string, string>): string
   For each group in the order shot, air, load, rifle, table, display:
   <fieldset class="group" data-group="{group}"><legend>{title}</legend> the fieldHtml of each field in that group, in FIELDS order </fieldset>
   Skip the 'pressure' field when conditions.pressureMode is 'altitude', and skip the 'altitude' field when it is 'station'.

TESTS in tests/planner-fields.test.ts. Use `defaultState` from '../src/planner/storage' for a state.

Write exactly these tests:
 1. FIELDS has 29 rows and every id is unique. Every 'number' field has minSi and maxSi with minSi < maxSi. Every 'select' field has at least 2 options. Every field has a non-empty label and help.
 2. Every FIELDS path resolves in defaultState(): getPath(defaultState(), def.path) is not undefined, for every field.
 3. displayValue in imperial for defaultState(): targetRange '300', windSpeed '5', windClock '3.0', temperature '59', pressure '29.92', humidity '50', muzzleVelocity '2650', bulletMass '168', bcG7 '0.224', sightHeight '1.75', twist '11.0', zeroRange '100', clickValue '0.100', shotAngle '0.0', dopeStep '50'.
 4. displayValue in metric (state.unitSystem 'metric'): targetRange '274', temperature '15', pressure '1013', muzzleVelocity '808'.
 5. displayValue of bulletLength when load.bulletLengthM is null is ''.
 6. parseInput(targetRange, '600', 'imperial') is ok with value 548.64 within 1e-9. parseInput(targetRange, '600', 'metric') is ok with value 600.
 7. parseInput(targetRange, '', 'imperial') is { ok: false, message: 'Enter a value.' }. parseInput(targetRange, 'abc', 'imperial') is { ok: false, message: 'Enter a number.' }.
 8. parseInput(targetRange, '5', 'imperial') is not ok and its message is 'Must be between 11 and 1640 yd.'. parseInput(targetRange, '5000', 'metric') message is 'Must be between 10 and 1500 m.'.
 9. parseInput(bcG7, '', 'imperial') is { ok: true, value: null }. parseInput(bcG7, '0.243', 'imperial') is ok with value 0.243.
10. parseInput(humidity, '50', 'imperial') is ok with value 0.5 within 1e-12. parseInput(shotAngle, '10', 'imperial') is ok with value 10 * Math.PI / 180 within 1e-12. parseInput(windClock, '13', 'imperial') is not ok.
11. Round trip: for every 'number' field whose displayValue for defaultState() is not '', parseInput(def, displayValue(def, s), 'imperial') is ok.
12. setPath does not mutate: s = defaultState(); n = setPath(s, 'conditions.targetRangeM', 500); n.conditions.targetRangeM is 500; s.conditions.targetRangeM is 274.32; n is not s. setPath(s, 'unitSystem', 'metric').unitSystem is 'metric'.
13. applyField(bcG7, 0.25): load.bcG7 0.25 and load.origin.bcG7 'user'; load.origin.bcG1 still 'library'.
14. applyField(muzzleVelocity, 760) on a state with velocityMeasured true sets velocityMeasured false. Applying the same velocity it already has keeps velocityMeasured true.
15. fieldHtml(targetRange, defaultState(), undefined) contains 'id="targetRange"', 'value="300"', '<span class="unit">yd</span>', 'How far away the target is.', and does not contain 'class="error"'.
16. fieldHtml(targetRange, defaultState(), 'Enter a value.') contains 'has-error' and '<p class="error" role="alert">Enter a value.</p>'.
17. fieldHtml(dragModel, defaultState(), undefined) contains '<option value="G7" selected>'. fieldHtml(velocityMeasured, ...) contains 'type="checkbox"' and does not contain ' checked'. fieldHtml(spinDrift, ...) contains ' checked'.
18. fieldHtml(clickValue, defaultState(), undefined) contains '<span class="unit">MIL</span>'.
19. formHtml(defaultState(), {}) contains 6 '<fieldset'; contains '<legend>The shot</legend>'; contains 'id="pressure"'; does not contain 'id="altitude"'. With conditions.pressureMode 'altitude' it contains 'id="altitude"' and not 'id="pressure"'.
20. formHtml(defaultState(), { windSpeed: 'Enter a number.' }) contains 'Enter a number.' exactly once.

If a test fails, check your code against this task first. Do not edit any file you do not own. If you think the task itself is wrong, leave the test failing and say which and why.

Finish by running `npm run typecheck` and `npm test`. Reply with the test count and anything you left failing.
