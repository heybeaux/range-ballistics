import type { AppState, SavedState, Sourced } from './types';
import { cartridgeById, library, loadsForCartridge, scopeLibrary } from './storage';
import { escapeHtml } from './view';
import { effectivePressurePa, velocityForBarrel } from './model';
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
  const cartridgeLoads = loadsForCartridge(state.rifle.cartridgeId);
  for (const lib of cartridgeLoads) {
    const selected = lib.id === state.load.libraryId ? ' selected' : '';
    options.push(`<option value="lib:${lib.id}"${selected}>${escapeHtml(lib.name)}</option>`);
  }
  for (const custom of state.customLoads) {
    const selected = state.load.libraryId === null && custom.name === state.load.name ? ' selected' : '';
    options.push(`<option value="custom:${escapeHtml(custom.name)}"${selected}>My load: ${escapeHtml(custom.name)}</option>`);
  }
  const help =
    cartridgeLoads.length === 0
      ? 'There are no library loads for this cartridge. Enter your load\'s values below.'
      : 'Pick the ammunition you are shooting, or a bullet if you load your own.';
  return (
    `<div class="field" data-field="loadPicker"><label for="loadPicker">Load</label>` +
    `<select id="loadPicker" name="loadPicker">${options.join('')}</select>` +
    `<p class="help">${help}</p></div>` +
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
  const g1 = line('G1 BC', lib.bcG1, state.load.origin.bcG1, (lib.bcG1.value ?? 0).toFixed(3));
  items.push(
    lib.bcModelStated === false && state.load.origin.bcG1 === 'library'
      ? g1 + ' Drag model not stated by the maker; treated as G1.'
      : g1
  );
  if (lib.bcRA4.value !== null || state.load.origin.bcRA4 === 'user') {
    items.push(line('RA4 BC', lib.bcRA4, state.load.origin.bcRA4, (lib.bcRA4.value ?? 0).toFixed(3)));
  }
  items.push(line('Bullet length', lib.bulletLengthM, state.load.origin.bulletLengthM, bulletLengthText(lib.bulletLengthM.value ?? 0, sys)));
  let velText: string;
  if (lib.velocityByBarrel.length > 0) {
    velText = lib.velocityByBarrel
      .map((entry) => `${format(entry.velocityMps, 'velocity', sys)} from a ${(entry.barrelM / 0.0254).toFixed(0)} inch barrel`)
      .join('; ');
  } else {
    const v = lib.publishedVelocityMps.value ?? 0;
    velText =
      format(v, 'velocity', sys) +
      (lib.testBarrelM === null ? ', test barrel not stated' : ` from a ${(lib.testBarrelM / 0.0254).toFixed(0)} inch test barrel`);
  }
  items.push(line('Published velocity', lib.publishedVelocityMps, 'library', velText));
  const note = lib.note === null ? '' : `<p class="load-note">${escapeHtml(lib.note)}</p>`;
  return `<ul class="sources">${items.join('')}</ul>${note}`;
}

export function velocityNoteHtml(state: AppState): string {
  const sys = state.unitSystem;
  const fmt = (x: number): string => format(x, 'velocity', sys);
  const barrelIn = (state.rifle.barrelLengthM / 0.0254).toFixed(0);
  if (state.load.velocityMeasured) {
    return '<p class="velocity-note measured">Measured: your chronograph average. If you change the barrel or the ammunition lot, measure again.</p>';
  }
  const lib = state.load.libraryId === null ? undefined : library.loads.find((l) => l.id === state.load.libraryId);
  let text: string;
  if (lib === undefined) {
    text = 'There is no published velocity for this load.';
  } else {
    const c = cartridgeById(lib.cartridgeId);
    const r = velocityForBarrel(lib, state.rifle.barrelLengthM, c);
    const v = lib.publishedVelocityMps.value;
    switch (r.basis) {
      case 'none':
        text = 'There is no published velocity for this load.';
        break;
      case 'published-barrel':
        text = `The maker publishes ${fmt(r.velocityMps ?? 0)} for this load from a ${barrelIn} inch barrel, the same as yours.`;
        break;
      case 'interpolated':
        text = `The maker publishes this load from two barrel lengths. ${fmt(r.velocityMps ?? 0)} is the straight-line figure between them for your ${barrelIn} inch barrel.`;
        break;
      case 'nearest-barrel':
        text = `The maker publishes this load from other barrel lengths only. ${fmt(r.velocityMps ?? 0)} is the figure for the nearest one, not for your ${barrelIn} inch barrel.`;
        break;
      case 'estimated': {
        const testIn = (lib.testBarrelM ?? 0) / 0.0254;
        const loss = c?.velocityLossMpsPerM.value ?? 0;
        const src = c?.velocityLossMpsPerM.sourceUrl ?? null;
        const linkHtml = src === null ? '' : ` ${link(src)}`;
        text = `The maker publishes ${fmt(v ?? 0)} from a ${testIn.toFixed(0)} inch test barrel. Less ${fmt(loss * 0.0254)} per inch for your ${barrelIn} inch barrel gives ${fmt(r.velocityMps ?? 0)}. ${escapeHtml(c?.velocityLossNote ?? '')}${linkHtml}`;
        break;
      }
      case 'published':
        if (lib.testBarrelM === null) {
          text = `The maker publishes ${fmt(v ?? 0)} and does not state its test barrel, so no barrel-length correction was made. Expect less from a short barrel.`;
        } else {
          const testIn = (lib.testBarrelM / 0.0254).toFixed(0);
          const note = c === undefined ? '' : ` ${escapeHtml(c.velocityLossNote)}`;
          text = `The maker publishes ${fmt(v ?? 0)} from a ${testIn} inch test barrel. No barrel-length correction was made.${note}`;
        }
        break;
    }
  }
  return `<p class="velocity-note estimate"><strong>Estimate, not measured in your rifle.</strong> ${text} Shoot over a chronograph and enter your average.</p>`;
}

export function twistNoteHtml(state: AppState): string {
  if (state.rifle.twistConfirmed) {
    return '<p class="twist-note confirmed">Twist confirmed by you.</p>';
  }
  const isDefaultRifle = state.rifle.cartridgeId === '308-win' && state.rifle.name === rifleJson.name;
  if (!isDefaultRifle) {
    return `<div class="twist-note unconfirmed"><p><strong>Unconfirmed.</strong> ${escapeHtml(rifleJson.genericTwistNote)}</p></div>`;
  }
  const items = rifleJson.twistSources
    .map((s) => `<li>${escapeHtml(s.label)} ${link(s.url)}</li>`)
    .join('');
  return `<div class="twist-note unconfirmed"><p><strong>Unconfirmed.</strong> ${escapeHtml(rifleJson.twistNote)}</p><ul>${items}</ul></div>`;
}

export function cartridgeNoteHtml(state: AppState): string {
  const c = cartridgeById(state.rifle.cartridgeId);
  if (c === undefined) {
    return '<p class="cartridge-note">Cartridge not in the library. Enter your own load values.</p>';
  }
  const safety =
    c.safetyNote === null
      ? ''
      : `<blockquote class="safety-note"><p><strong>Safety, in the standards body's words:</strong> ${escapeHtml(c.safetyNote.text)}</p><p>${link(c.safetyNote.sourceUrl)}</p></blockquote>`;
  return `<p class="cartridge-note">Cartridge: <strong>${escapeHtml(c.name)}</strong></p>${safety}`;
}

export function rifleBarHtml(saved: SavedState): string {
  const options = saved.profiles
    .map((p) => `<option value="${escapeHtml(p.id)}"${p.id === saved.activeId ? ' selected' : ''}>${escapeHtml(p.state.rifle.name)}</option>`)
    .join('');
  const deleteDisabled = saved.profiles.length <= 1 ? ' disabled' : '';
  return (
    `<label for="riflePicker">Rifle</label>` +
    `<select id="riflePicker" name="riflePicker">${options}</select>` +
    `<button type="button" id="addRifle">Add rifle</button>` +
    `<button type="button" id="duplicateRifle">Duplicate</button>` +
    `<button type="button" id="deleteRifle"${deleteDisabled}>Delete</button>`
  );
}

export function addRifleDialogHtml(): string {
  const options = library.cartridges
    .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`)
    .join('');
  return (
    `<div class="setup-backdrop"><div class="setup-dialog" role="dialog" aria-modal="true" aria-labelledby="addRifleTitle">` +
    `<h2 id="addRifleTitle">Add a rifle</h2>` +
    `<p class="setup-intro">Each rifle keeps its own load, zero, scope and conditions. Setup runs next so you can check the defaults.</p>` +
    `<div class="field"><label for="newRifleName">Rifle name</label><input type="text" id="newRifleName" value="My rifle" autocomplete="off"></div>` +
    `<div class="field"><label for="newRifleCartridge">Cartridge</label><select id="newRifleCartridge">${options}<option value="other">Other (enter your own load)</option></select></div>` +
    `<div class="setup-actions"><button type="button" id="addRifleCancel">Cancel</button><button type="button" id="addRifleConfirm" class="primary">Add rifle</button></div>` +
    `</div></div>`
  );
}

export function deleteRifleDialogHtml(name: string): string {
  return (
    `<div class="setup-backdrop"><div class="setup-dialog" role="dialog" aria-modal="true" aria-labelledby="deleteRifleTitle">` +
    `<h2 id="deleteRifleTitle">Delete this rifle?</h2>` +
    `<p class="setup-intro">"${escapeHtml(name)}" and its loads, zero and conditions will be removed from this browser. This cannot be undone.</p>` +
    `<div class="setup-actions"><button type="button" id="deleteRifleCancel">Cancel</button><button type="button" id="deleteRifleConfirm" class="primary">Delete rifle</button></div>` +
    `</div></div>`
  );
}

export function scopePanelHtml(state: AppState): string {
  const scopeLibId = state.rifle.scope.libraryId;
  const options: string[] = [];
  for (const entry of scopeLibrary.scopes) {
    const selected = entry.scope.libraryId === scopeLibId ? ' selected' : '';
    options.push(`<option value="lib:${escapeHtml(entry.scope.libraryId ?? '')}"${selected}>${escapeHtml(entry.scope.name)}</option>`);
  }
  const genericSelected = scopeLibId === null ? ' selected' : '';
  options.push(`<option value="generic"${genericSelected}>Generic scope (enter your own figures)</option>`);
  let detail = '';
  const found = scopeLibId === null ? undefined : scopeLibrary.scopes.find((s) => s.scope.libraryId === scopeLibId);
  if (found !== undefined) {
    const facts = found.facts.map((fact) => `<li>${escapeHtml(fact.text)} ${link(fact.sourceUrl)}</li>`).join('');
    const note = found.scope.note === null ? '' : `<p class="scope-note">${escapeHtml(found.scope.note.text)} ${link(found.scope.note.sourceUrl)}</p>`;
    detail = `<ul class="sources">${facts}</ul>${note}`;
  } else {
    detail = `<p class="scope-note">Generic crosshair. One mark is 1 MIL (or 2 MOA). Enter your scope's figures below.</p>`;
  }
  return (
    `<div class="field" data-field="scopePicker"><label for="scopePicker">Scope</label>` +
    `<select id="scopePicker" name="scopePicker">${options.join('')}</select>` +
    `<p class="help">Pick your scope so the scope view shows its reticle and field of view.</p></div>` +
    detail
  );
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
