Write one TypeScript module: the three.js range scene. No tests for this file (it needs WebGL); the acceptance check is `npm run typecheck` and `npm test` both passing.

File you own (create it, touch nothing else): src/scene/scene.ts

Read first, in full: src/scene/types.ts, src/scene/geometry.ts, src/scene/objects.ts. Use their functions; do not re-implement them.

Imports allowed:
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  from './types', './geometry', './objects', and types from '../solver/types'.

EXPORT

export function createRangeScene(container: HTMLElement): RangeScene

It implements every method of the RangeScene interface in src/scene/types.ts. The scene never computes physics: it only draws view.samples.

SETUP (once, inside createRangeScene)
- renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); setPixelRatio(Math.min(window.devicePixelRatio, 2)); append renderer.domElement to container; style it display block, width 100%, height 100%.
- scene = new THREE.Scene(); scene.background = new THREE.Color(COLORS.sky).
- Lights: new THREE.HemisphereLight(0xffffff, 0x556644, 1.0) and a DirectionalLight(0xffffff, 0.8) at (-50, 100, 50).
- camera = new THREE.PerspectiveCamera(50, 1, 0.1, 6000).
- controls = new OrbitControls(camera, renderer.domElement); enableDamping = true.
- A resize function: w = container.clientWidth, h = container.clientHeight; if both > 0: renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(). Call it once and from a ResizeObserver on container.
- staticGroup = new THREE.Group() for everything rebuilt on update(); add it to the scene.
- Three dots from buildDot, added to the scene once: bullet (COLORS.bullet), impact (COLORS.impact), aim (COLORS.aim).

STATE
  view: SceneView | null = null
  trimmed: TrajectorySample[] = []      // trimToRange(view.samples, view.targetRangeM)
  flags: THREE.Mesh[] = []              // the cloth meshes
  flag: FlagPose | null = null
  timeS = 0, playing = false, speed = 1, durationS = 0
  readoutCallback: ((r: Readout) => void) | null = null
  firstUpdate = true

update(view)
 1. Store view. Remove every child of staticGroup, calling disposeObject on each. Clear flags.
 2. trimmed = trimToRange(view.samples, view.targetRangeM). durationS = last trimmed sample's timeS, or 0 when trimmed is empty.
 3. markers = markerRanges(view.targetRangeM, view.unitSystem). lastRange = the last marker's rangeM (or view.targetRangeM when there are no markers).
 4. rangeGroup = new THREE.Group(); rangeGroup.rotation.z = view.shotAngleRad; add to staticGroup. Into rangeGroup add: buildGround(lastRange); buildMarker(m) for each marker; buildTarget(view.targetType, view.targetRangeM, view.sightHeightM); and for each marker a flag: const f = buildFlag(m.rangeM); add f.group; push f.cloth to flags.
 5. flag = flagPose(view.windSpeedMps, view.windClock).
 6. Into staticGroup (world frame, NOT rangeGroup) add: buildPath(pathRuns(trimmed, view.shotAngleRad, view.sightHeightM, view.exaggeration)); buildLineOfSight(losPoint(0, view.shotAngleRad, view.sightHeightM), losPoint(view.targetRangeM, view.shotAngleRad, view.sightHeightM)).
 7. aim.position = losPoint(view.targetRangeM, ...). impact.position = displayPoint(last trimmed sample, view.shotAngleRad, view.sightHeightM, view.exaggeration) when trimmed is not empty.
 8. If firstUpdate: setCamera('reset'); firstUpdate = false.
 9. timeS = 0; playing = true. Then call emitReadout().

setCamera(preset)
  If view is null return. pose = cameraPose(preset, view.targetRangeM, view.shotAngleRad, view.sightHeightM). camera.up.set(pose.up...); camera.position.set(pose.position...); controls.target.set(pose.target...); controls.update().

play(): if timeS >= durationS then timeS = 0; playing = true.
pause(): playing = false; emitReadout().
replay(): timeS = 0; playing = true.
setSpeed(m): speed = m when m > 0.
seek(t): timeS = Math.min(Math.max(t, 0), durationS); playing = false; emitReadout().
onReadout(cb): readoutCallback = cb.
fps(): the value measured in the frame loop.
dispose(): cancelAnimationFrame, disconnect the ResizeObserver, controls.dispose(), disposeObject(staticGroup) and the three dots, renderer.dispose(), remove renderer.domElement from container.

emitReadout(): r = readoutAt(trimmed, timeS, playing); if r is not null and readoutCallback is not null, call it.

FRAME LOOP (requestAnimationFrame; keep the request id for dispose)
  now = performance.now() / 1000; dt = Math.min(now - last, 0.1); last = now.
  fps: count frames; once per second set fpsValue = frames counted / seconds elapsed and reset the count.
  If playing and durationS > 0: timeS += dt * speed; if timeS >= durationS: timeS = durationS, playing = false. Call emitReadout().
  Bullet: s = sampleAtTime(trimmed, timeS). If s is not null: bullet.position = displayPoint(s, view.shotAngleRad, view.sightHeightM, view.exaggeration). bullet.visible = s is not null.
  Dot sizes, so they stay visible at any distance: for each of bullet, impact, aim: size = camera.position.distanceTo(dot.position) * k, dot.scale.setScalar(size), with k = 0.006 for bullet, 0.004 for impact and aim.
  Flags: if flag is not null, poseFlag(cloth, flag, now) for each cloth in flags.
  controls.update(); renderer.render(scene, camera).

Type notes: `noUncheckedIndexedAccess` is on, so `array[i]` may be undefined; check before use. Convert Vec3 to three.js with `.set(p.x, p.y, p.z)`. No `any`.

Finish by running `npm run typecheck` and `npm test`. Reply with what you built and anything you could not do.
