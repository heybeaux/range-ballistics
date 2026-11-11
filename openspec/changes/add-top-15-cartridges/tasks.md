# Tasks: add the top 15 cartridges

## 1. Research (Scout, manufacturer pages only)

- [ ] 1.1 research/sources-65cm-65prc-243.md: 6.5 Creedmoor, 6.5 PRC, .243 Winchester
- [ ] 1.2 research/sources-7mm-270.md: 7mm-08, 7mm Rem Mag, 7mm PRC, .270 Winchester
- [ ] 1.3 research/sources-30cal-450bm.md: .30-06, .300 Win Mag, .300 PRC, .450 Bushmaster
- [ ] 1.4 Second re-read of every value that goes into loads.json (Scout, not the researcher)
- [ ] 1.5 SAAMI bullet diameter, with drawing reference, for all 11 cartridges

## 2. Data (Qwen via OpenCode, after Beaux approves)

- [ ] 2.1 Add 11 cartridge entries to src/data/loads.json (diameter, sources, defaults, notes)
- [ ] 2.2 Add at least 3 loads per cartridge with full sourcing
- [ ] 2.3 Per-cartridge velocity-loss figure only where a source exists
- [ ] 2.4 .450 Bushmaster short-range note

## 3. Checks

- [ ] 3.1 Reference cases: 2+ loads per cartridge, ten distances, existing tolerance
- [ ] 3.2 Data test passes: every non-null value sourced, load diameter equals cartridge diameter
- [ ] 3.3 Cross-check against at least one maker-published downrange table per cartridge
- [ ] 3.4 Browser check: cartridge picker lists 15 + other; one new cartridge solves end to end
