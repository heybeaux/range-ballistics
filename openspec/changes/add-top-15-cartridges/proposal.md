# Add the top 15 cartridges

## Why

The library ships four cartridges: .22 LR, .223 Remington, 5.56x45 NATO, and .308 Winchester.
Beaux asked for the top 15 cartridges from Backfire's popularity ranking
(https://backfire.tv/popular-cartridges/, "ranking by ammo sales", late 2025). That list has 14
entries because it counts .223 and 5.56 as one; the app keeps them separate, so the full list is
exactly 15 cartridges — the 4 we have plus 11 new ones.

## What Changes

Add these 11 cartridges, in Backfire's sales order:

| # on list | Cartridge | Note |
|---|---|---|
| 3 | 6.5 Creedmoor | |
| 5 | 7mm PRC | |
| 6 | 6.5 PRC | |
| 7 | .30-06 Springfield | |
| 8 | .300 Winchester Magnum | |
| 9 | .270 Winchester | |
| 10 | .450 Bushmaster | Straight-wall, low BC; short-range cartridge, same solver |
| 11 | .243 Winchester | |
| 12 | 7mm Remington Magnum | |
| 13 | 7mm-08 Remington | |
| 14 | .300 PRC | |

Each cartridge follows the existing rules, unchanged:

- Sourcing: every BC, bullet length, and muzzle velocity from a manufacturer page, with URL and
  read date, re-read a second time before it enters `loads.json`. NOT PUBLISHED values stay null.
- Bullet diameter from the SAAMI drawing, with source.
- At least 3 library loads per cartridge from major makers, favouring loads whose maker publishes
  a full downrange table.
- Reference checks: at least 2 loads per cartridge compared with the independent solver at ten
  distances to the existing tolerance (0.05 MIL or 1%).
- Per-cartridge barrel-length velocity figure only when a source exists; otherwise no correction,
  same as .223 today.
- Research first: a `research/sources-*.md` file per cartridge group, in the existing format,
  before any data enters the app.

## Capabilities

### Modified Capabilities

- `cartridge-library`: the shipped list grows from 4 to 15 cartridges. No rule changes; the
  "First-pass cartridges" requirement is replaced by the full list.

No code structure changes are expected: cartridges and loads are data entries in
`src/data/loads.json`, plus generated reference cases and tests.

## Impact

- `src/data/loads.json` (11 cartridges, ~35 loads), `research/sources-*.md` (new files).
- `scripts/gen_reference.py` reference cases and the reference tests.
- The solver, planner, and scene do not change.

## Decisions needed from Beaux

1. DECIDED 2026-11-11: 3 loads per new cartridge to start (vs 8–15 for the first four). More can
   be added later on request.
2. DECIDED 2026-11-11: .450 Bushmaster ships with the short-range caveat. Makers publish little
   for it beyond a G1 BC around 0.2 and a 100–300 yd table.
