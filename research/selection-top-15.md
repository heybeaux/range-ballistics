# Top-15 cartridges: selected loads and entry conventions (verified 2026-11-11)

Every value for every load below was re-read directly from its source page by Scout on
2026-11-11 (second read) and matched the research files exactly. Use READ_ON = "2026-11-11"
for all of these entries. Source values live in:

- `research/sources-65cm-65prc-243.md`
- `research/sources-7mm-270.md`
- `research/sources-30cal-450bm.md`

## Selected loads (3 per cartridge)

| Cartridge | Loads |
|---|---|
| 6.5 Creedmoor | Hornady 81500 (140 ELD-M), Hornady 81499 (143 ELD-X), Federal GM65CRDBH2 (Gold Medal Berger 140) |
| 6.5 PRC | Hornady 81620 (147 ELD-M), Hornady 81621 (143 ELD-X), Berger 50010 (156 EOL Elite Hunter) |
| .243 Winchester | Hornady 80462 (90 ELD-X), Federal F243FS1 (Fusion 95), Remington 29015 (Core-Lokt Tipped 95) |
| 7mm-08 Remington | Hornady 85578 (150 ELD-X), Federal F708FS1 (Fusion 140), Remington 21337 (Core-Lokt 140) |
| 7mm Remington Magnum | Hornady 80636 (162 ELD-X), Federal P7RTA1 (Terminal Ascent 155), Remington 28821 (Core-Lokt 140) |
| 7mm PRC | Hornady 80711 (180 ELD-M), Hornady 80712 (175 ELD-X), Federal P7PRCTA1 (Terminal Ascent 155) |
| .270 Winchester | Hornady 80536 (145 ELD-X), Federal P270TA1 (Terminal Ascent 136), Remington 27808 (Core-Lokt 130) |
| .30-06 Springfield | Hornady 81174 (178 ELD-X), Federal GM3006M (Gold Medal 168 SMK), Remington 29037 (Core-Lokt Tipped 180) |
| .300 Winchester Magnum | Hornady 82002 (200 ELD-X), Federal GM300WM (Gold Medal 190 SMK), Remington R29038 (Core-Lokt Tipped 180) |
| .300 PRC | Hornady 82162 (225 ELD-M), Hornady 82166 (212 ELD-X), Berger 55030 (215 Hybrid Target) |
| .450 Bushmaster | Federal F450BMFS1 (Fusion 260), Federal 450BMB (Power-Shok 300), Remington 27943 (AccuTip 260) |

Loads NOT selected, and why: Hornady SST and CX loads have no Hornady-published BC anywhere
(ammo page, bullet page, BC chart); Nosler 47284 publishes no BC; Winchester publishes no BC on
any product page; Hornady .450 BM loads (250 FTX, 395 Sub-X) have no Hornady BC. A load without
a maker BC cannot be solved and does not enter the library.

## Entry conventions

- Hornady BCs come from Hornady's own chart at https://www.hornady.com/bc (Doppler-measured,
  Mach 2.25 column — Hornady says that is the value comparable to industry BCs). G1 and G7 are
  both labeled there: `model_stated=True`. Note on each Hornady load that the ammo page prints
  no BC and the value is from the Hornady BC chart at Mach 2.25.
- Twist-row BCs: 7mm 180 ELD-M has chart rows for 1:8.75 (0.777 G1 / 0.391 G7) and 1:7.5
  (0.816/0.411); .30 cal 212 ELD-X rows 1:10 (0.663/0.334) and 1:7 (0.702/0.354); 225 ELD-M rows
  1:10 (0.777/0.391) and 1:7 (0.798/0.402). Use the SLOWER-twist row (the lower BC) and say in
  the load note that the chart lists a higher value for the faster twist. SAAMI twists (8 in for
  7mm PRC, 8.5 in for .300 PRC) sit between the chart rows; the ammo pages do not state test twist.
- Federal/Remington single unlabeled "Ballistic Coefficient" values: store as G1 with
  `model_stated=False`, same convention as the .22 LR entries. Federal Gold Medal and Terminal
  Ascent pages also label a G7 value explicitly — store it as G7 (the G7 IS labeled; only the
  primary value is unlabeled, so keep `model_stated=False` and say so in the note).
- Berger labels G1 BC and G7 BC explicitly: `model_stated=True`. Berger states 26 in test barrel
  and sea level.
- Test barrel: Hornady states 24 in on every page here; Berger 26 in; Federal and Remington state
  none (null).
- Bullet length: Federal publishes it (values in the research files); all others null.
- Bullet diameter per cartridge (nominal, as loaded; SAAMI drawing is provenance):
  6.5 CM / 6.5 PRC 0.264 in; .243 0.243 in; 7mm-08 / 7mm RM / 7mm PRC 0.284 in; .270 0.277 in
  (SAAMI draws .278 max; groove .277 — note this); .30-06 / .300 WM / .300 PRC 0.308 in (SAAMI
  draws .309/.3084 max; groove .308 — note this); .450 BM 0.452 in (SAAMI draws .4525 max).
- Velocity-loss-per-inch: no sourced figure exists for any of the 11 — all null, no correction,
  same wording pattern as .223.
- SAAMI twists for cartridge defaults: 6.5 CM 8, 6.5 PRC 8, .243 10, 7mm-08 9.5, 7mm RM 9.5,
  7mm PRC 8, .270 10, .30-06 10, .300 WM 10, .300 PRC 8.5, .450 BM 24 (inches).
- .450 Bushmaster cartridge note (required by the spec): published data is short-range —
  Hornady and Winchester stop their own tables at 300 yd, and Federal/Remington's 500 yd rows
  show 816–932 fps. Default its dope table to 300 yd max.
- Hornady trajectory tables: zero and sight height are NOT stated; 0 at 200 yd and −1.5 in at
  the muzzle imply 200 yd zero and 1.5 in sights. Mark reference cross-checks against Hornady
  tables as using inferred zero/sight height.
- Federal/Remington tables state "zeroed at 100 yards, sights 1.5 inches above bore line" for
  the average-range rows; their zero cells render as images (noted in research files) — use the
  velocity and drift columns for cross-checks, not the image cells.
