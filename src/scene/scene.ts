import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { TrajectorySample, Vec3 } from '../solver/types';
import type { CameraPreset, FlagPose, RangeScene, Readout, SceneView } from './types';
import {
  cameraPose,
  dialSamples,
  displayPoint,
  dotScale,
  flagPose,
  losPoint,
  markerRanges,
  pathRuns,
  pxPerMil,
  readoutAt,
  sampleAtTime,
  scopeFovRad,
  trimToRange,
  visibleLabels
} from './geometry';
import {
  buildDot,
  buildFlag,
  buildGround,
  buildLineOfSight,
  buildMarker,
  buildPath,
  buildSkyTexture,
  buildTarget,
  buildWindArrow,
  COLORS,
  disposeObject,
  poseFlag
} from './objects';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';

function setVec(target: THREE.Vector3, p: Vec3): void {
  target.set(p.x, p.y, p.z);
}

export function createRangeScene(container: HTMLElement): RangeScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  container.appendChild(renderer.domElement);

  const overlay = document.createElement('canvas');
  overlay.style.position = 'absolute';
  overlay.style.left = '0';
  overlay.style.top = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.pointerEvents = 'none';
  container.appendChild(overlay);

  const scene = new THREE.Scene();
  const sky = buildSkyTexture();
  scene.background = sky ?? new THREE.Color(COLORS.sky);
  scene.fog = new THREE.Fog(0xe3ecf2, 500, 4500);

  const hemisphere = new THREE.HemisphereLight(0xffffff, 0x556644, 1.0);
  scene.add(hemisphere);
  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(-50, 100, 50);
  scene.add(directional);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 6000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const staticGroup = new THREE.Group();
  scene.add(staticGroup);

  const bullet = buildDot(COLORS.bullet);
  const impact = buildDot(COLORS.impact);
  const aim = buildDot(COLORS.aim);
  scene.add(bullet, impact, aim);

  let view: SceneView | null = null;
  let trimmed: TrajectorySample[] = [];
  let drawn: TrajectorySample[] = [];
  const flags: THREE.Mesh[] = [];
  let flag: FlagPose | null = null;
  let timeS = 0;
  let playing = false;
  let speed = 1;
  let durationS = 0;
  let readoutCallback: ((r: Readout) => void) | null = null;
  let firstUpdate = true;

  let currentPreset: CameraPreset = 'reset';
  let scopeMode = false;
  let markerLabels: Array<{ sprite: THREE.Sprite; rangeM: number }> = [];
  let drawnScope: TrajectorySample[] = [];

  let fpsValue = 0;
  let fpsFrames = 0;
  let fpsLast = 0;
  let last = performance.now() / 1000;
  let rafId = 0;

  const labelWorld = new THREE.Vector3();
  const labelProjected = new THREE.Vector3();

  function emitReadout(): void {
    const r = readoutAt(drawn, timeS, playing);
    if (r !== null && readoutCallback !== null) {
      readoutCallback(r);
    }
  }

  function drawReticle(): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    const dpr = Math.min(window.devicePixelRatio, 2);
    overlay.width = w * dpr;
    overlay.height = h * dpr;
    const ctx = overlay.getContext('2d');
    if (ctx === null) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (!scopeMode || view === null) return;

    const cx = w / 2;
    const cy = h / 2;
    const ppm = pxPerMil((camera.fov * Math.PI) / 180, h);
    const r = h * 0.48;

    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.stroke();

    if (ppm > 0) {
      const gap = 0.25 * ppm;
      ctx.strokeStyle = 'rgba(10,10,10,0.9)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx - gap, cy);
      ctx.moveTo(cx + gap, cy);
      ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy - gap);
      ctx.moveTo(cx, cy + gap);
      ctx.lineTo(cx, cy + r);
      ctx.stroke();

      const maxMil = Math.floor(r / ppm);
      ctx.font = '11px system-ui';
      ctx.fillStyle = 'rgba(10,10,10,0.9)';
      for (let m = 1; m <= maxMil; m++) {
        const d = m * ppm;
        const long = m % 5 === 0;
        const half = long ? 8 : 4;
        ctx.beginPath();
        ctx.moveTo(cx + d, cy - half);
        ctx.lineTo(cx + d, cy + half);
        ctx.moveTo(cx - d, cy - half);
        ctx.lineTo(cx - d, cy + half);
        ctx.moveTo(cx - half, cy + d);
        ctx.lineTo(cx + half, cy + d);
        ctx.moveTo(cx - half, cy - d);
        ctx.lineTo(cx + half, cy - d);
        ctx.stroke();
        if (long) {
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(m), cx + d + 4, cy);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(String(m), cx, cy + d + 4);
        }
      }
    }

    ctx.font = '12px system-ui';
    ctx.fillStyle = 'rgba(232,234,237,0.9)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Scope view, true scale. 1 mark = 1 MIL', w - 12, h - 12);
  }

  function resize(): void {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      staticGroup.traverse((object) => {
        if (object instanceof Line2) {
          object.material.resolution.set(w, h);
        }
      });
    }
    drawReticle();
  }
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  function update(v: SceneView): void {
    view = v;
    for (const child of [...staticGroup.children]) {
      staticGroup.remove(child);
      disposeObject(child);
    }
    flags.length = 0;
    markerLabels = [];

    trimmed = trimToRange(v.samples, v.targetRangeM);
    drawn = v.showDialed ? dialSamples(trimmed, v.targetRangeM) : trimmed;
    drawnScope = trimmed;
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
      const mk = buildMarker(m);
      rangeGroup.add(mk.group);
      if (mk.label !== null) {
        markerLabels.push({ sprite: mk.label, rangeM: m.rangeM });
      }
    }
    rangeGroup.add(buildTarget(v.targetType, v.targetRangeM, v.sightHeightM));
    for (const m of markers) {
      const f = buildFlag(m.rangeM);
      rangeGroup.add(f.group);
      flags.push(f.cloth);
    }

    flag = flagPose(v.windSpeedMps, v.windClock);

    if (v.windSpeedMps > 0.05) {
      for (const m of markers) {
        const arrow = buildWindArrow();
        arrow.position.set(m.rangeM, -0.2, -9);
        arrow.rotation.y = Math.atan2(-flag.downwind.z, flag.downwind.x);
        rangeGroup.add(arrow);
      }
    }

    staticGroup.add(
      buildPath(pathRuns(drawn, v.shotAngleRad, v.sightHeightM, v.exaggeration))
    );
    staticGroup.add(
      buildLineOfSight(
        losPoint(0, v.shotAngleRad, v.sightHeightM),
        losPoint(v.targetRangeM, v.shotAngleRad, v.sightHeightM)
      )
    );

    setVec(aim.position, losPoint(v.targetRangeM, v.shotAngleRad, v.sightHeightM));
    const lastDrawn = drawn[drawn.length - 1];
    if (lastDrawn !== undefined) {
      setVec(
        impact.position,
        displayPoint(lastDrawn, v.shotAngleRad, v.sightHeightM, v.exaggeration)
      );
    }

    if (firstUpdate) {
      setCamera('reset');
      firstUpdate = false;
    }

    timeS = 0;
    playing = true;
    emitReadout();

    const size = renderer.getSize(new THREE.Vector2());
    staticGroup.traverse((object) => {
      if (object instanceof Line2) {
        object.material.resolution.set(size.x, size.y);
      }
    });

    if (scopeMode) {
      setCamera('shooter');
    }
    drawReticle();
  }

  function setCamera(preset: CameraPreset): void {
    if (view === null) return;
    currentPreset = preset;
    scopeMode = preset === 'shooter';
    if (scopeMode) {
      const fovRad = scopeFovRad(drawnScope, view.targetRangeM);
      camera.fov = (fovRad * 180) / Math.PI;
      camera.near = 0.5;
      camera.up.set(0, 1, 0);
      setVec(camera.position, losPoint(-1, view.shotAngleRad, view.sightHeightM));
      setVec(controls.target, losPoint(view.targetRangeM, view.shotAngleRad, view.sightHeightM));
      controls.enabled = false;
    } else {
      camera.fov = 50;
      camera.near = 0.1;
      const pose = cameraPose(currentPreset, view.targetRangeM, view.shotAngleRad, view.sightHeightM);
      setVec(camera.up, pose.up);
      setVec(camera.position, pose.position);
      setVec(controls.target, pose.target);
      controls.enabled = true;
    }
    camera.updateProjectionMatrix();
    controls.update();
    drawReticle();
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

    const s = sampleAtTime(drawn, timeS);
    if (view !== null && s !== null) {
      setVec(
        bullet.position,
        displayPoint(s, view.shotAngleRad, view.sightHeightM, view.exaggeration)
      );
    }
    bullet.visible = s !== null;

    const fovRad = (camera.fov * Math.PI) / 180;
    bullet.scale.setScalar(dotScale(camera.position.distanceTo(bullet.position), fovRad, 0.012));
    impact.scale.setScalar(dotScale(camera.position.distanceTo(impact.position), fovRad, 0.008));
    aim.scale.setScalar(dotScale(camera.position.distanceTo(aim.position), fovRad, 0.008));
    aim.visible = !scopeMode;

    if (scopeMode) {
      for (const entry of markerLabels) {
        entry.sprite.visible = false;
      }
    } else {
      const w = container.clientWidth;
      const h = container.clientHeight;
      const points: Array<{ x: number; y: number; depth: number }> = [];
      const inFront: boolean[] = [];
      for (const entry of markerLabels) {
        entry.sprite.getWorldPosition(labelWorld);
        const depth = camera.position.distanceTo(labelWorld);
        labelProjected.copy(labelWorld).project(camera);
        inFront.push(labelProjected.z < 1);
        points.push({
          x: (labelProjected.x * 0.5 + 0.5) * w,
          y: (-labelProjected.y * 0.5 + 0.5) * h,
          depth
        });
      }
      const shown = visibleLabels(points, 70, 28);
      for (let i = 0; i < markerLabels.length; i++) {
        const entry = markerLabels[i];
        if (entry === undefined) continue;
        const p = points[i];
        if (p === undefined) continue;
        entry.sprite.visible = shown[i] === true && inFront[i] === true;
      }
    }

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
    if (overlay.parentElement === container) {
      container.removeChild(overlay);
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
