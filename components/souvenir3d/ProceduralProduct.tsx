import React, { useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { PrintAreaConfig, SouvenirSurfacePointerHandler } from './types';
import { createSurfaceUvProjector } from './surfaceUvToClient';

type ProceduralProductProps = {
  printArea: PrintAreaConfig;
  printTexture: THREE.Texture | null;
  dragTexture?: THREE.Texture | null;
  bodyColor?: string;
  onSurfacePointer?: SouvenirSurfacePointerHandler;
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

/** Лёгкий шум для ткани / микрорельефа керамики. */
function makeNoiseMap(size = 128, contrast = 0.35): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 255 * contrast;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.max(0, Math.min(255, v));
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.needsUpdate = true;
  return tex;
}

function usePrintMaterial(
  printTexture: THREE.Texture | null,
  fallback = '#f8fafc',
  polygonOffsetFactor = -2,
) {
  return useMemo(() => {
    const mat = new THREE.MeshBasicMaterial({
      color: printTexture ? '#ffffff' : fallback,
      map: printTexture ?? null,
      side: THREE.DoubleSide,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor,
      polygonOffsetUnits: polygonOffsetFactor,
      transparent: true,
      alphaTest: printTexture ? 0.04 : 0,
      depthWrite: !printTexture,
      opacity: printTexture ? 1 : 0.85,
    });
    if (printTexture) {
      printTexture.colorSpace = THREE.SRGBColorSpace;
      printTexture.anisotropy = Math.max(printTexture.anisotropy, 16);
      printTexture.minFilter = THREE.LinearFilter;
      printTexture.magFilter = THREE.LinearFilter;
      printTexture.generateMipmaps = false;
      printTexture.needsUpdate = true;
    }
    return mat;
  }, [fallback, polygonOffsetFactor, printTexture]);
}

function useFabricMaterial(color: string) {
  return useMemo(() => {
    const bump = makeNoiseMap(96, 0.22);
    bump.repeat.set(6, 6);
    const mat = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.92,
      metalness: 0,
      bumpMap: bump,
      bumpScale: 0.012,
      sheen: 1,
      sheenRoughness: 0.48,
      sheenColor: new THREE.Color('#f8fafc'),
      clearcoat: 0.02,
      clearcoatRoughness: 1,
    });
    return mat;
  }, [color]);
}

function useCeramicMaterial(color: string, opts?: { gloss?: number }) {
  const gloss = opts?.gloss ?? 0.88;
  return useMemo(() => {
    const bump = makeNoiseMap(64, 0.08);
    bump.repeat.set(2, 2);
    const mat = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 1 - gloss * 0.75,
      metalness: 0.04,
      bumpMap: bump,
      bumpScale: 0.004,
      clearcoat: gloss,
      clearcoatRoughness: 0.12 + (1 - gloss) * 0.35,
      reflectivity: 0.6,
      ior: 1.48,
      specularIntensity: 0.9,
    });
    return mat;
  }, [color, gloss]);
}

/** Силуэт футболки: плечи, рукава, подол, V-горловина с отверстием. */
function buildTshirtShape(): THREE.Shape {
  const s = new THREE.Shape();
  // низ → левый бок → рукав → плечо → горловина → симметрия
  s.moveTo(-0.62, -1.02);
  s.bezierCurveTo(-0.66, -0.7, -0.7, -0.2, -0.66, 0.22);
  s.bezierCurveTo(-0.64, 0.42, -0.7, 0.48, -0.95, 0.28);
  // левый рукав
  s.lineTo(-1.38, -0.02);
  s.bezierCurveTo(-1.52, 0.08, -1.55, 0.42, -1.42, 0.55);
  s.bezierCurveTo(-1.28, 0.68, -0.95, 0.92, -0.55, 1.08);
  // левое плечо → горловина
  s.bezierCurveTo(-0.42, 0.98, -0.28, 0.9, -0.18, 0.88);
  s.bezierCurveTo(-0.1, 0.78, -0.05, 0.72, 0, 0.72);
  s.bezierCurveTo(0.05, 0.72, 0.1, 0.78, 0.18, 0.88);
  s.bezierCurveTo(0.28, 0.9, 0.42, 0.98, 0.55, 1.08);
  // правый рукав
  s.bezierCurveTo(0.95, 0.92, 1.28, 0.68, 1.42, 0.55);
  s.bezierCurveTo(1.55, 0.42, 1.52, 0.08, 1.38, -0.02);
  s.lineTo(0.95, 0.28);
  s.bezierCurveTo(0.7, 0.48, 0.64, 0.42, 0.66, 0.22);
  s.bezierCurveTo(0.7, -0.2, 0.66, -0.7, 0.62, -1.02);
  s.bezierCurveTo(0.32, -1.06, -0.32, -1.06, -0.62, -1.02);

  // отверстие горловины
  const neck = new THREE.Path();
  neck.moveTo(-0.16, 0.78);
  neck.bezierCurveTo(-0.12, 0.68, -0.06, 0.62, 0, 0.62);
  neck.bezierCurveTo(0.06, 0.62, 0.12, 0.68, 0.16, 0.78);
  neck.bezierCurveTo(0.1, 0.86, -0.1, 0.86, -0.16, 0.78);
  s.holes.push(neck);

  return s;
}

/** Профиль кружки: дно с кольцом, конус, буртик, внутренняя стенка. */
function buildMugLathePoints(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0.001, -0.64),
    new THREE.Vector2(0.36, -0.64),
    new THREE.Vector2(0.42, -0.62), // кольцо дна
    new THREE.Vector2(0.44, -0.58),
    new THREE.Vector2(0.48, -0.52),
    new THREE.Vector2(0.5, -0.28),
    new THREE.Vector2(0.52, 0.0),
    new THREE.Vector2(0.545, 0.28),
    new THREE.Vector2(0.565, 0.48),
    new THREE.Vector2(0.58, 0.54),
    new THREE.Vector2(0.6, 0.57), // наружный буртик
    new THREE.Vector2(0.575, 0.595),
    new THREE.Vector2(0.52, 0.585), // край ободка
    new THREE.Vector2(0.505, 0.52),
    new THREE.Vector2(0.485, 0.2),
    new THREE.Vector2(0.46, -0.2),
    new THREE.Vector2(0.435, -0.48),
    new THREE.Vector2(0.4, -0.55),
    new THREE.Vector2(0.001, -0.56),
  ];
}

/** Мягкая «тканевая» футболка с bevel и зоной печати на груди. */
export const ProceduralTshirt: React.FC<ProceduralProductProps> = ({
  printArea,
  printTexture,
  dragTexture,
  bodyColor = '#e8eef6',
  onSurfacePointer,
}) => {
  const printMat = usePrintMaterial(printTexture);
  const dragMat = usePrintMaterial(dragTexture ?? null, '#f8fafc', -4);
  const bodyMat = useFabricMaterial(bodyColor);
  const ribMat = useFabricMaterial('#c5d0de');
  const innerMat = useFabricMaterial('#d5dee9');

  const shape = useMemo(() => buildTshirtShape(), []);
  const extrude = useMemo(
    () => ({
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.055,
      bevelSize: 0.048,
      bevelOffset: -0.008,
      bevelSegments: 5,
      curveSegments: 48,
    }),
    [],
  );

  const aspect = printArea.widthMm / Math.max(1, printArea.heightMm);
  const printH = 0.68;
  const printW = Math.min(Math.max(printH * aspect, 0.42), 0.95);
  /**
   * Тело: position z=-0.11, depth=0.22 + bevel → перед ≈0.165 / зад ≈-0.11.
   * Грудь: +Z; спина: −Z + разворот плоскости лицом наружу.
   */
  const isBack =
    /print_back/i.test(printArea.meshName)
    || /(?:^|[^a-z])back(?:[^a-z]|$)|rear|спин|задн/i.test(
      `${printArea.id} ${printArea.meshName} ${printArea.label}`,
    );
  const printZ = isBack ? -0.22 : 0.22;

  const printZoneFrame = useMemo(
    () =>
      new Float32Array([
        -printW / 2, -printH / 2, 0.004,
        printW / 2, -printH / 2, 0.004,
        printW / 2, printH / 2, 0.004,
        -printW / 2, printH / 2, 0.004,
      ]),
    [printW, printH],
  );

  return (
    <group position={[0, 0.02, 0]}>
      <mesh material={bodyMat} castShadow receiveShadow position={[0, 0, -0.11]}>
        <extrudeGeometry args={[shape, extrude]} />
      </mesh>

      {/* Внутренняя «подкладка» — читаемая толщина */}
      <mesh material={innerMat} position={[0, 0.05, -0.02]} scale={[0.92, 0.92, 0.55]}>
        <extrudeGeometry
          args={[
            shape,
            {
              depth: 0.12,
              bevelEnabled: false,
              curveSegments: 32,
            },
          ]}
        />
      </mesh>

      {/* Ворот */}
      <mesh position={[0, 0.98, 0.04]} material={ribMat} castShadow>
        <torusGeometry args={[0.22, 0.045, 12, 32, Math.PI]} />
      </mesh>

      {/* Манжеты */}
      <mesh position={[-1.32, 0.28, 0.02]} rotation={[0.15, 0.2, 0.85]} material={ribMat} castShadow>
        <cylinderGeometry args={[0.095, 0.105, 0.07, 24]} />
      </mesh>
      <mesh position={[1.32, 0.28, 0.02]} rotation={[0.15, -0.2, -0.85]} material={ribMat} castShadow>
        <cylinderGeometry args={[0.095, 0.105, 0.07, 24]} />
      </mesh>

      {/* Подол-резинка */}
      <mesh position={[0, -0.99, 0.02]} material={ribMat} castShadow receiveShadow>
        <boxGeometry args={[1.18, 0.055, 0.18]} />
      </mesh>

      {/* Зона печати — грудь (+Z) или спина (−Z) */}
      <group position={[0, 0.06, printZ]} rotation={[0, isBack ? Math.PI : 0, 0]} renderOrder={2}>
        <mesh
          name={printArea.meshName || (isBack ? 'print_back' : 'print_front')}
          material={printMat}
          castShadow
          renderOrder={3}
          onPointerDown={(event) => {
            if (forwardSurfacePointer('down', event, onSurfacePointer)) capturePointer(event);
          }}
          onPointerMove={(event) => forwardSurfacePointer('move', event, onSurfacePointer)}
          onPointerUp={(event) => {
            forwardSurfacePointer('up', event, onSurfacePointer);
            releasePointer(event);
          }}
          onPointerCancel={(event) => {
            forwardSurfacePointer('up', event, onSurfacePointer);
            releasePointer(event);
          }}
        >
          <planeGeometry args={[printW, printH]} />
        </mesh>
        {dragTexture ? (
          <mesh
            name={`print_drag_overlay_${printArea.id}`}
            material={dragMat}
            renderOrder={4}
          >
            <planeGeometry args={[printW, printH]} />
          </mesh>
        ) : null}
        <lineLoop renderOrder={5}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[printZoneFrame, 3]}
              count={4}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#2563eb" toneMapped={false} />
        </lineLoop>
      </group>
    </group>
  );
};

/** Керамическая кружка: lathe + clearcoat, объёмная ручка, печатный пояс. */
export const ProceduralMug: React.FC<ProceduralProductProps> = ({
  printArea,
  printTexture,
  dragTexture,
  bodyColor = '#f5f7fa',
  onSurfacePointer,
}) => {
  const printMat = usePrintMaterial(printTexture, '#eef2f7');
  const dragMat = usePrintMaterial(dragTexture ?? null, '#f8fafc', -4);
  const bodyMat = useCeramicMaterial(bodyColor, { gloss: 0.9 });
  const rimMat = useCeramicMaterial('#ffffff', { gloss: 0.95 });
  const innerMat = useCeramicMaterial('#ebeff5', { gloss: 0.75 });
  const handleMat = useCeramicMaterial(bodyColor, { gloss: 0.85 });

  const lathePoints = useMemo(() => buildMugLathePoints(), []);
  const handleCurve = useMemo(
    () =>
      new THREE.CubicBezierCurve3(
        new THREE.Vector3(0.55, 0.34, 0),
        new THREE.Vector3(1.02, 0.48, 0),
        new THREE.Vector3(1.05, -0.32, 0),
        new THREE.Vector3(0.53, -0.3, 0),
      ),
    [],
  );

  return (
    <group>
      <mesh material={bodyMat} castShadow receiveShadow>
        <latheGeometry args={[lathePoints, 128]} />
      </mesh>

      {/* Глянцевый ободок */}
      <mesh position={[0, 0.575, 0]} rotation={[Math.PI / 2, 0, 0]} material={rimMat} castShadow>
        <torusGeometry args={[0.545, 0.022, 16, 80]} />
      </mesh>

      {/* Внутренняя полость */}
      <mesh position={[0, 0.02, 0]} material={innerMat}>
        <cylinderGeometry args={[0.485, 0.43, 1.02, 80, 1, true]} />
      </mesh>
      <mesh position={[0, -0.48, 0]} rotation={[Math.PI / 2, 0, 0]} material={innerMat}>
        <circleGeometry args={[0.43, 64]} />
      </mesh>

      {/* Кольцо дна */}
      <mesh position={[0, -0.635, 0]} rotation={[Math.PI / 2, 0, 0]} material={bodyMat} castShadow>
        <torusGeometry args={[0.3, 0.028, 12, 64]} />
      </mesh>

      {/* Ручка */}
      <mesh material={handleMat} castShadow>
        <tubeGeometry args={[handleCurve, 80, 0.055, 20, false]} />
      </mesh>
      <mesh position={[0.53, 0.32, 0]} material={handleMat} castShadow>
        <sphereGeometry args={[0.072, 24, 18]} />
      </mesh>
      <mesh position={[0.51, -0.28, 0]} material={handleMat} castShadow>
        <sphereGeometry args={[0.068, 24, 18]} />
      </mesh>

      {/* Печатный пояс */}
      <mesh
        name={printArea.meshName || 'print_wrap'}
        material={printMat}
        castShadow
        onPointerDown={(event) => {
          if (forwardSurfacePointer('down', event, onSurfacePointer)) capturePointer(event);
        }}
        onPointerMove={(event) => forwardSurfacePointer('move', event, onSurfacePointer)}
        onPointerUp={(event) => {
          forwardSurfacePointer('up', event, onSurfacePointer);
          releasePointer(event);
        }}
        onPointerCancel={(event) => {
          forwardSurfacePointer('up', event, onSurfacePointer);
          releasePointer(event);
        }}
      >
        <cylinderGeometry args={[0.552, 0.528, 0.56, 128, 1, true]} />
      </mesh>
      {dragTexture ? (
        <mesh
          name={`print_drag_overlay_${printArea.id}`}
          material={dragMat}
          renderOrder={4}
        >
          <cylinderGeometry args={[0.553, 0.529, 0.56, 128, 1, true]} />
        </mesh>
      ) : null}

      {/* Маркеры зоны */}
      <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.553, 0.005, 8, 96]} />
        <meshBasicMaterial color="#64748b" transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, -0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.53, 0.005, 8, 96]} />
        <meshBasicMaterial color="#64748b" transparent opacity={0.35} />
      </mesh>
    </group>
  );
};

export const ProceduralProduct: React.FC<ProceduralProductProps> = (props) => {
  const kind = props.printArea.procedural ?? (props.printArea.id === 'wrap' ? 'mug' : 'tshirt');
  if (kind === 'mug') return <ProceduralMug {...props} />;
  return <ProceduralTshirt {...props} />;
};
