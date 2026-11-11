Write one TypeScript module that builds three.js objects for a rifle range scene. No tests for this file (it needs WebGL); the acceptance check is `npm run typecheck` and `npm test` both passing.

File you own (create it, touch nothing else): src/scene/objects.ts

Read first, in full: src/scene/types.ts and src/scene/geometry.ts.

Imports allowed: `import * as THREE from 'three';`, types from './types', functions from './geometry', types from '../solver/types'.

Frame: x = downrange, y = up, z = shooter's right, metres, true scale. The muzzle is at the origin. The ground is 0.3 m below the muzzle (the rifle is on a bipod).

Every function returns a new THREE.Object3D (usually a THREE.Group) and adds nothing to any scene. "Range-local" positions below are for objects that the caller puts inside a group rotated by the shot angle.

EXPORTS

export const COLORS = { sky: 0xbfd9ee, ground: 0x6f8f55, line: 0xffffff, supersonic: 0xff5a1f, transonic: 0xffd000, subsonic: 0x2a7fff, los: 0xffffff, steel: 0xe8e8e8, post: 0x5a4632, flag: 0xd62828, bullet: 0xffe066, impact: 0xff2020, aim: 0x20c040 } as const;

1. export function buildGround(lengthM: number): THREE.Group
   - A flat ground: PlaneGeometry(lengthM + 120, 240), MeshLambertMaterial color COLORS.ground, rotated -PI/2 about x so it lies flat, centred at x = lengthM / 2 - 10, y = -0.3, z = 0.
   - A firing line: a white BoxGeometry(0.15, 0.02, 12) at (0, -0.29, 0).
   - A shooting mat: BoxGeometry(2, 0.02, 0.8), color 0x3a3a3a, at (-1, -0.29, 0).

2. export function buildMarker(marker: DistanceMarker): THREE.Group
   Range-local. Contains:
   - A white ground stripe: BoxGeometry(0.2, 0.02, 16) at (marker.rangeM, -0.29, 0).
   - A text label as a THREE.Sprite at (marker.rangeM, 1.6, -7). Draw marker.label on a 256 x 96 canvas (bold 48px sans-serif, white text, centred, with a dark rounded background rgba(0,0,0,0.55)), make a THREE.CanvasTexture, SpriteMaterial({ map, sizeAttenuation: false, depthTest: false }), sprite.scale.set(0.11, 0.041, 1).
   Get the 2D context with `canvas.getContext('2d')` and return the group without the sprite if the context is null.

3. export function buildTarget(type: 'steel' | 'paper', rangeM: number, sightHeightM: number): THREE.Group
   Range-local. The target centre is at (rangeM, sightHeightM, 0), facing the shooter (its face normal is -x).
   - 'steel': a round plate, CylinderGeometry(0.25, 0.25, 0.02, 32) rotated PI/2 about z so its axis is along x, MeshLambertMaterial color COLORS.steel.
   - 'paper': a PlaneGeometry(0.6, 0.6) rotated -PI/2 about y so it faces -x, with a CanvasTexture: 256 x 256 white canvas with 4 black concentric ring outlines and a filled black centre circle of radius 24. MeshBasicMaterial({ map, side: THREE.DoubleSide }).
   - Both: a post, BoxGeometry(0.05, sightHeightM + 0.3, 0.05), color COLORS.post, from the ground (y = -0.3) up to the target centre, at x = rangeM + 0.03.

4. export function buildFlag(rangeM: number): { group: THREE.Group; cloth: THREE.Mesh }
   Range-local. A pole and a cloth, at (rangeM, 0, 7):
   - Pole: CylinderGeometry(0.03, 0.03, 3.3, 8), color 0xdddddd, its base on the ground (centre y = -0.3 + 1.65).
   - Cloth: PlaneGeometry(1.2, 0.5, 12, 1) then geometry.translate(0.6, -0.25, 0) so the hoist edge is at the local origin and the cloth runs along local +x. MeshLambertMaterial({ color: COLORS.flag, side: THREE.DoubleSide }). cloth.position is the pole top: (rangeM, 3.0, 7). Set cloth.matrixAutoUpdate = false.
   Return both the group (which contains pole and cloth) and the cloth mesh.

5. export function poseFlag(cloth: THREE.Mesh, pose: FlagPose, timeS: number): void
   Points the cloth and flutters it. Call every frame.
   - dw = pose.downwind as a Vector3. dir = dw * sin(pose.liftRad) + (0, -1, 0) * cos(pose.liftRad), normalised. (liftRad 0 = hanging straight down, PI/2 = level downwind.)
   - side = (-dw.z, 0, dw.x). If its length is under 1e-6 use (0, 0, 1). Normalise.
   - up2 = side cross dir.
   - cloth.matrix = new Matrix4().makeBasis(dir, up2, side), then setPosition(cloth.position). Then cloth.matrixWorldNeedsUpdate = true.
   - Flutter: for each vertex i of cloth.geometry's position attribute: x = getX(i); setZ(i, Math.sin(x * 5 - timeS * 2 * Math.PI * pose.flutterHz) * 0.07 * x * (pose.liftRad / (Math.PI / 2))). Then position.needsUpdate = true.

6. export function buildPath(runs: PathRun[]): THREE.Group
   One THREE.Line per run: BufferGeometry().setFromPoints(points as Vector3), LineBasicMaterial with color COLORS.supersonic / transonic / subsonic by run.regime.

7. export function buildLineOfSight(from: Vec3, to: Vec3): THREE.Line
   A dashed white line: LineDashedMaterial({ color: COLORS.los, dashSize: 1, gapSize: 1, transparent: true, opacity: 0.6 }); call line.computeLineDistances().

8. export function buildDot(color: number): THREE.Mesh
   SphereGeometry(1, 16, 12) with MeshBasicMaterial({ color }). The caller scales it. Used for the bullet, the impact point, and the aim point.

9. export function disposeObject(obj: THREE.Object3D): void
   Traverse obj. For every Mesh, Line, or Sprite: dispose its geometry (if it has one) and its material(s), and dispose `material.map` when the material has one. Use `instanceof` checks, not `any`.

Type notes: `noUncheckedIndexedAccess` is on. Convert Vec3 to THREE.Vector3 with `new THREE.Vector3(p.x, p.y, p.z)`. A material can be a single Material or an array.

Finish by running `npm run typecheck` and `npm test`. Reply with what you built and anything you could not do.
