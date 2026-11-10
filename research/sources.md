# Sourced data (read 2026-11-10)

Manufacturer-published values only. BLANK means the maker does not publish it on a page we could
open. These feed `src/data/loads.json` and `rifle.json`. Scout will re-open each page and confirm
each number before it goes into the app.

## Rifle: Tikka T3x CTR .308 Win

- Current T3x CTR page: barrels 508 mm or 600 mm, twist 1:10". https://www.sako.global/rifle/t3x-compact-tactical-rifle
- 2014 T3 CTR sheet: twist 11", barrel 510 mm (20"). https://media.sako.global/image/upload/v1695721076/TIKKA_T3_CTR_dldro4.pdf
- No factory 16" barrel found on either. Twist for Beaux's rifle is unconfirmed: measure it.

## Bullets (.308)

| Bullet | G1 | G7 | Length | Source |
|---|---|---|---|---|
| Sierra 168 HPBT MatchKing #2200 | 0.462 | 0.224 | BLANK | https://sierrabullets.com/30-cal-168-gr-hpbt-matchking-smk/ |
| Sierra 175 HPBT MatchKing #2275 | 0.505 | 0.250 | BLANK | https://sierrabullets.com/30-cal-175-gr-hpbt-matchking-smk/ |
| Hornady 168 ELD Match #30506 | 0.523 | 0.263 | BLANK | https://www.hornady.com/bc |
| Hornady 178 ELD Match #30713 | 0.547 | 0.275 | BLANK | https://www.hornady.com/bc |
| Berger 168 Hybrid Target #30425 | 0.515 | 0.264 | 1.287" | https://bergerbullets.com/product/30-caliber-168-grain-hybrid-target/ |
| Berger 175 OTM Tactical #30105 | 0.512 | 0.263 | 1.261" | https://bergerbullets.com/product/30-caliber-175-grain-otm-tactical/ |
| Lapua 155 Scenar-L GB552 | 0.460 | 0.230 | BLANK | https://www.lapua.com/product/30-cal-scenar-l-bullet-gb552-100-g-155-gr-otm/ |
| Lapua 175 Scenar-L GB550 | 0.490 | 0.247 | BLANK | https://www.lapua.com/product/30-scenar-l-bullet-gb550-113-g-175-gr-otm/ |
| Nosler 168 Custom Competition #53164 | 0.462 | BLANK | 1.200" | https://www.nosler.com/30-caliber-168gr-hpbt-custom-competition-100ct.html |

- Hornady values are at Mach 2.25. At Mach 2.0 / 1.75: 168 gr 0.516/0.259 and 0.498/0.251; 178 gr
  0.527/0.265 and 0.506/0.254 (G1/G7).
- Sierra velocity-banded BCs: BLANK (not found on a Sierra page).
- Nosler: a catalog may list different figures (0.505, 1.240"). Not opened. Unverified.

## Factory match ammo

| Load | Muzzle velocity | Test barrel | Source |
|---|---|---|---|
| Federal GM308M (168 SMK) | 2650 fps | BLANK | https://www.federalpremium.com/rifle/gold-medal/gold-medal-sierra-matchking/11-GM308M.html |
| Federal GM308M2 (175 SMK) | 2600 fps | BLANK | https://www.federalpremium.com/rifle/gold-medal/gold-medal-sierra-matchking/11-GM308M2.html |
| Hornady 168 ELD Match #80966 | 2700 fps | 24" | https://www.hornady.com/ammunition/rifle/308-win-168-gr-eld-match |
| Hornady 178 BTHP Match #8105 | 2600 fps | 24" | https://www.hornady.com/ammunition/rifle/308-win-178-gr-bthp-match |
| Berger 175 OTM Tactical #60010 | 2668 fps | 26" | https://bergerbullets.com/product/308-winchester-175gr-otm-tactical/ |
| Lapua 155 Scenar-L 4317076 | 860 m/s | 26" | https://www.lapua.com/product/308-win-target-cartridge-scenar-l-10g-155gr-4317076/ |
| Lapua 175 Scenar-L 4317520 | 793 m/s | 26" | https://www.lapua.com/product/308-win-target-cartridge-scenar-l-113g-175gr-4317520/ |

## Velocity loss with barrel length (not manufacturer data)

Rifleshooter.com cut one .308 barrel from 28" to 16.5", one inch at a time.
https://rifleshooter.com/2014/12/308-winchester-7-62x51mm-nato-barrel-length-versus-velocity-28-to-16-5/

- Federal Gold Medal 168: 2706 fps at 28", 2466 fps at 16.5". Published average 20.9 fps per inch.
- Other loads in the test: 22.5 to 24.6 fps per inch.
- One barrel, one test, stopped at 16.5". These numbers came through a page summary and need a
  direct re-read before use.

## Drag tables

G1 (79 points) and G7 (84 points) from py-ballisticcalc `drag_tables.py`.
https://github.com/o-murphy/py-ballisticcalc — spot check: G1 0.5934 and G7 0.2980 at Mach 2.00.
