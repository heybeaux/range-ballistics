Make the scope view show the shooter's own scope: its real field of view at the chosen magnification, and its reticle. No new tests (WebGL and canvas); acceptance is file-local typecheck plus the existing test suites for the scene.

File you own (edit only this):
  src/scene/scene.ts

Read first, in full: src/scene/types.ts (SceneView now has `scope` and `magnification`; RangeScene has a new method `setMagnification`), src/scene/reticle.ts (use scopeFovAt, reticlePxPerUnit, subtensionsAreTrue, reticleFor, drawReticle, unitRad), src/scene/geometry.ts, then src/scene/scene.ts.

IMPORTANT JavaScript rule: declare every `const` / `let` BEFORE any function call that uses it. Typecheck does not catch a use-before-declaration at start-up; a previous version of this file crashed that way.

Naming: scene.ts already has its own function called drawReticle. Import the one from reticle.ts under another name: `import { drawReticle as drawReticleShapes, ... } from './reticle';`

THE LENS: the scope view shows a round lens of diameter D = 0.96 * (container height in px), centred. The lens shows exactly the scope's field of view.

CHANGES

1. Scope camera (inside setCamera when the preset is 'shooter', and in setMagnification):
     lensFov = scopeFovAt(view.scope, view.magnification)        // radians across the lens
     camera.fov = (lensFov / 0.96) * 180 / Math.PI               // vertical field of view of the whole canvas, degrees
   This replaces the scopeFovRad(...) call. Remove the scopeFovRad import if nothing else uses it. Everything else in the scope branch (position, target, near plane, controls disabled) stays.

2. New state: let magnification = 1 is NOT needed; keep the value on `view`. Implement
     setMagnification(m): if view is null return; view = { ...view, magnification: m }; if scopeMode: apply the camera formula above, camera.updateProjectionMatrix(), then redraw the reticle overlay.
   Add setMagnification to the returned object.

3. Reticle overlay (the existing scene-local drawReticle function). Keep the canvas sizing, the clear, the early return when not in scope mode, the black surround with the lens cut out, and the lens outline. Replace the hand-drawn crosshair, hash marks and numbers with:
     const reticle = reticleFor(view.scope.reticleId);
     const D = h * 0.96;
     const ppu = reticlePxPerUnit(view.scope, view.magnification, D, reticle.unit);
     Clip to the lens circle before drawing the reticle (ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, D / 2, 0, Math.PI * 2); ctx.clip(); ... ctx.restore()), so marks do not spill onto the black surround.
     drawReticleShapes(ctx, reticle, cx, cy, ppu, 'rgba(8,8,8,0.92)');
   The lens circle radius is now D / 2 everywhere in this function (it was h * 0.48, which is the same number).

4. Caption, bottom right, white, as now, but with the real figures:
     line 1: `${view.scope.name} · ${view.magnification.toFixed(view.magnification % 1 === 0 ? 0 : 1)}×`
     line 2: subtensionsAreTrue(view.scope, view.magnification)
               ? `Reticle: ${reticle.name}. Marks read true.`
               : `Reticle: ${reticle.name}. Marks read true only at ${(view.scope.trueSubtensionMag ?? view.scope.magMax)}×.`
   Draw line 1 at (w - 12, h - 28) and line 2 at (w - 12, h - 12), right aligned, font '12px system-ui, sans-serif', fillStyle 'rgba(232,234,237,0.9)'.

5. update(view): no change in what it builds. It already re-applies the scope camera when scopeMode is true; make sure that path uses the new formula and that the reticle overlay is redrawn at the end of update().

6. Dot sizes in scope mode: use k = 0.006 for the bullet and 0.004 for the impact dot (half the normal size), so they do not cover the reticle marks. Outside scope mode they stay 0.012 and 0.008.

ACCEPTANCE
- `npx tsc --noEmit 2>&1 | grep -E "src/scene/"` prints nothing. (src/main.ts will still report errors; that is the next task.)
- `npx vitest run tests/scene-geometry.test.ts tests/scene-reticle.test.ts` passes.
Do not edit any other file.

Reply with what you changed and anything you could not do.
