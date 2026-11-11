# Add rifle profiles, more cartridges, and the shooter's own scope

## Why

The app is fixed to one rifle and one cartridge. Barrel length and bullet diameter are stored but
cannot be edited. The scope view draws a generic crosshair, so a hold read off it has to be
translated to the shooter's real reticle. Beaux shoots a Vortex Venom 5-25x56 FFP with the EBR-7C
MRAD reticle and wants the scope view to match it, and wants the app to work for other calibres
and barrel lengths.

## What Changes

- Make barrel length and bullet diameter editable.
- Add rifle profiles: save several rifles and switch between them. Each has its own cartridge,
  barrel, twist, sight height, zero, scope, loads, and last conditions.
- Tag every library load with its cartridge. The load picker shows the loads for the selected
  rifle's cartridge. Add cartridges one at a time, each with the same sourcing rule as .308.
- Make the barrel-length velocity estimate per cartridge. No sourced figure means no estimate.
- Add a scope profile to each rifle: magnification range, focal plane, field of view, click value,
  elevation travel, and reticle.
- Draw the scope view through that scope: a magnification control sets the real field of view,
  and the reticle is the shooter's reticle. Ship the Venom 5-25x56 FFP with EBR-7C MRAD, and keep
  the current generic MIL crosshair as the fallback.
- Warn when a correction is more than the scope can dial.
- Move saved state to version 2 and carry the existing rifle, loads, and conditions across.

## Capabilities

### New Capabilities

- `rifle-profiles`: several saved rifles, editable barrel length and bullet diameter, migration.
- `cartridge-library`: loads grouped by cartridge, per-cartridge velocity estimate, reference checks.
- `scope-profile`: scope data, magnification and field of view, reticle drawing, dial-limit warning.

### Modified Capabilities

None changed in wording. `load-library`, `shot-planner`, and `range-scene` keep their requirements;
the new capabilities add to them.

## Impact

- `src/planner/types.ts`, `storage.ts`, `fields.ts`, `panels.ts`, `setup.ts`, `main.ts`.
- `src/data/loads.json` (adds `cartridge`), new `src/data/cartridges.json`, new `src/data/scopes.json`.
- `src/scene/geometry.ts`, `scene.ts` (field of view from the scope; reticle drawing moves to its
  own module).
- `scripts/gen_loads.py`, `scripts/gen_reference.py`, and the reference tests.
- The solver does not change. It already takes any mass, diameter, BC, velocity, and twist.

## Decisions needed from Beaux

1. Which cartridges go in the first pass? Each one is a sourcing job. Suggested: 6.5 Creedmoor and
   .223 Rem, because they have the most published match data.
2. The EBR-7C fine layout is published only as a drawing marked "for representation only". The
   labelled sizes are exact; the hash and dot positions are measured from that drawing. Is it
   acceptable to ship the reticle with a note that says so?
3. Is the RevStop zero ring fitted? It lowers the dial limit from 25 to 19 MRAD.
