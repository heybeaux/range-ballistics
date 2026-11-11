import { describe, it, expect } from 'vitest';
import { solve, sampleAt } from '../src/solver/solve';
import type { ShotInput, TrajectorySample } from '../src/solver/types';
import { losPoint, displayPoint, trimToRange, regimeOf, pathRuns, sampleAtTime, flagPose, markerRanges, cameraPose, readoutAt, dialSamples, scopeFovRad, NICE_SCALES, autoExaggeration, pxPerMil, visibleLabels, dotScale } from '../src/scene/geometry';

const base: ShotInput = {
  muzzleVelocityMps: 750, bc: 0.243, dragModel: 'G7', bulletMassKg: 0.01134, bulletDiameterM: 0.007823,
  bulletLengthM: null, twistM: 0.2794, twistDirection: 'right', sightHeightM: 0.05, zeroRangeM: 91.44,
  maxRangeM: 914.4, shotAngleRad: 0, atmosphere: { temperatureK: 288.15, pressurePa: 101325, relativeHumidity: 0 },
  wind: { speedMps: 4.4704, clock: 3 }, spinDrift: false, coriolis: null
};

function samplesFor(input: ShotInput): TrajectorySample[] {
  const r = solve(input);
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.samples;
}

describe('losPoint', () => {
  it('test 1', () => {
    const p = losPoint(100, 0, 0.05);
    expect(p.x).toBeCloseTo(100, 12);
    expect(p.y).toBeCloseTo(0.05, 12);
    expect(p.z).toBeCloseTo(0, 12);
    const q = losPoint(100, Math.PI / 6, 0);
    expect(q.x).toBeCloseTo(86.60254, 4);
    expect(q.y).toBeCloseTo(50, 4);
    expect(q.z).toBeCloseTo(0, 4);
  });
});

describe('displayPoint', () => {
  it('test 2: true scale equals solver position, no spin drift', () => {
    const samples = samplesFor(base);
    for (const idx of [0, 500, samples.length - 1]) {
      const s = samples[idx];
      if (s === undefined) throw new Error('missing sample');
      const p = displayPoint(s, 0, 0.05, 1);
      expect(Math.abs(p.x - s.position.x)).toBeLessThan(1e-9);
      expect(Math.abs(p.y - s.position.y)).toBeLessThan(1e-9);
      expect(Math.abs(p.z - s.position.z)).toBeLessThan(1e-9);
    }
  });

  it('test 3: inclined shot', () => {
    const samples = samplesFor({ ...base, shotAngleRad: 0.2 });
    const s = samples[500];
    if (s === undefined) throw new Error('missing sample');
    const p = displayPoint(s, 0.2, 0.05, 1);
    expect(Math.abs(p.x - s.position.x)).toBeLessThan(1e-9);
    expect(Math.abs(p.y - s.position.y)).toBeLessThan(1e-9);
    expect(Math.abs(p.z - s.position.z)).toBeLessThan(1e-9);
  });

  it('test 4: exaggeration triples offsets', () => {
    const samples = samplesFor(base);
    const s = sampleAt(samples, 500);
    if (s === null) throw new Error('sampleAt returned null');
    const p1 = displayPoint(s, 0, 0.05, 1);
    const p3 = displayPoint(s, 0, 0.05, 3);
    const L = losPoint(s.rangeM, 0, 0.05);
    expect(Math.abs((p3.y - L.y) - 3 * (p1.y - L.y))).toBeLessThan(1e-9);
    expect(Math.abs((p3.z - L.z) - 3 * (p1.z - L.z))).toBeLessThan(1e-9);
    expect(Math.abs(p3.x - p1.x)).toBeLessThan(1e-9);
  });
});

describe('trimToRange', () => {
  it('test 5', () => {
    const samples = samplesFor(base);
    const trimmed = trimToRange(samples, 548.64);
    const last = trimmed[trimmed.length - 1];
    if (last === undefined) throw new Error('empty trim');
    expect(Math.abs(last.rangeM - 548.64)).toBeLessThan(1e-6);
    for (const s of trimmed.slice(0, -1)) {
      expect(s.rangeM).toBeLessThan(548.64);
    }
    expect(trimmed.length).toBeGreaterThanOrEqual(100);
  });

  it('test 6', () => {
    const samples = samplesFor(base);
    expect(trimToRange(samples, 5000).length).toBe(samples.length);
  });
});

describe('regimeOf', () => {
  it('test 7', () => {
    expect(regimeOf(2)).toBe('supersonic');
    expect(regimeOf(1.2)).toBe('supersonic');
    expect(regimeOf(1.19)).toBe('transonic');
    expect(regimeOf(1.0)).toBe('transonic');
    expect(regimeOf(0.99)).toBe('subsonic');
  });
});

describe('pathRuns', () => {
  it('test 8', () => {
    const samples = samplesFor(base);
    const trimmed = trimToRange(samples, 548.64);
    const runs = pathRuns(trimmed, 0, 0.05, 1);
    expect(runs.length).toBe(1);
    expect(runs[0]?.regime).toBe('supersonic');
    expect(runs[0]?.points.length).toBe(trimmed.length);
  });

  it('test 9', () => {
    const samples = samplesFor({ ...base, maxRangeM: 1400 });
    const runs = pathRuns(samples, 0, 0.05, 1);
    expect(runs.length).toBe(3);
    expect(runs[0]?.regime).toBe('supersonic');
    expect(runs[1]?.regime).toBe('transonic');
    expect(runs[2]?.regime).toBe('subsonic');
    const end0 = runs[0]?.points[runs[0]?.points.length - 1];
    const start1 = runs[1]?.points[0];
    const end1 = runs[1]?.points[runs[1]?.points.length - 1];
    const start2 = runs[2]?.points[0];
    if (end0 === undefined || start1 === undefined || end1 === undefined || start2 === undefined) {
      throw new Error('missing run points');
    }
    expect(Math.abs(end0.x - start1.x)).toBeLessThan(1e-12);
    expect(Math.abs(end0.y - start1.y)).toBeLessThan(1e-12);
    expect(Math.abs(end0.z - start1.z)).toBeLessThan(1e-12);
    expect(Math.abs(end1.x - start2.x)).toBeLessThan(1e-12);
    expect(Math.abs(end1.y - start2.y)).toBeLessThan(1e-12);
    expect(Math.abs(end1.z - start2.z)).toBeLessThan(1e-12);
  });

  it('test 10', () => {
    expect(pathRuns([], 0, 0.05, 1)).toEqual([]);
  });
});

describe('sampleAtTime', () => {
  it('test 11', () => {
    const samples = samplesFor(base);
    const first = samples[0];
    const last = samples[samples.length - 1];
    if (first === undefined || last === undefined) throw new Error('empty samples');
    expect(sampleAtTime(samples, -1)).toBe(first);
    expect(sampleAtTime(samples, 1e9)).toBe(last);
    const a = samples[100];
    const b = samples[101];
    if (a === undefined || b === undefined) throw new Error('missing samples');
    const mid = sampleAtTime(samples, (a.timeS + b.timeS) / 2);
    if (mid === null) throw new Error('null mid');
    expect(Math.abs(mid.rangeM - (a.rangeM + b.rangeM) / 2)).toBeLessThan(1e-9);
    expect(Math.abs(mid.position.y - (a.position.y + b.position.y) / 2)).toBeLessThan(1e-12);
    expect(sampleAtTime([], 1)).toBeNull();
  });
});

describe('flagPose', () => {
  it('test 12', () => {
    const p = flagPose(4.4704, 3);
    expect(Math.abs(p.downwind.x)).toBeLessThan(1e-9);
    expect(Math.abs(p.downwind.y)).toBeLessThan(1e-9);
    expect(Math.abs(p.downwind.z - (-1))).toBeLessThan(1e-9);
    expect(Math.abs(p.liftRad - Math.PI / 4)).toBeLessThan(1e-9);
    expect(flagPose(0, 3).liftRad).toBe(0);
    expect(flagPose(20, 3).liftRad).toBe(Math.PI / 2);
    const p12 = flagPose(5, 12);
    expect(Math.abs(p12.downwind.x - (-1))).toBeLessThan(1e-9);
    expect(Math.abs(p12.downwind.y)).toBeLessThan(1e-9);
    expect(Math.abs(p12.downwind.z)).toBeLessThan(1e-9);
    const p9 = flagPose(5, 9);
    expect(Math.abs(p9.downwind.x)).toBeLessThan(1e-9);
    expect(Math.abs(p9.downwind.y)).toBeLessThan(1e-9);
    expect(Math.abs(p9.downwind.z - 1)).toBeLessThan(1e-9);
    expect(flagPose(10, 3).flutterHz).toBeGreaterThan(flagPose(1, 3).flutterHz);
  });
});

describe('markerRanges', () => {
  it('test 13', () => {
    const imp = markerRanges(548.64, 'imperial');
    expect(imp.length).toBe(6);
    const first = imp[0];
    const last = imp[imp.length - 1];
    if (first === undefined || last === undefined) throw new Error('missing markers');
    expect(first.label).toBe('100 yd');
    expect(Math.abs(first.rangeM - 91.44)).toBeLessThan(1e-9);
    expect(last.label).toBe('600 yd');
    const m600 = markerRanges(600, 'metric');
    expect(m600.length).toBe(6);
    const m600Last = m600[m600.length - 1];
    if (m600Last === undefined) throw new Error('missing marker');
    expect(m600Last.label).toBe('600 m');
    const m50 = markerRanges(50, 'metric');
    expect(m50.length).toBe(1);
    const m50First = m50[0];
    if (m50First === undefined) throw new Error('missing marker');
    expect(m50First.label).toBe('100 m');
    expect(markerRanges(601, 'metric').length).toBe(7);
  });
});

describe('cameraPose', () => {
  it('test 14', () => {
    const side = cameraPose('side', 600, 0, 0.05);
    expect(Math.abs(side.position.x - 300)).toBeLessThan(1e-9);
    expect(Math.abs(side.position.y - 12.025)).toBeLessThan(1e-9);
    expect(Math.abs(side.position.z - 450)).toBeLessThan(1e-9);
    expect(Math.abs(side.target.x - 300)).toBeLessThan(1e-9);
    expect(Math.abs(side.target.y - 0.025)).toBeLessThan(1e-9);
    expect(Math.abs(side.target.z)).toBeLessThan(1e-9);
    expect(side.up).toEqual({ x: 0, y: 1, z: 0 });
    const top = cameraPose('top', 600, 0, 0.05);
    expect(Math.abs(top.position.x - 300)).toBeLessThan(1e-9);
    expect(Math.abs(top.position.y - 450.025)).toBeLessThan(1e-9);
    expect(Math.abs(top.position.z)).toBeLessThan(1e-9);
    expect(top.up).toEqual({ x: 0, y: 0, z: -1 });
    const shooter = cameraPose('shooter', 600, 0, 0.05);
    expect(Math.abs(shooter.position.x - (-4))).toBeLessThan(1e-9);
    expect(Math.abs(shooter.position.y - 0.55)).toBeLessThan(1e-9);
    expect(Math.abs(shooter.position.z)).toBeLessThan(1e-9);
    expect(Math.abs(shooter.target.x - 600)).toBeLessThan(1e-9);
    expect(Math.abs(shooter.target.y - 0.05)).toBeLessThan(1e-9);
    expect(Math.abs(shooter.target.z)).toBeLessThan(1e-9);
    const reset = cameraPose('reset', 600, 0, 0.05);
    expect(Math.abs(reset.position.x - (-36))).toBeLessThan(1e-9);
    expect(Math.abs(reset.position.y - 51)).toBeLessThan(1e-9);
    expect(Math.abs(reset.position.z - 95)).toBeLessThan(1e-9);
  });
});

describe('readoutAt', () => {
  it('test 15', () => {
    const samples = samplesFor(base);
    const r = readoutAt(samples, 0.5, true);
    if (r === null) throw new Error('null readout');
    expect(Math.abs(r.timeS - 0.5)).toBeLessThan(1e-9);
    const last = samples[samples.length - 1];
    if (last === undefined) throw new Error('empty samples');
    expect(r.durationS).toBe(last.timeS);
    expect(r.playing).toBe(true);
    expect(r.rangeM).toBeGreaterThan(300);
    expect(r.rangeM).toBeLessThan(400);
    expect(readoutAt([], 0, false)).toBeNull();
  });
});

describe('dialSamples', () => {
  it('test 16: the dialled shot hits the point of aim at the target', () => {
    const samples = samplesFor(base);
    const dialed = dialSamples(samples, 548.64);
    const at = sampleAt(dialed, 548.64);
    if (at === null) throw new Error('sampleAt returned null');
    expect(Math.abs(at.pathM)).toBeLessThan(1e-6);
    expect(Math.abs(at.windageM)).toBeLessThan(1e-6);
  });

  it('test 17: the muzzle sample is unchanged and length is preserved', () => {
    const samples = samplesFor(base);
    const dialed = dialSamples(samples, 548.64);
    expect(dialed.length).toBe(samples.length);
    const first = dialed[0];
    if (first === undefined) throw new Error('empty result');
    expect(Math.abs(first.pathM - -0.05)).toBeLessThan(1e-9);
    expect(Math.abs(first.windageM)).toBeLessThan(1e-9);
  });

  it('test 18: the dialled path rises above the line of sight', () => {
    const samples = samplesFor(base);
    const dialed = dialSamples(samples, 548.64);
    let maxPath = -Infinity;
    for (const s of dialed) {
      if (s.rangeM < 548.64 && s.pathM > maxPath) {
        maxPath = s.pathM;
      }
    }
    expect(maxPath).toBeGreaterThan(0.5);
    expect(maxPath).toBeLessThan(3);
  });

  it('test 19: wind from 3 o\'clock, the dialled bullet is right of the line of sight mid-flight', () => {
    const samples = samplesFor(base);
    const dialed = dialSamples(samples, 548.64);
    const at = sampleAt(dialed, 274.32);
    if (at === null) throw new Error('sampleAt returned null');
    expect(at.windageM).toBeGreaterThan(0);
  });

  it('test 20: a target beyond the solve leaves the path unchanged; empty input stays empty', () => {
    const samples = samplesFor(base);
    const dialed = dialSamples(samples, 5000);
    for (let i = 0; i < samples.length; i++) {
      const a = samples[i];
      const b = dialed[i];
      if (a === undefined || b === undefined) throw new Error('missing sample');
      expect(b.pathM).toBe(a.pathM);
    }
    expect(dialSamples([], 100)).toEqual([]);
  });

  it('test 21: dialSamples does not change timeS, speedMps, rangeM, or position', () => {
    const samples = samplesFor(base);
    const dialed = dialSamples(samples, 548.64);
    const a = samples[500];
    const b = dialed[500];
    if (a === undefined || b === undefined) throw new Error('missing sample');
    expect(b.timeS).toBe(a.timeS);
    expect(b.speedMps).toBe(a.speedMps);
    expect(b.rangeM).toBe(a.rangeM);
    expect(b.position).toEqual(a.position);
  });
});

describe('scopeFovRad', () => {
  it('test 22', () => {
    const samples = samplesFor(base);
    expect(Math.abs(scopeFovRad(samples, 548.64) - 0.024)).toBeLessThan(1e-12);
    expect(scopeFovRad(samples, 900)).toBeCloseTo(3.2 * Math.atan2(11.8861, 900), 4);
    expect(scopeFovRad([], 500)).toBe(0.024);
    for (const range of [100, 300, 500, 700, 900]) {
      const fov = scopeFovRad(samples, range);
      expect(fov).toBeGreaterThanOrEqual(0.024);
      expect(fov).toBeLessThanOrEqual(0.12);
    }
  });
});

describe('NICE_SCALES', () => {
  it('test 23', () => {
    expect(NICE_SCALES).toEqual([1, 2, 5, 10, 20, 50, 100, 200]);
  });
});

describe('autoExaggeration', () => {
  it('test 24: dialled arc', () => {
    const samples = samplesFor(base);
    expect(autoExaggeration(dialSamples(trimToRange(samples, 548.64), 548.64), 548.64, 'path')).toBe(50);
  });

  it('test 25: uncorrected drop and drift', () => {
    const samples = samplesFor(base);
    const trimmed = trimToRange(samples, 548.64);
    expect(autoExaggeration(trimmed, 548.64, 'path')).toBe(20);
    expect(autoExaggeration(trimmed, 548.64, 'windage')).toBe(50);
  });

  it('test 26: degenerate inputs', () => {
    expect(autoExaggeration([], 500, 'path')).toBe(1);
    const noWind = samplesFor({ ...base, wind: { speedMps: 0, clock: 3 } });
    expect(autoExaggeration(noWind, 500, 'windage')).toBe(1);
  });
});

describe('pxPerMil', () => {
  it('test 27', () => {
    expect(Math.abs(pxPerMil(0.024, 480) - 20)).toBeLessThan(0.01);
    expect(pxPerMil(0, 480)).toBe(0);
  });
});

describe('visibleLabels', () => {
  it('test 28', () => {
    expect(
      visibleLabels(
        [
          { x: 100, y: 100, depth: 10 },
          { x: 110, y: 104, depth: 20 },
          { x: 300, y: 100, depth: 30 }
        ],
        60,
        24
      )
    ).toEqual([true, false, true]);
  });

  it('test 29: nearest wins when unsorted; empty input', () => {
    expect(
      visibleLabels([{ x: 100, y: 100, depth: 50 }, { x: 105, y: 100, depth: 5 }], 60, 24)
    ).toEqual([false, true]);
    expect(visibleLabels([], 60, 24)).toEqual([]);
  });

  it('test 30: close in x but far in y both show', () => {
    expect(
      visibleLabels([{ x: 100, y: 100, depth: 1 }, { x: 100, y: 200, depth: 2 }], 60, 24)
    ).toEqual([true, true]);
  });
});

describe('dotScale', () => {
  it('test 31', () => {
    expect(Math.abs(dotScale(100, (50 * Math.PI) / 180, 0.012) - 1.2)).toBeLessThan(1e-9);
    expect(dotScale(100, 0.024, 0.012)).toBeLessThan(0.05);
  });
});
