import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
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
  /** Модель собрана и нарисована. Редактор до этого закрыт. */
  onModelReady?: () => void;
  onModelError?: () => void;
};

class ModelBoundary extends React.Component<
  { onError: () => void; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

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

const SceneBody: React.FC<{
  printAreas: PrintAreaConfig[];
  active: PrintAreaConfig;
  textures: Record<string, THREE.Texture | null>;
  dragTexture: THREE.Texture | null;
  bodyColor?: string;
  onSurfacePointer?: SouvenirSurfacePointerHandler;
  orbitEnabled: boolean;
  onModelReady: () => void;
  onModelError: () => void;
}> = ({
  printAreas,
  active,
  textures,
  dragTexture,
  bodyColor,
  onSurfacePointer,
  orbitEnabled,
  onModelReady,
  onModelError,
}) => {
  const modelUrl = printAreas.find((a) => a.modelUrl)?.modelUrl || active.modelUrl;
  const hasGltf = Boolean(modelUrl);
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

  useEffect(() => {
    if (!hasGltf) onModelReady();
  }, [hasGltf, onModelReady]);

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
      <ambientLight intensity={0.38} />
      <hemisphereLight args={['#fff6ea', '#b7aa9c', 0.42]} />
      <directionalLight position={[2.4, 5.2, 3.4]} intensity={2.4} />
      <directionalLight position={[-3.1, 2.4, -1.6]} intensity={0.85} />
      <directionalLight position={[0.2, 1.4, -3.2]} intensity={0.45} />
      {hasGltf && modelUrl ? (
        <ModelBoundary onError={onModelError}>
          <Suspense fallback={null}>
            <GltfPrintModel
              url={modelUrl}
              layers={layers}
              bodyColor={bodyColor}
              onSurfacePointer={onSurfacePointer}
              onReady={onModelReady}
            />
          </Suspense>
        </ModelBoundary>
      ) : procedural}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY + 0.004, 0.08]}>
        <circleGeometry args={[isMug ? 0.42 : 0.72, 40]} />
        <meshBasicMaterial color="#b3a394" transparent opacity={0.38} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY - 0.005, 0]}>
        <circleGeometry args={[isMug ? 1.4 : 2.1, 48]} />
        <meshStandardMaterial color="#ddd6ca" roughness={0.96} metalness={0} />
      </mesh>
      <OrbitControls
        enabled={orbitEnabled}
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.7}
        minDistance={isMug ? 1.7 : isGltfTshirt ? 2.6 : 2.3}
        maxDistance={isMug ? 4.8 : 8.5}
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
  onModelReady,
  onModelError,
}) => {
  const active =
    resolveActivePrintArea(printAreas, activePrintAreaId)
    ?? printAreas[0];
  const [textures, setTextures] = useState<Record<string, THREE.Texture | null>>({});
  const [dragTexture, setDragTexture] = useState<THREE.Texture | null>(null);
  const modelUrl = active?.modelUrl || printAreas.find((area) => area.modelUrl)?.modelUrl || "";
  const onModelReadyRef = React.useRef(onModelReady);
  const onModelErrorRef = React.useRef(onModelError);
  onModelReadyRef.current = onModelReady;
  onModelErrorRef.current = onModelError;
  const notifyModelReady = React.useCallback(() => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => onModelReadyRef.current?.());
    });
  }, []);
  const notifyModelError = React.useCallback(() => {
    onModelErrorRef.current?.();
  }, []);

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
  const hasGltf = Boolean(modelUrl);

  const cameraPos = useMemo<[number, number, number]>(() => {
    if (isMug) return hasGltf ? [1.55, 1.02, 2.35] : [2.5, 1.25, 2.75];
    if (hasGltf) {
      return isBack ? [0.2, 1.2, -6.2] : [0.2, 1.2, 6.2];
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
          dpr={1}
          camera={{ position: cameraPos, fov: 34 }}
          gl={{
            antialias: false,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
          onCreated={({ gl, scene }) => {
            scene.background = new THREE.Color("#e7e1d6");
            gl.setClearColor("#e7e1d6", 1);
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
            onModelReady={notifyModelReady}
            onModelError={notifyModelError}
          />
        </Canvas>
      </div>
      {label ? <p className="souvenir3d-preview__caption">{label}</p> : null}
    </div>
  );
};

export default Souvenir3dPreview;
