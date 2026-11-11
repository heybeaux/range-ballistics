import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { TrajectorySample, Vec3 } from '../solver/types';
import type { CameraPreset, FlagPose, RangeScene, Readout, SceneView } from './types';
import {
  cameraPose,
  displayPoint,
  flagPose,
  losPoint,
  markerRanges,
  pathRuns,
  readoutAt,
  sampleAtTime,
  trimToRange
} from './geometry';
import {
  buildDot,
  buildFlag,
  buildGround,
  buildLineOfSight,
  buildMarker,
  buildPath,
  buildTarget,
  COLORS,
  disposeObject,
  poseFlag
} from './objects';

function setVec(target: THREE.Vector3, p: Vec3): void {
  target.set(p.x, p.y, p.z);
}

export function createRangeScene(container: HTMLElement): RangeScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.sky);

  const hemisphere = new THREE.HemisphereLight(0xffffff, 0x556644, 1.0);
  scene.add(hemisphere);
  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(-50, 100, 50);
  scene.add(directional);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 6000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  function resize(): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  const staticGroup = new THREE.Group();
  scene.add(staticGroup);

  const bullet = buildDot(COLORS.bullet);
  const impact = buildDot(COLORS.impact);
  const aim = buildDot(COLORS.aim);
  scene.add(bullet, impact, aim);

  let view: SceneView | null = null;
  let trimmed: TrajectorySample[] = [];
  const flags: THREE.Mesh[] = [];
  let flag: FlagPose | null = null;
  let timeS = 0;
  let playing = false;
  let speed = 1;
  let durationS = 0;
  let readoutCallback: ((r: Readout) => void) | null = null;
  let firstUpdate = true;

  let fpsValue = 0;
  let fpsFrames = 0;
  let fpsLast = 0;
  let last = performance.now() / 1000;
  let rafId = 0;

  function emitReadout(): void {
    const r = readoutAt(trimmed, timeS, playing);
    if (r !== null && readoutCallback !== null) {
      readoutCallback(r);
    }
  }

  function update(v: SceneView): void {
    view = v;
    for (const child of [...staticGroup.children]) {
      staticGroup.remove(child);
      disposeObject(child);
    }
    flags.length = 0;

    trimmed = trimToRange(v.samples, v.targetRangeM);
    const lastSample = trimmed[trimmed.length - 1];
    durationS = lastSample === undefined ? 0 : lastSample.timeS;

    const markers = markerRanges(v.targetRangeM, v.unitSystem);
    const lastMarker = markers[markers.length - 1];
    const lastRange = lastMarker === undefined ? v.targetRangeM : lastMarker.rangeM;

    const rangeGroup = new THREE.Group();
    rangeGroup.rotation.z = v.shotAngleRad;
    staticGroup.add(rangeGroup);
    rangeGroup.add(buildGround(lastRange));
    for (const m of markers) {
      rangeGroup.add(buildMarker(m));
    }
    rangeGroup.add(buildTarget(v.targetType, v.targetRangeM, v.sightHeightM));
    for (const m of markers) {
      const f = buildFlag(m.rangeM);
      rangeGroup.add(f.group);
      flags.push(f.cloth);
    }

    flag = flagPose(v.windSpeedMps, v.windClock);

    staticGroup.add(
      buildPath(pathRuns(trimmed, v.shotAngleRad, v.sightHeightM, v.exaggeration))
    );
    staticGroup.add(
      buildLineOfSight(
        losPoint(0, v.shotAngleRad, v.sightHeightM),
        losPoint(v.targetRangeM, v.shotAngleRad, v.sightHeightM)
      )
    );

    setVec(aim.position, losPoint(v.targetRangeM, v.shotAngleRad, v.sightHeightM));
    if (lastSample !== undefined) {
      setVec(
        impact.position,
        displayPoint(lastSample, v.shotAngleRad, v.sightHeightM, v.exaggeration)
      );
    }

    if (firstUpdate) {
      setCamera('reset');
      firstUpdate = false;
    }

    timeS = 0;
    playing = true;
    emitReadout();
  }

  function setCamera(preset: CameraPreset): void {
    if (view === null) return;
    const pose = cameraPose(preset, view.targetRangeM, view.shotAngleRad, view.sightHeightM);
    setVec(camera.up, pose.up);
    setVec(camera.position, pose.position);
    setVec(controls.target, pose.target);
    controls.update();
  }

  function play(): void {
    if (timeS >= durationS) {
      timeS = 0;
    }
    playing = true;
  }

  function pause(): void {
    playing = false;
    emitReadout();
  }

  function replay(): void {
    timeS = 0;
    playing = true;
  }

  function setSpeed(m: number): void {
    if (m > 0) {
      speed = m;
    }
  }

  function seek(t: number): void {
    timeS = Math.min(Math.max(t, 0), durationS);
    playing = false;
    emitReadout();
  }

  function onReadout(cb: (r: Readout) => void): void {
    readoutCallback = cb;
  }

  function fps(): number {
    return fpsValue;
  }

  function frame(): void {
    rafId = requestAnimationFrame(frame);
    const now = performance.now() / 1000;
    const dt = Math.min(now - last, 0.1);
    last = now;

    fpsFrames += 1;
    if (now - fpsLast >= 1) {
      fpsValue = fpsFrames / (now - fpsLast);
      fpsFrames = 0;
      fpsLast = now;
    }

    if (playing && durationS > 0) {
      timeS += dt * speed;
      if (timeS >= durationS) {
        timeS = durationS;
        playing = false;
      }
      emitReadout();
    }

    const s = sampleAtTime(trimmed, timeS);
    if (view !== null && s !== null) {
      setVec(
        bullet.position,
        displayPoint(s, view.shotAngleRad, view.sightHeightM, view.exaggeration)
      );
    }
    bullet.visible = s !== null;

    const kBullet = 0.006;
    const kOther = 0.004;
    bullet.scale.setScalar(camera.position.distanceTo(bullet.position) * kBullet);
    impact.scale.setScalar(camera.position.distanceTo(impact.position) * kOther);
    aim.scale.setScalar(camera.position.distanceTo(aim.position) * kOther);

    if (flag !== null) {
      for (const cloth of flags) {
        poseFlag(cloth, flag, now);
      }
    }

    controls.update();
    renderer.render(scene, camera);
  }
  fpsLast = performance.now() / 1000;
  rafId = requestAnimationFrame(frame);

  function dispose(): void {
    cancelAnimationFrame(rafId);
    resizeObserver.disconnect();
    controls.dispose();
    disposeObject(staticGroup);
    disposeObject(bullet);
    disposeObject(impact);
    disposeObject(aim);
    renderer.dispose();
    if (renderer.domElement.parentElement === container) {
      container.removeChild(renderer.domElement);
    }
  }

  return {
    update,
    setCamera,
    play,
    pause,
    replay,
    setSpeed,
    seek,
    onReadout,
    fps,
    dispose
  };
}
