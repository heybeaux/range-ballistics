import { describe, it, expect } from 'vitest';
import type { ScopeProfile } from '../src/planner/types';
import {
  unitRad,
  scopeFovAt,
  reticlePxPerUnit,
  subtensionsAreTrue,
  genericReticle,
  ebr7cMrad,
  reticleFor,
  drawReticle
} from '../src/scene/reticle';
import type { ReticleCanvas, ReticleShape } from '../src/scene/reticle';

const venom: ScopeProfile = { libraryId: 'v', name: 'Venom', magMin: 5, magMax: 25, focalPlane: 'first', fovAtMinRad: 0.070637, fovAtMaxRad: 0.015666, trueSubtensionMag: null, reticleId: 'ebr-7c-mrad', availableElevation: 19, note: null };

interface Call {
  name: string;
  args: unknown[];
}

function makeFake(): { ctx: ReticleCanvas; calls: Call[]; props: Record<string, unknown> } {
  const calls: Call[] = [];
  const props: Record<string, unknown> = {};
  const ctx = {
    set strokeStyle(v: string) { props.strokeStyle = v; },
    get strokeStyle() { return props.strokeStyle as string; },
    set fillStyle(v: string) { props.fillStyle = v; },
    get fillStyle() { return props.fillStyle as string; },
    set lineWidth(v: number) { props.lineWidth = v; calls.push({ name: 'lineWidth', args: [v] }); },
    get lineWidth() { return props.lineWidth as number; },
    set font(v: string) { props.font = v; calls.push({ name: 'font', args: [v] }); },
    get font() { return props.font as string; },
    set textAlign(v: 'left' | 'center' | 'right') { props.textAlign = v; calls.push({ name: 'textAlign', args: [v] }); },
    get textAlign() { return props.textAlign as 'left' | 'center' | 'right'; },
    set textBaseline(v: 'middle') { props.textBaseline = v; calls.push({ name: 'textBaseline', args: [v] }); },
    get textBaseline() { return props.textBaseline as 'middle'; },
    beginPath() { calls.push({ name: 'beginPath', args: [] }); },
    moveTo(x: number, y: number) { calls.push({ name: 'moveTo', args: [x, y] }); },
    lineTo(x: number, y: number) { calls.push({ name: 'lineTo', args: [x, y] }); },
    stroke() { calls.push({ name: 'stroke', args: [] }); },
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number) { calls.push({ name: 'arc', args: [x, y, radius, startAngle, endAngle] }); },
    fill() { calls.push({ name: 'fill', args: [] }); },
    fillText(text: string, x: number, y: number) { calls.push({ name: 'fillText', args: [text, x, y] }); }
  };
  return { ctx, calls, props };
}

function lines(r: ReturnType<typeof ebr7cMrad>): ReticleShape[] {
  return r.shapes.filter((s): s is Extract<ReticleShape, { kind: 'line' }> => s.kind === 'line');
}

function dots(r: ReturnType<typeof ebr7cMrad>): ReticleShape[] {
  return r.shapes.filter((s): s is Extract<ReticleShape, { kind: 'dot' }> => s.kind === 'dot');
}

function texts(r: ReturnType<typeof ebr7cMrad>): ReticleShape[] {
  return r.shapes.filter((s): s is Extract<ReticleShape, { kind: 'text' }> => s.kind === 'text');
}

function near(a: number, b: number, eps: number): boolean {
  return Math.abs(a - b) <= eps;
}

describe('unitRad', () => {
  it('test 1', () => {
    expect(unitRad('MIL')).toBe(0.001);
    expect(Math.abs(unitRad('MOA') - Math.PI / 10800)).toBeLessThan(1e-15);
  });
});

describe('scopeFovAt', () => {
  it('test 2: published ends and clamping', () => {
    expect(scopeFovAt(venom, 5)).toBe(0.070637);
    expect(scopeFovAt(venom, 25)).toBe(0.015666);
    expect(scopeFovAt(venom, 1)).toBe(0.070637);
    expect(scopeFovAt(venom, 99)).toBe(0.015666);
  });

  it('test 3: interpolation and monotonic decrease', () => {
    const expected = 0.070637 + ((1 / 10 - 1 / 5) / (1 / 25 - 1 / 5)) * (0.015666 - 0.070637);
    const at10 = scopeFovAt(venom, 10);
    expect(at10).toBeGreaterThan(0.015666);
    expect(at10).toBeLessThan(0.070637);
    expect(Math.abs(at10 - expected)).toBeLessThan(1e-12);
    const seq = [5, 8, 12, 18, 25].map((m) => scopeFovAt(venom, m));
    for (let i = 1; i < seq.length; i++) {
      const prev = seq[i - 1];
      const cur = seq[i];
      if (prev === undefined || cur === undefined) throw new Error('missing');
      expect(cur).toBeLessThan(prev);
    }
  });
});

describe('reticlePxPerUnit', () => {
  it('test 4: first focal plane scales with magnification', () => {
    const at25 = reticlePxPerUnit(venom, 25, 480, 'MIL');
    expect(Math.abs(at25 - 480 / 0.015666 * 0.001)).toBeLessThan(1e-9);
    const at5 = reticlePxPerUnit(venom, 5, 480, 'MIL');
    expect(Math.abs(at5 - 480 / 0.070637 * 0.001)).toBeLessThan(1e-9);
    expect(at25).toBeGreaterThan(at5);
  });

  it('test 5: second focal plane is constant', () => {
    const sfp: ScopeProfile = { ...venom, focalPlane: 'second', trueSubtensionMag: 25 };
    const at5 = reticlePxPerUnit(sfp, 5, 480, 'MIL');
    const at25 = reticlePxPerUnit(sfp, 25, 480, 'MIL');
    expect(at5).toBe(at25);
  });
});

describe('subtensionsAreTrue', () => {
  it('test 6', () => {
    expect(subtensionsAreTrue(venom, 7)).toBe(true);
    const sfp: ScopeProfile = { ...venom, focalPlane: 'second', trueSubtensionMag: 25 };
    expect(subtensionsAreTrue(sfp, 25)).toBe(true);
    expect(subtensionsAreTrue(sfp, 10)).toBe(false);
  });
});

describe('ebr7cMrad', () => {
  const r = ebr7cMrad();

  it('test 7: identity and centre dot', () => {
    expect(r.id).toBe('ebr-7c-mrad');
    expect(r.unit).toBe('MIL');
    expect(r.extent).toBe(13);
    const centre = dots(r).filter((d) => d.kind === 'dot' && d.diameter === 0.04);
    expect(centre.length).toBe(1);
    const c = centre[0];
    if (c === undefined || c.kind !== 'dot') throw new Error('missing centre dot');
    expect(c.x).toBe(0);
    expect(c.y).toBe(0);
  });

  it('test 8: wind dot counts', () => {
    const wind = dots(r).filter((d) => d.kind === 'dot' && d.y >= 1);
    expect(wind.length).toBe(380);
    const row1 = wind.filter((d) => d.kind === 'dot' && d.y === 1);
    expect(row1.length).toBe(18);
    const row1Max = Math.max(...row1.map((d) => (d.kind === 'dot' ? Math.abs(d.x) : 0)));
    expect(row1Max).toBeCloseTo(2.0, 9);
    const row10 = wind.filter((d) => d.kind === 'dot' && d.y === 10);
    expect(row10.length).toBe(58);
    const row10Max = Math.max(...row10.map((d) => (d.kind === 'dot' ? Math.abs(d.x) : 0)));
    expect(row10Max).toBeCloseTo(6.0, 9);
    for (const d of wind) {
      if (d.kind !== 'dot') continue;
      expect(Math.abs(d.x)).toBeGreaterThanOrEqual(0.39);
    }
  });

  it('test 9: dot sizes', () => {
    const wind = dots(r).filter((d) => d.kind === 'dot' && d.y >= 1);
    for (const d of wind) {
      if (d.kind !== 'dot') continue;
      const whole = Math.abs(Math.abs(d.x) - Math.round(Math.abs(d.x))) < 1e-6;
      expect(d.diameter).toBe(whole ? 0.09 : 0.06);
    }
    const diameters = new Set(dots(r).map((d) => (d.kind === 'dot' ? d.diameter : -1)));
    expect([...diameters].sort((a, b) => a - b)).toEqual([0.04, 0.06, 0.09]);
  });

  it('test 10: line widths', () => {
    const ls = lines(r);
    for (const l of ls) {
      if (l.kind !== 'line') continue;
      expect([0.03, 0.06, 0.5]).toContain(l.width);
    }
    const bars = ls.filter((l) => l.kind === 'line' && l.width === 0.5);
    expect(bars.length).toBe(3);
    const post = bars.find((l) => l.kind === 'line' && l.x1 === 0 && l.x2 === 0 && l.y1 === 11 && l.y2 === 13);
    expect(post).toBeDefined();
  });

  it('test 11: no fine line crosses the centre', () => {
    const ls = lines(r);
    for (const l of ls) {
      if (l.kind !== 'line' || l.width !== 0.03) continue;
      if (Math.abs(l.y1) < 1e-9 && Math.abs(l.y2) < 1e-9) {
        const span = Math.abs(l.x2 - l.x1);
        if (span > 1) {
          expect(Math.min(Math.abs(l.x1), Math.abs(l.x2))).toBeGreaterThanOrEqual(0.1 - 1e-9);
        }
      }
      if (Math.abs(l.x1) < 1e-9 && Math.abs(l.x2) < 1e-9) {
        const span = Math.abs(l.y2 - l.y1);
        if (span > 1) {
          expect(Math.min(Math.abs(l.y1), Math.abs(l.y2))).toBeGreaterThanOrEqual(0.1 - 1e-9);
        }
      }
    }
  });

  it('test 12: specific ticks', () => {
    const ls = lines(r);
    const whole = ls.find((l) => l.kind === 'line' && l.x1 === 1 && l.x2 === 1 && l.y1 === -0.5 && l.y2 === 0.5);
    expect(whole).toBeDefined();
    const tick02 = ls.find((l) => l.kind === 'line' && l.x1 === 0.2 && l.x2 === 0.2 && l.y1 === -0.25 && l.y2 === 0);
    expect(tick02).toBeDefined();
    const outer41 = ls.find((l) => l.kind === 'line' && l.x1 === 4.1 && l.x2 === 4.1 && l.y1 === -0.1 && l.y2 === 0.1);
    expect(outer41).toBeDefined();
    const outer6 = ls.find((l) => l.kind === 'line' && l.x1 === 6 && l.x2 === 6 && l.y1 === -0.25 && l.y2 === 0.25);
    expect(outer6).toBeDefined();
  });

  it('test 13: symmetry', () => {
    for (const s of r.shapes) {
      if (s.kind === 'line') {
        const mirror = r.shapes.find((o) => o.kind === 'line' && near(o.x1, -s.x1, 1e-9) && near(o.x2, -s.x2, 1e-9) && near(o.y1, s.y1, 1e-9) && near(o.y2, s.y2, 1e-9));
        // A segment on the vertical axis (x1 = -x2) maps to itself under x -> -x.
        const selfMirror = near(s.x1, -s.x2, 1e-9) && near(s.x2, -s.x1, 1e-9);
        expect(mirror !== undefined || selfMirror).toBe(true);
      } else if (s.kind === 'dot') {
        const mirror = r.shapes.find((o) => o.kind === 'dot' && near(o.x, -s.x, 1e-9) && near(o.y, s.y, 1e-9) && o.diameter === s.diameter);
        expect(mirror).toBeDefined();
      }
    }
  });

  it('test 14: positions are clean', () => {
    for (const s of r.shapes) {
      if (s.kind === 'line') {
        expect(s.x1).toBe(Math.round(s.x1 * 10000) / 10000);
        expect(s.y1).toBe(Math.round(s.y1 * 10000) / 10000);
        expect(s.x2).toBe(Math.round(s.x2 * 10000) / 10000);
        expect(s.y2).toBe(Math.round(s.y2 * 10000) / 10000);
      } else {
        expect(s.x).toBe(Math.round(s.x * 10000) / 10000);
        expect(s.y).toBe(Math.round(s.y * 10000) / 10000);
      }
    }
  });

  it('test 15: the sixes', () => {
    const ts = texts(r);
    const sixes = ts.filter((t) => t.kind === 'text' && t.text === '6');
    const horizontal = sixes.filter((t) => t.kind === 'text' && t.y < 0 && t.y > -1);
    expect(horizontal.length).toBe(2);
    const upper = sixes.filter((t) => t.kind === 'text' && t.x > 0.4 && t.x < 0.5);
    expect(upper.length).toBe(1);
    const windRow = sixes.filter((t) => t.kind === 'text' && t.y === 6);
    expect(windRow.length).toBe(2);
  });
});

describe('genericReticle', () => {
  it('test 16: MIL', () => {
    const r = genericReticle('MIL');
    expect(r.id).toBe('generic-mil');
    expect(r.extent).toBe(20);
    const ls = r.shapes.filter((s): s is Extract<ReticleShape, { kind: 'line' }> => s.kind === 'line');
    const tick5 = ls.find((l) => l.kind === 'line' && l.x1 === 5 && l.x2 === 5);
    expect(tick5).toBeDefined();
    if (tick5 !== undefined && tick5.kind === 'line') {
      expect(Math.abs(tick5.y2 - tick5.y1)).toBeCloseTo(0.8, 9);
    }
    const tick3 = ls.find((l) => l.kind === 'line' && l.x1 === 3 && l.x2 === 3);
    expect(tick3).toBeDefined();
    if (tick3 !== undefined && tick3.kind === 'line') {
      expect(Math.abs(tick3.y2 - tick3.y1)).toBeCloseTo(0.4, 9);
    }
    const ts = r.shapes.filter((s): s is Extract<ReticleShape, { kind: 'text' }> => s.kind === 'text');
    expect(ts.some((t) => t.kind === 'text' && t.text === '5')).toBe(true);
    expect(ts.some((t) => t.kind === 'text' && t.text === '20')).toBe(true);
    expect(r.shapes.some((s) => s.kind === 'dot')).toBe(false);
  });

  it('test 17: MOA', () => {
    const r = genericReticle('MOA');
    expect(r.id).toBe('generic-moa');
    expect(r.unit).toBe('MOA');
    expect(r.extent).toBe(60);
    const ts = r.shapes.filter((s): s is Extract<ReticleShape, { kind: 'text' }> => s.kind === 'text');
    expect(ts.some((t) => t.kind === 'text' && t.text === '10')).toBe(true);
    expect(ts.some((t) => t.kind === 'text' && t.text === '60')).toBe(true);
  });
});

describe('reticleFor', () => {
  it('test 18', () => {
    expect(reticleFor('ebr-7c-mrad').id).toBe('ebr-7c-mrad');
    expect(reticleFor('generic-mil').unit).toBe('MIL');
    expect(reticleFor('generic-moa').unit).toBe('MOA');
  });
});

describe('drawReticle', () => {
  it('test 19: call counts and positions', () => {
    const r = ebr7cMrad();
    const { ctx, calls } = makeFake();
    drawReticle(ctx, r, 400, 300, 30, '#000');
    const nDots = dots(r).length;
    const nLines = lines(r).length;
    const arcs = calls.filter((c) => c.name === 'arc');
    const strokes = calls.filter((c) => c.name === 'stroke');
    expect(arcs.length).toBe(nDots);
    expect(strokes.length).toBe(nLines);
    const centreArc = arcs.find((c) => c.name === 'arc' && c.args[0] === 400 && c.args[1] === 300);
    expect(centreArc).toBeDefined();
    const dot21 = arcs.find((c) => c.name === 'arc' && c.args[0] === 460 && c.args[1] === 330);
    expect(dot21).toBeDefined();
  });

  it('test 20: minimum sizes', () => {
    const r = ebr7cMrad();
    const small = makeFake();
    drawReticle(small.ctx, r, 400, 300, 5, '#000');
    const widths = small.calls.filter((c) => c.name === 'lineWidth').map((c) => c.args[0] as number);
    for (const w of widths) expect(w).toBeGreaterThanOrEqual(1);
    const radii = small.calls.filter((c) => c.name === 'arc').map((c) => c.args[2] as number);
    for (const rad of radii) expect(rad).toBeGreaterThanOrEqual(0.75);
    expect(small.calls.some((c) => c.name === 'fillText')).toBe(false);

    const big = makeFake();
    drawReticle(big.ctx, r, 400, 300, 30, '#000');
    const fillTexts = big.calls.filter((c) => c.name === 'fillText');
    expect(fillTexts.length).toBeGreaterThanOrEqual(20);
  });

  it('test 21: pxPerUnit 0 makes no calls', () => {
    const r = ebr7cMrad();
    const { ctx, calls } = makeFake();
    drawReticle(ctx, r, 400, 300, 0, '#000');
    expect(calls.length).toBe(0);
  });
});
