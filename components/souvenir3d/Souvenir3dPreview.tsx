import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GltfPrintModel } from './GltfPrintModel';
import { ProceduralProduct } from './ProceduralProduct';
import type { PrintAreaConfig, SouvenirSurfacePointerHandler } from './types';
import { isMugPrintArea, isTshirtBackPrintArea, resolveActivePrintArea } from './types';
import { MUG_OUTER_CIRCUMFERENCE_MM, mugWrapArcFromHandle } from './scale';
import './souvenir3dPreview.css';

export type Souvenir3dPreviewProps = {
  /** Все зоны печати (грудь/спина). */
  printAreas: PrintAreaConfig[];
  /** Активная зона — камера и рамка. */
  activePrintAreaId: string;
  /** Макеты по id зоны; хранятся при переключении. */
  texturesByArea: Record<string, string | HTMLCanvasElement | null | undefined>;
  /** Инкремент при обновлении текстуры. */
  textureRevision?: number;
  dragOverlaySource?: HTMLCanvasElement | null;
  dragOverlayRevision?: number;
  className?: string;
  caption?: string;
  /** Цвет вещи с лавки. На печатный слой не влияет. */
  bodyColor?: string;
  onSurfacePointer?: SouvenirSurfacePointerHandler;
  orbitEnabled?: boolean;
};

function configurePrintTexture(texture: THREE.Texture): THREE.Texture {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = true;
  texture.needsUpdate = true;
  return texture;
}

function textureFromSource(source: string | HTMLCanvasElement | null | undefined): THREE.Texture | null {
  if (!source) return null;
  if (typeof source !== 'string') {
    return configurePrintTexture(new THREE.CanvasTexture(source));
  }
  const img = new Image();
  const tex = configurePrintTexture(new THREE.Texture(img));
  img.onload = () => {
    tex.needsUpdate = true;
  };
  img.src = source;
  if (img.complete) tex.needsUpdate = true;
  return tex;
}

function CameraRig({
  position,
  lookAt,
}: {
  position: [number, number, number];
  lookAt: [number, number, number];
}) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(position[0], position[1], position[2]);
    camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
    camera.updateProjectionMatrix();
  }, [camera, position, lookAt]);
  return null;
}

function LocalStudioEnvironment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const { texture } = pmrem.fromScene(room, 0.04);
    scene.environment = texture;
    room.dispose();
    return () => {
      if (scene.environment === texture) scene.environment = null;
      texture.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

const SceneBody: React.FC<{
  printAreas: PrintAreaConfig[];
  active: PrintAreaConfig;
  textures: Record<string, THREE.Texture | null>;
  dragTexture: THREE.Texture | null;
  bodyColor?: string;
  onSurfacePointer?: SouvenirSurfacePointerHandler;
  orbitEnabled: boolean;
  startGltf: boolean;
  gltfReady: boolean;
  onGltfReady: () => void;
}> = ({
  printAreas,
  active,
  textures,
  dragTexture,
  bodyColor,
  onSurfacePointer,
  orbitEnabled,
  startGltf,
  gltfReady,
  onGltfReady,
}) => {
  const modelUrl = printAreas.find((a) => a.modelUrl)?.modelUrl || active.modelUrl;
  const hasGltf = Boolean(modelUrl) && gltfReady;
  const isMug = isMugPrintArea(active);
  const isGltfTshirt = hasGltf && !isMug;
  const isGltfMug = hasGltf && isMug;
  const groundY = isGltfMug ? 0 : isMug ? -0.72 : isGltfTshirt ? 0 : -1.08;
  const orbitTargetY = isGltfMug ? 0.62 : isMug ? 0.05 : isGltfTshirt ? 1.05 : 0.08;

  const layers = useMemo(
    () =>
      printAreas.map((area) => ({
        printArea: area.procedural || area.modelUrl
          ? area
          : { ...area, procedural: isMugPrintArea(area) ? 'mug' as const : 'tshirt' as const },
        printTexture: textures[area.id] ?? null,
        dragTexture: area.id === active.id ? dragTexture : null,
        showBorder: area.id === active.id,
      })),
    [printAreas, textures, dragTexture, active.id],
  );

  const procedural = (
    <group position={[0, isMug ? 0.05 : 0.02, 0]}>
      <ProceduralProduct
        printArea={
          active.procedural || active.modelUrl
            ? active
            : { ...active, procedural: isMug ? 'mug' : 'tshirt' }
        }
        printTexture={textures[active.id] ?? null}
        dragTexture={dragTexture}
        onSurfacePointer={onSurfacePointer}
      />
    </group>
  );

  return (
    <>
      <color attach="background" args={['#e7e1d6']} />
      <fog attach="fog" args={['#e7e1d6', 14, 26]} />
      <ambientLight intensity={0.42} />
      <hemisphereLight args={['#fffaf3', '#cfc6b8', 0.38]} />
      <directionalLight
        position={[3.2, 5.5, 2.8]}
        intensity={1.35}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-2.5, 2.2, -1.5]} intensity={0.28} />
      <spotLight position={[0, 4.5, 3]} angle={0.45} penumbra={0.55} intensity={0.55} castShadow />
      <LocalStudioEnvironment />
      {startGltf && modelUrl ? (
        <Suspense fallback={procedural}>
          <GltfPrintModel
            url={modelUrl}
            layers={layers}
            bodyColor={bodyColor}
            onSurfacePointer={onSurfacePointer}
            onReady={onGltfReady}
          />
        </Suspense>
      ) : procedural}
      <ContactShadows
        position={[0, groundY, 0]}
        opacity={0.28}
        scale={isMug ? 4.5 : 6.5}
        blur={2.4}
        far={2.5}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY - 0.005, 0]} receiveShadow>
        <circleGeometry args={[isMug ? 1.4 : 2.1, 48]} />
        <meshStandardMaterial color="#ddd6ca" roughness={0.96} metalness={0} />
      </mesh>
      <OrbitControls
        enabled={orbitEnabled}
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.7}
        minDistance={isMug ? 1.7 : isGltfTshirt ? 2.6 : 2.3}
        maxDistance={isMug ? 4.8 : 6.2}
        target={[0, orbitTargetY, 0]}
      />
    </>
  );
};

/**
 * Live 3D-превью изделия. Не участвует в production PDF — только mockup для клиента.
 */
export const Souvenir3dPreview: React.FC<Souvenir3dPreviewProps> = ({
  printAreas,
  activePrintAreaId,
  texturesByArea,
  textureRevision = 0,
  dragOverlaySource = null,
  dragOverlayRevision = 0,
  className,
  caption,
  bodyColor,
  onSurfacePointer,
  orbitEnabled = true,
}) => {
  const active =
    resolveActivePrintArea(printAreas, activePrintAreaId)
    ?? printAreas[0];
  const [textures, setTextures] = useState<Record<string, THREE.Texture | null>>({});
  const [dragTexture, setDragTexture] = useState<THREE.Texture | null>(null);
  const modelUrl = active?.modelUrl || printAreas.find((area) => area.modelUrl)?.modelUrl || "";
  const [startGltf, setStartGltf] = useState(false);
  const [gltfReady, setGltfReady] = useState(false);
  const onGltfReady = useCallback(() => setGltfReady(true), []);

  useEffect(() => {
    setStartGltf(false);
    setGltfReady(false);
    const frame = window.requestAnimationFrame(() => setStartGltf(true));
    return () => window.cancelAnimationFrame(frame);
  }, [modelUrl]);

  useEffect(() => {
    const next: Record<string, THREE.Texture | null> = {};
    const created: THREE.Texture[] = [];
    for (const area of printAreas) {
      const src = texturesByArea[area.id];
      const tex = textureFromSource(src ?? null);
      next[area.id] = tex;
      if (tex) created.push(tex);
    }
    setTextures(next);
    return () => {
      created.forEach((tex) => tex.dispose());
    };
  }, [printAreas, texturesByArea]);

  useEffect(() => {
    Object.values(textures).forEach((texture) => {
      if (texture) texture.needsUpdate = true;
    });
  }, [textureRevision, textures]);

  useEffect(() => {
    const texture = textureFromSource(dragOverlaySource);
    setDragTexture(texture);
    return () => texture?.dispose();
  }, [dragOverlaySource]);

  useEffect(() => {
    if (dragTexture) dragTexture.needsUpdate = true;
  }, [dragOverlayRevision, dragTexture]);

  const rootClass = ['souvenir3d-preview', className].filter(Boolean).join(' ');
  const label = (() => {
    if (caption !== undefined) return caption;
    if (!active) return 'Podgląd 3D';
    const base = `${active.label} · ${active.widthMm}×${active.heightMm} mm`;
    if (!isMugPrintArea(active)) return base;
    const arc = mugWrapArcFromHandle({
      widthMm: active.widthMm,
      circumferenceMm: MUG_OUTER_CIRCUMFERENCE_MM,
      startMmFromHandle: active.wrapStartMmFromHandle,
    });
    return `${base} · od ucha ${Math.round(arc.startMm)}–${Math.round(arc.endMm)} mm`;
  })();
  const isMug = active ? isMugPrintArea(active) : false;
  const isBack = Boolean(active && !isMug && isTshirtBackPrintArea(active));
  const hasGltf = gltfReady && Boolean(modelUrl);

  const cameraPos = useMemo<[number, number, number]>(() => {
    if (isMug) return hasGltf ? [1.55, 1.02, 2.35] : [2.5, 1.25, 2.75];
    if (hasGltf) {
      return isBack ? [0.16, 1.16, -3.25] : [0.16, 1.16, 3.25];
    }
    return isBack ? [0.15, 0.55, -4.15] : [0.15, 0.55, 4.15];
  }, [isBack, isMug, hasGltf]);

  const lookAt = useMemo<[number, number, number]>(
    () => (isMug ? (hasGltf ? [0, 0.68, 0] : [0, 0.05, 0]) : hasGltf ? [0, 1.05, 0] : [0, 0.08, 0]),
    [isMug, hasGltf],
  );

  if (!active) return null;

  return (
    <div className={rootClass}>
      <div className="souvenir3d-preview__viewport" aria-label="Podgląd 3D produktu">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: cameraPos, fov: 34 }}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
        >
          <CameraRig position={cameraPos} lookAt={lookAt} />
          <SceneBody
            printAreas={printAreas}
            active={active}
            textures={textures}
            dragTexture={dragTexture}
            bodyColor={bodyColor}
            onSurfacePointer={onSurfacePointer}
            orbitEnabled={orbitEnabled}
            startGltf={startGltf}
            gltfReady={gltfReady}
            onGltfReady={onGltfReady}
          />
        </Canvas>
      </div>
      {label ? <p className="souvenir3d-preview__caption">{label}</p> : null}
    </div>
  );
};

export default Souvenir3dPreview;
