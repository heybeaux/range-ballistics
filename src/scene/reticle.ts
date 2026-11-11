import type { ReticleId, ScopeProfile } from '../planner/types';
import type { AngleUnit } from '../units/units';

export type ReticleShape =
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number; width: number }
  | { kind: 'dot'; x: number; y: number; diameter: number }
  | { kind: 'text'; x: number; y: number; text: string; size: number; align: 'left' | 'center' | 'right' };

export interface Reticle {
  id: ReticleId;
  unit: AngleUnit;
  name: string;
  /** How far the pattern reaches from centre, in units. */
  extent: number;
  shapes: ReticleShape[];
}

/** The part of CanvasRenderingContext2D this module uses. A real context satisfies it. */
export interface ReticleCanvas {
  strokeStyle: string | CanvasGradient | CanvasPattern;
  fillStyle: string | CanvasGradient | CanvasPattern;
  lineWidth: number;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;
  fill(): void;
  fillText(text: string, x: number, y: number): void;
}

export function unitRad(unit: AngleUnit): number {
  return unit === 'MIL' ? 0.001 : Math.PI / 10800;
}

export function scopeFovAt(scope: ScopeProfile, magnification: number): number {
  if (scope.magMax <= scope.magMin) return scope.fovAtMinRad;
  const m = Math.min(scope.magMax, Math.max(scope.magMin, magnification));
  const t = (1 / m - 1 / scope.magMin) / (1 / scope.magMax - 1 / scope.magMin);
  return scope.fovAtMinRad + t * (scope.fovAtMaxRad - scope.fovAtMinRad);
}

export function reticlePxPerUnit(scope: ScopeProfile, magnification: number, lensDiameterPx: number, unit: AngleUnit): number {
  const mag = scope.focalPlane === 'first' ? magnification : (scope.trueSubtensionMag ?? scope.magMax);
  return lensDiameterPx / scopeFovAt(scope, mag) * unitRad(unit);
}

export function subtensionsAreTrue(scope: ScopeProfile, magnification: number): boolean {
  if (scope.focalPlane === 'first') return true;
  return Math.abs(magnification - (scope.trueSubtensionMag ?? scope.magMax)) <= 0.05;
}

export function genericReticle(unit: AngleUnit): Reticle {
  const mil = unit === 'MIL';
  const extent = mil ? 20 : 60;
  const step = mil ? 1 : 2;
  const numberEvery = mil ? 5 : 10;
  const width = mil ? 0.03 : 0.1;
  const gap = step * 0.25;
  const shapes: ReticleShape[] = [];

  shapes.push({ kind: 'line', x1: gap, y1: 0, x2: extent, y2: 0, width });
  shapes.push({ kind: 'line', x1: -gap, y1: 0, x2: -extent, y2: 0, width });
  shapes.push({ kind: 'line', x1: 0, y1: gap, x2: 0, y2: extent, width });
  shapes.push({ kind: 'line', x1: 0, y1: -gap, x2: 0, y2: -extent, width });

  for (let v = step; v <= extent; v += step) {
    const len = v % numberEvery === 0 ? step * 0.8 : step * 0.4;
    shapes.push({ kind: 'line', x1: v, y1: -len / 2, x2: v, y2: len / 2, width });
    shapes.push({ kind: 'line', x1: -v, y1: -len / 2, x2: -v, y2: len / 2, width });
    shapes.push({ kind: 'line', x1: -len / 2, y1: v, x2: len / 2, y2: v, width });
    shapes.push({ kind: 'line', x1: -len / 2, y1: -v, x2: len / 2, y2: -v, width });
    if (v % numberEvery === 0) {
      shapes.push({ kind: 'text', x: v, y: step * 0.9, text: String(v), size: step * 0.6, align: 'center' });
      shapes.push({ kind: 'text', x: -v, y: step * 0.9, text: String(v), size: step * 0.6, align: 'center' });
      shapes.push({ kind: 'text', x: step * 0.7, y: v, text: String(v), size: step * 0.6, align: 'left' });
      shapes.push({ kind: 'text', x: step * 0.7, y: -v, text: String(v), size: step * 0.6, align: 'left' });
    }
  }

  return {
    id: mil ? 'generic-mil' : 'generic-moa',
    unit,
    name: mil ? 'Generic MIL crosshair' : 'Generic MOA crosshair',
    extent,
    shapes
  };
}

function isWhole(v: number): boolean {
  return Math.abs(v - Math.round(v)) < 1e-6;
}

function isHalf(v: number): boolean {
  return isWhole(v * 2) && !isWhole(v);
}

function r4(v: number): number {
  return Math.round(v * 10000) / 10000;
}

export function ebr7cMrad(): Reticle {
  const LINE = 0.03;
  const CENTER_DOT = 0.04;
  const DOT_SMALL = 0.06;
  const DOT_LARGE = 0.09;
  const BAR = 0.5;
  const shapes: ReticleShape[] = [];

  shapes.push({ kind: 'dot', x: 0, y: 0, diameter: CENTER_DOT });

  for (const s of [1, -1]) {
    shapes.push({ kind: 'line', x1: s * 0.1, y1: 0, x2: s * 9.0, y2: 0, width: LINE });
    shapes.push({ kind: 'line', x1: s * 9.0, y1: 0, x2: s * 13, y2: 0, width: BAR });
    shapes.push({ kind: 'line', x1: s * 10.0, y1: -0.5, x2: s * 10.0, y2: 0.5, width: LINE });
  }

  for (const s of [1, -1]) {
    for (let i = 1; i <= 20; i++) {
      const x = r4(s * i * 0.2);
      if (isWhole(x)) {
        shapes.push({ kind: 'line', x1: x, y1: -0.5, x2: x, y2: 0.5, width: LINE });
      } else {
        shapes.push({ kind: 'line', x1: x, y1: -0.25, x2: x, y2: 0, width: LINE });
      }
    }
    for (const x of [0.5, 1.5, 2.5, 3.5]) {
      shapes.push({ kind: 'line', x1: r4(s * x), y1: 0, x2: r4(s * x), y2: 0.3, width: DOT_SMALL });
    }
    for (const v of [1, 2, 3, 4]) {
      shapes.push({ kind: 'text', x: s * v, y: -0.75, text: String(v), size: 0.35, align: 'center' });
    }
  }

  for (const s of [1, -1]) {
    for (let i = 41; i <= 80; i++) {
      const x = r4(s * i * 0.1);
      const half = isHalf(x);
      const y1 = isWhole(x) ? -0.25 : half ? -0.15 : -0.1;
      const y2 = isWhole(x) ? 0.25 : half ? 0.15 : 0.1;
      shapes.push({ kind: 'line', x1: x, y1, x2: x, y2, width: LINE });
    }
    for (const v of [6, 8]) {
      shapes.push({ kind: 'text', x: s * v, y: -0.75, text: String(v), size: 0.35, align: 'center' });
    }
  }

  shapes.push({ kind: 'line', x1: 0, y1: -0.1, x2: 0, y2: -10, width: LINE });
  shapes.push({ kind: 'line', x1: 0, y1: -10.5, x2: 0, y2: -13, width: LINE });
  for (let i = 1; i <= 20; i++) {
    const y = r4(-i * 0.5);
    const x1 = isWhole(-y) ? -0.25 : -0.15;
    const x2 = isWhole(-y) ? 0.25 : 0.15;
    shapes.push({ kind: 'line', x1, y1: y, x2, y2: y, width: LINE });
  }
  for (let i = 41; i <= 99; i++) {
    const y = r4(-i * 0.1);
    if (isWhole(-y) || isHalf(-y)) continue;
    shapes.push({ kind: 'line', x1: -0.1, y1: y, x2: 0.1, y2: y, width: LINE });
  }
  for (const v of [2, 4, 6, 8, 10]) {
    shapes.push({ kind: 'text', x: 0.45, y: -v, text: String(v), size: 0.35, align: 'left' });
  }

  shapes.push({ kind: 'line', x1: 0, y1: 0.1, x2: 0, y2: 11, width: LINE });
  shapes.push({ kind: 'line', x1: 0, y1: 11, x2: 0, y2: 13, width: BAR });
  for (let i = 1; i <= 20; i++) {
    const y = r4(i * 0.5);
    const x1 = isWhole(y) ? -0.2 : -0.1;
    const x2 = isWhole(y) ? 0.2 : 0.1;
    shapes.push({ kind: 'line', x1, y1: y, x2, y2: y, width: LINE });
  }

  const reach = [2, 2, 3, 3, 4, 4, 5, 5, 6, 6];
  for (let row = 1; row <= 10; row++) {
    const y = row;
    const reachPx = reach[row - 1];
    if (reachPx === undefined) continue;
    for (let i = 2; i <= reachPx * 5; i++) {
      const x = r4(i * 0.2);
      const diameter = isWhole(x) ? DOT_LARGE : DOT_SMALL;
      shapes.push({ kind: 'dot', x, y, diameter });
      shapes.push({ kind: 'dot', x: -x, y, diameter });
    }
    shapes.push({ kind: 'text', x: reachPx + 0.35, y, text: String(y), size: 0.3, align: 'left' });
    shapes.push({ kind: 'text', x: -(reachPx + 0.35), y, text: String(y), size: 0.3, align: 'right' });
  }

  return { id: 'ebr-7c-mrad', unit: 'MIL', name: 'Vortex EBR-7C MRAD', extent: 13, shapes };
}

export function reticleFor(id: ReticleId): Reticle {
  switch (id) {
    case 'ebr-7c-mrad':
      return ebr7cMrad();
    case 'generic-moa':
      return genericReticle('MOA');
    case 'generic-mil':
      return genericReticle('MIL');
  }
}

export function drawReticle(ctx: ReticleCanvas, reticle: Reticle, cx: number, cy: number, pxPerUnit: number, color: string): void {
  if (pxPerUnit <= 0) return;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  for (const shape of reticle.shapes) {
    if (shape.kind === 'line') {
      const x1 = cx + shape.x1 * pxPerUnit;
      const y1 = cy + shape.y1 * pxPerUnit;
      const x2 = cx + shape.x2 * pxPerUnit;
      const y2 = cy + shape.y2 * pxPerUnit;
      ctx.lineWidth = Math.max(1, shape.width * pxPerUnit);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else if (shape.kind === 'dot') {
      const x = cx + shape.x * pxPerUnit;
      const y = cy + shape.y * pxPerUnit;
      const radius = Math.max(0.75, (shape.diameter * pxPerUnit) / 2);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const px = shape.size * pxPerUnit;
      if (px < 7) continue;
      const x = cx + shape.x * pxPerUnit;
      const y = cy + shape.y * pxPerUnit;
      ctx.font = `${Math.round(Math.min(px, 16))}px system-ui, sans-serif`;
      ctx.textAlign = shape.align;
      ctx.textBaseline = 'middle';
      ctx.fillText(shape.text, x, y);
    }
  }
}
