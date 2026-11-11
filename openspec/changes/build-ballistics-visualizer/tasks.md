## 1. Foundation (Scout)

- [x] 1.1 Scaffold Vite + TypeScript + Vitest + three.js; add lint and typecheck scripts
- [x] 1.2 Write `src/solver/types.ts` (the fixed solver contract)
- [x] 1.3 Generate `g1.json` and `g7.json` by script; add checksum and spot-value tests
- [x] 1.4 Generate reference cases with py-ballisticcalc into `tests/reference/`
- [x] 1.5 Fill `loads.json` and `rifle.json` from sourced research; add the source-present test

## 2. Solver (Qwen writes, Scout verifies)

- [x] 2.1 Atmosphere: density, speed of sound, altitude to pressure
- [x] 2.2 Drag table lookup and deceleration
- [x] 2.3 RK4 integrator with wind and range interpolation; vacuum and convergence tests
- [x] 2.4 Zero-angle solve and sight height
- [x] 2.5 Inclined shots
- [x] 2.6 Stability factor and spin drift, including the "length missing" path
- [x] 2.7 Derived outputs: energy, Mach, transonic and subsonic ranges
- [x] 2.8 Input validation with named fields
- [ ] 2.9 Optional Coriolis, default off
- [x] 2.10 Pass all reference cases within tolerance

## 3. Units (Qwen writes, Scout verifies)

- [x] 3.1 Conversions and MOA / MIL / click maths with round-trip tests
- [x] 3.2 Number formatting for both unit systems

## 4. Planner (Qwen writes, Scout verifies)

- [ ] 4.1 Input form with labels, help text, limits, and error states
- [ ] 4.2 Units switch that converts entered values
- [ ] 4.3 Load picker with source links, blank-value handling, and custom loads
- [ ] 4.4 Muzzle velocity field with the estimate label and chronograph flow
- [ ] 4.5 Results panel
- [ ] 4.6 Dope table, CSV export, print card
- [ ] 4.7 Local storage
- [ ] 4.8 Planning-aid notice in panel, CSV, and print

## 5. Scene (Qwen writes, Scout verifies)

- [ ] 5.1 Ground, firing line, distance markers, steel and paper targets
- [ ] 5.2 Wind flags driven by speed and direction
- [ ] 5.3 Trajectory path, line of sight, transonic colour change, exaggeration control
- [ ] 5.4 Animated round with play, pause, replay, speed, and timeline scrub readout
- [ ] 5.5 Orbit camera and presets

## 6. First run and acceptance

- [ ] 6.1 Four-step first-run setup, skippable and repeatable
- [ ] 6.2 Scout: fresh-install walkthrough in a clean browser profile, with screenshots
- [ ] 6.3 Scout: compare ten shots in the app against the reference solver by hand
- [ ] 6.4 Scout: offline check, print check, CSV check, frame-rate check
- [ ] 6.5 README: how to run, what the model includes and leaves out, where each number comes from
