# Task: add .450 Bushmaster to the load library, with its short-range note

Read first:
- research/selection-top-15.md — which loads to add and the entry conventions (authoritative)
- research/sources-30cal-450bm.md — every value with its source URL (the .450 BM sections)
- scripts/gen_loads.py — follow the existing patterns; use read_on=READ_ON_2 ("2026-11-11")
  for all new entries.

All data changes go in scripts/gen_loads.py; then regenerate.

1. Add cartridge `450-bm` (".450 Bushmaster"), same dict shape as existing:
   - bulletDiameterM: 0.452 in (times IN). diameterSource quotes the SAAMI Z299.4 drawing
     (bullet .4525 - .0030 in, twist 24 in) with the saami.org PDF URL from the research file.
   - velocityLossMpsPerM null, velocityLossNote in the .223 style. 
   - safetyNote: use the quote() helper with text in our own words: published maker data for
     .450 Bushmaster is short-range — Hornady and Winchester stop their trajectory tables at
     300 yd, and Federal and Remington's own 500 yd rows show the bullet at 816-932 fps, deep
     subsonic. Treat it as a 300 yd cartridge. sourceUrl:
     https://www.hornady.com/ammunition/rifle/450-bushmaster-250-gr-ftx-black
   - defaults: targetRangeM 182.88, zeroRangeM 91.44, dope 91.44 to 274.32 step 45.72,
     twistM 24 in times IN, barrelLengthM 20 in times IN.
2. Add the three loads named in selection-top-15.md:
   - Federal F450BMFS1 (Fusion 260 gr soft point): 2200 fps, g1 .180 model_stated False
     (primary BC unlabeled on page), no g7, length 0.779 in, no test barrel.
   - Federal 450BMB (Power-Shok 300 gr jacketed soft point): 1900 fps, g1 .225
     model_stated False, no g7, length 0.800 in, no test barrel.
   - Remington 27943 (Premier AccuTip 260 gr): 2180 fps, g1 .144 model_stated False, no g7,
     no length, no test barrel.
   - Each load's note should mention the published trajectory table limit (Federal/Remington
     print to 500 yd but velocities there are subsonic; see cartridge note).
3. Run `python3 scripts/gen_loads.py`; `git diff src/data/loads.json` must show additions only.
4. Update tests/loads.test.ts: add '450-bm' to the expected sorted cartridge id list
   (>= 3 loads). Add LIMITS:
   '450-bm': massKg [0.0163, 0.0198], velocity [560, 690], g1 [0.12, 0.26], g7 [0, 0],
     lengthM [0.018, 0.022]
5. Run `npx vitest run tests/loads.test.ts` and fix failures in your additions only.

Rules: single-line shell commands only; edit files with your editor tools, not heredocs; do
NOT run git commit or git push; touch only scripts/gen_loads.py, src/data/loads.json
(generated), and tests/loads.test.ts.
