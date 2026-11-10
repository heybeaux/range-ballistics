"""Generate tests/reference/cases.json with py-ballisticcalc (an independent solver).

Run:  .venv/bin/python scripts/gen_reference.py
The TypeScript solver must match these rows within the tolerance in the spec.
Do not edit the output by hand. The numbers here are test vectors, not load data.

Conventions written to the file match src/solver/types.ts (SI, wind clock = where the
wind comes FROM, windage positive = right).
"""
import json
import math
import pathlib

import py_ballisticcalc as pbc
from py_ballisticcalc import Ammo, Atmo, Calculator, DragModel, Shot, Unit, Weapon, Wind

OUT = pathlib.Path(__file__).resolve().parent.parent / "tests" / "reference" / "cases.json"
YARD = 0.9144
GRAIN_KG = 0.00006479891
INCH = 0.0254

TABLES = {"G1": pbc.TableG1, "G7": pbc.TableG7}


def clock_to_pbc_degrees(clock: float) -> float:
    """py-ballisticcalc: direction_from 0 deg = from behind the shooter, 90 deg = from the left.
    Clock: 12 = from the target (headwind), 3 = from the right, 6 = from behind, 9 = from the left."""
    return (clock * 30.0 + 180.0) % 360.0


def build(case):
    dm = DragModel(
        case["bc"],
        TABLES[case["dragModel"]],
        weight=Unit.Grain(case["bulletGrains"]),
        diameter=Unit.Inch(case["bulletDiameterIn"]),
        length=Unit.Inch(case["bulletLengthIn"] or 0),
    )
    ammo = Ammo(dm, Unit.MPS(case["muzzleVelocityMps"]))
    twist_in = case["twistIn"] if case["spinDrift"] else 0
    weapon = Weapon(sight_height=Unit.Meter(case["sightHeightM"]), twist=Unit.Inch(twist_in))
    atmo = Atmo(
        altitude=Unit.Meter(0),
        pressure=Unit.hPa(case["pressurePa"] / 100.0),
        temperature=Unit.Celsius(case["temperatureK"] - 273.15),
        humidity=case["relativeHumidity"],
    )
    calc = Calculator()
    zero_shot = Shot(ammo=ammo, atmo=atmo, weapon=weapon)
    calc.set_weapon_zero(zero_shot, Unit.Meter(case["zeroRangeM"]))
    winds = []
    if case["windSpeedMps"] > 0:
        winds = [Wind(Unit.MPS(case["windSpeedMps"]), Unit.Degree(clock_to_pbc_degrees(case["windClock"])))]
    shot = Shot(
        ammo=ammo,
        atmo=atmo,
        weapon=weapon,
        winds=winds,
        look_angle=Unit.Degree(case["shotAngleDeg"]),
    )
    return calc, shot, weapon


def run(case):
    calc, shot, weapon = build(case)
    rows = []
    max_yd = case["maxRangeYd"]
    result = calc.fire(shot, Unit.Yard(max_yd), Unit.Yard(100))
    # Sight-offset convention. py-ballisticcalc keeps the scope vertically above the bore on a
    # slope. Our contract (types.ts) tilts the rifle with the line of sight, so the scope sits at
    # right angles to it. Same trajectory, different measuring origin:
    #   range_ours = range_pbc + h * sin(theta);  path_ours = path_pbc + h * (cos(theta) - 1)
    theta = math.radians(case["shotAngleDeg"])
    d_range = case["sightHeightM"] * math.sin(theta)
    d_path = case["sightHeightM"] * (math.cos(theta) - 1.0)
    for row in result.trajectory:
        slant_m = (row.slant_distance >> Unit.Meter) + d_range
        if slant_m < 1:
            continue
        rows.append(
            {
                "rangeM": round(slant_m, 4),
                "pathM": round((row.slant_height >> Unit.Meter) + d_path, 5),
                "windageM": round(row.windage >> Unit.Meter, 5),
                "speedMps": round(row.velocity >> Unit.MPS, 3),
                "timeS": round(row.time, 5),
                "mach": round(row.mach, 4),
            }
        )
    return {
        "name": case["name"],
        "input": {
            "muzzleVelocityMps": case["muzzleVelocityMps"],
            "bc": case["bc"],
            "dragModel": case["dragModel"],
            "bulletMassKg": case["bulletGrains"] * GRAIN_KG,
            "bulletDiameterM": case["bulletDiameterIn"] * INCH,
            "bulletLengthM": case["bulletLengthIn"] * INCH if case["bulletLengthIn"] else None,
            "twistM": case["twistIn"] * INCH,
            "twistDirection": "right",
            "sightHeightM": case["sightHeightM"],
            "zeroRangeM": case["zeroRangeM"],
            "maxRangeM": round(max(r["rangeM"] for r in rows) + 1.0, 4),
            "shotAngleRad": math.radians(case["shotAngleDeg"]),
            "atmosphere": {
                "temperatureK": case["temperatureK"],
                "pressurePa": case["pressurePa"],
                "relativeHumidity": case["relativeHumidity"],
            },
            "wind": {"speedMps": case["windSpeedMps"], "clock": case["windClock"]},
            "spinDrift": case["spinDrift"],
            "coriolis": None,
        },
        "zeroAngleRad": round(weapon.zero_elevation >> Unit.Radian, 8),
        "rows": rows,
    }


BASE = dict(
    bulletDiameterIn=0.308,
    bulletLengthIn=None,
    twistIn=11.0,
    sightHeightM=0.05,
    zeroRangeM=91.44,
    maxRangeYd=1000,
    shotAngleDeg=0.0,
    temperatureK=288.15,
    pressurePa=101325.0,
    relativeHumidity=0.0,
    windSpeedMps=0.0,
    windClock=3.0,
    spinDrift=False,
)
G7_175 = dict(dragModel="G7", bc=0.243, bulletGrains=175, muzzleVelocityMps=750.0)
G1_168 = dict(dragModel="G1", bc=0.462, bulletGrains=168, muzzleVelocityMps=765.0)
G7_155 = dict(dragModel="G7", bc=0.236, bulletGrains=155, muzzleVelocityMps=820.0)

CASES = [
    dict(BASE, **G7_175, name="g7-175-standard-no-wind"),
    dict(BASE, **G1_168, name="g1-168-standard-no-wind"),
    dict(BASE, **G7_155, name="g7-155-standard-no-wind"),
    dict(BASE, **G7_175, name="g7-175-wind-4.5mps-from-3", windSpeedMps=4.4704, windClock=3.0),
    dict(BASE, **G7_175, name="g7-175-wind-4.5mps-from-9", windSpeedMps=4.4704, windClock=9.0),
    dict(BASE, **G1_168, name="g1-168-wind-6.7mps-from-1:30", windSpeedMps=6.7056, windClock=1.5),
    dict(BASE, **G7_175, name="g7-175-headwind-8.9mps", windSpeedMps=8.9408, windClock=12.0),
    dict(BASE, **G7_175, name="g7-175-tailwind-8.9mps", windSpeedMps=8.9408, windClock=6.0),
    dict(BASE, **G7_175, name="g7-175-altitude-1500m-5C", temperatureK=278.15, pressurePa=84556.0),
    dict(BASE, **G1_168, name="g1-168-altitude-2500m-0C", temperatureK=273.15, pressurePa=74683.0),
    dict(BASE, **G7_175, name="g7-175-hot-35C", temperatureK=308.15),
    dict(BASE, **G7_175, name="g7-175-cold-minus-20C", temperatureK=253.15),
    dict(BASE, **G7_175, name="g7-175-humid-30C-90pct", temperatureK=303.15, relativeHumidity=0.9),
    dict(BASE, **G7_175, name="g7-175-uphill-15deg", shotAngleDeg=15.0),
    dict(BASE, **G7_175, name="g7-175-downhill-20deg", shotAngleDeg=-20.0),
    dict(BASE, **G1_168, name="g1-168-uphill-30deg-wind", shotAngleDeg=30.0, windSpeedMps=4.4704, windClock=9.0),
    dict(BASE, **G7_175, name="g7-175-zero-200yd-high-scope", zeroRangeM=182.88, sightHeightM=0.07),
    dict(BASE, **G7_175, name="g7-175-spin-drift-right-twist", bulletLengthIn=1.24, spinDrift=True),
    dict(BASE, **G1_168, name="g1-168-spin-drift-with-wind", bulletLengthIn=1.215, spinDrift=True,
         windSpeedMps=4.4704, windClock=9.0),
]

if __name__ == "__main__":
    out = {
        "generator": f"py-ballisticcalc {pbc.__version__ if hasattr(pbc, '__version__') else ''}".strip(),
        "note": "Generated by scripts/gen_reference.py. Do not edit by hand.",
        "cases": [run(c) for c in CASES],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=1) + "\n")
    print(f"wrote {OUT} with {len(out['cases'])} cases")
