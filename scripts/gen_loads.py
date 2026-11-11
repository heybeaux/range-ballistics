"""Build src/data/loads.json and src/data/rifle.json from research/sources.md values.

Every number here was read from the page named next to it on READ_ON and re-checked against the
page text the same day. None is typed from memory. A value the maker does not publish is None.
Run: python3 scripts/gen_loads.py
"""
import json
from pathlib import Path

READ_ON = "2026-11-10"
IN = 0.0254
FT = 0.3048
GR = 0.00006479891
DIAMETER_M = round(0.308 * IN, 7)

ICAO = "BC quoted by the bullet maker. Makers use different standard atmospheres; the difference is about 2%."
SIERRA = "Sierra quotes BCs against Army Standard Metro, most other makers against ICAO. The difference is about 2%."


def sourced(value, url):
    if value is None:
        return {"value": None, "sourceUrl": None, "readOn": None}
    return {"value": value, "sourceUrl": url, "readOn": READ_ON}


def load(id_, name, grains, g1, g7, bc_url, length_in, length_url, fps, mps, vel_url, barrel_in, note):
    velocity = mps if mps is not None else (round(fps * FT, 2) if fps is not None else None)
    return {
        "id": id_,
        "name": name,
        "bulletMassKg": round(grains * GR, 8),
        "bulletDiameterM": DIAMETER_M,
        "bulletLengthM": sourced(None if length_in is None else round(length_in * IN, 6), length_url),
        "bcG1": sourced(g1, bc_url),
        "bcG7": sourced(g7, bc_url),
        "publishedVelocityMps": sourced(velocity, vel_url),
        "testBarrelM": None if barrel_in is None else round(barrel_in * IN, 4),
        "note": note,
    }


FED168 = "https://www.federalpremium.com/rifle/gold-medal/gold-medal-sierra-matchking/11-GM308M.html"
FED175 = "https://www.federalpremium.com/rifle/gold-medal/gold-medal-sierra-matchking/11-GM308M2.html"
SMK168 = "https://sierrabullets.com/30-cal-168-gr-hpbt-matchking-smk/"
SMK175 = "https://sierrabullets.com/30-cal-175-gr-hpbt-matchking-smk/"
HBC = "https://www.hornady.com/bc"
HOR168 = "https://www.hornady.com/ammunition/rifle/308-win-168-gr-eld-match"
HOR178 = "https://www.hornady.com/ammunition/rifle/308-win-178-gr-bthp-match"
BER175A = "https://bergerbullets.com/product/308-winchester-175gr-otm-tactical/"
BER168 = "https://bergerbullets.com/product/30-caliber-168-grain-hybrid-target/"
BER175 = "https://bergerbullets.com/product/30-caliber-175-grain-otm-tactical/"
LAP155A = "https://www.lapua.com/product/308-win-target-cartridge-scenar-l-10g-155gr-4317076/"
LAP175A = "https://www.lapua.com/product/308-win-target-cartridge-scenar-l-113g-175gr-4317520/"
LAP155 = "https://www.lapua.com/product/30-cal-scenar-l-bullet-gb552-100-g-155-gr-otm/"
LAP175 = "https://www.lapua.com/product/30-scenar-l-bullet-gb550-113-g-175-gr-otm/"
NOS168 = "https://www.nosler.com/30-caliber-168gr-hpbt-custom-competition-100ct.html"
RIFLESHOOTER = "https://rifleshooter.com/2014/12/308-winchester-7-62x51mm-nato-barrel-length-versus-velocity-28-to-16-5/"

FED_NOTE = (
    "Federal does not state its test barrel length, so the app cannot work out a 16 inch estimate "
    "for this load. The starting velocity is Federal's published figure and is probably high for a "
    "16 inch barrel. "
)

LOADS = [
    # Factory match ammunition
    load("federal-gm308m", "Federal Gold Medal 168 gr Sierra MatchKing (GM308M)", 168, 0.462, 0.224, SMK168,
         1.220, FED168, 2650, None, FED168, None,
         FED_NOTE + "One independent test measured 2466 fps for this load from a 16.5 inch barrel "
         "(Rifleshooter.com, one barrel). " + SIERRA),
    load("federal-gm308m2", "Federal Gold Medal 175 gr Sierra MatchKing (GM308M2)", 175, 0.505, 0.250, SMK175,
         1.242, FED175, 2600, None, FED175, None, FED_NOTE + SIERRA),
    load("hornady-80966", "Hornady Match 168 gr ELD Match (80966)", 168, 0.523, 0.263, HBC,
         None, None, 2700, None, HOR168, 24,
         "Hornady quotes these BCs at Mach 2.25. At Mach 1.75 it quotes G1 0.498 and G7 0.251, so real "
         "drop at long range will be a little more than shown."),
    load("hornady-8105", "Hornady Match 178 gr BTHP (8105)", 178, None, None, None,
         None, None, 2600, None, HOR178, 24,
         "Hornady's page for this load does not give a BC. Type the BC from your ammunition box before solving."),
    load("berger-60010", "Berger 175 gr OTM Tactical (60010)", 175, 0.512, 0.263, BER175A,
         1.261, BER175, 2668, None, BER175A, 26, ICAO),
    load("lapua-4317076", "Lapua 155 gr Scenar-L (4317076)", 155, 0.460, 0.230, LAP155A,
         None, None, None, 860, LAP155A, 26, ICAO),
    load("lapua-4317520", "Lapua 175 gr Scenar-L (4317520)", 175, 0.490, 0.247, LAP175A,
         None, None, None, 793, LAP175A, 26, ICAO),
    # Component bullets for handloads: no factory velocity, so the user must enter one.
    load("bullet-berger-30425", "Handload: Berger 168 gr Hybrid Target (30425)", 168, 0.515, 0.264, BER168,
         1.287, BER168, None, None, None, None, "Component bullet. Enter your own chronograph velocity."),
    load("bullet-hornady-178-eldm", "Handload: Hornady 178 gr ELD Match", 178, 0.547, 0.275, HBC,
         None, None, None, None, None, None,
         "Component bullet. Enter your own chronograph velocity. BCs are Hornady's Mach 2.25 figures."),
    load("bullet-nosler-53164", "Handload: Nosler 168 gr Custom Competition (53164)", 168, 0.462, None, NOS168,
         1.200, NOS168, None, None, None, None,
         "Component bullet. Enter your own chronograph velocity. Nosler does not publish a G7 BC."),
]

LIBRARY = {
    "loads": LOADS,
    # 20.9 fps per inch of barrel, converted to m/s per metre of barrel.
    "velocityLossMpsPerM": sourced(round(20.9 * FT / IN, 2), RIFLESHOOTER),
    "velocityLossNote": (
        "Rifleshooter.com cut one .308 barrel from 28 to 16.5 inches and measured Federal Gold Medal "
        "168 gr at each length: 20.9 fps lost per inch on average. It is one barrel and one test, "
        "not manufacturer data. Your rifle will differ, so chronograph your load."
    ),
}

RIFLE = {
    "name": "Tikka T3x CTR .308 Win, 16 inch",
    "barrelLengthM": round(16 * IN, 4),
    "twistM": round(11 * IN, 4),
    "twistDirection": "right",
    "twistConfirmed": False,
    "sightHeightM": round(1.75 * IN, 5),
    "zeroRangeM": round(100 * 0.9144, 2),
    "angleUnit": "MIL",
    "clickValue": 0.1,
    "twistSources": [
        {"label": "1:11 inch, 2014 Tikka T3 CTR specification sheet (20 inch barrel)",
         "url": "https://media.sako.global/image/upload/v1695721076/TIKKA_T3_CTR_dldro4.pdf", "readOn": READ_ON},
        {"label": "1:10 inch, current Tikka T3x CTR page (20 and 24 inch barrels)",
         "url": "https://www.sako.global/rifle/t3x-compact-tactical-rifle", "readOn": READ_ON},
    ],
    "twistNote": (
        "Tikka's own figures disagree and neither lists a 16 inch barrel, so this twist is unconfirmed. "
        "To measure it: push a tight patch on a cleaning rod into the bore, mark the rod at the muzzle "
        "and put a tape flag on the handle, push until the flag has made one full turn, and measure "
        "how far the mark moved. That distance in inches is your twist."
    ),
    "sightHeightNote": "1.75 inches is a typical scope height, not a measurement. Measure from the centre of the bolt to the centre of the scope tube.",
}

out = Path(__file__).resolve().parent.parent / "src" / "data"
(out / "loads.json").write_text(json.dumps(LIBRARY, indent=2) + "\n")
(out / "rifle.json").write_text(json.dumps(RIFLE, indent=2) + "\n")
print("wrote", len(LOADS), "loads; loss", LIBRARY["velocityLossMpsPerM"]["value"], "m/s per m")
