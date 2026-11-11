# Range Ballistics

A local web app that shows where a rifle bullet goes. You enter the distance, wind, air, and load.
It shows what to dial on the scope, a dope table, and the flight path in a 3D range.

It is set up for a Tikka T3x CTR in .308 Win with a 16 inch barrel. Every value can be changed.

**This is a planning aid.** Real impacts and your own recorded dope are the authority.

![Scope view: 600 yd, 10 mph wind from 3 o'clock, correction dialled](docs/screenshots/scope-dialled.png)

## Run it

You need Node.js 24 or newer. The repo pins it in `.node-version`, which mise, fnm, nvm and nodenv all read.

```
npm install     # once
npm start       # opens the app in your browser
```

Nothing leaves your computer. The app makes no network requests and works offline. Your rifle,
loads, and last conditions are saved in the browser's local storage.

Other commands:

| Command | What it does |
|---|---|
| `npm test` | Runs every test, including the reference comparisons |
| `npm run typecheck` | Checks the TypeScript |
| `npm run build` | Builds a static copy into `dist/` |
| `npm run preview` | Serves the built copy |

## First use

The first time, the app walks you through four steps: confirm the rifle, pick a load, set the
muzzle velocity, and set your zero. You can skip it, and run it again from the top bar.

Three defaults are not measured on your rifle. The app marks each one until you replace it:

- **Muzzle velocity.** Makers measure velocity in 24 or 26 inch test barrels. A 16 inch barrel is
  slower. The app shows "estimated velocity" until you enter a chronograph average. This number
  changes the answer more than any other.
- **Barrel twist.** Tikka's own figures disagree (1:11 on the 2014 sheet, 1:10 on the current page)
  and neither lists a 16 inch barrel. The app starts at 1:11, marks it "unconfirmed", and shows how
  to measure it with a cleaning rod.
- **Sight height.** 1.75 inches is a typical figure. Measure yours from the centre of the bolt to
  the centre of the scope tube.

## Reading the screen

- **Left:** inputs. Click a field to see what it means.
- **Right:** the answer for your target distance. The large figure is what to dial, in your scope's
  unit. Under it are the clicks and the same correction in MIL, MOA, inches, and centimetres.
- **Centre:** the 3D range and the dope table.

The 3D range has four views:

| View | Shows |
|---|---|
| Range view | The whole range at true scale. Drag to orbit, scroll to zoom. |
| Scope view | A zoomed view down the line of sight with a MIL reticle, at true scale. With the correction dialled you see the bullet rise and come down onto the target. With it off, the red dot shows where the bullet would land, so you can read the hold off the reticle. |
| Side view | The arc of the shot. Drop is drawn larger than real so you can see it. The factor is shown on screen. |
| Top-down view | The wind curve. Drift is drawn larger than real. The factor is shown on screen. |

Scaling the drawing never changes the numbers.

The same shot (600 yd, 10 mph from 3 o'clock) in the other views:

| | |
|---|---|
| ![Range view](docs/screenshots/range-view.png) | ![Side view](docs/screenshots/side-view.png) |
| ![Top-down view](docs/screenshots/top-view.png) | ![Scope view with the correction off](docs/screenshots/scope-undialled.png) |

In the last picture the scope is still at its zero. The red dot is where the bullet would land:
4.75 MIL low and 1.5 MIL left on the reticle, the same figures the results panel gives.

## What the model includes

- Point-mass trajectory with G1 or G7 drag, solved with a fourth-order Runge-Kutta integrator at
  0.5 ms steps.
- Air density from temperature, station pressure, and humidity. Altitude can stand in for pressure
  (standard atmosphere).
- Air that thins or thickens along the flight on uphill and downhill shots.
- Wind from any clock direction, constant along the range.
- Uphill and downhill shots.
- Spin drift (Litz approximation from the Miller stability factor). It needs the bullet length.
- The distances where the bullet goes transonic (Mach 1.2) and subsonic.

## What it leaves out

- **BC change with velocity.** One BC is used for the whole flight. Hornady, for example, quotes a
  lower BC at lower speed, so real drop at long range is a little more than shown.
- **Aerodynamic jump** (the small vertical shift a crosswind causes).
- **Coriolis.** A small effect at these distances; not modelled.
- **Powder temperature.** Muzzle velocity does not change with temperature here.
- **Wind that changes along the range,** and vertical wind.
- **Anything past the transonic range** is less reliable. The app warns when the target is there.
- **A separate zero-day atmosphere.** The zero is solved in the current air.

## How it was checked

The solver is compared with two independent references every time the tests run.

1. **py-ballisticcalc 2.2.2**, a separate open-source solver. 19 shots (G1 and G7 loads, wind from
   several directions, altitude, heat, cold, humidity, 15 to 30 degree slopes, a 200 yd zero, spin
   drift), each compared at ten distances from 100 to 1000 yd: 190 points.
   Required: 0.05 MIL or 1%. Measured worst case: **0.007 MIL** elevation, **0.003 MIL** windage,
   0.07% velocity, 0.03% time of flight. Inside 600 yd the worst case is 0.002 MIL.
2. **Federal's published velocity tables** for Gold Medal 168 gr and 175 gr. With Federal's muzzle
   velocity and G1 BC, the solver matches the published velocity at 100 to 500 yd within 13 fps
   (0.75%).

Both references use the same kind of model as this app, so this shows the maths is right. It does
not show the model matches your rifle. Only shooting does that.

One thing to know: with the G7 BC that Sierra publishes (0.224 for the 168 gr), the solver runs up
to 43 fps slower at 500 yd than Federal's table, which follows the G1 figure. The app defaults to
G7 because it tracks boat-tail bullets better at long range. If your real drop is less than the app
shows, this is one place to look.

Thirteen sanity tests also run: drop grows with distance, the path crosses the line of sight at
the zero, a head or tail wind gives no drift, a full-value crosswind gives the most, denser or
colder air gives more drop, and so on.

## Where each number comes from

Every BC, bullet length, and muzzle velocity in the load list was read from the maker's own page
on 2026-11-10 and checked a second time against the page text. The app shows a "source" link next
to each value. A value the maker does not publish is left empty and never guessed.
The full list is in `research/sources.md`.

- The drag tables come from the py-ballisticcalc source and are generated by script. A checksum
  test fails if a single value changes.
- The barrel-length velocity figure (20.9 fps per inch) is from one Rifleshooter.com test of one
  barrel. It is not manufacturer data and is labelled that way in the app.

## Layout

```
src/solver/    physics. Pure functions, SI units, no browser code.
src/units/     unit conversion and formatting
src/data/      drag tables, load library, rifle defaults (all generated by script)
src/planner/   inputs, results, dope table, setup, saved state
src/scene/     the three.js range
tests/         unit tests and reference comparisons
scripts/       data generators and the task briefs used during the build
openspec/      the specification this was built from
```
