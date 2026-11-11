"""Generate tests/reference/cases-cartridges.json: reference shots for .22 LR, .223 Remington,
and 5.56x45 NATO, including the RA4 drag model, from py-ballisticcalc (an independent solver).

Run:  .venv/bin/python scripts/gen_reference_cartridges.py
These are test vectors, not load data. Do not edit the output by hand.
"""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import gen_reference as g  # noqa: E402

OUT = pathlib.Path(__file__).resolve().parent.parent / "tests" / "reference" / "cases-cartridges.json"

RIMFIRE = dict(
    g.BASE, bulletDiameterIn=0.2255, twistIn=16.0, sightHeightM=0.0381, zeroRangeM=45.72,
    maxRangeYd=200, stepYd=25, bulletGrains=40,
)
CENTREFIRE_224 = dict(g.BASE, bulletDiameterIn=0.224, twistIn=8.0, sightHeightM=0.0635, maxRangeYd=800)

# The 2026-11-11 cartridges. BC, muzzle velocity, grains, and bullet length are the library
# loads' sourced values (research/selection-top-15.md); diameter and twist are the cartridge
# entries'. Velocities are the published fps times 0.3048, rounded to 2 decimals as in loads.json.
CF_65 = dict(g.BASE, bulletDiameterIn=0.264, twistIn=8.0, sightHeightM=0.0635, maxRangeYd=1000)
CF_243 = dict(g.BASE, bulletDiameterIn=0.243, twistIn=10.0, sightHeightM=0.0635, maxRangeYd=1000)
CF_7MM = dict(g.BASE, bulletDiameterIn=0.284, twistIn=9.5, sightHeightM=0.0635, maxRangeYd=1000)
CF_270 = dict(g.BASE, bulletDiameterIn=0.277, twistIn=10.0, sightHeightM=0.0635, maxRangeYd=1000)
CF_30 = dict(g.BASE, bulletDiameterIn=0.308, twistIn=10.0, sightHeightM=0.0635, maxRangeYd=1000)
CF_450 = dict(g.BASE, bulletDiameterIn=0.452, twistIn=24.0, sightHeightM=0.0635, maxRangeYd=300, stepYd=30)

CASES = [
    # .22 LR
    dict(RIMFIRE, name="22lr-g1-subsonic-no-wind", dragModel="G1", bc=0.138, muzzleVelocityMps=329.0),
    dict(RIMFIRE, name="22lr-g1-subsonic-wind-4.5mps-from-3", dragModel="G1", bc=0.138, muzzleVelocityMps=329.0,
         windSpeedMps=4.4704, windClock=3.0),
    dict(RIMFIRE, name="22lr-g1-high-velocity-no-wind", dragModel="G1", bc=0.130, muzzleVelocityMps=376.0),
    dict(RIMFIRE, name="22lr-g1-high-velocity-wind-from-9-cold", dragModel="G1", bc=0.130, muzzleVelocityMps=376.0,
         windSpeedMps=3.0, windClock=9.0, temperatureK=268.15),
    dict(RIMFIRE, name="22lr-g1-0172-zero-100m-altitude", dragModel="G1", bc=0.172, muzzleVelocityMps=327.0,
         zeroRangeM=100.0, pressurePa=85000.0, temperatureK=283.15),
    dict(RIMFIRE, name="22lr-ra4-subsonic-no-wind", dragModel="RA4", bc=0.112, muzzleVelocityMps=325.0),
    dict(RIMFIRE, name="22lr-ra4-subsonic-wind-4.5mps-from-3", dragModel="RA4", bc=0.112, muzzleVelocityMps=325.0,
         windSpeedMps=4.4704, windClock=3.0),
    dict(RIMFIRE, name="22lr-ra4-high-velocity-hot", dragModel="RA4", bc=0.112, muzzleVelocityMps=370.0,
         temperatureK=303.15),
    # .223 Remington / 5.56x45 NATO
    dict(CENTREFIRE_224, name="224-g7-77gr-no-wind", dragModel="G7", bc=0.188, bulletGrains=77, muzzleVelocityMps=829.0),
    dict(CENTREFIRE_224, name="224-g7-77gr-wind-4.5mps-from-3", dragModel="G7", bc=0.188, bulletGrains=77,
         muzzleVelocityMps=829.0, windSpeedMps=4.4704, windClock=3.0),
    dict(CENTREFIRE_224, name="224-g7-73gr-altitude-1500m", dragModel="G7", bc=0.200, bulletGrains=73,
         muzzleVelocityMps=850.0, pressurePa=84556.0, temperatureK=278.15),
    dict(CENTREFIRE_224, name="224-g1-55gr-no-wind", dragModel="G1", bc=0.269, bulletGrains=55, muzzleVelocityMps=987.5),
    dict(CENTREFIRE_224, name="224-g1-55gr-wind-6.7mps-from-1:30", dragModel="G1", bc=0.246, bulletGrains=55,
         muzzleVelocityMps=965.0, windSpeedMps=6.7056, windClock=1.5),
    dict(CENTREFIRE_224, name="224-g1-62gr-16in-uphill-10deg", dragModel="G1", bc=0.304, bulletGrains=62,
         muzzleVelocityMps=890.0, shotAngleDeg=10.0),
    dict(CENTREFIRE_224, name="224-g7-77gr-spin-drift", dragModel="G7", bc=0.192, bulletGrains=77,
         muzzleVelocityMps=838.0, bulletLengthIn=1.015, spinDrift=True),
    # 6.5 Creedmoor: Hornady 81500 (G7) and Federal GM65CRDBH2 (G1, published bullet length)
    dict(CF_65, name="65cm-g7-140gr-no-wind", dragModel="G7", bc=0.326, bulletGrains=140, muzzleVelocityMps=826.01),
    dict(CF_65, name="65cm-g1-140gr-wind-4.5mps-from-3", dragModel="G1", bc=0.607, bulletGrains=140,
         muzzleVelocityMps=830.58, windSpeedMps=4.4704, windClock=3.0),
    dict(CF_65, name="65cm-g1-140gr-spin-drift", dragModel="G1", bc=0.607, bulletGrains=140,
         muzzleVelocityMps=830.58, bulletLengthIn=1.407, spinDrift=True),
    # 6.5 PRC: Hornady 81620 (G7) and Berger 50010 (G1)
    dict(CF_65, name="65prc-g7-147gr-no-wind", dragModel="G7", bc=0.351, bulletGrains=147, muzzleVelocityMps=886.97),
    dict(CF_65, name="65prc-g1-156gr-wind-4.5mps-from-9", dragModel="G1", bc=0.679, bulletGrains=156,
         muzzleVelocityMps=883.92, windSpeedMps=4.4704, windClock=9.0),
    # .243 Winchester: Hornady 80462 (G7) and Federal F243FS1 (G1)
    dict(CF_243, name="243-g7-90gr-no-wind", dragModel="G7", bc=0.206, bulletGrains=90, muzzleVelocityMps=960.12),
    dict(CF_243, name="243-g1-95gr-wind-4.5mps-from-3", dragModel="G1", bc=0.376, bulletGrains=95,
         muzzleVelocityMps=908.3, windSpeedMps=4.4704, windClock=3.0),
    # 7mm-08 Remington: Hornady 85578 (G7) and Federal F708FS1 (G1)
    dict(CF_7MM, name="7mm08-g7-150gr-no-wind", dragModel="G7", bc=0.289, bulletGrains=150, muzzleVelocityMps=844.3),
    dict(CF_7MM, name="7mm08-g1-140gr-wind-4.5mps-from-3", dragModel="G1", bc=0.390, bulletGrains=140,
         muzzleVelocityMps=868.68, windSpeedMps=4.4704, windClock=3.0),
    # 7mm Remington Magnum: Hornady 80636 (G7) and Federal P7RTA1 (G1)
    dict(CF_7MM, name="7rm-g7-162gr-no-wind", dragModel="G7", bc=0.318, bulletGrains=162, muzzleVelocityMps=906.78),
    dict(CF_7MM, name="7rm-g1-155gr-wind-6.7mps-from-1:30", dragModel="G1", bc=0.586, bulletGrains=155,
         muzzleVelocityMps=914.4, windSpeedMps=6.7056, windClock=1.5),
    # 7mm PRC: Hornady 80711 (G7, slower-twist chart row) and Federal P7PRCTA1 (G1); SAAMI twist 8 in
    dict(CF_7MM, name="7prc-g7-180gr-no-wind", dragModel="G7", bc=0.391, bulletGrains=180,
         muzzleVelocityMps=906.78, twistIn=8.0),
    dict(CF_7MM, name="7prc-g1-155gr-wind-4.5mps-from-3", dragModel="G1", bc=0.586, bulletGrains=155,
         muzzleVelocityMps=944.88, twistIn=8.0, windSpeedMps=4.4704, windClock=3.0),
    # .270 Winchester: Hornady 80536 (G7) and Remington 27808 (G1)
    dict(CF_270, name="270-g7-145gr-no-wind", dragModel="G7", bc=0.270, bulletGrains=145, muzzleVelocityMps=905.26),
    dict(CF_270, name="270-g1-130gr-wind-4.5mps-from-3", dragModel="G1", bc=0.336, bulletGrains=130,
         muzzleVelocityMps=932.69, windSpeedMps=4.4704, windClock=3.0),
    # .30-06 Springfield: Hornady 81174 (G7) and Federal GM3006M (G1)
    dict(CF_30, name="3006-g7-178gr-no-wind", dragModel="G7", bc=0.278, bulletGrains=178, muzzleVelocityMps=838.2),
    dict(CF_30, name="3006-g1-168gr-wind-4.5mps-from-3", dragModel="G1", bc=0.463, bulletGrains=168,
         muzzleVelocityMps=822.96, windSpeedMps=4.4704, windClock=3.0),
    # .300 Winchester Magnum: Hornady 82002 (G7) and Federal GM300WM (G1)
    dict(CF_30, name="300wm-g7-200gr-no-wind", dragModel="G7", bc=0.301, bulletGrains=200, muzzleVelocityMps=871.73),
    dict(CF_30, name="300wm-g1-190gr-wind-4.5mps-from-3", dragModel="G1", bc=0.533, bulletGrains=190,
         muzzleVelocityMps=883.92, windSpeedMps=4.4704, windClock=3.0),
    # .300 PRC: Hornady 82162 (G7, slower-twist chart row) and Berger 55030 (G1); SAAMI twist 8.5 in
    dict(CF_30, name="300prc-g7-225gr-no-wind", dragModel="G7", bc=0.391, bulletGrains=225,
         muzzleVelocityMps=856.49, twistIn=8.5),
    dict(CF_30, name="300prc-g1-215gr-altitude-1500m", dragModel="G1", bc=0.691, bulletGrains=215,
         muzzleVelocityMps=896.11, twistIn=8.5, pressurePa=84556.0, temperatureK=278.15),
    # .450 Bushmaster (300 yd cartridge): Federal F450BMFS1 and 450BMB, both G1
    dict(CF_450, name="450bm-g1-260gr-no-wind", dragModel="G1", bc=0.180, bulletGrains=260, muzzleVelocityMps=670.56),
    dict(CF_450, name="450bm-g1-300gr-wind-4.5mps-from-3", dragModel="G1", bc=0.225, bulletGrains=300,
         muzzleVelocityMps=579.12, windSpeedMps=4.4704, windClock=3.0),
]

if __name__ == "__main__":
    out = {
        "generator": f"py-ballisticcalc {g.pbc.__version__ if hasattr(g.pbc, '__version__') else ''}".strip(),
        "note": "Generated by scripts/gen_reference_cartridges.py. Do not edit by hand.",
        "cases": [g.run(c) for c in CASES],
    }
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    print(f"wrote {OUT} with {len(out['cases'])} cases, {sum(len(c['rows']) for c in out['cases'])} rows")

    # RA4 drag table, from the same py-ballisticcalc source as G1 and G7.
    ra4 = {
        "model": "RA4",
        "source": "https://github.com/o-murphy/py-ballisticcalc/blob/master/py_ballisticcalc/drag_tables.py",
        "points": [[p["Mach"], p["CD"]] for p in g.pbc.TableRA4],
    }
    (OUT.parent.parent.parent / "src" / "data" / "ra4.json").write_text(json.dumps(ra4) + "\n")
    print("wrote ra4.json with", len(ra4["points"]), "points")
