import { describe, expect, it } from 'vitest';
import { defaultState } from '../src/planner/storage';
import { fieldById } from '../src/planner/fields';
import { SETUP_STEPS, setupStepHtml } from '../src/planner/setup';

describe('SETUP_STEPS', () => {
  it('has the four steps in order', () => {
    expect(SETUP_STEPS.map((s) => s.key)).toEqual(['rifle', 'load', 'velocity', 'zero']);
  });

  it('references only existing fields', () => {
    for (const step of SETUP_STEPS) {
      for (const id of step.fieldIds) {
        expect(fieldById(id)).toBeDefined();
      }
    }
  });
});

describe('setupStepHtml', () => {
  it('renders step 1 (rifle)', () => {
    const html = setupStepHtml(defaultState(), 0, {});
    expect(html).toContain('Step 1 of 4');
    expect(html).toContain('Confirm your rifle');
    expect(html).toContain('id="twist"');
    expect(html).toContain('id="clickValue"');
    expect(html).toContain('Unconfirmed.');
    expect(html).toContain('id="setupNext"');
    expect(html).toContain('id="setupSkip"');
    expect(html).not.toContain('id="setupBack"');
    expect(html).not.toContain('id="setupFinish"');
  });

  it('renders step 2 (load)', () => {
    const html = setupStepHtml(defaultState(), 1, {});
    expect(html).toContain('Step 2 of 4');
    expect(html).toContain('id="loadPicker"');
    expect(html).toContain('class="sources"');
    expect(html).toContain('id="setupBack"');
  });

  it('renders step 3 (velocity)', () => {
    const html = setupStepHtml(defaultState(), 2, {});
    expect(html).toContain('Step 3 of 4');
    expect(html).toContain('id="muzzleVelocity"');
    expect(html).toContain('value="2650"');
    expect(html).toContain('Estimate, not measured in your rifle.');
  });

  it('renders step 4 (zero)', () => {
    const html = setupStepHtml(defaultState(), 3, {});
    expect(html).toContain('Step 4 of 4');
    expect(html).toContain('id="zeroRange"');
    expect(html).toContain('value="100"');
    expect(html).toContain('id="setupFinish"');
    expect(html).not.toContain('id="setupNext"');
  });

  it('shows a field error when provided', () => {
    const html = setupStepHtml(defaultState(), 0, { twist: 'Enter a number.' });
    expect(html).toContain('<p class="error" role="alert">Enter a number.</p>');
  });

  it('returns empty for an out-of-range index', () => {
    expect(setupStepHtml(defaultState(), 9, {})).toBe('');
  });

  it('marks the dialog for every step', () => {
    for (let i = 0; i < SETUP_STEPS.length; i++) {
      const html = setupStepHtml(defaultState(), i, {});
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-modal="true"');
    }
  });
});
