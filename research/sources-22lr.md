# .22 Long Rifle: sourced data (read 2026-11-10)

Manufacturer pages only. NOT PUBLISHED means the maker does not give it on a page we opened.
Each value needs a second direct re-read before it goes into `loads.json`.

## Loads

| Load | Part no. | Bullet | Muzzle velocity | Test barrel | BC (drag model) | Source |
|---|---|---|---|---|---|---|
| CCI Standard Velocity | 32 | 40 gr lead round nose | 1070 fps | NOT PUBLISHED | 0.120 (model not stated) | https://www.cci-ammunition.com/rimfire/cci/standard-velocity/6-32.html |
| CCI Green Tag | 33 | 40 gr lead round nose | 1070 fps | NOT PUBLISHED | 0.120 (model not stated) | https://www.cci-ammunition.com/rimfire/cci/green-tag/6-33.html |
| CCI Target Mini-Mag | 30 | 40 gr copper-plated round nose | 1235 fps | NOT PUBLISHED | 0.130 (model not stated) | https://www.cci-ammunition.com/rimfire/cci/target-mini-mag/6-30.html |
| Federal Gold Medal Rimfire | 711B | 40 gr lead round nose | 1080 fps | NOT PUBLISHED | 0.138 (model not stated) | https://www.federalpremium.com/rimfire/gold-medal/gold-medal-rimfire/11-711B.html |
| Federal Gold Medal Rimfire | 719 | 40 gr lead round nose | 1200 fps | NOT PUBLISHED | 0.138 (model not stated) | https://www.federalpremium.com/rimfire/gold-medal/gold-medal-rimfire/11-719.html |
| Lapua Center-X | 420163 | 2.59 g (40 gr) | 327 m/s | 660 mm (26 in) | 0.172 (G1) | https://www.lapua.com/product/22-lr-lapua-center-x-rimfire-ammo/ |
| Lapua Midas+ | 420162 | 2.59 g (40 gr) | 327 m/s | 660 mm (26 in) | 0.172 (G1) | https://www.lapua.com/product/22-lr-lapua-midas-plus-rimfire-ammo/ |
| Lapua Long Range | 420168 | 2.59 g (40 gr) | 337 m/s | NOT PUBLISHED | 0.172 (G1) | https://www.lapua.com/product/22-lr-lapua-long-range-rimfire-ammo/ |
| SK Standard Plus | 420101 | 2.59 g (40 gr) | 327 m/s | 660 mm (26 in) | not on product page | https://sk-ammunition.com/products/standard-plus/ |
| SK Rifle Match | 420108 | 2.59 g (40 gr) | 327 m/s | 660 mm (26 in) | not on product page | https://sk-ammunition.com/products/rifle-match/ |
| SK Long Range Match | 420158 | 2.59 g (40 gr) | 335 m/s | 660 mm (26 in) | not on product page | https://sk-ammunition.com/products/long-range-match/ |
| Eley Tenex / Match / Club | NOT PUBLISHED | 2.59 g (40 gr) | band 317-330 m/s | NOT PUBLISHED | 0.112 (RA4, not G1) | https://eley.co.uk/eley-tenex/ |
| RWS R 50 | 2134187 | 2.6 g lead round nose | 330 m/s | 650 mm | 0.136 (model not stated) | https://rws-ammunition.com/en/products/rimfire-cartridges/rws-r-50 |

- Lapua: "BC G1 for all rimfire .22 LR bullets = 0.172", calculated, not measured per load.
- SK brochure: "BC G1 for round nose bullets = 0.172", "Flatnose = 0.139". It does not say which
  nose each load has, so the per-load BC is unverified.
- Eley publishes an RA4 BC only, and a velocity band. Eley says to use the velocity printed on the
  box. https://eley.co.uk/what-muzzle-velocity-and-bc-should-i-enter-in-my-ballistic-solver-for-eley/
- Federal UltraMatch: product page not found.
- Bullet length: NOT PUBLISHED by any maker opened. No stability factor or spin drift for .22 LR
  until the user measures a bullet.

## Published downrange tables (for solver cross-checks)

- CCI Standard Velocity, velocity fps at muzzle / 50 / 75 / 100 yd: 1070 / 977 / 940 / 908.
- CCI Target Mini-Mag: 1235 / 1092 / 1040 / 998.
- Federal 711B, muzzle / 50 / 100 / 150 yd: 1080 / 994 / 930 / 878. 50 yd zero, sights 1.5 in:
  path at 100 / 150 yd -7.3 / -24.5 in. 10 mph drift at 50 / 100 / 150 yd: 1.1 / 4.2 / 8.9 in.
- Federal 719: 1200 / 1075 / 991 / 928. Path -6.0 / -20.8 in. Drift 1.3 / 4.9 / 10.6 in.
- Lapua Center-X, Midas+, SK Standard Plus, SK Rifle Match (same table), m/s at 0 / 50 / 100 m:
  327 / 304 / 284. Sight 40 mm; 50 m zero: path at 100 m -224 mm. 4 m/s crosswind drift at
  50 / 100 m: 24 / 98 mm.
- SK Long Range Match, m/s at 0 / 50 / 100 / 150 / 200 m: 335 / 311 / 290 / 270 / 252. 50 m zero:
  path at 100 / 150 / 200 m -214 / -719 / -1562 mm. Drift 24 / 97 / 221 / 401 mm.
- RWS R 50, m/s at 0 / 50 / 100 m: 330 / 294 / 271.

## Bullet diameter

- SAAMI Z299.1 (R2026), 22 Long Rifle Match drawing: bullet ".2255 - .0040" in (maximum with a
  minus tolerance). Twist 16 in.
  https://saami.org/wp-content/uploads/2026/05/SAAMI-Z299.1-R2026-Rimfire-FINAL-Approved-2026-05-08.pdf
- CIP TAB. V: projectile 5.72 mm maximum.

## Barrel length and velocity (not manufacturer data)

Ballistics By The Inch cut one barrel from 18 in to 2 in, three shots per length.
http://www.ballisticsbytheinch.com/22.html
CCI Mini-Mag: 1212 fps at 18 in, 1207 at 16 in, 1224 at 14 in, 1221 at 12 in, 1169 at 10 in.
Velocity is flat within shot-to-shot noise from about 12 in to 18 in. The test stops at 18 in and
used no match or subsonic load. Conclusion for the app: no per-inch correction for .22 LR.
