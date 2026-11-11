# Task: add .30-06 Springfield, .300 Win Mag, and .300 PRC to the load library

Read first:
- research/selection-top-15.md — which loads to add and the entry conventions (authoritative)
- research/sources-30cal-450bm.md — every value with its source URL
- scripts/gen_loads.py — follow the existing patterns; use read_on=READ_ON_2 ("2026-11-11")
  for all new entries.

All data changes go in scripts/gen_loads.py; then regenerate.

1. Add cartridges `3006-spr` (".30-06 Springfield"), `300-win-mag` (".300 Winchester Magnum"),
   `300-prc` (".300 PRC"), same dict shape as existing:
   - bulletDiameterM: 0.308 in for all three (times IN). diameterSource quotes the SAAMI
     Z299.4 drawing (30-06 and 300 WM bullet .309 - .003 in; 300 PRC .3084 - .0030 in — note
     that all three shoot nominal .308 groove barrels and the app uses .308, the drawing is
     provenance) with the saami.org PDF URL from the research file.
   - velocityLossMpsPerM null, velocityLossNote in the .223 style. safetyNote null.
   - defaults: targetRangeM 274.32, zeroRangeM 91.44, dope 91.44 to 548.64 step 45.72,
     twistM 10 in for 30-06 and 300 WM, 8.5 in for 300 PRC (times IN), barrelLengthM 24 in
     times IN.
2. Add the nine loads named in selection-top-15.md with exact values from the research table:
   - Hornady 81174 (.30-06 178 ELD-X): 2750 fps, 24 in, g1 0.552 / g7 0.278 from the BC chart,
     model_stated True, bc_url https://www.hornady.com/bc, chart note as in earlier entries.
   - Federal GM3006M: 168 gr SMK, 2700 fps, g1 .463 model_stated False (primary BC unlabeled
     on page), g7 .224 (labeled), length 1.220 in, no test barrel.
   - Remington 29037: 180 gr Core-Lokt Tipped, 2745 fps, g1 .480 model_stated False, no g7,
     no length.
   - Hornady 82002 (.300 WM 200 ELD-X): 2860 fps, 24 in, g1 0.597 / g7 0.301, chart note.
   - Federal GM300WM: 190 gr SMK, 2900 fps, g1 .533 model_stated False, g7 .275 (labeled),
     length 1.360 in.
   - Remington R29038: 180 gr Core-Lokt Tipped, 2980 fps, g1 .481 model_stated False.
   - Hornady 82162 (.300 PRC 225 ELD Match): 2810 fps, 24 in, use the 1:10-twist chart row
     g1 0.777 / g7 0.391, model_stated True; note the chart also lists 0.798/0.402 for 1:7
     twist and the ammo page does not state its test barrel twist.
   - Hornady 82166 (.300 PRC 212 ELD-X): 2860 fps, 24 in, 1:10 row g1 0.663 / g7 0.334,
     model_stated True; note the 1:7 row is 0.702/0.354.
   - Berger 55030 (.300 PRC 215 Hybrid Target): 2940 fps, test barrel 26 in, g1 0.691 /
     g7 0.354, model_stated True, no length. Note: Berger states 26 in barrel and sea level;
     minimum twist 1:10.
3. Run `python3 scripts/gen_loads.py`; `git diff src/data/loads.json` must show additions only.
4. Update tests/loads.test.ts: extend the expected sorted cartridge id list with '3006-spr',
   '300-prc', '300-win-mag' (keep sorted; new ids need >= 3 loads). Add LIMITS:
   '3006-spr': massKg [0.0106, 0.0120], velocity [800, 860], g1 [0.40, 0.60],
     g7 [0.20, 0.30], lengthM [0.028, 0.034]
   '300-win-mag': massKg [0.0113, 0.0133], velocity [850, 930], g1 [0.45, 0.65],
     g7 [0.24, 0.33], lengthM [0.032, 0.037]
   '300-prc': massKg [0.0133, 0.0150], velocity [830, 920], g1 [0.60, 0.85],
     g7 [0.30, 0.42], lengthM [0, 0]  // no .300 PRC load here publishes bullet length
5. Run `npx vitest run tests/loads.test.ts` and fix failures in your additions only.

Rules: single-line shell commands only; edit files with your editor tools, not heredocs; do
NOT run git commit or git push; touch only scripts/gen_loads.py, src/data/loads.json
(generated), and tests/loads.test.ts.
