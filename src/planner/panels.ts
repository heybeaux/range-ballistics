import type { AppState, Sourced } from './types';
import { library } from './storage';
import { escapeHtml } from './view';
import { effectivePressurePa, estimateVelocityMps } from './model';
import { format } from '../units/units';
import rifleJson from '../data/rifle.json';

function link(url: string): string {
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">source</a>`;
}

function line(label: string, sourced: Sourced, origin: 'library' | 'user', text: string): string {
  if (origin === 'user') return `<li>${label}: your value</li>`;
  if (sourced.value === null) return `<li>${label}: not published by the maker</li>`;
  const readOn = sourced.readOn ?? 'an unknown date';
  return `<li>${label}: ${text} ${link(sourced.sourceUrl ?? '')} (read ${escapeHtml(readOn)})</li>`;
}

function bulletLengthText(value: number, sys: AppState['unitSystem']): string {
  return sys === 'imperial' ? `${(value / 0.0254).toFixed(3)} in` : `${(value * 1000).toFixed(2)} mm`;
}

export function loadPickerHtml(state: AppState): string {
  const options: string[] = [];
  const hasCustom = state.customLoads.some((l) => l.name === state.load.name);
  if (state.load.libraryId === null && !hasCustom) {
    options.push('<option value="" selected>Custom (not saved)</option>');
  }
  for (const lib of library.loads) {
    const selected = lib.id === state.load.libraryId ? ' selected' : '';
    options.push(`<option value="lib:${lib.id}"${selected}>${escapeHtml(lib.name)}</option>`);
  }
  for (const custom of state.customLoads) {
    const selected = state.load.libraryId === null && custom.name === state.load.name ? ' selected' : '';
    options.push(`<option value="custom:${escapeHtml(custom.name)}"${selected}>My load: ${escapeHtml(custom.name)}</option>`);
  }
  return (
    `<div class="field" data-field="loadPicker"><label for="loadPicker">Load</label>` +
    `<select id="loadPicker" name="loadPicker">${options.join('')}</select>` +
    `<p class="help">Pick the ammunition you are shooting, or a bullet if you load your own.</p></div>` +
    `<div class="field" data-field="loadName"><label for="loadName">Load name</label>` +
    `<span class="input-row"><input type="text" id="loadName" name="loadName" value="${escapeHtml(state.load.name)}">` +
    `<button type="button" id="saveCustomLoad">Save as my load</button></span>` +
    `<p class="help">Change any value below, give it a name, and save it to keep it in the list.</p></div>`
  );
}

export function loadSourcesHtml(state: AppState): string {
  const lib = state.load.libraryId === null ? undefined : library.loads.find((l) => l.id === state.load.libraryId);
  if (lib === undefined) return '<p class="sources">Custom load: every value is your value.</p>';
  const sys = state.unitSystem;
  const items: string[] = [];
  items.push(line('G7 BC', lib.bcG7, state.load.origin.bcG7, (lib.bcG7.value ?? 0).toFixed(3)));
  items.push(line('G1 BC', lib.bcG1, state.load.origin.bcG1, (lib.bcG1.value ?? 0).toFixed(3)));
  items.push(line('Bullet length', lib.bulletLengthM, state.load.origin.bulletLengthM, bulletLengthText(lib.bulletLengthM.value ?? 0, sys)));
  const v = lib.publishedVelocityMps.value ?? 0;
  const velText =
    format(v, 'velocity', sys) +
    (lib.testBarrelM === null ? ', test barrel not stated' : ` from a ${(lib.testBarrelM / 0.0254).toFixed(0)} inch test barrel`);
  items.push(line('Published velocity', lib.publishedVelocityMps, 'library', velText));
  const note = lib.note === null ? '' : `<p class="load-note">${escapeHtml(lib.note)}</p>`;
  return `<ul class="sources">${items.join('')}</ul>${note}`;
}

export function velocityNoteHtml(state: AppState): string {
  const sys = state.unitSystem;
  const barrelIn = (state.rifle.barrelLengthM / 0.0254).toFixed(0);
  if (state.load.velocityMeasured) {
    return '<p class="velocity-note measured">Measured: your chronograph average.</p>';
  }
  const lib = state.load.libraryId === null ? undefined : library.loads.find((l) => l.id === state.load.libraryId);
  let text: string;
  const v = lib?.publishedVelocityMps.value ?? null;
  if (lib === undefined || v === null) {
    text = 'There is no published velocity for this load.';
  } else if (lib.testBarrelM === null) {
    text = `The maker publishes ${format(v, 'velocity', sys)} and does not state its test barrel, so no barrel-length correction was made. Expect less from a ${barrelIn} inch barrel.`;
  } else {
    const loss = library.velocityLossMpsPerM.value;
    const est = estimateVelocityMps(v, lib.testBarrelM, state.rifle.barrelLengthM, loss);
    if (loss === null || est === null) {
      text = `The maker publishes ${format(v, 'velocity', sys)} and does not state its test barrel, so no barrel-length correction was made. Expect less from a ${barrelIn} inch barrel.`;
    } else {
      const testIn = (lib.testBarrelM / 0.0254).toFixed(0);
      const lossPerIn = format(loss * 0.0254, 'velocity', sys);
      const src = library.velocityLossMpsPerM.sourceUrl;
      const linkHtml = src === null ? '' : ` ${link(src)}`;
      text = `The maker publishes ${format(v, 'velocity', sys)} from a ${testIn} inch test barrel. Less ${lossPerIn} per inch for your ${barrelIn} inch barrel gives ${format(est, 'velocity', sys)}. ${escapeHtml(library.velocityLossNote)}${linkHtml}`;
    }
  }
  return `<p class="velocity-note estimate"><strong>Estimate, not measured in your rifle.</strong> ${text} Shoot over a chronograph and enter your average.</p>`;
}

export function twistNoteHtml(state: AppState): string {
  if (state.rifle.twistConfirmed) {
    return '<p class="twist-note confirmed">Twist confirmed by you.</p>';
  }
  const items = rifleJson.twistSources
    .map((s) => `<li>${escapeHtml(s.label)} ${link(s.url)}</li>`)
    .join('');
  return `<div class="twist-note unconfirmed"><p><strong>Unconfirmed.</strong> ${escapeHtml(rifleJson.twistNote)}</p><ul>${items}</ul></div>`;
}

export function pressureNoteHtml(state: AppState): string {
  const sys = state.unitSystem;
  const { conditions } = state;
  if (conditions.pressureMode !== 'altitude') return '';
  return `<p class="pressure-note">Using ${format(effectivePressurePa(conditions), 'pressure', sys)}: a standard-atmosphere estimate for ${format(conditions.altitudeM, 'altitude', sys)}. A measured station pressure is better.</p>`;
}

export function sightHeightNoteHtml(): string {
  return `<p class="sight-note">${escapeHtml(rifleJson.sightHeightNote)}</p>`;
}
