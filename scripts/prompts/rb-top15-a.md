# Task: add 6.5 Creedmoor, 6.5 PRC, and .243 Winchester to the load library

Read first:
- research/selection-top-15.md — which loads to add and the entry conventions (authoritative)
- research/sources-65cm-65prc-243.md — every value with its source URL
- scripts/gen_loads.py — follow the existing cartridge and load patterns exactly

All data changes go in scripts/gen_loads.py; then regenerate.

1. Add a constant `READ_ON_2 = "2026-11-11"`. Give `sourced()`, `quote()`, and `load()` an
   optional `read_on=READ_ON` keyword and use `READ_ON_2` for the new entries only. Existing
   entries must produce byte-identical output.
2. Add cartridges with ids `65-creedmoor`, `65-prc`, `243-win` (names "6.5 Creedmoor",
   "6.5 PRC", ".243 Winchester") following the existing cartridge dict shape:
   - bulletDiameterM: 0.264 in for both 6.5s, 0.243 in for .243 (times IN). diameterSource
     quotes the SAAMI Z299.4 drawing (bullet .2644 - .0030 in for the 6.5s, .243 - .003 in for
     .243) with the saami.org PDF URL from the research file.
   - velocityLossMpsPerM: null. velocityLossNote in the same style as .223: no per-inch figure
     was sourced, no correction is made, the app shows the maker's velocity with its test
     barrel, chronograph your load.
   - safetyNote: null.
   - defaults: targetRangeM 274.32, zeroRangeM 91.44, dope 91.44 to 548.64 step 45.72,
     twistM 8 in for the 6.5s and 10 in for .243 (times IN), barrelLengthM 24 in times IN.
3. Add the nine loads named in selection-top-15.md with the exact values from the research
   file's tables, applying the conventions:
   - Hornady loads (81500, 81499, 81620, 81621, 80462): BCs from the hornady.com/bc chart,
     g1 and g7 both set, model_stated True, bc_url https://www.hornady.com/bc, test barrel
     24 in, note that the ammo page prints no BC and the value is the Hornady BC chart's
     Mach 2.25 figure. No bullet length.
   - Federal GM65CRDBH2: g1 .607 with model_stated False (the page's primary BC carries no
     drag-model label), g7 .311 (labeled on the page), bullet length 1.407 in, velocity
     2725 fps, no test barrel. Note says the primary BC is unlabeled on the page.
   - Federal F243FS1: g1 .376 model_stated False, no g7 on page, length 1.025 in, 2980 fps.
   - Remington 29015: g1 .355 model_stated False, no g7, no length, 3140 fps, no test barrel.
   - Berger 50010: g1 0.679 / g7 0.347, model_stated True, 2900 fps, test barrel 26 in, no
     length. Note: Berger states 26 in barrel and sea level; minimum twist 1:8.
   - Velocities in fps via the `fps=` parameter; masses in grains via `grains=`.
4. Run `python3 scripts/gen_loads.py`. Then check `git diff src/data/loads.json` shows
   additions only — no change to any existing cartridge or load.
5. Update tests/loads.test.ts:
   - The "ships the four first-pass cartridges" test becomes "ships the library cartridges,
     each with loads"; the expected sorted id list is
     ['22-lr','223-rem','243-win','308-win','556-nato','65-creedmoor','65-prc'];
     minimum load count stays >= 7 for the original four ids and is >= 3 for new ids.
   - Add LIMITS entries:
     '65-creedmoor': massKg [0.0088, 0.0097], velocity [800, 870], g1 [0.55, 0.75],
       g7 [0.28, 0.38], lengthM [0.033, 0.038]
     '65-prc': massKg [0.0088, 0.0105], velocity [860, 930], g1 [0.55, 0.75],
       g7 [0.28, 0.38], lengthM [0.033, 0.038]
     '243-win': massKg [0.0055, 0.0068], velocity [890, 980], g1 [0.30, 0.45],
       g7 [0.18, 0.24], lengthM [0.024, 0.028]
6. Run `npx vitest run tests/loads.test.ts` and fix failures in your additions. Do not weaken
   existing assertions beyond the changes named above.

Rules: single-line shell commands only; edit files with your editor tools, not heredocs; do
NOT run git commit or git push; touch only scripts/gen_loads.py, src/data/loads.json
(generated), and tests/loads.test.ts.
