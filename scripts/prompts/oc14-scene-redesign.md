Redesign the 3D range so it looks like a real range and every view is readable. No new tests (WebGL); acceptance is `npm run typecheck`, `npm test`, and `npm run build` all passing.

Files you own (edit only these):
  src/scene/objects.ts
  src/scene/scene.ts
  src/main.ts
  index.html
  src/styles.css

Read first, in full: src/scene/types.ts, src/scene/geometry.ts (note the new functions scopeFovRad, NICE_SCALES, autoExaggeration, pxPerMil, visibleLabels, dotScale, and dialSamples, trimToRange), then the files you own.

IMPORTANT JavaScript rule for scene.ts: declare every `const` / `let` BEFORE any function call that uses it. A function may be defined early, but it must not be CALLED until everything it reads is declared. (The last version crashed at start-up because resize() ran before staticGroup existed. Typecheck does not catch this.)

## 1. src/scene/objects.ts

a. Add: export function buildSkyTexture(): THREE.Texture | null
   A 2 x 512 canvas with a vertical linear gradient: 0.0 '#3f78bd', 0.55 '#a9cbe8', 1.0 '#e3ecf2'. Return new THREE.CanvasTexture(canvas) with colorSpace = THREE.SRGBColorSpace. Return null if getContext('2d') is null.

b. Replace the body of buildGround(lengthM) with:
   - Wide ground: PlaneGeometry(8000, 8000), MeshLambertMaterial color 0x5a7a45, rotated -PI/2 about x, at (lengthM / 2, -0.3, 0).
   - Mown lane: PlaneGeometry(lengthM + 50, 26), MeshLambertMaterial color 0x7fa65c, rotated -PI/2 about x, at (lengthM / 2 - 5, -0.29, 0).
   - Backstop berm behind the last marker: CylinderGeometry(5, 5, 44, 24), MeshLambertMaterial color 0x8a6f4d, rotation.x = PI / 2 (so it lies across the lane), at (lengthM + 22, -0.3, 0).
   - Firing line: white BoxGeometry(0.15, 0.02, 26) at (0, -0.28, 0).
   - Shooting mat: BoxGeometry(2, 0.02, 0.8), color 0x3a3a3a, at (-1, -0.28, 0).
   - A simple rifle so the muzzle is visible: barrel CylinderGeometry(0.012, 0.012, 0.41, 8) rotated PI/2 about z, color 0x222222, centred at (-0.205, 0, 0); stock BoxGeometry(0.75, 0.07, 0.05), color 0x4a3b2a, centred at (-0.75, -0.03, 0); scope CylinderGeometry(0.02, 0.02, 0.32, 10) rotated PI/2 about z, color 0x111111, centred at (-0.55, 0.045, 0).

c. Change buildMarker to return { group: THREE.Group; label: THREE.Sprite | null }. Same contents as now, but the stripe is BoxGeometry(0.2, 0.02, 26) and the label sprite sits at (marker.rangeM, 2.2, -14). Return the sprite (or null when the 2D context was missing).

d. buildTarget: add a white backer board behind both target types so the target can be found in the scope view: PlaneGeometry(1.2, 1.2), MeshBasicMaterial color 0xf4f1e8, side DoubleSide, rotated -PI/2 about y, at (rangeM + 0.05, sightHeightM, 0). Change the steel plate colour to 0x2b2b2b (dark plate on a pale board).

## 2. src/scene/scene.ts

a. Sky and fog (setup): const sky = buildSkyTexture(); scene.background = sky ?? new THREE.Color(COLORS.sky); scene.fog = new THREE.Fog(0xe3ecf2, 500, 4500).

b. Reticle overlay (setup): container.style.position = 'relative'. Create a second canvas `overlay`, appended to container AFTER renderer.domElement, styled: position absolute, left 0, top 0, width 100%, height 100%, pointer-events none.

c. New state: let currentPreset: CameraPreset = 'reset'; let scopeMode = false; let markerLabels: Array<{ sprite: THREE.Sprite; rangeM: number }> = []; let drawnScope: TrajectorySample[] = [].

d. update(): collect labels (markerLabels = []; for each marker: const mk = buildMarker(m); rangeGroup.add(mk.group); if (mk.label !== null) markerLabels.push({ sprite: mk.label, rangeM: m.rangeM })). At the END of update(): if (scopeMode) setCamera('shooter'); (so the scope re-aims and re-zooms when the distance changes). Then drawReticle().

e. setCamera(preset):
   currentPreset = preset; scopeMode = preset === 'shooter'.
   If scopeMode:
     fov = scopeFovRad(trimmed, view.targetRangeM)   // radians; always from the un-dialled `trimmed` samples
     camera.fov = fov * 180 / Math.PI; camera.near = 0.5;
     camera.up.set(0, 1, 0); position = losPoint(-1, view.shotAngleRad, view.sightHeightM); target = losPoint(view.targetRangeM, ...);
     controls.enabled = false.
   Else: camera.fov = 50; camera.near = 0.1; pose = cameraPose(preset, ...) as now; controls.enabled = true.
   Then camera.updateProjectionMatrix(); controls.update(); drawReticle().

f. drawReticle(): w = container.clientWidth, h = container.clientHeight, dpr = Math.min(window.devicePixelRatio, 2). Set overlay.width = w * dpr, overlay.height = h * dpr. ctx = overlay.getContext('2d'); return if null. ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h). If !scopeMode or view === null, return (overlay stays clear).
   cx = w / 2, cy = h / 2, ppm = pxPerMil(camera.fov * Math.PI / 180, h), r = h * 0.48.
   - Scope shadow: fill the whole overlay with rgba(0,0,0,0.92); then ctx.globalCompositeOperation = 'destination-out'; fill a circle (cx, cy, r); set globalCompositeOperation back to 'source-over'. Then stroke that circle, lineWidth 2, rgba(0,0,0,0.9).
   - Crosshair: strokeStyle rgba(10,10,10,0.9), lineWidth 1. A horizontal line from cx - r to cx + r and a vertical line from cy - r to cy + r, each with a gap of 0.25 * ppm around the centre.
   - Hash marks every 1 MIL out to Math.floor(r / ppm) in all four directions: a short tick across the axis, 8 px long (16 px long on every 5th). On every 5th MIL draw the number (font '11px system-ui', fillStyle rgba(10,10,10,0.9)) next to the tick, on the right of the vertical axis and below the horizontal axis.
   - Caption at (cx, cy + r - 10), centred, font '12px system-ui', fillStyle rgba(10,10,10,0.9): `1 mark = 1 MIL · scope view, true scale`.
   Call drawReticle() from resize() too.

g. Frame loop:
   - Dot sizes: fovRad = camera.fov * Math.PI / 180; bullet.scale.setScalar(dotScale(distance, fovRad, 0.012)); impact and aim with 0.008.
   - Labels: if scopeMode, hide every marker label. Else: for each markerLabels entry, v = sprite.getWorldPosition(new THREE.Vector3()); depth = camera.position.distanceTo(v); p = v.clone().project(camera); x = (p.x * 0.5 + 0.5) * w; y = (-p.y * 0.5 + 0.5) * h. shown = visibleLabels(points, 70, 28); sprite.visible = shown[i] === true && p.z < 1. (Reuse vectors if you like; correctness first.)
   - In scopeMode the aim dot is hidden (the crosshair marks the aim point); otherwise visible.

h. Add to the returned object nothing new; the RangeScene interface is unchanged.

## 3. index.html

- Rename the camera buttons' text: data-camera="shooter" -> "Scope view"; "reset" -> "Range view". Order: Range view, Scope view, Side view, Top-down view.
- Replace the exaggeration slider with: <input type="range" id="exaggeration" min="0" max="7" step="1" value="0">

## 4. src/main.ts

- The slider value is now an index into NICE_SCALES: exaggeration = NICE_SCALES[Number(slider.value)] ?? 1.
- Keep the last good solver samples: let lastSamples: TrajectorySample[] = []; set it in recompute() when the solve succeeds.
- Helper drawnSamples(): t = trimToRange(lastSamples, state.conditions.targetRangeM); return showDialed ? dialSamples(t, state.conditions.targetRangeM) : t.
- Helper setExaggeration(value: number): exaggeration = value; set the slider's value to String(Math.max(0, NICE_SCALES.indexOf(value))); recompute(); renderOutputs().
- Camera buttons: BEFORE calling scene.setCamera(preset):
    'side'  -> setExaggeration(autoExaggeration(drawnSamples(), R, 'path'))
    'top'   -> setExaggeration(autoExaggeration(drawnSamples(), R, 'windage'))
    'shooter', 'reset' -> setExaggeration(1)
  (R = state.conditions.targetRangeM.) Then scene.setCamera(preset).
- #exaggerationLabel text: exaggeration === 1 ? 'True scale' : `Drop and drift drawn ${exaggeration}× larger than real. The numbers are not changed.`

## 5. src/styles.css (append)

#scene canvas { display: block; }
#exaggerationLabel { font-size: 12px; }

Finish by running `npm run typecheck`, `npm test`, and `npm run build`. All three must pass. Reply with what you changed and anything you could not do.
