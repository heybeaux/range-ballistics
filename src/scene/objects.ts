import * as THREE from 'three';
import type { Vec3 } from '../solver/types';
import type { DistanceMarker, FlagPose, PathRun } from './types';

export const COLORS = {
  sky: 0xbfd9ee,
  ground: 0x6f8f55,
  line: 0xffffff,
  supersonic: 0xff5a1f,
  transonic: 0xffd000,
  subsonic: 0x2a7fff,
  los: 0xffffff,
  steel: 0xe8e8e8,
  post: 0x5a4632,
  flag: 0xd62828,
  bullet: 0xffe066,
  impact: 0xff2020,
  aim: 0x20c040
} as const;

function toV3(p: Vec3): THREE.Vector3 {
  return new THREE.Vector3(p.x, p.y, p.z);
}

export function buildGround(lengthM: number): THREE.Group {
  const group = new THREE.Group();

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(lengthM + 120, 240),
    new THREE.MeshLambertMaterial({ color: COLORS.ground })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(lengthM / 2 - 10, -0.3, 0);
  group.add(ground);

  const firingLine = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.02, 12),
    new THREE.MeshLambertMaterial({ color: COLORS.line })
  );
  firingLine.position.set(0, -0.29, 0);
  group.add(firingLine);

  const mat = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.02, 0.8),
    new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
  );
  mat.position.set(-1, -0.29, 0);
  group.add(mat);

  return group;
}

function makeLabelSprite(label: string): THREE.Sprite | null {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (ctx === null) return null;

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  const r = 16;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(256 - r, 0);
  ctx.arcTo(256, 0, 256, r, r);
  ctx.lineTo(256, 96 - r);
  ctx.arcTo(256, 96, 256 - r, 96, r);
  ctx.lineTo(r, 96);
  ctx.arcTo(0, 96, 0, 96 - r, r);
  ctx.lineTo(0, r);
  ctx.arcTo(0, 0, r, 0, r);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 128, 48);

  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, sizeAttenuation: false, depthTest: false })
  );
  sprite.scale.set(0.11, 0.041, 1);
  return sprite;
}

export function buildMarker(marker: DistanceMarker): THREE.Group {
  const group = new THREE.Group();

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.02, 16),
    new THREE.MeshLambertMaterial({ color: COLORS.line })
  );
  stripe.position.set(marker.rangeM, -0.29, 0);
  group.add(stripe);

  const sprite = makeLabelSprite(marker.label);
  if (sprite !== null) {
    sprite.position.set(marker.rangeM, 1.6, -7);
    group.add(sprite);
  }

  return group;
}

function makePaperTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx !== null) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(128, 128, 24 + (i + 1) * 24, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(128, 128, 24, 0, Math.PI * 2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

export function buildTarget(type: 'steel' | 'paper', rangeM: number, sightHeightM: number): THREE.Group {
  const group = new THREE.Group();

  if (type === 'steel') {
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.02, 32),
      new THREE.MeshLambertMaterial({ color: COLORS.steel })
    );
    plate.rotation.z = Math.PI / 2;
    plate.position.set(rangeM, sightHeightM, 0);
    group.add(plate);
  } else {
    const paper = new THREE.Mesh(
      new THREE.PlaneGeometry(0.6, 0.6),
      new THREE.MeshBasicMaterial({ map: makePaperTexture(), side: THREE.DoubleSide })
    );
    paper.rotation.y = -Math.PI / 2;
    paper.position.set(rangeM, sightHeightM, 0);
    group.add(paper);
  }

  const post = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, sightHeightM + 0.3, 0.05),
    new THREE.MeshLambertMaterial({ color: COLORS.post })
  );
  post.position.set(rangeM + 0.03, -0.3 + (sightHeightM + 0.3) / 2, 0);
  group.add(post);

  return group;
}

export function buildFlag(rangeM: number): { group: THREE.Group; cloth: THREE.Mesh } {
  const group = new THREE.Group();

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 3.3, 8),
    new THREE.MeshLambertMaterial({ color: 0xdddddd })
  );
  pole.position.set(rangeM, -0.3 + 1.65, 7);
  group.add(pole);

  const clothGeometry = new THREE.PlaneGeometry(1.2, 0.5, 12, 1);
  clothGeometry.translate(0.6, -0.25, 0);
  const cloth = new THREE.Mesh(
    clothGeometry,
    new THREE.MeshLambertMaterial({ color: COLORS.flag, side: THREE.DoubleSide })
  );
  cloth.position.set(rangeM, 3.0, 7);
  cloth.matrixAutoUpdate = false;
  group.add(cloth);

  return { group, cloth };
}

export function poseFlag(cloth: THREE.Mesh, pose: FlagPose, timeS: number): void {
  const dw = toV3(pose.downwind);
  const dir = new THREE.Vector3(
    dw.x * Math.sin(pose.liftRad),
    dw.y * Math.sin(pose.liftRad) - Math.cos(pose.liftRad),
    dw.z * Math.sin(pose.liftRad)
  ).normalize();

  let side = new THREE.Vector3(-dw.z, 0, dw.x);
  if (side.length() < 1e-6) {
    side = new THREE.Vector3(0, 0, 1);
  } else {
    side.normalize();
  }

  const up2 = new THREE.Vector3().crossVectors(side, dir);

  cloth.matrix = new THREE.Matrix4().makeBasis(dir, up2, side);
  cloth.matrix.setPosition(cloth.position);
  cloth.matrixWorldNeedsUpdate = true;

  const position = cloth.geometry.getAttribute('position') as THREE.BufferAttribute;
  const liftFactor = pose.liftRad / (Math.PI / 2);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    position.setZ(i, Math.sin(x * 5 - timeS * 2 * Math.PI * pose.flutterHz) * 0.07 * x * liftFactor);
  }
  position.needsUpdate = true;
}

export function buildPath(runs: PathRun[]): THREE.Group {
  const group = new THREE.Group();
  for (const run of runs) {
    const points = run.points.map(toV3);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const color =
      run.regime === 'supersonic' ? COLORS.supersonic : run.regime === 'transonic' ? COLORS.transonic : COLORS.subsonic;
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color }));
    group.add(line);
  }
  return group;
}

export function buildLineOfSight(from: Vec3, to: Vec3): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints([toV3(from), toV3(to)]);
  const line = new THREE.Line(
    geometry,
    new THREE.LineDashedMaterial({
      color: COLORS.los,
      dashSize: 1,
      gapSize: 1,
      transparent: true,
      opacity: 0.6
    })
  );
  line.computeLineDistances();
  return line;
}

export function buildDot(color: number): THREE.Mesh {
  return new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color }));
}

function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  const materials = Array.isArray(material) ? material : [material];
  for (const m of materials) {
    const withMap = m as THREE.Material & { map?: THREE.Texture | null };
    if (withMap.map !== null && withMap.map !== undefined) {
      withMap.map.dispose();
    }
    m.dispose();
  }
}

export function disposeObject(obj: THREE.Object3D): void {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Sprite) {
      child.geometry.dispose();
      disposeMaterial(child.material);
    }
  });
}
