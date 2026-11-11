import { describe, it, expect } from 'vitest';
import loadsJson from '../src/data/loads.json';
import rifleJson from '../src/data/rifle.json';
import type { LoadLibrary, Sourced } from '../src/planner/types';

const library: LoadLibrary = loadsJson;

const checkSourced = (s: Sourced, what: string): void => {
  if (s.value === null) {
    expect(s.sourceUrl, what).toBeNull();
    return;
  }
  expect(s.sourceUrl, what).toMatch(/^https:\/\//);
  expect(s.readOn, what).toMatch(/^\d{4}-\d{2}-\d{2}$/);
};

describe('load library', () => {
  it('every non-null BC, length, and velocity has a source URL and a date', () => {
    expect(library.loads.length).toBeGreaterThanOrEqual(7);
    for (const load of library.loads) {
      checkSourced(load.bcG1, `${load.id} bcG1`);
      checkSourced(load.bcG7, `${load.id} bcG7`);
      checkSourced(load.bulletLengthM, `${load.id} bulletLengthM`);
      checkSourced(load.publishedVelocityMps, `${load.id} publishedVelocityMps`);
    }
    checkSourced(library.velocityLossMpsPerM, 'velocityLossMpsPerM');
  });

  it('ids are unique and values are physically plausible for .308 match bullets', () => {
    const ids = library.loads.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const load of library.loads) {
      expect(load.bulletDiameterM).toBeCloseTo(0.0078232, 6);
      expect(load.bulletMassKg).toBeGreaterThan(0.0097); // 150 gr
      expect(load.bulletMassKg).toBeLessThan(0.0123); // 190 gr
      if (load.bcG1.value !== null) expect(load.bcG1.value).toBeGreaterThan(0.4), expect(load.bcG1.value).toBeLessThan(0.6);
      if (load.bcG7.value !== null) expect(load.bcG7.value).toBeGreaterThan(0.2), expect(load.bcG7.value).toBeLessThan(0.3);
      if (load.bulletLengthM.value !== null) expect(load.bulletLengthM.value).toBeGreaterThan(0.028), expect(load.bulletLengthM.value).toBeLessThan(0.035);
      if (load.publishedVelocityMps.value !== null) expect(load.publishedVelocityMps.value).toBeGreaterThan(750), expect(load.publishedVelocityMps.value).toBeLessThan(900);
      if (load.testBarrelM !== null) expect(load.testBarrelM).toBeGreaterThan(0.5), expect(load.testBarrelM).toBeLessThan(0.7);
    }
  });

  it('spot values match the manufacturer pages', () => {
    const byId = (id: string) => {
      const found = library.loads.find(l => l.id === id);
      if (found === undefined) throw new Error(`missing ${id}`);
      return found;
    };
    expect(byId('federal-gm308m').bcG7.value).toBe(0.224);
    expect(byId('federal-gm308m').publishedVelocityMps.value).toBeCloseTo(2650 * 0.3048, 2);
    expect(byId('federal-gm308m').testBarrelM).toBeNull();
    expect(byId('federal-gm308m2').bcG1.value).toBe(0.505);
    expect(byId('hornady-80966').testBarrelM).toBeCloseTo(0.6096, 4);
    expect(byId('hornady-8105').bcG1.value).toBeNull();
    expect(byId('lapua-4317520').publishedVelocityMps.value).toBe(793);
    expect(byId('bullet-nosler-53164').bcG7.value).toBeNull();
    expect(library.velocityLossMpsPerM.value).toBeCloseTo(250.8, 1);
  });

  it('the rifle default is a 16 inch barrel with an unconfirmed 1:11 twist and 0.1 MIL clicks', () => {
    expect(rifleJson.barrelLengthM).toBeCloseTo(0.4064, 4);
    expect(rifleJson.twistM).toBeCloseTo(0.2794, 4);
    expect(rifleJson.twistConfirmed).toBe(false);
    expect(rifleJson.angleUnit).toBe('MIL');
    expect(rifleJson.clickValue).toBe(0.1);
    expect(rifleJson.twistSources.length).toBe(2);
  });
});
