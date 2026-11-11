"""Build src/data/loads.json, src/data/rifle.json and src/data/scopes.json.

Every number here was read from the page named next to it on READ_ON and checked a second time
against the page text. None is typed from memory. A value the maker does not publish is None.
The research notes are in research/. Run: python3 scripts/gen_loads.py
"""
import json
from pathlib import Path

READ_ON = "2026-11-10"
READ_ON_2 = "2026-11-11"
IN = 0.0254
FT = 0.3048
YD = 0.9144
GR = 0.00006479891

ICAO = "BC quoted by the bullet maker. Makers use different standard atmospheres; the difference is about 2%."
SIERRA = "Sierra quotes BCs against Army Standard Metro, most other makers against ICAO. The difference is about 2%."


def sourced(value, url, read_on=READ_ON):
    if value is None:
        return {"value": None, "sourceUrl": None, "readOn": None}
    return {"value": value, "sourceUrl": url, "readOn": read_on}


def quote(text, url, read_on=READ_ON):
    return {"text": text, "sourceUrl": url, "readOn": read_on}


def load(id_, cartridge, name, grains, diameter_in, *, g1=None, g7=None, ra4=None, bc_url=None,
         model_stated=True, length_in=None, length_url=None, fps=None, mps=None, vel_url=None,
         barrel_in=None, by_barrel=(), note=None, read_on=READ_ON):
    """by_barrel: (barrel inches, fps) pairs the maker publishes for the same load."""
    velocity = mps if mps is not None else (round(fps * FT, 2) if fps is not None else None)
    return {
        "id": id_,
        "cartridgeId": cartridge,
        "name": name,
        "bulletMassKg": round(grains * GR, 8),
        "bulletDiameterM": round(diameter_in * IN, 7),
        "bulletLengthM": sourced(None if length_in is None else round(length_in * IN, 6), length_url, read_on),
        "bcG1": sourced(g1, bc_url, read_on),
        "bcG7": sourced(g7, bc_url, read_on),
        "bcRA4": sourced(ra4, bc_url, read_on),
        "bcModelStated": model_stated,
        "publishedVelocityMps": sourced(velocity, vel_url, read_on),
        "testBarrelM": None if barrel_in is None else round(barrel_in * IN, 4),
        "velocityByBarrel": [
            {"barrelM": round(b * IN, 4), "velocityMps": round(v * FT, 2)} for b, v in sorted(by_barrel)
        ],
        "note": note,
    }


# ---------------------------------------------------------------- .308 Winchester
D308 = 0.308
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
NOS168 = "https://www.nosler.com/30-caliber-168gr-hpbt-custom-competition-100ct.html"
RIFLESHOOTER_308 = "https://rifleshooter.com/2014/12/308-winchester-7-62x51mm-nato-barrel-length-versus-velocity-28-to-16-5/"

FED_NOTE = (
    "Federal does not state its test barrel length, so the app cannot correct this velocity for "
    "your barrel. The starting velocity is Federal's published figure and is probably high for a "
    "short barrel. "
)
COMPONENT = "Component bullet. Enter your own chronograph velocity."

LOADS_308 = [
    load("federal-gm308m", "308-win", "Federal Gold Medal 168 gr Sierra MatchKing (GM308M)", 168, D308,
         g1=0.462, g7=0.224, bc_url=SMK168, length_in=1.220, length_url=FED168, fps=2650, vel_url=FED168,
         note=FED_NOTE + "One independent test measured 2466 fps for this load from a 16.5 inch barrel "
         "(Rifleshooter.com, one barrel). " + SIERRA),
    load("federal-gm308m2", "308-win", "Federal Gold Medal 175 gr Sierra MatchKing (GM308M2)", 175, D308,
         g1=0.505, g7=0.250, bc_url=SMK175, length_in=1.242, length_url=FED175, fps=2600, vel_url=FED175,
         note=FED_NOTE + SIERRA),
    load("hornady-80966", "308-win", "Hornady Match 168 gr ELD Match (80966)", 168, D308,
         g1=0.523, g7=0.263, bc_url=HBC, fps=2700, vel_url=HOR168, barrel_in=24,
         note="Hornady quotes these BCs at Mach 2.25. At Mach 1.75 it quotes G1 0.498 and G7 0.251, so real "
         "drop at long range will be a little more than shown."),
    load("hornady-8105", "308-win", "Hornady Match 178 gr BTHP (8105)", 178, D308,
         fps=2600, vel_url=HOR178, barrel_in=24,
         note="Hornady's page for this load does not give a BC. Type the BC from your ammunition box before solving."),
    load("berger-60010", "308-win", "Berger 175 gr OTM Tactical (60010)", 175, D308,
         g1=0.512, g7=0.263, bc_url=BER175A, length_in=1.261, length_url=BER175, fps=2668, vel_url=BER175A,
         barrel_in=26, note=ICAO),
    load("lapua-4317076", "308-win", "Lapua 155 gr Scenar-L (4317076)", 155, D308,
         g1=0.460, g7=0.230, bc_url=LAP155A, mps=860, vel_url=LAP155A, barrel_in=26, note=ICAO),
    load("lapua-4317520", "308-win", "Lapua 175 gr Scenar-L (4317520)", 175, D308,
         g1=0.490, g7=0.247, bc_url=LAP175A, mps=793, vel_url=LAP175A, barrel_in=26, note=ICAO),
    load("bullet-berger-30425", "308-win", "Handload: Berger 168 gr Hybrid Target (30425)", 168, D308,
         g1=0.515, g7=0.264, bc_url=BER168, length_in=1.287, length_url=BER168, note=COMPONENT),
    load("bullet-hornady-178-eldm", "308-win", "Handload: Hornady 178 gr ELD Match", 178, D308,
         g1=0.547, g7=0.275, bc_url=HBC, note=COMPONENT + " BCs are Hornady's Mach 2.25 figures."),
    load("bullet-nosler-53164", "308-win", "Handload: Nosler 168 gr Custom Competition (53164)", 168, D308,
         g1=0.462, bc_url=NOS168, length_in=1.200, length_url=NOS168,
         note=COMPONENT + " Nosler does not publish a G7 BC."),
]

# ---------------------------------------------------------------- .223 Remington
D224 = 0.224
FED69 = "https://www.federalpremium.com/rifle/gold-medal/gold-medal-sierra-matchking/11-GM223M.html"
FED77 = "https://www.federalpremium.com/rifle/gold-medal/gold-medal-sierra-matchking/11-GM223M3.html"
FED73 = "https://www.federalpremium.com/rifle/gold-medal/gold-medal-berger/11-GM223BH73.html"
BER73A = "https://bergerbullets.com/product/223-remington-73-grain-boat-tail-target/"
FEDAE223 = "https://www.federalpremium.com/rifle/american-eagle/american-eagle-rifle/11-AE223.html"
SMK69 = "https://sierrabullets.com/22-cal-69-gr-hpbt-matchking-smk/"
SMK77 = "https://sierrabullets.com/22-cal-77-gr-hpbt-matchking-smk/"
HOR73 = "https://www.hornady.com/ammunition/rifle/223-rem-73-gr-eld-match"
HOR75 = "https://www.hornady.com/ammunition/rifle/223-rem-75-gr-bthp-match"
HOR68 = "https://www.hornady.com/ammunition/rifle/223-remington-68-gr-bthp-match-frontier"
BER77A = "https://bergerbullets.com/product/223-remington-77-grain-otm-tactical/"
BER77 = "https://bergerbullets.com/product/22-caliber-77-grain-otm-tactical/"
LAP69 = "https://www.lapua.com/product/223-rem-target-cartridge-scenar-l-45g-69gr-4315015/"
NOS77A = "https://www.nosler.com/223-rem-77gr-custom-competition-match-grade-ammunition.html"
NOS77 = "https://www.nosler.com/22-caliber-77gr-hpbt-custom-competition-100ct.html"
PMC223A = "https://pmcammo.com/product/bronze-223a/"

FED_SIERRA_223 = (
    "The BCs shown are Sierra's, the bullet maker. Federal's page for this load gives different "
    "figures (G1 {g1}, G7 {g7}). "
)
NOT_STATED = "The maker gives this BC without naming a drag model. The app treats it as G1."
G1_ONLY = "The maker publishes a G1 BC only for this bullet."
PMC_NOTE = "PMC publishes this load's velocity from two barrel lengths. The app uses the one nearest your barrel."

LOADS_223 = [
    load("federal-gm223m", "223-rem", "Federal Gold Medal 69 gr Sierra MatchKing (GM223M)", 69, D224,
         g1=0.341, g7=0.167, bc_url=SMK69, length_in=0.921, length_url=FED69, fps=2950, vel_url=FED69,
         note=FED_SIERRA_223.format(g1=".301", g7=".165") + FED_NOTE + SIERRA),
    load("federal-gm223m3", "223-rem", "Federal Gold Medal 77 gr Sierra MatchKing (GM223M3)", 77, D224,
         g1=0.372, g7=0.182, bc_url=SMK77, length_in=0.982, length_url=FED77, fps=2720, vel_url=FED77,
         note=FED_SIERRA_223.format(g1=".372", g7=".188") + FED_NOTE + SIERRA),
    load("federal-gm223bh73", "223-rem", "Federal Gold Medal 73 gr Berger BT Target (GM223BH73)", 73, D224,
         g1=0.348, g7=0.178, bc_url=BER73A, length_in=0.962, length_url=FED73, fps=2800, vel_url=FED73,
         note=FED_NOTE + ICAO),
    load("federal-ae223", "223-rem", "Federal American Eagle 55 gr FMJ (AE223)", 55, D224,
         g1=0.269, bc_url=FEDAE223, model_stated=False, length_in=0.735, length_url=FEDAE223, fps=3240,
         vel_url=FEDAE223, note=FED_NOTE + NOT_STATED),
    load("hornady-80269", "223-rem", "Hornady Match 73 gr ELD Match (80269)", 73, D224,
         g1=0.398, g7=0.200, bc_url=HOR73, fps=2790, vel_url=HOR73, barrel_in=24,
         note="Hornady quotes these BCs at Mach 2.25. At Mach 1.75 it quotes G1 0.382 and G7 0.192, so real "
         "drop at long range will be a little more than shown."),
    load("hornady-8026", "223-rem", "Hornady Match 75 gr BTHP (8026)", 75, D224,
         g1=0.395, bc_url=HOR75, fps=2790, vel_url=HOR75, barrel_in=24, note=G1_ONLY),
    load("hornady-fr160", "223-rem", "Hornady Frontier 68 gr BTHP Match (FR160)", 68, D224,
         g1=0.355, bc_url=HOR68, fps=2960, vel_url=HOR68, barrel_in=24, note=G1_ONLY),
    load("berger-23030", "223-rem", "Berger 77 gr OTM Tactical (23030)", 77, D224,
         g1=0.374, g7=0.192, bc_url=BER77A, length_in=1.015, length_url=BER77, fps=2750, vel_url=BER77A,
         barrel_in=20, note=ICAO),
    load("lapua-4315015", "223-rem", "Lapua 69 gr Scenar-L (4315015)", 69, D224,
         g1=0.341, g7=0.171, bc_url=LAP69, mps=830, vel_url=LAP69, barrel_in=20, note=ICAO),
    load("nosler-60011", "223-rem", "Nosler Match Grade 77 gr Custom Competition (60011)", 77, D224,
         g1=0.340, bc_url=NOS77, length_in=0.980, length_url=NOS77, fps=2600, vel_url=NOS77A, barrel_in=24,
         note=G1_ONLY),
    load("pmc-223a", "223-rem", "PMC Bronze 55 gr FMJ-BT (223A)", 55, D224,
         g1=0.243, bc_url=PMC223A, model_stated=False, length_in=0.740, length_url=PMC223A, fps=3200,
         vel_url=PMC223A, barrel_in=24, by_barrel=[(24, 3200), (16, 2900)], note=PMC_NOTE + " " + NOT_STATED),
]

# ---------------------------------------------------------------- 5.56x45 NATO
FEDAE193 = "https://www.federalpremium.com/rifle/american-eagle/american-eagle-rifle/11-AE193.html"
HORFR200 = "https://www.hornady.com/ammunition/rifle/5.56-nato-55-gr-fmj-bt-frontier"
HORFR260 = "https://www.hornady.com/ammunition/rifle/5.56-nato-62-gr-fmj-frontier"
HORFR310 = "https://www.hornady.com/ammunition/rifle/5.56-nato-68-gr-bthp-match-frontier"
HOR81264 = "https://www.hornady.com/ammunition/rifle/5-56-nato-75-gr-bthp-superformance-match"
PMC556X = "https://pmcammo.com/product/x-tac-5-56x/"
PMC556K = "https://pmcammo.com/product/x-tac-5-56k/"
BHMK262 = "https://www.black-hills.com/shop/mk-262-mod-1-c-mil-pack/556mm/"

LOADS_556 = [
    load("federal-ae193", "556-nato", "Federal American Eagle 55 gr FMJ-BT (AE193)", 55, D224,
         g1=0.246, bc_url=FEDAE193, model_stated=False, length_in=0.735, length_url=FEDAE193, fps=3165,
         vel_url=FEDAE193, note=FED_NOTE + NOT_STATED),
    load("hornady-fr200", "556-nato", "Hornady Frontier 55 gr FMJ, M193 (FR200)", 55, D224,
         g1=0.243, bc_url=HORFR200, fps=3240, vel_url=HORFR200, barrel_in=20, note=G1_ONLY),
    load("pmc-556x", "556-nato", "PMC X-TAC 55 gr FMJ-BT (5.56X)", 55, D224,
         g1=0.243, bc_url=PMC556X, model_stated=False, length_in=0.740, length_url=PMC556X, fps=3270,
         vel_url=PMC556X, barrel_in=20, by_barrel=[(20, 3270), (16, 3120)], note=PMC_NOTE + " " + NOT_STATED),
    load("pmc-556k", "556-nato", "PMC X-TAC 62 gr LAP (5.56K)", 62, D224,
         g1=0.304, bc_url=PMC556K, model_stated=False, length_in=0.923, length_url=PMC556K, fps=3100,
         vel_url=PMC556K, barrel_in=20, by_barrel=[(20, 3100), (16, 2920)], note=PMC_NOTE + " " + NOT_STATED),
    load("hornady-fr260", "556-nato", "Hornady Frontier 62 gr FMJ (FR260)", 62, D224,
         g1=0.274, bc_url=HORFR260, fps=3060, vel_url=HORFR260, barrel_in=20, note=G1_ONLY),
    load("hornady-fr310", "556-nato", "Hornady Frontier 68 gr BTHP Match (FR310)", 68, D224,
         g1=0.355, bc_url=HORFR310, fps=2960, vel_url=HORFR310, barrel_in=20, note=G1_ONLY),
    load("hornady-81264", "556-nato", "Hornady Superformance Match 75 gr BTHP (81264)", 75, D224,
         g1=0.395, bc_url=HOR81264, fps=2910, vel_url=HOR81264, barrel_in=20, note=G1_ONLY),
    load("blackhills-mk262", "556-nato", "Black Hills 77 gr MK 262 MOD 1-C", 77, D224,
         fps=2750, vel_url=BHMK262, barrel_in=20,
         note="Black Hills publishes the velocity for this load and no BC. Type a BC before solving."),
]

# ---------------------------------------------------------------- .22 Long Rifle
D22 = 0.2255  # SAAMI maximum bullet diameter
CCI32 = "https://www.cci-ammunition.com/rimfire/cci/standard-velocity/6-32.html"
CCI33 = "https://www.cci-ammunition.com/rimfire/cci/green-tag/6-33.html"
CCI30 = "https://www.cci-ammunition.com/rimfire/cci/target-mini-mag/6-30.html"
FED711B = "https://www.federalpremium.com/rimfire/gold-medal/gold-medal-rimfire/11-711B.html"
FED719 = "https://www.federalpremium.com/rimfire/gold-medal/gold-medal-rimfire/11-719.html"
LAPCX = "https://www.lapua.com/product/22-lr-lapua-center-x-rimfire-ammo/"
LAPMID = "https://www.lapua.com/product/22-lr-lapua-midas-plus-rimfire-ammo/"
LAPLR = "https://www.lapua.com/product/22-lr-lapua-long-range-rimfire-ammo/"
SKSTD = "https://sk-ammunition.com/products/standard-plus/"
SKRM = "https://sk-ammunition.com/products/rifle-match/"
SKLRM = "https://sk-ammunition.com/products/long-range-match/"
ELEYTENEX = "https://eley.co.uk/eley-tenex/"
ELEYMATCH = "https://eley.co.uk/eley-match/"
ELEYCLUB = "https://eley.co.uk/eley-club/"
RWSR50 = "https://rws-ammunition.com/en/products/rimfire-cartridges/rws-r-50"

LAPUA_BC = "Lapua gives one calculated G1 BC, 0.172, for all its .22 LR bullets. It is not measured for this load."
SK_NOTE = (
    "SK's page for this load gives no BC. SK's brochure gives G1 0.172 for round-nose and 0.139 for "
    "flat-nose bullets and does not say which this load has. Type the BC before solving."
)
ELEY_NOTE = (
    "Eley publishes its BC against the RA4 rimfire drag model, not G1, and gives a velocity band "
    "(1040 to 1085 fps) instead of one figure. Eley says to use the velocity printed on your box. "
    "Enter it before solving."
)

LOADS_22 = [
    load("cci-32", "22-lr", "CCI Standard Velocity 40 gr (32)", 40, D22,
         g1=0.120, bc_url=CCI32, model_stated=False, fps=1070, vel_url=CCI32, note=NOT_STATED),
    load("cci-33", "22-lr", "CCI Green Tag 40 gr (33)", 40, D22,
         g1=0.120, bc_url=CCI33, model_stated=False, fps=1070, vel_url=CCI33, note=NOT_STATED),
    load("cci-30", "22-lr", "CCI Target Mini-Mag 40 gr (30)", 40, D22,
         g1=0.130, bc_url=CCI30, model_stated=False, fps=1235, vel_url=CCI30, note=NOT_STATED),
    load("federal-711b", "22-lr", "Federal Gold Medal Rimfire 40 gr, 1080 fps (711B)", 40, D22,
         g1=0.138, bc_url=FED711B, model_stated=False, fps=1080, vel_url=FED711B, note=NOT_STATED),
    load("federal-719", "22-lr", "Federal Gold Medal Rimfire 40 gr, 1200 fps (719)", 40, D22,
         g1=0.138, bc_url=FED719, model_stated=False, fps=1200, vel_url=FED719, note=NOT_STATED),
    load("lapua-420163", "22-lr", "Lapua Center-X 40 gr (420163)", 40, D22,
         g1=0.172, bc_url=LAPCX, mps=327, vel_url=LAPCX, barrel_in=26, note=LAPUA_BC),
    load("lapua-420162", "22-lr", "Lapua Midas+ 40 gr (420162)", 40, D22,
         g1=0.172, bc_url=LAPMID, mps=327, vel_url=LAPMID, barrel_in=26, note=LAPUA_BC),
    load("lapua-420168", "22-lr", "Lapua Long Range 40 gr (420168)", 40, D22,
         g1=0.172, bc_url=LAPLR, mps=337, vel_url=LAPLR, note=LAPUA_BC),
    load("sk-420101", "22-lr", "SK Standard Plus 40 gr (420101)", 40, D22,
         mps=327, vel_url=SKSTD, barrel_in=26, note=SK_NOTE),
    load("sk-420108", "22-lr", "SK Rifle Match 40 gr (420108)", 40, D22,
         mps=327, vel_url=SKRM, barrel_in=26, note=SK_NOTE),
    load("sk-420158", "22-lr", "SK Long Range Match 40 gr (420158)", 40, D22,
         mps=335, vel_url=SKLRM, barrel_in=26, note=SK_NOTE),
    load("eley-tenex", "22-lr", "Eley Tenex 40 gr", 40, D22, ra4=0.112, bc_url=ELEYTENEX, note=ELEY_NOTE),
    load("eley-match", "22-lr", "Eley Match 40 gr", 40, D22, ra4=0.112, bc_url=ELEYMATCH, note=ELEY_NOTE),
    load("eley-club", "22-lr", "Eley Club 40 gr", 40, D22, ra4=0.112, bc_url=ELEYCLUB, note=ELEY_NOTE),
    load("rws-2134187", "22-lr", "RWS R 50 40 gr (2134187)", 40, D22,
         g1=0.136, bc_url=RWSR50, model_stated=False, mps=330, vel_url=RWSR50, barrel_in=650 / 25.4,
         note=NOT_STATED),
]

# ---------------------------------------------------------------- 6.5 Creedmoor
D65 = 0.264
HOR81500 = "https://www.hornady.com/ammunition/rifle/6-5-creedmoor-140-gr-eld-match"
HOR81499 = "https://www.hornady.com/ammunition/rifle/6-5-creedmoor-143-gr-eld-x-precision-hunter"
FEDGM65 = "https://www.federalpremium.com/rifle/gold-medal/gold-medal-berger/11-GM65CRDBH2.html"

HOR_CHART_NOTE = (
    "The ammo page prints no BC. The value is the Hornady BC chart's Mach 2.25 figure, which Hornady "
    "says is the one comparable to industry BCs."
)

LOADS_65CM = [
    load("hornady-81500", "65-creedmoor", "Hornady Match 140 gr ELD Match (81500)", 140, D65,
         g1=0.646, g7=0.326, bc_url=HBC, fps=2710, vel_url=HOR81500, barrel_in=24, read_on=READ_ON_2,
         note=HOR_CHART_NOTE),
    load("hornady-81499", "65-creedmoor", "Hornady Precision Hunter 143 gr ELD-X (81499)", 143, D65,
         g1=0.623, g7=0.314, bc_url=HBC, fps=2700, vel_url=HOR81499, barrel_in=24, read_on=READ_ON_2,
         note=HOR_CHART_NOTE),
    load("federal-gm65crdbh2", "65-creedmoor", "Federal Gold Medal Berger 140 gr (GM65CRDBH2)", 140, D65,
         g1=0.607, g7=0.311, bc_url=FEDGM65, model_stated=False, length_in=1.407, length_url=FEDGM65,
         fps=2725, vel_url=FEDGM65, read_on=READ_ON_2,
         note=FED_NOTE + NOT_STATED + " The G7 value is labeled on the page."),
]

# ---------------------------------------------------------------- 6.5 PRC
HOR81620 = "https://www.hornady.com/ammunition/rifle/6.5-prc-147-gr-eld-match"
HOR81621 = "https://www.hornady.com/ammunition/rifle/6.5-prc-143-gr-eld-x-precision-hunter"
BER50010 = "https://bergerbullets.com/product/6-5-prc-156-grain-extreme-outer-limits-eol-elite-hunter-rifle-ammunition/"

LOADS_65PRC = [
    load("hornady-81620", "65-prc", "Hornady Match 147 gr ELD Match (81620)", 147, D65,
         g1=0.697, g7=0.351, bc_url=HBC, fps=2910, vel_url=HOR81620, barrel_in=24, read_on=READ_ON_2,
         note=HOR_CHART_NOTE),
    load("hornady-81621", "65-prc", "Hornady Precision Hunter 143 gr ELD-X (81621)", 143, D65,
         g1=0.623, g7=0.314, bc_url=HBC, fps=2960, vel_url=HOR81621, barrel_in=24, read_on=READ_ON_2,
         note=HOR_CHART_NOTE),
    load("berger-50010", "65-prc", "Berger 156 gr EOL Elite Hunter (50010)", 156, D65,
         g1=0.679, g7=0.347, bc_url=BER50010, fps=2900, vel_url=BER50010, barrel_in=26, read_on=READ_ON_2,
         note="Berger states a 26 in test barrel and sea level conditions. Minimum twist 1:8."),
]

# ---------------------------------------------------------------- .243 Winchester
D243 = 0.243
HOR80462 = "https://www.hornady.com/ammunition/rifle/243-win-90-gr-eld-x-precision-hunter"
FEDF243 = "https://www.federalpremium.com/rifle/fusion/11-F243FS1.html"
REM29015 = "https://www.remington.com/rifle/core-lokt-tipped/29-29015.html"

LOADS_243 = [
    load("hornady-80462", "243-win", "Hornady Precision Hunter 90 gr ELD-X (80462)", 90, D243,
         g1=0.410, g7=0.206, bc_url=HBC, fps=3150, vel_url=HOR80462, barrel_in=24, read_on=READ_ON_2,
         note=HOR_CHART_NOTE),
    load("federal-f243fs1", "243-win", "Federal Fusion 95 gr (F243FS1)", 95, D243,
         g1=0.376, bc_url=FEDF243, model_stated=False, length_in=1.025, length_url=FEDF243, fps=2980,
         vel_url=FEDF243, read_on=READ_ON_2,
         note=FED_NOTE + NOT_STATED + " " + G1_ONLY),
    load("remington-29015", "243-win", "Remington Core-Lokt Tipped 95 gr (29015)", 95, D243,
         g1=0.355, bc_url=REM29015, model_stated=False, fps=3140, vel_url=REM29015, read_on=READ_ON_2,
         note=FED_NOTE + NOT_STATED + " " + G1_ONLY),
]

# ---------------------------------------------------------------- 7mm-08 Remington
D7MM = 0.284
HOR85578 = "https://www.hornady.com/ammunition/rifle/7mm-08-rem-150-gr-eld-x-precision-hunter"
FEDF708 = "https://www.federalpremium.com/rifle/fusion/11-F708FS1.html"
REM21337 = "https://www.remington.com/rifle/shop-by-caliber/shop-all-calibers/29-21337.html"

LOADS_7MM08 = [
    load("hornady-85578", "7mm08-rem", "Hornady Precision Hunter 150 gr ELD-X (85578)", 150, D7MM,
         g1=0.574, g7=0.289, bc_url=HBC, fps=2770, vel_url=HOR85578, barrel_in=24, read_on=READ_ON_2,
         note=HOR_CHART_NOTE),
    load("federal-f708fs1", "7mm08-rem", "Federal Fusion 140 gr (F708FS1)", 140, D7MM,
         g1=0.390, bc_url=FEDF708, model_stated=False, length_in=1.135, length_url=FEDF708, fps=2850,
         vel_url=FEDF708, read_on=READ_ON_2,
         note=FED_NOTE + NOT_STATED + " " + G1_ONLY),
    load("remington-21337", "7mm08-rem", "Remington Core-Lokt 140 gr (21337)", 140, D7MM,
         g1=0.390, bc_url=REM21337, model_stated=False, fps=2860, vel_url=REM21337, read_on=READ_ON_2,
         note=FED_NOTE + NOT_STATED + " " + G1_ONLY),
]

# ---------------------------------------------------------------- 7mm Remington Magnum
HOR80636 = "https://www.hornady.com/ammunition/rifle/7mm-rem-mag-162-gr-eld-x-precision-hunter"
FEDP7RTA1 = "https://www.federalpremium.com/rifle/terminal-ascent/11-P7RTA1.html"
REM28821 = "https://www.remington.com/rifle/core-lokt/29-28821.html"

LOADS_7MMRM = [
    load("hornady-80636", "7mm-rem-mag", "Hornady Precision Hunter 162 gr ELD-X (80636)", 162, D7MM,
         g1=0.631, g7=0.318, bc_url=HBC, fps=2975, vel_url=HOR80636, barrel_in=24, read_on=READ_ON_2,
         note=HOR_CHART_NOTE),
    load("federal-p7rta1", "7mm-rem-mag", "Federal Terminal Ascent 155 gr (P7RTA1)", 155, D7MM,
         g1=0.586, g7=0.300, bc_url=FEDP7RTA1, model_stated=False, length_in=1.514, length_url=FEDP7RTA1,
         fps=3000, vel_url=FEDP7RTA1, read_on=READ_ON_2,
         note=FED_NOTE + NOT_STATED + " The G7 value is labeled on the page."),
    load("remington-28821", "7mm-rem-mag", "Remington Core-Lokt 140 gr (28821)", 140, D7MM,
         g1=0.390, bc_url=REM28821, model_stated=False, fps=3175, vel_url=REM28821, read_on=READ_ON_2,
         note=FED_NOTE + NOT_STATED + " " + G1_ONLY),
]

# ---------------------------------------------------------------- 7mm PRC
HOR80711 = "https://www.hornady.com/ammunition/rifle/7mm-prc-180-gr-eld-match"
HOR80712 = "https://www.hornady.com/ammunition/rifle/7mm-prc-175-gr-eld-x-precision-hunter"
FEDP7PRCTA1 = "https://www.federalpremium.com/rifle/terminal-ascent/11-P7PRCTA1.html"

LOADS_7MMPRC = [
    load("hornady-80711", "7mm-prc", "Hornady Match 180 gr ELD Match (80711)", 180, D7MM,
         g1=0.777, g7=0.391, bc_url=HBC, fps=2975, vel_url=HOR80711, barrel_in=24, read_on=READ_ON_2,
         note=HOR_CHART_NOTE + " The chart also lists G1 0.816 / G7 0.411 for a 1:7.5 twist; the ammo "
         "page does not state its test barrel twist."),
    load("hornady-80712", "7mm-prc", "Hornady Precision Hunter 175 gr ELD-X (80712)", 175, D7MM,
         g1=0.689, g7=0.347, bc_url=HBC, fps=3000, vel_url=HOR80712, barrel_in=24, read_on=READ_ON_2,
         note=HOR_CHART_NOTE),
    load("federal-p7prcta1", "7mm-prc", "Federal Terminal Ascent 155 gr (P7PRCTA1)", 155, D7MM,
         g1=0.586, bc_url=FEDP7PRCTA1, model_stated=False, length_in=1.510, length_url=FEDP7PRCTA1,
         fps=3100, vel_url=FEDP7PRCTA1, read_on=READ_ON_2,
         note=FED_NOTE + NOT_STATED + " " + G1_ONLY),
]

# ---------------------------------------------------------------- .270 Winchester
D270 = 0.277
HOR80536 = "https://www.hornady.com/ammunition/rifle/270-win-145-gr-eld-x-precision-hunter"
FEDP270TA1 = "https://www.federalpremium.com/rifle/terminal-ascent/11-P270TA1.html"
REM27808 = "https://www.remington.com/rifle/shop-by-caliber/shop-all-calibers/29-27808.html"

LOADS_270 = [
    load("hornady-80536", "270-win", "Hornady Precision Hunter 145 gr ELD-X (80536)", 145, D270,
         g1=0.536, g7=0.270, bc_url=HBC, fps=2970, vel_url=HOR80536, barrel_in=24, read_on=READ_ON_2,
         note=HOR_CHART_NOTE),
    load("federal-p270ta1", "270-win", "Federal Terminal Ascent 136 gr (P270TA1)", 136, D270,
         g1=0.493, g7=0.247, bc_url=FEDP270TA1, model_stated=False, length_in=1.354, length_url=FEDP270TA1,
         fps=3000, vel_url=FEDP270TA1, read_on=READ_ON_2,
         note=FED_NOTE + NOT_STATED + " The G7 value is labeled on the page."),
    load("remington-27808", "270-win", "Remington Core-Lokt 130 gr (27808)", 130, D270,
         g1=0.336, bc_url=REM27808, model_stated=False, fps=3060, vel_url=REM27808, read_on=READ_ON_2,
         note=FED_NOTE + NOT_STATED + " " + G1_ONLY),
]

# ---------------------------------------------------------------- .30-06 Springfield
D30 = 0.308
HOR81174 = "https://www.hornady.com/ammunition/rifle/30-06-springfield-178-gr-eld-x-precision-hunter"
FEDGM3006M = "https://www.federalpremium.com/rifle/gold-medal/gold-medal-sierra-matchking/11-GM3006M.html"
REM29037 = "https://remington.com/rifle/core-lokt-tipped/29-29037.html"

LOADS_3006 = [
    load("hornady-81174", "3006-spr", "Hornady Precision Hunter 178 gr ELD-X (81174)", 178, D30,
         g1=0.552, g7=0.278, bc_url=HBC, fps=2750, vel_url=HOR81174, barrel_in=24, read_on=READ_ON_2,
         note=HOR_CHART_NOTE),
    load("federal-gm3006m", "3006-spr", "Federal Gold Medal 168 gr Sierra MatchKing (GM3006M)", 168, D30,
         g1=0.463, g7=0.224, bc_url=FEDGM3006M, model_stated=False, length_in=1.220, length_url=FEDGM3006M,
         fps=2700, vel_url=FEDGM3006M, read_on=READ_ON_2,
         note=FED_NOTE + NOT_STATED + " The G7 value is labeled on the page."),
    load("remington-29037", "3006-spr", "Remington Core-Lokt Tipped 180 gr (29037)", 180, D30,
         g1=0.480, bc_url=REM29037, model_stated=False, fps=2745, vel_url=REM29037, read_on=READ_ON_2,
         note=FED_NOTE + NOT_STATED + " " + G1_ONLY),
]

# ---------------------------------------------------------------- .300 Winchester Magnum
HOR82002 = "https://www.hornady.com/ammunition/rifle/300-win-mag-200-gr-eld-x-precision-hunter"
FEDGM300WM = "https://www.federalpremium.com/rifle/gold-medal/gold-medal-sierra-matchking/11-GM300WM.html"
REMR29038 = "https://remington.com/rifle/core-lokt-tipped/29-R29038.html"

LOADS_300WM = [
    load("hornady-82002", "300-win-mag", "Hornady Precision Hunter 200 gr ELD-X (82002)", 200, D30,
         g1=0.597, g7=0.301, bc_url=HBC, fps=2860, vel_url=HOR82002, barrel_in=24, read_on=READ_ON_2,
         note=HOR_CHART_NOTE),
    load("federal-gm300wm", "300-win-mag", "Federal Gold Medal 190 gr Sierra MatchKing (GM300WM)", 190, D30,
         g1=0.533, g7=0.275, bc_url=FEDGM300WM, model_stated=False, length_in=1.360, length_url=FEDGM300WM,
         fps=2900, vel_url=FEDGM300WM, read_on=READ_ON_2,
         note=FED_NOTE + NOT_STATED + " The G7 value is labeled on the page."),
    load("remington-r29038", "300-win-mag", "Remington Core-Lokt Tipped 180 gr (R29038)", 180, D30,
         g1=0.481, bc_url=REMR29038, model_stated=False, fps=2980, vel_url=REMR29038, read_on=READ_ON_2,
         note=FED_NOTE + NOT_STATED + " " + G1_ONLY),
]

# ---------------------------------------------------------------- .300 PRC
HOR82162 = "https://www.hornady.com/ammunition/rifle/300-prc-225-gr-eld-match"
HOR82166 = "https://www.hornady.com/ammunition/rifle/300-prc-212-gr-eld-x-precision-hunter"
BER55030 = "https://bergerbullets.com/product/300-prc-215-grain-hybrid-target-rifle-ammunition/"

LOADS_300PRC = [
    load("hornady-82162", "300-prc", "Hornady Match 225 gr ELD Match (82162)", 225, D30,
         g1=0.777, g7=0.391, bc_url=HBC, fps=2810, vel_url=HOR82162, barrel_in=24, read_on=READ_ON_2,
         note=HOR_CHART_NOTE + " The chart also lists G1 0.798 / G7 0.402 for a 1:7 twist; the ammo "
         "page does not state its test barrel twist."),
    load("hornady-82166", "300-prc", "Hornady Precision Hunter 212 gr ELD-X (82166)", 212, D30,
         g1=0.663, g7=0.334, bc_url=HBC, fps=2860, vel_url=HOR82166, barrel_in=24, read_on=READ_ON_2,
         note=HOR_CHART_NOTE + " The chart also lists G1 0.702 / G7 0.354 for a 1:7 twist; the ammo "
         "page does not state its test barrel twist."),
    load("berger-55030", "300-prc", "Berger 215 gr Hybrid Target (55030)", 215, D30,
         g1=0.691, g7=0.354, bc_url=BER55030, fps=2940, vel_url=BER55030, barrel_in=26, read_on=READ_ON_2,
         note="Berger states a 26 in test barrel and sea level conditions. Minimum twist 1:10."),
]

# ---------------------------------------------------------------- cartridges
SAAMI_CF = "https://saami.org/wp-content/uploads/2026/10/SAAMI-Z299.4-CFR-2025-Centerfire-Rifle-Approved-2-10-2025-2026-10-21.pdf"
SAAMI_CF_2 = "https://saami.org/wp-content/uploads/2026/04/SAAMI-Z299.4-CFR-2025-Centerfire-Rifle-Approved-2-10-2025-2026-04-27.pdf"
SAAMI_RF = "https://saami.org/wp-content/uploads/2026/05/SAAMI-Z299.1-R2026-Rimfire-FINAL-Approved-2026-05-08.pdf"
SAAMI_556 = "https://saami.org/wp-content/uploads/2026/10/Public-Introduction-5.56-Commercial-2026-06-22-FINAL-Rev-3.pdf"
SAAMI_FAQ = "https://saami.org/faqs/"

SAFETY_556_IN_223 = (
    "However, it is not safe to shoot \u201c5.56,\u201d \u201c5.56 NATO,\u201d or \u201c5.56x45mm\u201d ammunition in a "
    "barrel marked as being chambered in 223 Remington for a number of reasons. The main reason being that a "
    "barrel marked as chambered in 223 Remington will have a shorter throat into the rifling than a "
    "\u201c5.56\u201d barrel which may cause increased pressure if the \u201c5.56\u201d ammunition is fired in it. This "
    "can result in serious injury or death to the user and/or bystanders, as well as damage to the "
    "firearm."
)
NO_LOSS_224 = (
    "No barrel-length correction is made for this cartridge. The published figures disagree: PMC's "
    "own two-barrel velocities work out to 37 to 45 fps per inch, and one independent cut-down test "
    "measured 22 to 30. The app shows the maker's velocity with its test barrel. Chronograph your load."
)
NO_LOSS_65 = (
    "No per-inch velocity-loss figure was sourced for this cartridge, so no barrel-length correction "
    "is made. The app shows the maker's velocity with its test barrel. Chronograph your load."
)
NO_LOSS_243 = (
    "No per-inch velocity-loss figure was sourced for this cartridge, so no barrel-length correction "
    "is made. The app shows the maker's velocity with its test barrel. Chronograph your load."
)
NO_LOSS_7MM = (
    "No per-inch velocity-loss figure was sourced for this cartridge, so no barrel-length correction "
    "is made. The app shows the maker's velocity with its test barrel. Chronograph your load."
)
NO_LOSS_270 = (
    "No per-inch velocity-loss figure was sourced for this cartridge, so no barrel-length correction "
    "is made. The app shows the maker's velocity with its test barrel. Chronograph your load."
)
NO_LOSS_30 = (
    "No per-inch velocity-loss figure was sourced for this cartridge, so no barrel-length correction "
    "is made. The app shows the maker's velocity with its test barrel. Chronograph your load."
)


def dope(start_yd, end_yd, step_yd):
    return {"startM": round(start_yd * YD, 4), "endM": round(end_yd * YD, 4), "stepM": round(step_yd * YD, 4)}


CARTRIDGES = [
    {
        "id": "308-win", "name": ".308 Winchester", "bulletDiameterM": round(D308 * IN, 7),
        "diameterSource": quote("Bullet diameter 0.308 in, as listed on the bullet makers' pages.", SMK168),
        "velocityLossMpsPerM": sourced(round(20.9 * FT / IN, 2), RIFLESHOOTER_308),
        "velocityLossNote": (
            "Rifleshooter.com cut one .308 barrel from 28 to 16.5 inches and measured Federal Gold Medal "
            "168 gr at each length: 20.9 fps lost per inch on average. It is one barrel and one test, "
            "not manufacturer data. Your rifle will differ, so chronograph your load."
        ),
        "safetyNote": None,
        "defaults": {"targetRangeM": round(300 * YD, 4), "zeroRangeM": round(100 * YD, 4), "dope": dope(100, 600, 50),
                     "twistM": round(11 * IN, 4), "barrelLengthM": round(16 * IN, 4)},
    },
    {
        "id": "223-rem", "name": ".223 Remington", "bulletDiameterM": round(D224 * IN, 7),
        "diameterSource": quote("SAAMI .223 Remington drawing: bullet diameter .2245 - .0030 in.", SAAMI_CF),
        "velocityLossMpsPerM": sourced(None, None),
        "velocityLossNote": NO_LOSS_224,
        "safetyNote": quote(SAFETY_556_IN_223, SAAMI_FAQ),
        "defaults": {"targetRangeM": round(300 * YD, 4), "zeroRangeM": round(100 * YD, 4), "dope": dope(100, 600, 50),
                     "twistM": round(8 * IN, 4), "barrelLengthM": round(20 * IN, 4)},
    },
    {
        "id": "556-nato", "name": "5.56x45 NATO", "bulletDiameterM": round(D224 * IN, 7),
        "diameterSource": quote("SAAMI 5.56 Commercial introduction: bullet diameter .2245 - .0030 in.", SAAMI_556),
        "velocityLossMpsPerM": sourced(None, None),
        "velocityLossNote": NO_LOSS_224,
        "safetyNote": quote(SAFETY_556_IN_223, SAAMI_FAQ),
        "defaults": {"targetRangeM": round(300 * YD, 4), "zeroRangeM": round(100 * YD, 4), "dope": dope(100, 600, 50),
                     "twistM": round(7 * IN, 4), "barrelLengthM": round(16 * IN, 4)},
    },
    {
        "id": "22-lr", "name": ".22 Long Rifle", "bulletDiameterM": round(D22 * IN, 7),
        "diameterSource": quote("SAAMI 22 Long Rifle Match drawing: bullet diameter .2255 - .0040 in.", SAAMI_RF),
        "velocityLossMpsPerM": sourced(None, None),
        "velocityLossNote": (
            "No barrel-length correction is made for .22 Long Rifle. The one cut-down test found "
            "(Ballistics By The Inch, one barrel) shows velocity flat within shot-to-shot noise from about "
            "12 to 18 inches, and it did not test longer barrels or match ammunition. Chronograph your load."
        ),
        "safetyNote": None,
        "defaults": {"targetRangeM": round(50 * YD, 4), "zeroRangeM": round(50 * YD, 4), "dope": dope(25, 200, 25),
                     "twistM": round(16 * IN, 4), "barrelLengthM": round(20 * IN, 4)},
    },
    {
        "id": "65-creedmoor", "name": "6.5 Creedmoor", "bulletDiameterM": round(D65 * IN, 7),
        "diameterSource": quote("SAAMI 6.5 Creedmoor drawing: bullet diameter .2644 - .0030 in.", SAAMI_CF_2, READ_ON_2),
        "velocityLossMpsPerM": sourced(None, None),
        "velocityLossNote": NO_LOSS_65,
        "safetyNote": None,
        "defaults": {"targetRangeM": round(300 * YD, 4), "zeroRangeM": round(100 * YD, 4), "dope": dope(100, 600, 50),
                     "twistM": round(8 * IN, 4), "barrelLengthM": round(24 * IN, 4)},
    },
    {
        "id": "65-prc", "name": "6.5 PRC", "bulletDiameterM": round(D65 * IN, 7),
        "diameterSource": quote("SAAMI 6.5 PRC drawing: bullet diameter .2644 - .0030 in.", SAAMI_CF_2, READ_ON_2),
        "velocityLossMpsPerM": sourced(None, None),
        "velocityLossNote": NO_LOSS_65,
        "safetyNote": None,
        "defaults": {"targetRangeM": round(300 * YD, 4), "zeroRangeM": round(100 * YD, 4), "dope": dope(100, 600, 50),
                     "twistM": round(8 * IN, 4), "barrelLengthM": round(24 * IN, 4)},
    },
    {
        "id": "243-win", "name": ".243 Winchester", "bulletDiameterM": round(D243 * IN, 7),
        "diameterSource": quote("SAAMI 243 Winchester drawing: bullet diameter .243 - .003 in.", SAAMI_CF_2, READ_ON_2),
        "velocityLossMpsPerM": sourced(None, None),
        "velocityLossNote": NO_LOSS_243,
        "safetyNote": None,
        "defaults": {"targetRangeM": round(300 * YD, 4), "zeroRangeM": round(100 * YD, 4), "dope": dope(100, 600, 50),
                     "twistM": round(10 * IN, 4), "barrelLengthM": round(24 * IN, 4)},
    },
    {
        "id": "7mm08-rem", "name": "7mm-08 Remington", "bulletDiameterM": round(D7MM * IN, 7),
        "diameterSource": quote("SAAMI 7mm-08 Remington drawing: bullet diameter .2845 - .0030 in.", SAAMI_CF_2, READ_ON_2),
        "velocityLossMpsPerM": sourced(None, None),
        "velocityLossNote": NO_LOSS_7MM,
        "safetyNote": None,
        "defaults": {"targetRangeM": round(300 * YD, 4), "zeroRangeM": round(100 * YD, 4), "dope": dope(100, 600, 50),
                     "twistM": round(9.5 * IN, 4), "barrelLengthM": round(24 * IN, 4)},
    },
    {
        "id": "7mm-rem-mag", "name": "7mm Remington Magnum", "bulletDiameterM": round(D7MM * IN, 7),
        "diameterSource": quote("SAAMI 7mm Remington Magnum drawing: bullet diameter .2845 - .0030 in.", SAAMI_CF_2, READ_ON_2),
        "velocityLossMpsPerM": sourced(None, None),
        "velocityLossNote": NO_LOSS_7MM,
        "safetyNote": None,
        "defaults": {"targetRangeM": round(300 * YD, 4), "zeroRangeM": round(100 * YD, 4), "dope": dope(100, 600, 50),
                     "twistM": round(9.5 * IN, 4), "barrelLengthM": round(24 * IN, 4)},
    },
    {
        "id": "7mm-prc", "name": "7mm PRC", "bulletDiameterM": round(D7MM * IN, 7),
        "diameterSource": quote("SAAMI 7mm PRC drawing: bullet diameter .2844 - .0030 in.", SAAMI_CF_2, READ_ON_2),
        "velocityLossMpsPerM": sourced(None, None),
        "velocityLossNote": NO_LOSS_7MM,
        "safetyNote": None,
        "defaults": {"targetRangeM": round(300 * YD, 4), "zeroRangeM": round(100 * YD, 4), "dope": dope(100, 600, 50),
                     "twistM": round(8 * IN, 4), "barrelLengthM": round(24 * IN, 4)},
    },
    {
        "id": "270-win", "name": ".270 Winchester", "bulletDiameterM": round(D270 * IN, 7),
        "diameterSource": quote(
            "SAAMI 270 Winchester drawing: bullet diameter .278 - .003 in (SAAMI draws .278 max; the "
            "common .277 figure is the groove diameter).", SAAMI_CF_2, READ_ON_2),
        "velocityLossMpsPerM": sourced(None, None),
        "velocityLossNote": NO_LOSS_270,
        "safetyNote": None,
        "defaults": {"targetRangeM": round(300 * YD, 4), "zeroRangeM": round(100 * YD, 4), "dope": dope(100, 600, 50),
                     "twistM": round(10 * IN, 4), "barrelLengthM": round(24 * IN, 4)},
    },
    {
        "id": "3006-spr", "name": ".30-06 Springfield", "bulletDiameterM": round(D30 * IN, 7),
        "diameterSource": quote(
            "SAAMI 30-06 Springfield drawing: bullet diameter .309 - .003 in (SAAMI draws .309 max; "
            "the common .308 figure is the groove diameter).", SAAMI_CF_2, READ_ON_2),
        "velocityLossMpsPerM": sourced(None, None),
        "velocityLossNote": NO_LOSS_30,
        "safetyNote": None,
        "defaults": {"targetRangeM": round(300 * YD, 4), "zeroRangeM": round(100 * YD, 4), "dope": dope(100, 600, 50),
                     "twistM": round(10 * IN, 4), "barrelLengthM": round(24 * IN, 4)},
    },
    {
        "id": "300-win-mag", "name": ".300 Winchester Magnum", "bulletDiameterM": round(D30 * IN, 7),
        "diameterSource": quote(
            "SAAMI 300 Winchester Magnum drawing: bullet diameter .309 - .003 in (SAAMI draws .309 max; "
            "the common .308 figure is the groove diameter).", SAAMI_CF_2, READ_ON_2),
        "velocityLossMpsPerM": sourced(None, None),
        "velocityLossNote": NO_LOSS_30,
        "safetyNote": None,
        "defaults": {"targetRangeM": round(300 * YD, 4), "zeroRangeM": round(100 * YD, 4), "dope": dope(100, 600, 50),
                     "twistM": round(10 * IN, 4), "barrelLengthM": round(24 * IN, 4)},
    },
    {
        "id": "300-prc", "name": ".300 PRC", "bulletDiameterM": round(D30 * IN, 7),
        "diameterSource": quote(
            "SAAMI 300 PRC drawing: bullet diameter .3084 - .0030 in (SAAMI draws .3084 max; the "
            "common .308 figure is the groove diameter).", SAAMI_CF_2, READ_ON_2),
        "velocityLossMpsPerM": sourced(None, None),
        "velocityLossNote": NO_LOSS_30,
        "safetyNote": None,
        "defaults": {"targetRangeM": round(300 * YD, 4), "zeroRangeM": round(100 * YD, 4), "dope": dope(100, 600, 50),
                     "twistM": round(8.5 * IN, 4), "barrelLengthM": round(24 * IN, 4)},
    },
]

LIBRARY = {"cartridges": CARTRIDGES, "loads": LOADS_308 + LOADS_223 + LOADS_556 + LOADS_22 + LOADS_65CM + LOADS_65PRC + LOADS_243 + LOADS_7MM08 + LOADS_7MMRM + LOADS_7MMPRC + LOADS_270 + LOADS_3006 + LOADS_300WM + LOADS_300PRC}

# ---------------------------------------------------------------- scopes
VENOM_PAGE = "https://vortexoptics.com/venom-5-25x56-ffp-riflescope.html"
VENOM_MANUAL = "https://vortexoptics.widen.net/view/pdf/j900peyuse/VTX_M-00285-0_WEB.pdf"
EBR7C_SHEET = "https://vortexoptics.widen.net/view/pdf/wtqaqb3spd/VTX_VEN-52502_EBR-7C_MRAD_RS_I_RI_ST.pdf"


def fov_rad(feet_at_100yd):
    """Angle across the field of view, from the published linear field of view at 100 yd."""
    import math
    return round(2 * math.atan((feet_at_100yd / 2) / 300.0), 6)


VENOM = {
    "scope": {
        "libraryId": "vortex-venom-5-25x56-ebr7c-mrad",
        "name": "Vortex Venom 5-25x56 FFP, EBR-7C MRAD",
        "magMin": 5, "magMax": 25, "focalPlane": "first",
        "fovAtMinRad": fov_rad(21.2), "fovAtMaxRad": fov_rad(4.7),
        "trueSubtensionMag": None,
        "reticleId": "ebr-7c-mrad",
        # RevStop zero ring fitted (confirmed by the owner 2026-11-10): 19 MRAD instead of 25.
        "availableElevation": 19,
        "note": quote(
            "The reticle's line, dot, and hash sizes are Vortex's published figures. The positions of the "
            "hashes and wind dots are drawn from Vortex's subtension diagram, which Vortex marks "
            "\"for representation only\".", EBR7C_SHEET),
    },
    "angleUnit": "MIL",
    "clickValue": 0.1,
    "facts": [
        quote("Magnification 5-25x, first focal plane.", VENOM_PAGE),
        quote("Field of view 21.2 ft to 4.7 ft at 100 yd.", VENOM_MANUAL),
        quote("0.1 MRAD per click, 10 MRAD per rotation.", VENOM_MANUAL),
        quote("Maximum elevation 25 MRAD; 19 MRAD with the RevStop zero ring fitted.", VENOM_MANUAL),
        quote("Maximum windage 25 MRAD.", VENOM_MANUAL),
    ],
}
SCOPES = {"scopes": [VENOM]}

GENERIC_SCOPE = {
    "libraryId": None, "name": "Generic scope", "magMin": 3, "magMax": 18, "focalPlane": "first",
    "fovAtMinRad": 0.105, "fovAtMaxRad": 0.0175, "trueSubtensionMag": None,
    "reticleId": "generic-mil", "availableElevation": 15, "note": None,
}

RIFLE = {
    "name": "Tikka T3x CTR .308 Win, 16 inch",
    "cartridgeId": "308-win",
    "barrelLengthM": round(16 * IN, 4),
    "twistM": round(11 * IN, 4),
    "twistDirection": "right",
    "twistConfirmed": False,
    "sightHeightM": round(1.75 * IN, 5),
    "zeroRangeM": round(100 * YD, 2),
    "angleUnit": "MIL",
    "clickValue": 0.1,
    "scope": VENOM["scope"],
    "genericScope": GENERIC_SCOPE,
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
    "genericTwistNote": (
        "To measure your twist: push a tight patch on a cleaning rod into the bore, mark the rod at the "
        "muzzle and put a tape flag on the handle, push until the flag has made one full turn, and "
        "measure how far the mark moved. That distance in inches is your twist."
    ),
    "sightHeightNote": "1.75 inches is a typical scope height, not a measurement. Measure from the centre of the bolt to the centre of the scope tube.",
}

if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "src" / "data"
    (out / "loads.json").write_text(json.dumps(LIBRARY, indent=2) + "\n")
    (out / "rifle.json").write_text(json.dumps(RIFLE, indent=2) + "\n")
    (out / "scopes.json").write_text(json.dumps(SCOPES, indent=2) + "\n")
    by = {}
    for l in LIBRARY["loads"]:
        by[l["cartridgeId"]] = by.get(l["cartridgeId"], 0) + 1
    print("wrote", len(LIBRARY["loads"]), "loads:", by, "| scopes:", len(SCOPES["scopes"]))
    print("Venom FOV rad:", VENOM["scope"]["fovAtMinRad"], VENOM["scope"]["fovAtMaxRad"])
