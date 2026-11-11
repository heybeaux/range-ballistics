// Lead-owned data checks for src/data/loads.json, rifle.json and scopes.json.
import { describe, it, expect } from 'vitest';
import loadsJson from '../src/data/loads.json';
import rifleJson from '../src/data/rifle.json';
import scopesJson from '../src/data/scopes.json';
import type { LoadLibrary, Sourced } from '../src/planner/types';

const library: LoadLibrary = loadsJson;

const checkSourced = (s: Sourced, what: string): void => {
  if (s.value === null) {
    expect(s.sourceUrl, what).toBeNull();
    return;
  }
  expect(s.sourceUrl, what).toMatch(/^https?:\/\//);
  expect(s.readOn, what).toMatch(/^\d{4}-\d{2}-\d{2}$/);
};

/** Plausible limits per cartridge. A value outside them is a typing or unit mistake. */
const LIMITS: Record<string, { massKg: [number, number]; velocity: [number, number]; g1: [number, number]; g7: [number, number]; lengthM: [number, number] }> = {
  '308-win': { massKg: [0.0097, 0.0123], velocity: [750, 900], g1: [0.4, 0.6], g7: [0.2, 0.3], lengthM: [0.028, 0.035] },
  '223-rem': { massKg: [0.0032, 0.0052], velocity: [780, 1010], g1: [0.22, 0.42], g7: [0.15, 0.21], lengthM: [0.018, 0.027] },
  '556-nato': { massKg: [0.0032, 0.0052], velocity: [820, 1010], g1: [0.22, 0.42], g7: [0.15, 0.21], lengthM: [0.018, 0.027] },
  '22-lr': { massKg: [0.0025, 0.0027], velocity: [310, 385], g1: [0.1, 0.18], g7: [0, 0], lengthM: [0, 0] }
};

describe('load library', () => {
  it('ships the four first-pass cartridges, each with loads', () => {
    expect(library.cartridges.map(c => c.id).sort()).toEqual(['22-lr', '223-rem', '308-win', '556-nato']);
    for (const c of library.cartridges) {
      expect(library.loads.filter(l => l.cartridgeId === c.id).length, c.id).toBeGreaterThanOrEqual(7);
    }
  });

  it('every non-null BC, length, and velocity has a source URL and a date', () => {
    for (const load of library.loads) {
      checkSourced(load.bcG1, `${load.id} bcG1`);
      checkSourced(load.bcG7, `${load.id} bcG7`);
      checkSourced(load.bcRA4, `${load.id} bcRA4`);
      checkSourced(load.bulletLengthM, `${load.id} bulletLengthM`);
      checkSourced(load.publishedVelocityMps, `${load.id} publishedVelocityMps`);
    }
    for (const c of library.cartridges) {
      checkSourced(c.velocityLossMpsPerM, `${c.id} velocityLossMpsPerM`);
      expect(c.diameterSource.sourceUrl, c.id).toMatch(/^https:\/\//);
      expect(c.velocityLossNote.length, c.id).toBeGreaterThan(20);
    }
  });

  it('ids are unique, every load belongs to a cartridge, and its diameter is the cartridge diameter', () => {
    const ids = library.loads.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const load of library.loads) {
      const cartridge = library.cartridges.find(c => c.id === load.cartridgeId);
      expect(cartridge, load.id).toBeDefined();
      if (cartridge === undefined) continue;
      expect(load.bulletDiameterM, load.id).toBeCloseTo(cartridge.bulletDiameterM, 7);
    }
  });

  it('values are physically plausible for their cartridge', () => {
    for (const load of library.loads) {
      const lim = LIMITS[load.cartridgeId];
      expect(lim, load.id).toBeDefined();
      if (lim === undefined) continue;
      const within = (v: number, [lo, hi]: [number, number], what: string): void => {
        expect(v, `${load.id} ${what}`).toBeGreaterThanOrEqual(lo);
        expect(v, `${load.id} ${what}`).toBeLessThanOrEqual(hi);
      };
      within(load.bulletMassKg, lim.massKg, 'mass');
      if (load.bcG1.value !== null) within(load.bcG1.value, lim.g1, 'G1');
      if (load.bcG7.value !== null) within(load.bcG7.value, lim.g7, 'G7');
      if (load.bcRA4.value !== null) within(load.bcRA4.value, [0.08, 0.15], 'RA4');
      if (load.bulletLengthM.value !== null) within(load.bulletLengthM.value, lim.lengthM, 'length');
      if (load.publishedVelocityMps.value !== null) within(load.publishedVelocityMps.value, lim.velocity, 'velocity');
      if (load.testBarrelM !== null) within(load.testBarrelM, [0.4, 0.72], 'test barrel');
      for (const pair of load.velocityByBarrel) {
        within(pair.barrelM, [0.38, 0.72], 'barrel in velocityByBarrel');
        within(pair.velocityMps, lim.velocity, 'velocity in velocityByBarrel');
      }
    }
  });

  it('a BC with no stated drag model is only ever in the G1 field', () => {
    for (const load of library.loads) {
      if (!load.bcModelStated) {
        expect(load.bcG1.value, load.id).not.toBeNull();
        expect(load.bcG7.value, load.id).toBeNull();
        expect(load.bcRA4.value, load.id).toBeNull();
        expect(load.note ?? '', load.id).toContain('without naming a drag model');
      }
    }
  });

  it('velocityByBarrel is sorted, and a shorter barrel is never faster', () => {
    for (const load of library.loads) {
      for (let i = 1; i < load.velocityByBarrel.length; i++) {
        const a = load.velocityByBarrel[i - 1];
        const b = load.velocityByBarrel[i];
        if (a === undefined || b === undefined) continue;
        expect(b.barrelM, load.id).toBeGreaterThan(a.barrelM);
        expect(b.velocityMps, load.id).toBeGreaterThan(a.velocityMps);
      }
    }
  });

  it('spot values match the manufacturer pages', () => {
    const byId = (id: string) => {
      const found = library.loads.find(l => l.id === id);
      if (found === undefined) throw new Error(`missing ${id}`);
      return found;
    };
    // .308
    expect(byId('federal-gm308m').bcG7.value).toBe(0.224);
    expect(byId('federal-gm308m').publishedVelocityMps.value).toBeCloseTo(2650 * 0.3048, 2);
    expect(byId('federal-gm308m').testBarrelM).toBeNull();
    expect(byId('federal-gm308m2').bcG1.value).toBe(0.505);
    expect(byId('hornady-80966').testBarrelM).toBeCloseTo(0.6096, 4);
    expect(byId('hornady-8105').bcG1.value).toBeNull();
    expect(byId('lapua-4317520').publishedVelocityMps.value).toBe(793);
    expect(byId('bullet-nosler-53164').bcG7.value).toBeNull();
    // .223
    expect(byId('federal-gm223m3').bcG7.value).toBe(0.182);
    expect(byId('federal-gm223m3').publishedVelocityMps.value).toBeCloseTo(2720 * 0.3048, 2);
    expect(byId('hornady-80269').bcG7.value).toBe(0.2);
    expect(byId('berger-23030').testBarrelM).toBeCloseTo(0.508, 4);
    expect(byId('pmc-223a').velocityByBarrel.length).toBe(2);
    expect(byId('pmc-223a').velocityByBarrel[0]?.velocityMps).toBeCloseTo(2900 * 0.3048, 2);
    // 5.56
    expect(byId('federal-ae193').bcG1.value).toBe(0.246);
    expect(byId('federal-ae193').bcModelStated).toBe(false);
    expect(byId('hornady-fr200').bcModelStated).toBe(true);
    expect(byId('pmc-556k').velocityByBarrel[0]?.barrelM).toBeCloseTo(0.4064, 4);
    expect(byId('blackhills-mk262').bcG1.value).toBeNull();
    // .22 LR
    expect(byId('cci-32').publishedVelocityMps.value).toBeCloseTo(1070 * 0.3048, 2);
    expect(byId('cci-32').bcModelStated).toBe(false);
    expect(byId('lapua-420163').bcG1.value).toBe(0.172);
    expect(byId('lapua-420163').bcModelStated).toBe(true);
    expect(byId('eley-tenex').bcRA4.value).toBe(0.112);
    expect(byId('eley-tenex').bcG1.value).toBeNull();
    expect(byId('eley-tenex').publishedVelocityMps.value).toBeNull();
    expect(byId('sk-420101').bcG1.value).toBeNull();
  });

  it('only .308 has a barrel-length velocity figure; the .223 and 5.56 safety note is SAAMI\'s wording', () => {
    const c = (id: string) => {
      const found = library.cartridges.find(x => x.id === id);
      if (found === undefined) throw new Error(`missing ${id}`);
      return found;
    };
    expect(c('308-win').velocityLossMpsPerM.value).toBeCloseTo(250.8, 1);
    expect(c('223-rem').velocityLossMpsPerM.value).toBeNull();
    expect(c('556-nato').velocityLossMpsPerM.value).toBeNull();
    expect(c('22-lr').velocityLossMpsPerM.value).toBeNull();
    for (const id of ['223-rem', '556-nato']) {
      expect(c(id).safetyNote?.text).toContain('it is not safe to shoot \u201c5.56,\u201d \u201c5.56 NATO,\u201d or \u201c5.56x45mm\u201d ammunition in a barrel marked as being chambered in 223 Remington');
      expect(c(id).safetyNote?.sourceUrl).toBe('https://saami.org/faqs/');
    }
    expect(c('308-win').safetyNote).toBeNull();
    expect(c('22-lr').defaults.zeroRangeM).toBeCloseTo(45.72, 2);
    expect(c('22-lr').defaults.dope.endM).toBeCloseTo(182.88, 2);
  });
});

describe('rifle and scope defaults', () => {
  it('the rifle default is a 16 inch .308 with an unconfirmed 1:11 twist and 0.1 MIL clicks', () => {
    expect(rifleJson.cartridgeId).toBe('308-win');
    expect(rifleJson.barrelLengthM).toBeCloseTo(0.4064, 4);
    expect(rifleJson.twistM).toBeCloseTo(0.2794, 4);
    expect(rifleJson.twistConfirmed).toBe(false);
    expect(rifleJson.angleUnit).toBe('MIL');
    expect(rifleJson.clickValue).toBe(0.1);
    expect(rifleJson.twistSources.length).toBe(2);
  });

  it('the Venom 5-25x56 matches Vortex\'s published figures', () => {
    const venom = scopesJson.scopes[0];
    expect(venom).toBeDefined();
    if (venom === undefined) return;
    expect(venom.scope.magMin).toBe(5);
    expect(venom.scope.magMax).toBe(25);
    expect(venom.scope.focalPlane).toBe('first');
    expect(venom.scope.reticleId).toBe('ebr-7c-mrad');
    expect(venom.clickValue).toBe(0.1);
    expect(venom.angleUnit).toBe('MIL');
    // 21.2 ft and 4.7 ft across at 100 yd (300 ft).
    expect(2 * 300 * Math.tan(venom.scope.fovAtMinRad / 2)).toBeCloseTo(21.2, 2);
    expect(2 * 300 * Math.tan(venom.scope.fovAtMaxRad / 2)).toBeCloseTo(4.7, 2);
    // RevStop zero ring fitted: 19 MRAD, not 25.
    expect(venom.scope.availableElevation).toBe(19);
    expect(rifleJson.scope.libraryId).toBe(venom.scope.libraryId);
    for (const fact of venom.facts) expect(fact.sourceUrl).toMatch(/^https:\/\/vortexoptics\./);
  });
});
