# 7mm-08 Rem / 7mm Rem Mag / 7mm PRC / .270 Win: sourced data (read 2026-11-11)

Manufacturer pages only. NOT PUBLISHED means the maker does not give it on a page we opened.
Each value needs a second direct re-read before it goes into `loads.json`.

## Loads

| Cartridge | Load | Part no. | Bullet | Muzzle velocity | Test barrel | BC (drag model) | Source |
|---|---|---|---|---|---|---|---|
| 7mm-08 Rem | Hornady Precision Hunter | 85578 | 150 gr ELD-X | 2770 fps | 24 in | .574 G1 / .289 G7 (Hornady bullet BC chart, Mach 2.25; not on ammo page) | https://www.hornady.com/ammunition/rifle/7mm-08-rem-150-gr-eld-x-precision-hunter |
| 7mm-08 Rem | Hornady Superformance | 80573 | 139 gr SST | 2950 fps | 24 in | NOT PUBLISHED on pages opened | https://www.hornady.com/ammunition/rifle/7mm-08-rem-139-gr-sst-superformance |
| 7mm-08 Rem | Federal Fusion | F708FS1 | 140 gr Fusion Soft Point | 2850 fps | NOT PUBLISHED | .390 (model not stated) | https://www.federalpremium.com/rifle/fusion/11-F708FS1.html |
| 7mm-08 Rem | Remington Core-Lokt | 21337 | 140 gr Pointed Soft Point | 2860 fps | NOT PUBLISHED | .390 (model not stated) | https://www.remington.com/rifle/shop-by-caliber/shop-all-calibers/29-21337.html |
| 7mm Rem Mag | Hornady Precision Hunter | 80636 | 162 gr ELD-X | 2975 fps | 24 in | .631 G1 / .318 G7 (Hornady bullet BC chart, Mach 2.25; not on ammo page) | https://www.hornady.com/ammunition/rifle/7mm-rem-mag-162-gr-eld-x-precision-hunter |
| 7mm Rem Mag | Federal Terminal Ascent | P7RTA1 | 155 gr Terminal Ascent | 3000 fps | NOT PUBLISHED | .586 (model not stated) and .300 (labeled G7) | https://www.federalpremium.com/rifle/terminal-ascent/11-P7RTA1.html |
| 7mm Rem Mag | Nosler Trophy Grade | 47284 | 160 gr AccuBond (Spitzer) | 3000 fps | 24 in, 1-9.5 in twist | NOT PUBLISHED on product page | https://www.nosler.com/7mm-rem-mag-160gr-accubond-trophy-grade-ammunition.html |
| 7mm Rem Mag | Remington Core-Lokt | 28821 | 140 gr Pointed Soft Point | 3175 fps | NOT PUBLISHED | .390 (model not stated) | https://www.remington.com/rifle/core-lokt/29-28821.html |
| 7mm PRC | Hornady Match | 80711 | 180 gr ELD Match | 2975 fps | 24 in | bullet BC chart: .777 G1 / .391 G7 (1:8.75 twist) or .816 G1 / .411 G7 (1:7.5 twist), Mach 2.25; not on ammo page, twist of test barrel not stated | https://www.hornady.com/ammunition/rifle/7mm-prc-180-gr-eld-match |
| 7mm PRC | Hornady Precision Hunter | 80712 | 175 gr ELD-X | 3000 fps | 24 in | .689 G1 / .347 G7 (Hornady bullet BC chart, Mach 2.25; not on ammo page) | https://www.hornady.com/ammunition/rifle/7mm-prc-175-gr-eld-x-precision-hunter |
| 7mm PRC | Hornady Outfitter | 80713 | 160 gr CX | 3000 fps | 24 in | NOT PUBLISHED on pages opened | https://www.hornady.com/ammunition/rifle/7mm-prc-160-gr-cx-outfitter |
| 7mm PRC | Federal Terminal Ascent | P7PRCTA1 | 155 gr Terminal Ascent | 3100 fps | NOT PUBLISHED | .586 (model not stated) | https://www.federalpremium.com/rifle/terminal-ascent/11-P7PRCTA1.html |
| .270 Win | Hornady Precision Hunter | 80536 | 145 gr ELD-X | 2970 fps | 24 in | .536 G1 / .270 G7 (Hornady bullet BC chart "270 Cal 145 gr ELD-X", Mach 2.25; not on ammo page) | https://www.hornady.com/ammunition/rifle/270-win-145-gr-eld-x-precision-hunter |
| .270 Win | Hornady Superformance | 80543 | 130 gr SST | 3200 fps | 24 in | NOT PUBLISHED on pages opened | https://www.hornady.com/ammunition/rifle/270-win-130-gr-sst-superformance |
| .270 Win | Federal Terminal Ascent | P270TA1 | 136 gr Terminal Ascent | 3000 fps | NOT PUBLISHED | .493 (model not stated) and .247 (labeled G7) | https://www.federalpremium.com/rifle/terminal-ascent/11-P270TA1.html |
| .270 Win | Remington Core-Lokt | 27808 | 130 gr Pointed Soft Point | 3060 fps | NOT PUBLISHED | .336 (model not stated) | https://www.remington.com/rifle/shop-by-caliber/shop-all-calibers/29-27808.html |

- Hornady ammo pages print no numeric BC. The G1/G7 values above are from Hornady's own bullet BC
  chart, https://www.hornady.com/bc, which covers ELD Match and ELD-X only and gives values at
  Mach 2.25 / 2.0 / 1.75; Hornady says the Mach 2.25 ("200 yard") value is the one to compare with
  industry BCs. The chart lists bullets by caliber/weight, not ammo part number — the ammo page
  names the exact bullet. SST and CX bullets are not on that chart: BC NOT PUBLISHED on pages opened.
- Hornady 7mm PRC 180 gr ELD Match: the BC chart lists two rows for this bullet by barrel twist
  (1:8.75 and 1:7.5). The ammo page does not say which twist its 24 in test barrel has, so the
  per-load BC is ambiguous as published.
- Hornady trajectory tables state no zero range or sight height; the 0 at 200 yd implies a
  200-yd zero but Hornady does not say so.
- Bullet length, published only by Federal: P7RTA1 1.514 in; P7PRCTA1 1.510 in; P270TA1 1.354 in;
  F708FS1 1.135 in. Hornady, Remington, Nosler ammo pages: NOT PUBLISHED.
- Federal BC labeling: the main "Ballistic Coefficient" spec carries no drag-model label on the
  page; a second G7-labeled value appears for P7RTA1 (.300) and P270TA1 (.247). Re-check the live
  spec panel before treating the unlabeled value as G1.
- Federal and Remington trajectory tables render the zero-range cell as an image (a zero symbol),
  so that cell's value is not in the page text; readable cells are copied below as published.
- Federal P270TA1 long-range table as extracted shows +1.5 at 200 yd with the 100 yd cell as the
  image — column alignment on the flattened page is suspect; re-read before use.
- Winchester Deer Season XP .270 Win (X270DS): product page lists the 130 gr bullet but no muzzle
  velocity, no BC, and says "There is no ballistics data available at this time."
  https://winchester.com/Products/Ammunition/Rifle/Deer-Season-XP/X270DS — excluded from the table.
- Federal lists no 7mm-08 Terminal Ascent; their 7mm-08 Nosler AccuBond P708A1 is marked
  discontinued. No factory match/ELD-type load found from these makers in 7mm-08 or .270 Win;
  the ELD-X hunting loads are the ELD-type entries for those two cartridges.
- Berger announced 7mm PRC Elite Hunter ammo for 2026 (175 gr, G7 .336; 195 gr, G7 .387) but no
  product page with a downrange table was up yet.
  https://bergerbullets.com/berger-adds-7mm-prc-elite-hunter-ammunition-for-2026/
- Test barrel length: Federal and Remington do not state it on product pages. Nosler states
  24 in and the twist (1-9.5 in) — the only maker here that publishes test twist.

## Published downrange tables (for solver cross-checks)

Hornady tables: 24 in test barrel, velocity fps / energy ft-lb / trajectory inches at
muzzle / 100 / 200 / 300 / 400 / 500 yd. Trajectory starts at -1.5 in at muzzle, 0 at 200 yd;
zero and sight height not stated.

- Hornady 85578 (7mm-08 150 ELD-X): velocity 2770 / 2613 / 2461 / 2315 / 2173 / 2037.
  Trajectory -1.5 / 1.8 / 0 / -7.5 / -21.6 / -43.
- Hornady 80573 (7mm-08 139 SST): velocity 2950 / 2757 / 2572 / 2395 / 2224 / 2061.
  Trajectory -1.5 / 1.5 / 0 / -6.8 / -19.7 / -39.6.
- Hornady 80636 (7mm RM 162 ELD-X): velocity 2975 / 2827 / 2682 / 2542 / 2406 / 2274.
  Trajectory -1.5 / 1.4 / 0 / -6.3 / -17.9 / -35.6.
- Hornady 80711 (7mm PRC 180 ELD Match): velocity 2975 / 2855 / 2739 / 2626 / 2516 / 2408.
  Trajectory -1.5 / 1.4 / 0 / -6 / -17.1 / -33.7.
- Hornady 80712 (7mm PRC 175 ELD-X): velocity 3000 / 2861 / 2727 / 2597 / 2470 / 2347.
  Trajectory -1.5 / 1.4 / 0 / -6 / -17.2 / -34.2.
- Hornady 80713 (7mm PRC 160 CX): velocity 3000 / 2840 / 2686 / 2537 / 2393 / 2254.
  Trajectory -1.5 / 1.5 / 0 / -6.2 / -17.9 / -35.6.
- Hornady 80536 (270 Win 145 ELD-X): velocity 2970 / 2796 / 2627 / 2465 / 2308 / 2157.
  Trajectory -1.5 / 1.5 / 0 / -6.5 / -18.8 / -37.6.
- Hornady 80543 (270 Win 130 SST): velocity 3200 / 2984 / 2779 / 2583 / 2396 / 2216.
  Trajectory -1.5 / 1.2 / 0 / -5.7 / -16.7 / -33.7.

Federal tables: velocity fps and 10 mph wind drift in at muzzle / 100 / 200 / 300 / 400 / 500 yd;
long-range trajectory in, stated "zeroed at 100 yards. Sights 1.5 inches above bore line", at
50 / 100 / 200 / 300 / 400 / 500 yd (one cell is a zero-symbol image, marked [img]).

- Federal P7RTA1 (7mm RM 155 TA): velocity 3000 / 2837 / 2680 / 2528 / 2382 / 2240.
  Drift 0 / 0.5 / 2.1 / 4.7 / 8.6 / 13.9. Long-range path 0.5 / 1.4 / [img] / -6.2 / -17.9 / -35.7.
  Average-range path at 50 / 200 / 300 yd: -0.2 / -2.9 / -10.5.
- Federal P7PRCTA1 (7mm PRC 155 TA): velocity 3100 / 2933 / 2773 / 2618 / 2468 / 2324.
  Drift 0 / 0.4 / 1.9 / 4.5 / 8.2 / 13.2. Long-range path 0.4 / 1.3 / [img] / -5.8 / -16.7 / -33.2.
  Average-range path -0.3 / -2.6 / -9.7.
- Federal P270TA1 (270 Win 136 TA): velocity 3000 / 2807 / 2622 / 2445 / 2274 / 2111.
  Drift 0 / 0.6 / 2.5 / 5.7 / 10.5 / 17.1. Long-range path as extracted 0.5 / [img] / 1.5 / -6.5 /
  -18.8 / -38.0 (alignment suspect, see caveat). Average-range path -0.2 / -2.9 / -10.9.
- Federal F708FS1 (7mm-08 140 Fusion): velocity 2850 / 2615 / 2393 / 2181 / 1980 / 1791.
  Drift -0.0 / 0.9 / 3.4 / 8.0 / 14.9 / 24.3. Long-range path 0.7 / 1.8 / [img] / -7.9 / -23.2 /
  -47.2. Average-range path -0.2 / -3.6 / -13.3.

Remington tables: velocity fps and 10 mph drift in at muzzle / 100 / 200 / 300 / 400 / 500 yd;
average-range trajectory "zeroed at 100 yards, sights 1.5 inches above bore line" at
50 / 100 / 200 / 300 yd; long-range trajectory "zeroed at range indicated" at 50-500 yd.

- Remington 21337 (7mm-08 140 CL): velocity 2860 / 2625 / 2402 / 2190 / 1988 / 1798.
  Drift 0 / 0.9 / 3.4 / 8.0 / 14.9 / 24.2. Average path -0.2 / [img] / -3.5 / -13.2.
  Long-range path 0.7 / 1.8 / [img] / -7.9 / -23.0 / -46.8.
- Remington 28821 (7mm RM 140 CL): velocity 3175 / 2923 / 2684 / 2458 / 2243 / 2039.
  Drift 0 / 0.7 / 2.9 / 6.8 / 12.7 / 20.8. Average path -0.3 / [img] / -2.6 / -10.0.
  Long-range path 0.4 / 1.3 / [img] / -6.1 / -18.0 / -36.8.
- Remington 27808 (270 Win 130 CL): velocity 3060 / 2776 / 2509 / 2258 / 2021 / 1799.
  Drift 0.0 / 0.8 / 3.6 / 8.5 / 16.0 / 26.4. Average path -0.2 / [img] / -3.0 / -11.6.
  Long-range path 0.5 / 1.5 / -0.0 / -7.1 / -21.0 / -43.4.
- Nosler 47284 (7mm RM 160 AB), 24 in / 1-9.5 in barrel, velocity fps at muzzle / 100 / 200 / 300 /
  400 / 500 / 600 / 700 / 800 yd: 3000 / 2818 / 2643 / 2474 / 2312 / 2156 / 2006 / 1862 / 1726.
  Drop in, 100-yd zero: -1.5 / 0 / -2.9 / -10.8 / -24.3 / -44.4 / -71.9 / -108.1 / -154.4.
  Drop in, 200-yd zero: -1.5 / 1.4 / 0 / -6.4 / -18.5 / -37.2 / -63.3 / -98.1 / -142.9.
  Sight height not stated.

## Bullet diameter

All from ANSI/SAAMI Z299.4 CFR (2025 revision, approved 2025-02-10), cartridge & chamber drawings:
https://saami.org/wp-content/uploads/2026/04/SAAMI-Z299.4-CFR-2025-Centerfire-Rifle-Approved-2-10-2025-2026-04-27.pdf

- 7mm-08 Remington drawing (issued 04/21/1980, revised 02/18/2022): bullet .2845 -.0030 in.
  Bore .277 in, groove .2837 in. Twist as drawn 9.50 in RH, 6 grooves.
- 7mm Remington Magnum drawing (issued 04/21/1980, revised 12/06/2021): bullet .2845 -.0030 in.
  Bore .277 in, groove .2837 in. Twist 9.5 in RH, 6 grooves.
- 7mm PRC drawing (issued 06/07/2022): bullet .2844 -.0030 in. Bore .277 in, groove .284 in.
  Twist 8.00 in RH, 6 grooves.
- 270 Winchester drawing (issued 05/29/1979, revised 05/04/2022): bullet .278 -.003 in
  (7.06 - 0.08 mm) — SAAMI draws a .278 max / .275 min bullet, with the groove at .277 in and
  bore at .270 in. Twist 10.00 in RH, 4 grooves. The common ".277 bullet" figure matches the
  groove diameter, not the drawn bullet maximum.
