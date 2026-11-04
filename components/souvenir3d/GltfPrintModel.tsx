import React, { useEffect, useLayoutEffect, useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  MUG_BODY_HEIGHT_MM,
  MUG_OUTER_CIRCUMFERENCE_MM,
  mugPrintHeightScene,
  mugWrapArcFromHandle,
  printAreaSceneSize,
} from './scale';
import type { PrintAreaConfig, SouvenirSurfacePointerHandler } from './types';
import { isMugPrintArea, isTshirtBackPrintArea } from './types';
import { dequantizeGeometry } from './dequantize-geometry';
import { createSurfaceUvProjector } from './surfaceUvToClient';

type PrintLayer = {
  printArea: PrintAreaConfig;
  printTexture: THREE.Texture | null;
  dragTexture: THREE.Texture | null;
  showBorder: boolean;
};

type GltfPrintModelProps = {
  url: string;
  /** Все зоны (грудь+спина) рисуются сразу; камера смотрит на активную. */
  layers: PrintLayer[];
  /** Цвет вещи с лавки. Печатный слой им не красится. */
  bodyColor?: string;
  onSurfacePointer?: SouvenirSurfacePointerHandler;
  onReady?: () => void;
};

function forwardSurfacePointer(
  phase: 'down' | 'move' | 'up',
  event: ThreeEvent<PointerEvent>,
  handler?: SouvenirSurfacePointerHandler,
): boolean {
  if (!handler || !event.uv) return false;
  const handled = handler(phase, {
    uv: { u: event.uv.x, v: event.uv.y },
    clientX: event.nativeEvent.clientX,
    clientY: event.nativeEvent.clientY,
    pointerId: event.nativeEvent.pointerId,
    projectUvToClient: createSurfaceUvProjector(event),
  });
  if (handled) event.stopPropagation();
  return handled;
}

type PointerCaptureTarget = EventTarget & {
  setPointerCapture?: (pointerId: number) => void;
  releasePointerCapture?: (pointerId: number) => void;
  hasPointerCapture?: (pointerId: number) => boolean;
};

function capturePointer(event: ThreeEvent<PointerEvent>): void {
  const target = event.target as unknown as PointerCaptureTarget;
  target.setPointerCapture?.(event.nativeEvent.pointerId);
}

function releasePointer(event: ThreeEvent<PointerEvent>): void {
  const target = event.target as unknown as PointerCaptureTarget;
  const pointerId = event.nativeEvent.pointerId;
  if (!target.hasPointerCapture || target.hasPointerCapture(pointerId)) {
    target.releasePointerCapture?.(pointerId);
  }
}

function parentNameChain(obj: THREE.Object3D): string {
  const parts: string[] = [];
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (cur.name) parts.push(cur.name);
    cur = cur.parent;
  }
  return parts.join(' ').toLowerCase();
}

function collectBodyMeshes(root: THREE.Object3D, wantBack: boolean): THREE.Mesh[] {
  const found: THREE.Mesh[] = [];
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const chain = parentNameChain(mesh);
    if (wantBack) {
      if (/body_back|print_back/.test(chain)) found.push(mesh);
    } else if (/body_front|print_front/.test(chain)) {
      found.push(mesh);
    }
  });
  return found;
}

function fitCloneToStudio(source: THREE.Object3D, targetSize = 2.35): THREE.Object3D {
  const root = source.clone(true);
  root.updateMatrixWorld(true);

  let box = new THREE.Box3().setFromObject(root);
  let size = box.getSize(new THREE.Vector3());
  let center = box.getCenter(new THREE.Vector3());
  root.position.sub(center);

  const maxDim = Math.max(size.x, size.y, size.z, 0.001);
  root.scale.setScalar(targetSize / maxDim);
  root.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(root);
  root.position.y -= box.min.y;
  root.updateMatrixWorld(true);

  box = new THREE.Box3().setFromObject(root);
  center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.updateMatrixWorld(true);
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh) mesh.geometry.computeVertexNormals();
  });

  return root;
}

/** Ось тулова кружки (без ручки): центр XZ + радиус стенки + высота. */
function estimateMugBody(root: THREE.Object3D): {
  cx: number;
  cz: number;
  radius: number;
  yMin: number;
  yMax: number;
  handleAngle: number;
} {
  root.updateMatrixWorld(true);
  const all: THREE.Vector3[] = [];
  const v = new THREE.Vector3();
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (!pos) return;
    for (let i = 0; i < pos.count; i += 1) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      all.push(v.clone());
    }
  });

  let yMin = Infinity;
  let yMax = -Infinity;
  for (const p of all) {
    yMin = Math.min(yMin, p.y);
    yMax = Math.max(yMax, p.y);
  }
  const h = Math.max(yMax - yMin, 0.001);
  const y0 = yMin + h * 0.32;
  const y1 = yMin + h * 0.68;
  const band = all.filter((p) => p.y >= y0 && p.y <= y1);
  if (band.length < 8) {
    return { cx: 0, cz: 0, radius: 0.45, yMin, yMax, handleAngle: Math.PI };
  }

  // Ручка — выброс по радиусу; без неё стенка тулова ~ r=body.
  let handleAngle = Math.PI;
  let maxR = -Infinity;
  for (const p of band) {
    const r = Math.hypot(p.x, p.z);
    if (r > maxR) {
      maxR = r;
      handleAngle = Math.atan2(p.z, p.x);
    }
  }

  const bodyRs: number[] = [];
  for (const p of band) {
    const a = Math.atan2(p.z, p.x);
    let d = Math.abs(a - handleAngle);
    if (d > Math.PI) d = Math.PI * 2 - d;
    if (d > (40 * Math.PI) / 180) bodyRs.push(Math.hypot(p.x, p.z));
  }
  bodyRs.sort((a, b) => a - b);
  const radius = bodyRs[Math.floor(bodyRs.length * 0.9)] || maxR * 0.55 || 0.45;

  // Центр — по «диску» тулова (без кончика ручки), иначе среднее уезжает к ручке.
  const inner = band.filter((p) => Math.hypot(p.x, p.z) <= radius * 1.02);
  let sx = 0;
  let sz = 0;
  for (const p of inner.length ? inner : band) {
    sx += p.x;
    sz += p.z;
  }
  const n = Math.max(inner.length || band.length, 1);
  return { cx: sx / n, cz: sz / n, radius, yMin, yMax, handleAngle };
}

/** Кружка: масштаб по высоте, ось тулова в (0,y,0), ручка справа (+X), дно на y=0. */
function fitMugToStudio(source: THREE.Object3D, targetHeight = 1.38): THREE.Object3D {
  const root = source.clone(true);
  root.updateMatrixWorld(true);

  let box = new THREE.Box3().setFromObject(root);
  const height = Math.max(box.max.y - box.min.y, 0.001);
  root.scale.setScalar(targetHeight / height);
  root.updateMatrixWorld(true);

  let body = estimateMugBody(root);
  root.position.x -= body.cx;
  root.position.y -= body.yMin;
  root.position.z -= body.cz;
  root.updateMatrixWorld(true);

  // Ручка → +X: в CylinderGeometry theta=0 совпадает с центром ручки (s=0 обхвата).
  body = estimateMugBody(root);
  root.rotation.y = -body.handleAngle;
  root.updateMatrixWorld(true);

  body = estimateMugBody(root);
  root.position.x -= body.cx;
  root.position.y -= body.yMin;
  root.position.z -= body.cz;
  root.updateMatrixWorld(true);
  return root;
}

/**
 * Печатный пояс: s=0 в центре ручки (+X), шов (зазор) у ручки, лицо закрыто.
 * Fabric U=0 → startMm, U=1 → endMm. Высота — по мм, не через fit майки.
 */
function buildMugWrapGeometry(
  fitted: THREE.Object3D,
  printArea: PrintAreaConfig,
): THREE.BufferGeometry | null {
  const body = estimateMugBody(fitted);
  const bodyH = Math.max(body.yMax - body.yMin, 0.001);
  // Высота пояса от калибровки кружки 110 мм (не от обхвата).
  const printH = mugPrintHeightScene(printArea.heightMm, bodyH, MUG_BODY_HEIGHT_MM);

  const arc = mugWrapArcFromHandle({
    widthMm: printArea.widthMm,
    circumferenceMm: MUG_OUTER_CIRCUMFERENCE_MM,
    startMmFromHandle: printArea.wrapStartMmFromHandle,
  });

  const printR = body.radius * 1.018;
  const cy = body.yMin + bodyH * 0.48;

  const geo = new THREE.CylinderGeometry(
    printR,
    printR * 0.992,
    Math.max(printH, 0.08),
    128,
    1,
    true,
    arc.thetaStart,
    arc.thetaLength,
  );
  geo.translate(0, cy, 0);
  geo.computeVertexNormals();
  return geo;
}

function applyMugCeramicMaterials(root: THREE.Object3D, color: string) {
  let bodyMat = root.userData.merchBodyMat as THREE.MeshStandardMaterial | undefined;
  if (!bodyMat) {
    bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.38,
      metalness: 0,
    });
    root.userData.merchBodyMat = bodyMat;
  } else {
    bodyMat.color.set(color);
  }
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.material = bodyMat;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
  });
}

/** Ткань GLB без своей карты цвета: заменяем материал цветом лавки. Принт — отдельный слой. */
function applyShirtBodyColor(root: THREE.Object3D, color: string) {
  let mat = root.userData.merchBodyMat as THREE.MeshStandardMaterial | undefined;
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.62,
      metalness: 0,
    });
    root.userData.merchBodyMat = mat;
  } else {
    mat.color.set(color);
  }
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.material = mat;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
  });
}

/** Внешний слой груди (max.z) или спины (min.z), с приоритетом плотности. */
function pickSurfaceMesh(meshes: THREE.Mesh[], isBack: boolean): THREE.Mesh | null {
  if (!meshes.length) return null;
  let best: THREE.Mesh | null = null;
  let bestScore = -Infinity;
  for (const mesh of meshes) {
    const box = new THREE.Box3().setFromObject(mesh);
    const verts = mesh.geometry.attributes.position?.count ?? 0;
    const depthScore = isBack ? -box.min.z : box.max.z;
    const score = depthScore * 1e6 + verts;
    if (score > bestScore) {
      bestScore = score;
      best = mesh;
    }
  }
  return best;
}

/**
 * Оболочка по реальной геометрии Body_Front/Back.
 * Сдвиг по ±Z (без разрыва сетки). Край зоны — discard по UV в шейдере,
 * а не клип треугольников (он давал «рваный» край).
 * Спина: U зеркалим, чтобы с камеры сзади текст читался нормально.
 */
function buildSurfacePrintGeometry(
  mesh: THREE.Mesh,
  printArea: PrintAreaConfig,
  isBack: boolean,
): THREE.BufferGeometry | null {
  mesh.updateWorldMatrix(true, true);

  const geo = dequantizeGeometry(mesh.geometry);
  geo.applyMatrix4(mesh.matrixWorld);
  geo.computeVertexNormals();

  const pos = geo.attributes.position as THREE.BufferAttribute;
  const nor = geo.attributes.normal as THREE.BufferAttribute;
  if (!pos || !nor || pos.count < 3) {
    geo.dispose();
    return null;
  }

  const inflateZ = isBack ? -0.014 : 0.014;
  for (let i = 0; i < pos.count; i += 1) {
    pos.setXYZ(i, pos.getX(i), pos.getY(i), pos.getZ(i) + inflateZ);
  }
  pos.needsUpdate = true;

  geo.computeBoundingBox();
  const box = geo.boundingBox;
  if (!box) {
    geo.dispose();
    return null;
  }

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const { width: printW, height: printH } = printAreaSceneSize(
    printArea.widthMm,
    printArea.heightMm,
    size.x,
    size.y,
  );
  const printCx = center.x;
  const printCy = center.y + size.y * 0.02;

  const uvAttr = new THREE.BufferAttribute(new Float32Array(pos.count * 2), 2);
  for (let i = 0; i < pos.count; i += 1) {
    let u = (pos.getX(i) - printCx) / printW + 0.5;
    const v = (pos.getY(i) - printCy) / printH + 0.5;
    // С камеры сзади +X мира слева → без flip текст зеркалится.
    if (isBack) u = 1 - u;
    uvAttr.setXY(i, u, v);
  }
  geo.setAttribute('uv', uvAttr);

  // Лёгкая обрезка далеко за зоной (производительность), край — ровный через discard UV.
  const srcPos = pos.array as Float32Array;
  const srcNor = nor.array as Float32Array;
  const srcUv = uvAttr.array as Float32Array;
  const outPos: number[] = [];
  const outNor: number[] = [];
  const outUv: number[] = [];
  const pad = 0.12;

  for (let i = 0; i < pos.count; i += 3) {
    const cu = (srcUv[i * 2] + srcUv[(i + 1) * 2] + srcUv[(i + 2) * 2]) / 3;
    const cv = (srcUv[i * 2 + 1] + srcUv[(i + 1) * 2 + 1] + srcUv[(i + 2) * 2 + 1]) / 3;
    if (cu < -pad || cu > 1 + pad || cv < -pad || cv > 1 + pad) continue;

    for (let k = 0; k < 3; k += 1) {
      const vi = i + k;
      outPos.push(srcPos[vi * 3], srcPos[vi * 3 + 1], srcPos[vi * 3 + 2]);
      outNor.push(srcNor[vi * 3], srcNor[vi * 3 + 1], srcNor[vi * 3 + 2]);
      outUv.push(srcUv[vi * 2], srcUv[vi * 2 + 1]);
    }
  }

  geo.dispose();
  if (outPos.length < 9) return null;

  const clipped = new THREE.BufferGeometry();
  clipped.setAttribute('position', new THREE.Float32BufferAttribute(outPos, 3));
  clipped.setAttribute('normal', new THREE.Float32BufferAttribute(outNor, 3));
  clipped.setAttribute('uv', new THREE.Float32BufferAttribute(outUv, 2));
  clipped.computeBoundingSphere();
  return clipped;
}

/**
 * Рамка зоны: canvas с aspect = widthMm/heightMm, чтобы штрихи были
 * одинаковой длины (мм) на всех сторонах после UV-маппинга на mesh.
 */
function createPrintAreaBorderTexture(
  widthMm: number,
  heightMm: number,
  longSidePx = 1024,
): THREE.CanvasTexture {
  const aspect = Math.max(0.05, Math.max(1, widthMm) / Math.max(1, heightMm));
  const canvas = document.createElement('canvas');
  if (aspect >= 1) {
    canvas.width = longSidePx;
    canvas.height = Math.max(64, Math.round(longSidePx / aspect));
  } else {
    canvas.height = longSidePx;
    canvas.width = Math.max(64, Math.round(longSidePx * aspect));
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // dashMm одинаков по периметру → равные px при aspect-canvas.
  const pxPerMm = canvas.width / Math.max(1, widthMm);
  const dash = Math.max(4, Math.round(3.2 * pxPerMm));
  const gap = Math.max(3, Math.round(2.0 * pxPerMm));
  const lineW = Math.max(2, Math.round(0.9 * pxPerMm));
  const inset = Math.max(3, Math.round(lineW * 1.2));

  ctx.strokeStyle = 'rgba(26, 25, 22, 0.45)';
  ctx.lineWidth = lineW;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'miter';
  ctx.setLineDash([dash, gap]);
  ctx.strokeRect(inset, inset, canvas.width - inset * 2, canvas.height - inset * 2);

  ctx.setLineDash([]);
  ctx.lineWidth = lineW + 1;
  ctx.strokeStyle = 'rgba(26, 25, 22, 0.72)';
  const corner = Math.max(10, Math.round(6 * pxPerMm));
  const drawCorner = (x: number, y: number, dx: number, dy: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y + dy * corner);
    ctx.lineTo(x, y);
    ctx.lineTo(x + dx * corner, y);
    ctx.stroke();
  };
  drawCorner(inset, inset, 1, 1);
  drawCorner(canvas.width - inset, inset, -1, 1);
  drawCorner(inset, canvas.height - inset, 1, -1);
  drawCorner(canvas.width - inset, canvas.height - inset, -1, -1);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

function usePrintZoneBorderMaterial(widthMm: number, heightMm: number) {
  return useMemo(() => {
    const map = createPrintAreaBorderTexture(widthMm, heightMm);
    const mat = new THREE.MeshBasicMaterial({
      map,
      color: '#ffffff',
      side: THREE.DoubleSide,
      toneMapped: false,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -10,
      polygonOffsetUnits: -10,
      alphaTest: 0.02,
    });
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        /* glsl */ `
        #include <map_fragment>
        #ifdef USE_MAP
          if (vMapUv.x < 0.0 || vMapUv.x > 1.0 || vMapUv.y < 0.0 || vMapUv.y > 1.0) discard;
        #endif
        `,
      );
    };
    return { mat, map };
  }, [widthMm, heightMm]);
}

function usePrintMaterial(printTexture: THREE.Texture | null, polygonOffsetFactor = -8) {
  return useMemo(() => {
    const map = printTexture;
    if (map) {
      map.flipY = true;
      map.colorSpace = THREE.LinearSRGBColorSpace;
      map.anisotropy = 16;
      map.minFilter = THREE.LinearFilter;
      map.magFilter = THREE.LinearFilter;
      map.generateMipmaps = false;
      map.wrapS = THREE.ClampToEdgeWrapping;
      map.wrapT = THREE.ClampToEdgeWrapping;
      map.needsUpdate = true;
    }

    if (!map) {
      return { mat: new THREE.MeshBasicMaterial({ visible: false }), map };
    }

    // Свой шейдер, без onBeforeCompile. Фон листа прозрачный, поэтому
    // белые чернила остаются. Прозрачные пиксели не рисуем. Цвет ткани — материал модели.
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: map } },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor,
      polygonOffsetUnits: polygonOffsetFactor,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D map;
        varying vec2 vUv;
        void main() {
          if (vUv.x < 0.0 || vUv.x > 1.0 || vUv.y < 0.0 || vUv.y > 1.0) discard;
          vec4 texel = texture2D(map, vUv);
          if (texel.a < 0.04) discard;
          gl_FragColor = vec4(texel.rgb, 1.0);
        }
      `,
    });

    return { mat, map };
  }, [polygonOffsetFactor, printTexture]);
}

const PrintLayerMeshes: React.FC<{
  fitted: THREE.Object3D;
  layer: PrintLayer;
  isMug: boolean;
  onSurfacePointer?: SouvenirSurfacePointerHandler;
}> = ({ fitted, layer, isMug, onSurfacePointer }) => {
  const { printArea, printTexture, dragTexture, showBorder } = layer;
  const isBack = !isMug && isTshirtBackPrintArea(printArea);
  const printGeometry = useMemo(() => {
    if (isMug) return buildMugWrapGeometry(fitted, printArea);
    const meshes = collectBodyMeshes(fitted, isBack);
    const surface = pickSurfaceMesh(meshes, isBack);
    if (!surface) return null;
    return buildSurfacePrintGeometry(surface, printArea, isBack);
  }, [fitted, printArea, isBack, isMug]);

  const { mat: printMat } = usePrintMaterial(printTexture);
  const { mat: dragMat } = usePrintMaterial(dragTexture, -12);
  const { mat: borderMat, map: borderMap } = usePrintZoneBorderMaterial(
    printArea.widthMm,
    printArea.heightMm,
  );

  useEffect(() => {
    return () => {
      printGeometry?.dispose();
    };
  }, [printGeometry]);

  useEffect(() => {
    return () => {
      printMat.dispose();
      dragMat.dispose();
    };
  }, [dragMat, printMat]);

  useEffect(() => {
    return () => {
      borderMat.dispose();
      borderMap.dispose();
    };
  }, [borderMat, borderMap]);

  if (!printGeometry) return null;

  return (
    <group>
      <mesh
        name={printArea.meshName || (isMug ? 'print_wrap' : isBack ? 'print_back' : 'print_front')}
        geometry={printGeometry}
        material={printMat}
        renderOrder={4}
        dispose={null}
        onPointerDown={(event) => {
          if (!showBorder) return;
          if (forwardSurfacePointer('down', event, onSurfacePointer)) capturePointer(event);
        }}
        onPointerMove={(event) => (
          showBorder ? forwardSurfacePointer('move', event, onSurfacePointer) : undefined
        )}
        onPointerUp={(event) => {
          if (!showBorder) return;
          forwardSurfacePointer('up', event, onSurfacePointer);
          releasePointer(event);
        }}
        onPointerCancel={(event) => {
          if (!showBorder) return;
          forwardSurfacePointer('up', event, onSurfacePointer);
          releasePointer(event);
        }}
      />
      {dragTexture ? (
        <mesh
          name={`print_drag_overlay_${printArea.id}`}
          geometry={printGeometry}
          material={dragMat}
          renderOrder={5}
          dispose={null}
        />
      ) : null}
      {showBorder ? (
        <mesh
          name={`print_zone_border_${printArea.id}`}
          geometry={printGeometry}
          material={borderMat}
          renderOrder={6}
          dispose={null}
        />
      ) : null}
    </group>
  );
};

/**
 * GLB изделие + макеты зон печати (майка: грудь/спина; кружка: wrap).
 */
export const GltfPrintModel: React.FC<GltfPrintModelProps> = ({
  url,
  layers,
  bodyColor = '#f4f1ea',
  onSurfacePointer,
  onReady,
}) => {
  const { scene } = useGLTF(url);
  const isMug = layers.some((l) => isMugPrintArea(l.printArea));
  const fitted = useMemo(
    () => (isMug ? fitMugToStudio(scene) : fitCloneToStudio(scene)),
    [scene, isMug],
  );

  useLayoutEffect(() => {
    if (isMug) {
      applyMugCeramicMaterials(fitted, bodyColor);
      return;
    }
    applyShirtBodyColor(fitted, bodyColor);
  }, [fitted, isMug, bodyColor]);

  useLayoutEffect(() => {
    onReady?.();
  }, [fitted, onReady]);

  return (
    <group>
      <primitive object={fitted} />
      {layers.map((layer) => (
        <PrintLayerMeshes
          key={layer.printArea.id}
          fitted={fitted}
          layer={layer}
          isMug={isMug}
          onSurfacePointer={onSurfacePointer}
        />
      ))}
    </group>
  );
};

export function preloadPrintModel(url: string) {
  if (!url) return;
  useGLTF.preload(url);
}

export default GltfPrintModel;
