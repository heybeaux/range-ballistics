# Build the ballistics visualizer

## Why

Beaux is starting target shooting with a Tikka T3x CTR in .308 Win with a 16" barrel. He wants to
enter shot conditions and see the bullet's likely flight in a 3D range scene, with the corrections
he would dial or hold. Most published load data assumes a 22–24" barrel, so generic tables overstate
his velocity. He needs a tool built around his own rifle and his own chronograph numbers.

## What Changes

- Add a local web app (no server, no account, nothing leaves the machine).
- Add a pure, UI-free point-mass ballistics solver (G1 and G7 drag, RK4) that can be tested alone.
- Add a small .308 match load library. Every value carries its manufacturer source. Unpublished
  values stay blank.
- Add a 3D range scene: firing line, distance markers, target, wind flags, trajectory path, and an
  animated round that can be replayed and scrubbed.
- Add a shot planner: inputs, a results panel, and a dope table that exports to CSV and prints.
- Add first-run setup and plain-language help, so a person who has never used a ballistics
  calculator can get a usable answer.
- State on screen and on every printout that the app is a planning aid. Real impacts and the
  shooter's own dope are the authority.

## Capabilities

### New Capabilities

- `ballistics-solver`: atmosphere, drag, integration, zero solve, wind, inclined shots, spin drift,
  optional Coriolis, and derived outputs.
- `load-library`: seeded rifle profile and .308 match loads with recorded sources.
- `shot-planner`: inputs, units, results panel, dope table, export, print, first-run setup, saved
  state, and the planning-aid notice.
- `range-scene`: the 3D scene, trajectory, animation, and camera.

### Modified Capabilities

None. This is a new project.

## Impact

- New repository at `~/projects/ballistics-visualizer`. No other project changes.
- Dependencies: Vite, TypeScript, three.js, Vitest. All run locally.
- Out of scope for this change: muzzle-velocity change with powder temperature, aerodynamic jump,
  custom drag curves, multiple rifles, mobile layout, and hosting.
