# 6.5 Creedmoor, 6.5 PRC, .243 Winchester: sourced data (read 2026-11-11)

Manufacturer pages only. NOT PUBLISHED means the maker does not give it on a page we opened.
Each value needs a second direct re-read before it goes into `loads.json`.

## Loads

### 6.5 Creedmoor

| Load | Part no. | Bullet | Muzzle velocity | Test barrel | BC (drag model) | Source |
|---|---|---|---|---|---|---|
| Hornady Match (ELD Match) | 81500 | 140 gr ELD Match | 2710 fps | 24 in | 0.646 G1 / 0.326 G7 (BC chart, Mach 2.25) | https://www.hornady.com/ammunition/rifle/6-5-creedmoor-140-gr-eld-match |
| Hornady Match (ELD Match) | 81501 | 147 gr ELD Match | 2695 fps | 24 in | 0.697 G1 / 0.351 G7 (BC chart, Mach 2.25) | https://www.hornady.com/ammunition/rifle/6.5-creedmoor-147-gr-eld-match |
| Hornady Precision Hunter | 81499 | 143 gr ELD-X | 2700 fps | 24 in | 0.623 G1 / 0.314 G7 (BC chart, Mach 2.25) | https://www.hornady.com/ammunition/rifle/6-5-creedmoor-143-gr-eld-x-precision-hunter |
| Federal Gold Medal Berger | GM65CRDBH2 | 140 gr Berger Hybrid | 2725 fps | NOT PUBLISHED | .607 (model not stated) / .311 G7 | https://www.federalpremium.com/rifle/gold-medal/gold-medal-berger/11-GM65CRDBH2.html |
| Federal Terminal Ascent | P65CRDTA1 | 130 gr Terminal Ascent | 2800 fps | NOT PUBLISHED | .532 (model not stated) / .263 G7 | https://www.federalpremium.com/rifle/terminal-ascent/11-P65CRDTA1.html |

### 6.5 PRC

| Load | Part no. | Bullet | Muzzle velocity | Test barrel | BC (drag model) | Source |
|---|---|---|---|---|---|---|
| Hornady Match (ELD Match) | 81620 | 147 gr ELD Match | 2910 fps | 24 in | 0.697 G1 / 0.351 G7 (BC chart, Mach 2.25) | https://www.hornady.com/ammunition/rifle/6.5-prc-147-gr-eld-match |
| Hornady Precision Hunter | 81621 | 143 gr ELD-X | 2960 fps | 24 in | 0.623 G1 / 0.314 G7 (BC chart, Mach 2.25) | https://www.hornady.com/ammunition/rifle/6.5-prc-143-gr-eld-x-precision-hunter |
| Federal Terminal Ascent | P65PRCTA1 | 130 gr Terminal Ascent | 3000 fps | NOT PUBLISHED | .532 (model not stated) / .263 G7 | https://www.federalpremium.com/rifle/terminal-ascent/11-P65PRCTA1.html |
| Berger EOL Elite Hunter | 50010 | 156 gr Elite Hunter | 2900 fps | 26 in | 0.679 G1 / 0.347 G7 (G7 form factor 0.921) | https://bergerbullets.com/product/6-5-prc-156-grain-extreme-outer-limits-eol-elite-hunter-rifle-ammunition/ |

### .243 Winchester

| Load | Part no. | Bullet | Muzzle velocity | Test barrel | BC (drag model) | Source |
|---|---|---|---|---|---|---|
| Hornady Precision Hunter | 80462 | 90 gr ELD-X | 3150 fps | 24 in | 0.410 G1 / 0.206 G7 (BC chart, Mach 2.25) | https://www.hornady.com/ammunition/rifle/243-win-90-gr-eld-x-precision-hunter |
| Hornady Superformance | 80463 | 95 gr SST | 3185 fps | 24 in | NOT PUBLISHED on pages opened | https://www.hornady.com/ammunition/rifle/243-win-95-gr-sst-superformance |
| Federal Power-Shok | 243B | 100 gr jacketed soft point | 2960 fps | NOT PUBLISHED | .355 (model not stated) | https://www.federalpremium.com/rifle/power-shok/11-243B.html |
| Federal Fusion | F243FS1 | 95 gr Fusion soft point | 2980 fps | NOT PUBLISHED | .376 (model not stated) | https://www.federalpremium.com/rifle/fusion/11-F243FS1.html |
| Remington Core-Lokt Tipped | 29015 | 95 gr Core-Lokt Tipped | 3140 fps | NOT PUBLISHED | .355 (model not stated) | https://www.remington.com/rifle/core-lokt-tipped/29-29015.html |

- Hornady ammunition pages publish no BC at all. The BCs above come from Hornady's own BC chart
  https://www.hornady.com/bc, which gives Doppler-measured, ICAO-corrected G1/G7 pairs in Mach
  bands for A-Tip, ELD-X and ELD Match bullets only. Mach 2.25 (2512 fps) is the "compare to
  industry" value; Hornady says use the Mach 1.75 values beyond 600 yd:
  140 ELD-M 0.616/0.310, 147 ELD-M 0.637/0.321, 143 ELD-X 0.584/0.294, 6mm 90 ELD-X 0.399/0.201.
- The ammo pages name the exact bullets (140/147 gr ELD Match, 143/90 gr ELD-X), which is how the
  BC chart rows were matched. Hornady bullet item numbers: 26331 (140 ELD-M), 26333 (147 ELD-M),
  2635 (143 ELD-X).
- Hornady publishes no BC for the 95 gr SST: not on the ammo page, not on the bullet page
  (item #24532, https://www.hornady.com/bullets/rifle/6mm-243-95-gr-sst), and the BC chart covers
  only A-Tip/ELD-X/ELD-M. Retailers list .355 but that is third party; do not use.
- Federal lists a bare "Ballistic Coefficient" plus a separately labeled "Ballistic Coefficient
  G7". The bare value is presumably G1 but the page never says so; recorded as "model not stated".
- Federal publishes bullet length: GM65CRDBH2 1.407 in; P65CRDTA1 and P65PRCTA1 1.421 in
  (36.093 mm); 243B 1.006 in (25.55 mm); F243FS1 1.025 in (26.04 mm). Hornady, Berger, and
  Remington publish no bullet length on any page opened.
- Federal never states a test barrel length on these product pages.
- Berger: "Performance based on a 26″ barrel and sea level conditions." Minimum twist 1:8",
  maximum COAL 2.955", large rifle primer. Page warns "All product specifications are for
  reference only. Individual lots may vary."
- Hornady trajectory tables state no zero range or sight height; trajectory reads 0 at 200 yd,
  which implies a 200 yd zero, but that is inference, not a published value.
- Winchester SBST243A (Ballistic Silvertip 95 gr) was opened at
  https://winchester.com/Products/Ammunition/Rifle/Ballistic-Silvertip/SBST243A but the page says
  "There is no ballistics data available at this time" — no velocity, BC, or table. Excluded.
- No factory match load in .243 Win was found from the allowed makers (Hornady, Federal,
  Winchester, Remington, Nosler, Berger, Barnes, Lapua). The 90 gr ELD-X Precision Hunter is the
  ELD-type load for this cartridge.
- Remington's classic 100 gr Core-Lokt (R243W3/27802) has no findable product page on
  remington.com; the 95 gr Core-Lokt Tipped page was used instead.

## Published downrange tables (for solver cross-checks)

Hornady tables: velocity fps / energy ft-lb / trajectory inches at muzzle, 100, 200, 300, 400,
500 yd; 24 in test barrel; muzzle trajectory -1.5 in; zero and sight height not stated (0 at
200 yd implies 200 yd zero).

- Hornady 81500 (6.5 CM 140 ELD-M): velocity 2710 / 2564 / 2422 / 2285 / 2152 / 2023.
  Energy 2283 / 2043 / 1823 / 1622 / 1439 / 1273. Trajectory -1.5 / 1.9 / 0 / -7.8 / -22.3 / -44.4.
- Hornady 81501 (6.5 CM 147 ELD-M): velocity 2695 / 2567 / 2443 / 2323 / 2206 / 2092.
  Energy 2370 / 2151 / 1948 / 1761 / 1587 / 1428. Trajectory -1.5 / 1.9 / 0 / -7.7 / -21.9 / -43.2.
- Hornady 81499 (6.5 CM 143 ELD-X): velocity 2700 / 2556 / 2417 / 2282 / 2151 / 2025.
  Energy 2315 / 2075 / 1855 / 1654 / 1470 / 1302. Trajectory -1.5 / 1.9 / 0 / -7.9 / -22.4 / -44.5.
- Hornady 81620 (6.5 PRC 147 ELD-M): velocity 2910 / 2775 / 2645 / 2518 / 2395 / 2275.
  Energy 2764 / 2514 / 2283 / 2069 / 1871 / 1689. Trajectory -1.5 / 1.5 / 0 / -6.5 / -18.4 / -36.5.
- Hornady 81621 (6.5 PRC 143 ELD-X): velocity 2960 / 2808 / 2661 / 2519 / 2381 / 2248.
  Energy 2782 / 2503 / 2248 / 2014 / 1800 / 1604. Trajectory -1.5 / 1.5 / 0 / -6.4 / -18.2 / -36.2.
- Hornady 80462 (.243 90 ELD-X): velocity 3150 / 2911 / 2685 / 2469 / 2264 / 2069.
  Energy 1983 / 1693 / 1440 / 1219 / 1024 / 855. Trajectory -1.5 / 1.3 / 0 / -6.1 / -18 / -36.6.
- Hornady 80463 (.243 95 SST): velocity 3185 / 2908 / 2649 / 2404 / 2172 / 1953.
  Energy 2140 / 1784 / 1480 / 1219 / 995 / 804. Trajectory -1.5 / 1.3 / 0 / -6.3 / -18.6 / -38.3.

Federal tables: muzzle, 100, 200, 300, 400, 500 yd; sight height 1.5 in above bore; wind drift
at 10 mph crosswind; trajectory given twice ("average range" zeroed at 100 yd to 300 yd, "long
range" to 500 yd). The zero cell in each trajectory table renders as an image on the page, so
the 100 yd (average) and 200 yd (long) cells could not be read as text; the long-range numbers
(e.g. +1.8 at 100 yd) are consistent with a 200 yd zero, but Federal's page text only states
"if zeroed at 100 yards". Test barrel never stated.

- Federal GM65CRDBH2: velocity 2725 / 2577 / 2434 / 2295 / 2161 / 2031.
  Energy 2308 / 2064 / 1841 / 1637 / 1452 / 1283. Drift 0 / 0.6 / 2.2 / 5.2 / 9.6 / 15.4.
  Average-range path at 50 / 200 / 300 yd: -0.1 / -3.7 / -13.3.
  Long-range path at 50 / 100 / 300 / 400 / 500 yd: 0.8 / 1.9 / -7.7 / -22.2 / -44.0.
- Federal P65CRDTA1: velocity 2800 / 2629 / 2464 / 2305 / 2152 / 2005.
  Energy 2263 / 1995 / 1752 / 1533 / 1337 / 1160. Drift 0 / 0.7 / 2.5 / 5.8 / 10.7 / 17.2.
  Average-range path 50 / 200 / 300 yd: -0.2 / -3.5 / -12.8.
  Long-range path 50 / 100 / 300 / 400 / 500 yd: 0.7 / 1.8 / -7.5 / -21.6 / -43.1.
- Federal P65PRCTA1: velocity 3000 / 2821 / 2649 / 2483 / 2324 / 2170.
  Energy 2598 / 2297 / 2025 / 1780 / 1558 / 1359. Drift 0 / 0.5 / 2.3 / 5.3 / 9.6 / 15.6.
  Average-range path 50 / 200 / 300 yd: -0.2 / -2.9 / -10.7.
  Long-range path 50 / 100 / 300 / 400 / 500 yd: 0.5 / 1.5 / -6.4 / -18.4 / -36.9.
- Federal 243B: velocity 2960 / 2697 / 2448 / 2213 / 1991 / 1783.
  Energy 1945 / 1615 / 1331 / 1087 / 880 / 706. Drift 0 / 0.9 / 3.6 / 8.4 / 15.8 / 25.9.
  Average-range path 50 / 200 / 300 yd: -0.2 / -3.3 / -12.4.
  Long-range path 50 / 100 / 300 / 400 / 500 yd: 0.6 / 1.6 / -7.5 / -22.1 / -45.4.
- Federal F243FS1: velocity 2980 / 2730 / 2493 / 2268 / 2056 / 1854.
  Energy 1873 / 1572 / 1311 / 1085 / 891 / 725. Drift 0 / 0.8 / 3.3 / 7.8 / 14.6 / 23.7.
  Average-range path 50 / 200 / 300 yd: -0.2 / -3.2 / -11.9.
  Long-range path 50 / 100 / 300 / 400 / 500 yd: 0.6 / 1.6 / -7.2 / -21.2 / -43.2.
- Berger 50010 (6.5 PRC 156 EOL EH), 26 in barrel, sea level: velocity at muzzle / 100 / 200 /
  300 / 400 yd: 2900 / 2764 / 2631 / 2501 / 2375. Energy 2914 / 2646 / 2398 / 2167 / 1955.
  Drop +1.52 / 0 / -6.55 / -18.65 in at 100 / 200 / 300 / 400 yd (200 yd zero as published;
  sight height not stated).
- Remington 29015 (.243 95 CLT): velocity 3140 / 2866 / 2608 / 2364 / 2134 / 1916.
  Energy 2080 / 1732 / 1434 / 1179 / 960 / 774. Drift 0 / 0.8 / 3.3 / 7.7 / 14.5 / 23.6.
  Sights 1.5 in. Average-range path (100 yd zero) 50 / 200 / 300 yd: -0.3 / -2.8 / -10.6.
  Long-range path ("zeroed at range indicated", zero cell unreadable) 50 / 100 / 300 / 400 /
  500 yd: 0.4 / 1.4 / -6.4 / -19.2 / -39.5. Test barrel NOT PUBLISHED.

## Bullet diameter

SAAMI ANSI Z299.4 CFR 2025 (Centerfire Rifle, approved 2025-02-10), cartridge drawings:
https://saami.org/wp-content/uploads/2026/04/SAAMI-Z299.4-CFR-2025-Centerfire-Rifle-Approved-2-10-2025-2026-04-27.pdf

- 6.5 Creedmoor drawing (issued 06/17/2009, revised 11/16/2021): bullet ".2644 - .0030" in
  (6.716 - 0.076 mm), maximum with a minus tolerance. Twist 8.00 in (203.2 mm) R.H., 6 grooves.
- 6.5 Precision Rifle Cartridge [6.5 PRC] drawing (issued 06/13/2018, revised 11/18/2021):
  bullet ".2644 - .0030" in (6.716 - 0.076 mm). Twist 8.00 in (203.2 mm) R.H., 6 grooves.
- 243 Winchester drawing (issued 05/29/1979, revised 04/05/2022): bullet ".243 - .003" in
  (6.17 - 0.08 mm). Twist 10.00 in (254.0 mm) R.H., 6 grooves.
