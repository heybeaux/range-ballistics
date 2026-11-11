import type { AngleUnit } from '../units/units';
import { format, unitFor } from '../units/units';
import type { AppState, Correction, DopeRow, ShotResults } from './types';
import { PLANNING_NOTICE } from './types';

function angle(c: Correction, unit: AngleUnit): number {
  return unit === 'MIL' ? c.mil : c.moa;
}

function dirWord(d: Correction['direction']): string {
  return d === 'none' ? '' : d;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function correctionHtml(title: string, c: Correction, state: AppState): string {
  const u = state.rifle.angleUnit;
  const a = angle(c, u);
  const dir = dirWord(c.direction);
  const equiv = `${c.mil.toFixed(2)} MIL &middot; ${c.moa.toFixed(2)} MOA &middot; ${(Math.abs(c.offsetM) / 0.0254).toFixed(1)} in &middot; ${(Math.abs(c.offsetM) * 100).toFixed(1)} cm`;
  if (c.direction === 'none') {
    return `<div class="correction"><h3>${escapeHtml(title)}</h3><p class="dial"><strong>No correction</strong></p></div>`;
  }
  const dial = `<p class="dial"><strong>${a.toFixed(1)} ${u} ${dir}</strong></p>`;
  const clicks = `<p class="clicks">${c.clicks} clicks ${dir} &middot; exact ${a.toFixed(2)} ${u}</p>`;
  return `<div class="correction"><h3>${escapeHtml(title)}</h3>${dial}${clicks}<p class="equiv">${equiv}</p></div>`;
}

export function windClockSvg(windClock: number, speedText: string): string {
  const speed = escapeHtml(speedText === '' ? 'No wind' : speedText);
  return (
    `<svg class="wind-clock" viewBox="0 0 96 112" width="96" height="112" role="img" aria-label="Wind ${speed} from ${windClock} o&#39;clock">` +
    `<circle cx="48" cy="48" r="40" fill="rgba(20,23,26,0.72)" stroke="#e8eaed" stroke-width="1.5"/>` +
    `<text x="48" y="18" class="wc-num">12</text><text x="82" y="52" class="wc-num">3</text><text x="48" y="86" class="wc-num">6</text><text x="14" y="52" class="wc-num">9</text>` +
    `<g transform="rotate(${windClock * 30} 48 48)">` +
    `<line x1="48" y1="14" x2="48" y2="44" stroke="#4aa8ff" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M48 52 L40 38 L56 38 Z" fill="#4aa8ff"/>` +
    `</g>` +
    `<circle cx="48" cy="48" r="3" fill="#e8eaed"/>` +
    `<text x="48" y="106" class="wc-speed">${speed}</text>` +
    `</svg>`
  );
}

export function resultsHtml(results: ShotResults | null, state: AppState, stale: boolean): string {
  const sys = state.unitSystem;
  if (results === null) {
    return `<section class="results"><p class="notice">${PLANNING_NOTICE}</p><p class="empty">Fix the highlighted inputs to see a result.</p></section>`;
  }
  const parts: string[] = [];
  parts.push(`<section class="results${stale ? ' stale' : ''}">`);
  parts.push(`<p class="notice">${PLANNING_NOTICE}</p>`);
  if (stale) {
    parts.push('<p class="stale-mark">Out of date: fix the highlighted inputs.</p>');
  }
  if (results.velocityEstimated) {
    parts.push('<p class="estimate-mark">Estimated velocity. Replace it with your chronograph average.</p>');
  }
  parts.push(`<h2>At ${format(results.rangeM, 'range', sys)}</h2>`);
  parts.push(correctionHtml('Elevation', results.elevation, state));
  parts.push(correctionHtml('Windage', results.windage, state));
  const facts: Array<[string, string]> = [
    ['Time of flight', `${results.timeOfFlightS.toFixed(2)} s`],
    ['Remaining velocity', `${format(results.velocityMps, 'velocity', sys)} (Mach ${results.mach.toFixed(2)})`],
    ['Remaining energy', format(results.energyJ, 'energy', sys)],
    [
      'Spin drift',
      results.spinDriftM === null
        ? 'Not available'
        : `${format(Math.abs(results.spinDriftM), 'smallLength', sys)} ${results.spinDriftM >= 0 ? 'right' : 'left'} (included in windage)`
    ],
    [
      'Stability factor',
      results.stabilitySg === null
        ? 'Not available (bullet length unknown)'
        : `${results.stabilitySg.toFixed(2)} (${results.stabilityStatus ?? ''})`
    ],
    [
      'Goes transonic at',
      results.transonicRangeM === null
        ? `Stays supersonic to ${format(results.rangeM, 'range', sys)}`
        : format(results.transonicRangeM, 'range', sys)
    ],
    [
      'Goes subsonic at',
      results.subsonicRangeM === null ? 'Not within this distance' : format(results.subsonicRangeM, 'range', sys)
    ]
  ];
  parts.push('<dl class="facts">');
  for (const [dt, dd] of facts) {
    parts.push(`<dt>${dt}</dt><dd>${dd}</dd>`);
  }
  parts.push('</dl>');
  if (results.pastTransonic) {
    parts.push('<p class="warning">The target is past the transonic range. Predictions beyond it are less reliable.</p>');
  }
  if (results.notes.length > 0) {
    parts.push('<ul class="notes">');
    for (const note of results.notes) {
      parts.push(`<li>${escapeHtml(note)}</li>`);
    }
    parts.push('</ul>');
  }
  parts.push('</section>');
  return parts.join('');
}

export function dopeTableHtml(rows: DopeRow[], state: AppState): string {
  const u = state.rifle.angleUnit;
  const sys = state.unitSystem;
  if (rows.length === 0) {
    return '<p class="empty">No rows. Check the start, end, and step distances.</p>';
  }
  const body = rows
    .map((row) => {
      const e = `${angle(row.elevation, u).toFixed(1)} ${dirWord(row.elevation.direction)}`.trim();
      const w = `${angle(row.windage, u).toFixed(1)} ${dirWord(row.windage.direction)}`.trim();
      const current = Math.abs(row.rangeM - state.conditions.targetRangeM) <= 0.5 ? ' class="current"' : '';
      return `<tr${current}><td>${format(row.rangeM, 'range', sys, false)}</td><td>${e}</td><td>${row.elevation.clicks}</td><td>${w}</td><td>${row.windage.clicks}</td><td>${row.timeOfFlightS.toFixed(2)}</td><td>${format(row.velocityMps, 'velocity', sys, false)}</td></tr>`;
    })
    .join('');
  return `<table class="dope"><thead><tr><th>Distance (${unitFor('range', sys).label})</th><th>Elevation (${u})</th><th>Clicks</th><th>Windage (${u})</th><th>Clicks</th><th>Time (s)</th><th>Velocity (${unitFor('velocity', sys).label})</th></tr></thead><tbody>${body}</tbody></table>`;
}

export function cardHeaderLines(state: AppState, dateIso: string): string[] {
  const sys = state.unitSystem;
  const { load, rifle, conditions } = state;
  return [
    load.name,
    `Muzzle velocity ${format(load.muzzleVelocityMps, 'velocity', sys)}${load.velocityMeasured ? '' : ' (estimated velocity)'}`,
    `Zero ${format(rifle.zeroRangeM, 'range', sys)}`,
    `Wind ${format(conditions.windSpeedMps, 'windSpeed', sys)} from ${conditions.windClock} o'clock`,
    `${format(conditions.temperatureK, 'temperature', sys)}, ${Math.round(conditions.relativeHumidity * 100)}% humidity`,
    dateIso
  ];
}

export function printCardHtml(rows: DopeRow[], state: AppState, dateIso: string): string {
  const lines = cardHeaderLines(state, dateIso)
    .map((line) => `<p class="card-line">${escapeHtml(line)}</p>`)
    .join('');
  return `<div class="print-card"><h2>${escapeHtml(state.rifle.name)}</h2>${lines}${dopeTableHtml(rows, state)}<p class="notice">${PLANNING_NOTICE}</p></div>`;
}
