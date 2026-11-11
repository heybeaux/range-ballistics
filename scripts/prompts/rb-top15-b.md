# Task: add 7mm-08 Rem, 7mm Rem Mag, 7mm PRC, and .270 Win to the load library

Read first:
- research/selection-top-15.md — which loads to add and the entry conventions (authoritative)
- research/sources-7mm-270.md — every value with its source URL
- scripts/gen_loads.py — follow the existing cartridge and load patterns; a previous task added
  READ_ON_2 = "2026-11-11" and a read_on keyword on the helpers. Use read_on=READ_ON_2 for all
  new entries.

All data changes go in scripts/gen_loads.py; then regenerate.

1. Add cartridges `7mm08-rem` ("7mm-08 Remington"), `7mm-rem-mag` ("7mm Remington Magnum"),
   `7mm-prc` ("7mm PRC"), `270-win` (".270 Winchester"), same dict shape as the existing ones:
   - bulletDiameterM: 0.284 in for the three 7mms, 0.277 in for .270 (times IN). diameterSource
     quotes the SAAMI Z299.4 drawing (7mm-08 and 7mm RM bullet .2845 - .0030 in; 7mm PRC
     .2844 - .0030 in; .270 Win .278 - .003 in — note for .270 that SAAMI draws .278 max and
     the common .277 figure is the groove diameter) with the saami.org PDF URL from the
     research file.
   - velocityLossMpsPerM null, velocityLossNote in the .223 style (no sourced per-inch figure,
     no correction, chronograph your load). safetyNote null.
   - defaults: targetRangeM 274.32, zeroRangeM 91.44, dope 91.44 to 548.64 step 45.72,
     twistM 9.5 in for 7mm-08 and 7mm RM, 8 in for 7mm PRC, 10 in for .270 (times IN),
     barrelLengthM 24 in times IN.
2. Add the twelve loads named in selection-top-15.md with exact values from the research table:
   - Hornady (85578, 80636, 80712, 80536): BC chart G1/G7, model_stated True,
     bc_url https://www.hornady.com/bc, test barrel 24 in, note that the ammo page prints no BC
     and the value is the Hornady BC chart's Mach 2.25 figure. No bullet length.
   - Hornady 80711 (7mm PRC 180 ELD Match): use the 1:8.75-twist chart row, g1 0.777 /
     g7 0.391, model_stated True, test barrel 24 in. Note: the chart also lists 0.816/0.411
     for a 1:7.5 twist and the ammo page does not state its test barrel twist.
   - Federal P7RTA1: g1 .586 model_stated False (primary BC unlabeled on page), g7 .300
     (labeled), length 1.514 in, 3000 fps, no test barrel.
   - Federal P7PRCTA1: g1 .586 model_stated False, no G7 on page, length 1.510 in, 3100 fps.
   - Federal P270TA1: g1 .493 model_stated False, g7 .247 (labeled), length 1.354 in, 3000 fps.
   - Federal F708FS1: g1 .390 model_stated False, no g7, length 1.135 in, 2850 fps.
   - Remington 21337: g1 .390 model_stated False, no length, 2860 fps.
   - Remington 28821: g1 .390 model_stated False, no length, 3175 fps.
   - Remington 27808: g1 .336 model_stated False, no length, 3060 fps.
3. Run `python3 scripts/gen_loads.py`; `git diff src/data/loads.json` must show additions only.
4. Update tests/loads.test.ts: extend the expected sorted cartridge id list with
   '270-win', '7mm-prc', '7mm-rem-mag', '7mm08-rem' (keep it sorted; new ids need >= 3 loads).
   Add LIMITS:
   '7mm08-rem': massKg [0.0088, 0.0100], velocity [820, 900], g1 [0.35, 0.62],
     g7 [0.25, 0.32], lengthM [0.027, 0.032]
   '7mm-rem-mag': massKg [0.0088, 0.0108], velocity [880, 990], g1 [0.35, 0.68],
     g7 [0.27, 0.35], lengthM [0.036, 0.040]
   '7mm-prc': massKg [0.0098, 0.0120], velocity [880, 970], g1 [0.55, 0.82],
     g7 [0.30, 0.42], lengthM [0.036, 0.040]
   '270-win': massKg [0.0082, 0.0096], velocity [880, 960], g1 [0.30, 0.58],
     g7 [0.22, 0.30], lengthM [0.032, 0.037]
5. Run `npx vitest run tests/loads.test.ts` and fix failures in your additions only.

Rules: single-line shell commands only; edit files with your editor tools, not heredocs; do
NOT run git commit or git push; touch only scripts/gen_loads.py, src/data/loads.json
(generated), and tests/loads.test.ts.
