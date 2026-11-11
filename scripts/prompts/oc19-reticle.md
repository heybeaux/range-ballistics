Write one pure TypeScript module and its Vitest test: scope reticles as data, and a small function that draws them. No DOM access (the drawing function takes a canvas-like object). No three.js. No `any`.

Files you own (create both, touch nothing else):
  src/scene/reticle.ts
  tests/scene-reticle.test.ts

Read first: the ScopeProfile and ReticleId types in src/planner/types.ts, and AngleUnit in src/units/units.ts. This module does not depend on the rest of the planner. Other parts of the project do not typecheck at the moment; that is expected and NOT your job. Check only your two files.

PURPOSE: the scope view must show the shooter's own reticle so a hold can be read straight off it. A reticle is a list of shapes in the reticle's own angle unit (MRAD for MIL reticles, MOA for MOA reticles). The drawing function turns the shapes into canvas calls at a given pixels-per-unit.

COORDINATES: x = right of centre, y = BELOW centre (so holdover marks, which are below the centre, have positive y). Units are MRAD or MOA.

TYPES to export

export type ReticleShape =
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; width: number }
  | { kind: 'dot'; x: number; y: number; diameter: number }
  | { kind: 'text'; x: number; y: number; text: string; size: number; align: 'left' | 'center' | 'right' };

export interface Reticle {
  id: ReticleId;
  unit: AngleUnit;
  name: string;
  /** How far the pattern reaches from centre, in units. */
  extent: number;
  shapes: ReticleShape[];
}

/** The part of CanvasRenderingContext2D this module uses. A real context satisfies it. */
export interface ReticleCanvas {
  strokeStyle: string | CanvasGradient | CanvasPattern;
  fillStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;
  fill(): void;
  fillText(text: string, x: number, y: number): void;
}

FUNCTIONS to export

1. export function unitRad(unit: AngleUnit): number          // 'MIL' -> 0.001; 'MOA' -> Math.PI / 10800

2. export function scopeFovAt(scope: ScopeProfile, magnification: number): number
   The angle across the lens at a magnification, from the two published ends. Makers' figures do not scale exactly with 1/magnification, so interpolate between the two published ends in 1/magnification:
   m = magnification clamped to scope.magMin..scope.magMax. If magMax <= magMin return scope.fovAtMinRad.
   t = (1 / m - 1 / scope.magMin) / (1 / scope.magMax - 1 / scope.magMin)
   return scope.fovAtMinRad + t * (scope.fovAtMaxRad - scope.fovAtMinRad)

3. export function reticlePxPerUnit(scope: ScopeProfile, magnification: number, lensDiameterPx: number, unit: AngleUnit): number
   Pixels per reticle unit when the lens circle is lensDiameterPx across.
   First focal plane: the reticle scales with the image: lensDiameterPx / scopeFovAt(scope, magnification) * unitRad(unit).
   Second focal plane: the reticle keeps one size on screen, true at scope.trueSubtensionMag (use scope.magMax when that is null): lensDiameterPx / scopeFovAt(scope, thatMag) * unitRad(unit).

4. export function subtensionsAreTrue(scope: ScopeProfile, magnification: number): boolean
   First focal plane -> true. Second focal plane -> true only when magnification is within 0.05 of (scope.trueSubtensionMag ?? scope.magMax).

5. export function genericReticle(unit: AngleUnit): Reticle
   id 'generic-mil' or 'generic-moa'. name 'Generic MIL crosshair' / 'Generic MOA crosshair'.
   MIL: extent 20, step 1, numberEvery 5.   MOA: extent 60, step 2, numberEvery 10.
   Shapes:
   - four arms, each a line of width (MIL 0.03, MOA 0.1), from gap to extent, where gap = step * 0.25: right (gap,0)-(extent,0), left, up, down.
   - a tick at every multiple of step from step to extent on all four arms. Tick length (across the arm) = step * 0.4, or step * 0.8 when the value is a multiple of numberEvery. Same line width as the arms.
   - a number at every multiple of numberEvery: on the right and left arms, text below the tick at (±v, step * 0.9), align 'center'; on the up and down arms, text to the right of the tick at (step * 0.7, ±v), align 'left'. size = step * 0.6. text = String(v).

6. export function ebr7cMrad(): Reticle
   Vortex EBR-7C MRAD. id 'ebr-7c-mrad', unit 'MIL', name 'Vortex EBR-7C MRAD', extent 13.
   Published sizes (use these constants): LINE = 0.03; CENTER_DOT = 0.04; DOT_SMALL = 0.06; DOT_LARGE = 0.09; BAR = 0.5.
   Build the shapes with loops. Compute tick positions as i * step from an integer i (never by adding 0.1 repeatedly), and round each position to 4 decimals.
   Helper: isWhole(v) = Math.abs(v - Math.round(v)) < 1e-6; isHalf(v) = isWhole(v * 2) && !isWhole(v).

   a. Centre dot: { kind 'dot', x 0, y 0, diameter CENTER_DOT }.
   b. Horizontal fine line, both sides: from |x| = 0.1 to 9.0 at y = 0, width LINE.
   c. Horizontal thick bar, both sides: from |x| = 9.0 to 13 at y = 0, width BAR. Plus a fine tick at |x| = 10.0 from y = -0.5 to y = 0.5, width LINE.
   d. Horizontal inner section, for |x| = 0.2, 0.4, ... 4.0 (step 0.2), both sides:
        whole MRAD: a line from y = -0.5 to y = 0.5, width LINE.
        otherwise: a tick ABOVE the line only, from y = -0.25 to y = 0, width LINE.
      Also at each half MRAD |x| = 0.5, 1.5, 2.5, 3.5: a tick BELOW the line from y = 0 to y = 0.3, width 0.06.
      Numbers 1, 2, 3, 4 at (±v, -0.75), align 'center', size 0.35.
   e. Horizontal outer section, for |x| = 4.1, 4.2, ... 8.0 (step 0.1), both sides, ticks centred on the line:
        whole MRAD: y from -0.25 to 0.25; half MRAD: -0.15 to 0.15; otherwise: -0.1 to 0.1. Width LINE.
      Numbers 6 and 8 at (±v, -0.75), align 'center', size 0.35.
   f. Upper vertical (y negative): fine line from y = -0.1 to y = -10 at x = 0, width LINE. A separate fine line from y = -10.5 to y = -13.
        hashes at y = -0.5, -1.0, ... -10.0 (step 0.5): whole MRAD x from -0.25 to 0.25; half MRAD x from -0.15 to 0.15.
        fine ticks at y = -4.1, -4.2, ... -9.9 (step 0.1), skipping whole and half MRAD: x from -0.1 to 0.1.
        Numbers 2, 4, 6, 8, 10 at (0.45, -v), align 'left', size 0.35.
   g. Lower vertical (y positive): fine line from y = 0.1 to y = 11 at x = 0, width LINE. Thick post from y = 11 to y = 13, width BAR.
        hashes at y = 0.5, 1.0, ... 10.0: whole MRAD x from -0.2 to 0.2; half MRAD x from -0.1 to 0.1.
   h. Wind dots. For each row y = 1, 2, ... 10: the row reaches reach = 2, 2, 3, 3, 4, 4, 5, 5, 6, 6 MRAD each side.
        dots at x = ±0.4, ±0.6, ... ±reach (step 0.2). Diameter DOT_LARGE when |x| is a whole MRAD, else DOT_SMALL.
        the row number at both ends: text String(y) at (reach + 0.35, y) align 'left' and at (-(reach + 0.35), y) align 'right', size 0.3.

7. export function reticleFor(id: ReticleId): Reticle
   'ebr-7c-mrad' -> ebr7cMrad(); 'generic-moa' -> genericReticle('MOA'); 'generic-mil' -> genericReticle('MIL'). Exhaustive switch.

8. export function drawReticle(ctx: ReticleCanvas, reticle: Reticle, cx: number, cy: number, pxPerUnit: number, color: string): void
   Sets ctx.strokeStyle and ctx.fillStyle to color. For each shape (screen x = cx + x * pxPerUnit, screen y = cy + y * pxPerUnit):
   - line: ctx.lineWidth = Math.max(1, width * pxPerUnit); beginPath; moveTo; lineTo; stroke.
   - dot: radius = Math.max(0.75, (diameter * pxPerUnit) / 2); beginPath; arc(x, y, radius, 0, Math.PI * 2); fill.
   - text: px = size * pxPerUnit; skip the text when px < 7; otherwise font = `${Math.round(Math.min(px, 16))}px system-ui, sans-serif`; textAlign = align; textBaseline = 'middle'; fillText.
   Does nothing when pxPerUnit <= 0.

TESTS in tests/scene-reticle.test.ts. Use this scope (copy unchanged):

```ts
const venom: ScopeProfile = { libraryId: 'v', name: 'Venom', magMin: 5, magMax: 25, focalPlane: 'first', fovAtMinRad: 0.070637, fovAtMaxRad: 0.015666, trueSubtensionMag: null, reticleId: 'ebr-7c-mrad', availableElevation: 19, note: null };
```

and a recording fake for ReticleCanvas that pushes every call (name and arguments) into an array and stores the properties it is given.

Write exactly these tests:
 1. unitRad('MIL') is 0.001; unitRad('MOA') is Math.PI / 10800 within 1e-15.
 2. scopeFovAt(venom, 5) is 0.070637; scopeFovAt(venom, 25) is 0.015666; scopeFovAt(venom, 1) is 0.070637 (clamped); scopeFovAt(venom, 99) is 0.015666.
 3. scopeFovAt(venom, 10) is between the two ends and equals 0.070637 + ((1/10 - 1/5) / (1/25 - 1/5)) * (0.015666 - 0.070637) within 1e-12. It decreases as magnification rises: values at 5, 8, 12, 18, 25 are strictly decreasing.
 4. First focal plane: reticlePxPerUnit(venom, 25, 480, 'MIL') is 480 / 0.015666 * 0.001 within 1e-9 (about 30.6 px per MRAD); at 5x it is 480 / 0.070637 * 0.001 (about 6.8). The reticle grows with magnification.
 5. Second focal plane: with { ...venom, focalPlane: 'second', trueSubtensionMag: 25 }, reticlePxPerUnit at 5x equals reticlePxPerUnit at 25x.
 6. subtensionsAreTrue(venom, 7) is true. For the second-focal-plane scope: true at 25, false at 10.
 7. ebr7cMrad(): id 'ebr-7c-mrad', unit 'MIL', extent 13. Exactly one dot of diameter 0.04, at (0, 0).
 8. Wind dots: counting dots with y >= 1: 380 in total. On row y = 1: 18 dots, the outermost at |x| = 2.0. On row y = 10: 58 dots, the outermost at |x| = 6.0. No dot on any row has |x| < 0.39.
 9. Dot sizes: every dot with y >= 1 has diameter 0.09 when its |x| is a whole number (within 1e-6) and 0.06 otherwise. The only diameters used anywhere are 0.04, 0.06 and 0.09.
10. Line widths: every line has width 0.03, 0.06 or 0.5. There are exactly 3 lines of width 0.5 (two side bars and the bottom post). The bottom post runs from y = 11 to y = 13 at x = 0.
11. No fine line crosses the centre: every line that lies on y = 0 with width 0.03 and spans more than 1 unit has Math.min(|x1|, |x2|) >= 0.1 - 1e-9; the same for lines on x = 0 with y.
12. Whole-MRAD hash on the right arm: there is a line with x1 = x2 = 1 running from y = -0.5 to y = 0.5. A 0.2 tick: there is a line with x1 = x2 = 0.2 from y = -0.25 to y = 0. Outer scale: a line at x1 = x2 = 4.1 from y = -0.1 to y = 0.1, and one at x = 6 from y = -0.25 to y = 0.25.
13. Symmetry: for every 'line' and 'dot' shape there is a mirror shape with x negated (x, x1, x2 -> -x) within 1e-9.
14. Positions are clean: every x, y, x1, y1, x2, y2 in the reticle equals itself rounded to 4 decimals (no 0.30000000000000004).
15. Numbers: the texts are exactly these, counted: '1','2','3','4','6','8' twice each from the horizontal arms plus row numbers; check instead that there are 2 texts '6' with y < 0 and y > -1 (horizontal), 1 text '6' with x between 0.4 and 0.5 (upper vertical, y = -6), and 2 texts '6' with y = 6 (wind row ends at |x| = 4.35).
16. genericReticle('MIL'): id 'generic-mil', extent 20; has a tick line at x1 = x2 = 5 that is 0.8 long and one at x = 3 that is 0.4 long; contains the text '5' and '20'; no dots.
17. genericReticle('MOA'): id 'generic-moa', unit 'MOA', extent 60; contains the text '10' and '60'.
18. reticleFor('ebr-7c-mrad').id is 'ebr-7c-mrad'; reticleFor('generic-mil').unit is 'MIL'; reticleFor('generic-moa').unit is 'MOA'.
19. drawReticle with the fake canvas, ebr7cMrad(), cx 400, cy 300, pxPerUnit 30, color '#000': the number of arc calls equals the number of dots (381); the number of stroke calls equals the number of lines; the centre dot's arc is at (400, 300); the dot at reticle (2, 1) is drawn at (460, 330).
20. drawReticle minimum sizes: at pxPerUnit 5 every lineWidth set is >= 1, every arc radius is >= 0.75, and no fillText is called (text would be under 7 px). At pxPerUnit 30 fillText is called at least 20 times.
21. drawReticle with pxPerUnit 0 makes no calls.

ACCEPTANCE (the whole project does not typecheck right now; check only your files)
- `npx tsc --noEmit 2>&1 | grep -E "src/scene/reticle|tests/scene-reticle"` prints nothing.
- `npx vitest run tests/scene-reticle.test.ts` passes.
If an expectation fails and your code matches the definition, leave the test failing and report the actual value. Do not edit any other file.

Reply with the test count and anything left failing.
