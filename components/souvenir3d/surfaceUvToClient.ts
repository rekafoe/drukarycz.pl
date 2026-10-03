import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { SouvenirSurfaceProjector } from './types';

function readVertexIndex(
  geometry: THREE.BufferGeometry,
  triangleOffset: number,
  corner: number,
): number {
  return geometry.index
    ? geometry.index.getX(triangleOffset + corner)
    : triangleOffset + corner;
}

export function projectSurfaceUvToClient(
  geometry: THREE.BufferGeometry,
  matrixWorld: THREE.Matrix4,
  camera: THREE.Camera,
  viewport: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  uv: { u: number; v: number },
): { x: number; y: number } | null {
  const uvAttribute = geometry.getAttribute('uv');
  const positionAttribute = geometry.getAttribute('position');
  if (!uvAttribute || !positionAttribute || viewport.width <= 0 || viewport.height <= 0) {
    return null;
  }

  const triangleCount = geometry.index
    ? geometry.index.count
    : positionAttribute.count;
  const target = new THREE.Vector3(uv.u, uv.v, 0);
  const uvA = new THREE.Vector3();
  const uvB = new THREE.Vector3();
  const uvC = new THREE.Vector3();
  const barycentric = new THREE.Vector3();
  const pointA = new THREE.Vector3();
  const pointB = new THREE.Vector3();
  const pointC = new THREE.Vector3();
  const projected = new THREE.Vector3();

  for (let offset = 0; offset + 2 < triangleCount; offset += 3) {
    const a = readVertexIndex(geometry, offset, 0);
    const b = readVertexIndex(geometry, offset, 1);
    const c = readVertexIndex(geometry, offset, 2);
    uvA.set(uvAttribute.getX(a), uvAttribute.getY(a), 0);
    uvB.set(uvAttribute.getX(b), uvAttribute.getY(b), 0);
    uvC.set(uvAttribute.getX(c), uvAttribute.getY(c), 0);
    THREE.Triangle.getBarycoord(target, uvA, uvB, uvC, barycentric);
    if (
      barycentric.x < -1e-5
      || barycentric.y < -1e-5
      || barycentric.z < -1e-5
    ) {
      continue;
    }

    pointA.fromBufferAttribute(positionAttribute as THREE.BufferAttribute, a);
    pointB.fromBufferAttribute(positionAttribute as THREE.BufferAttribute, b);
    pointC.fromBufferAttribute(positionAttribute as THREE.BufferAttribute, c);
    projected
      .copy(pointA)
      .multiplyScalar(barycentric.x)
      .addScaledVector(pointB, barycentric.y)
      .addScaledVector(pointC, barycentric.z)
      .applyMatrix4(matrixWorld)
      .project(camera);
    return {
      x: viewport.left + (projected.x + 1) * viewport.width / 2,
      y: viewport.top + (1 - projected.y) * viewport.height / 2,
    };
  }
  return null;
}

export function createSurfaceUvProjector(
  event: ThreeEvent<PointerEvent>,
): SouvenirSurfaceProjector | undefined {
  const mesh = event.object as THREE.Mesh;
  if (!mesh.isMesh || !mesh.geometry) return undefined;
  const element = event.nativeEvent.target;
  if (!(element instanceof Element)) return undefined;
  const viewport = element.getBoundingClientRect();
  mesh.updateWorldMatrix(true, false);
  const matrixWorld = mesh.matrixWorld.clone();
  const camera = event.camera;
  const geometry = mesh.geometry;
  return (uv) => projectSurfaceUvToClient(geometry, matrixWorld, camera, viewport, uv);
}
