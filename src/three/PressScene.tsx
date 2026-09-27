import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import { ContextGuard, FitCamera, StaticFrame } from './SceneGuards'
import { readScenePalette } from './palette'
import {
  PLATEN_TRAVEL,
  platenTravel,
  windowOpen,
  type Impression,
  type Timeline,
} from '@/lib/press'

/**
 * The bed is five slots wide and the platen slides along to the next one while
 * it is up, so a run fills the sheet left to right — the way a test sheet is
 * actually pulled.
 */
const SLOT_COUNT = 5
const SLOT_SPACING = 0.48
const CAMERA_FOV = 30
const LOOK_AT: [number, number, number] = [0, 0.78, 0]
/** How far above the look-at point the camera sits, which sets the look-down. */
const CAMERA_LIFT = 2.4
/**
 * The box the camera has to keep in frame. Wider than the machine (3.5 across)
 * because the near-bottom corners of the bed sit closer than its centre and so
 * project further out; without the margin the bed is cropped on a 16:11 stage.
 */
const FRAME_HALF_WIDTH = 2.2
const FRAME_HALF_HEIGHT = 1.58

/** Top face of the sheet. The seal rests 0.8 above it — see PLATEN_TRAVEL. */
const SHEET_TOP = 0.06

/** Post centres, clear of the platen at its widest. */
const POST_X = 1.3
/** Beam the spindle passes through. */
const BEAM_Y = 1.9

function slotX(index: number): number {
  return (index - (SLOT_COUNT - 1) / 2) * SLOT_SPACING
}

/**
 * The maker's mark, drawn to a canvas rather than shipped as an asset: a serif
 * face is already in the bundle and a data texture costs a few hundred bytes.
 *
 * White on transparent, so the material's `color` decides the ink and one
 * texture serves both themes.
 *
 * Two variants, because they are seen under very different conditions. The print
 * lies flat on the sheet and fills the frame, so it can carry a ring, an inner
 * ring and the initials. The cast mark is a 0.5-unit disc on a platen seen at a
 * shallow angle, where that much line work turns into a smudge — so it is one
 * thick ring, and the letters are left to the paper.
 */
type MarkVariant = 'print' | 'cast';

function useMarkTexture(monogram: string, variant: MarkVariant): THREE.CanvasTexture {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.clearRect(0, 0, size, size);
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';

    if (variant === 'cast') {
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.33, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.29, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = `600 ${Math.round(size * 0.28)}px Fraunces, Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(monogram || '·', size / 2, size / 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }, [monogram, variant]);
}

interface PressProps {
  monogram: string;
  reducedMotion: boolean;
  running: boolean;
  timeline: RefObject<Timeline | null>;
  impressions: Impression[];
  runId: number;
  /** Re-resolve the palette when this changes. See PressSceneProps. */
  theme?: 'light' | 'dark';
}

function Press({ monogram, reducedMotion, running, timeline, impressions, runId, theme }: PressProps) {
  const palette = useMemo(readScenePalette, [theme]);
  const printed = useMarkTexture(monogram, 'print');
  const cast = useMarkTexture(monogram, 'cast');

  const platenRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);
  const ringInnerRef = useRef<THREE.Mesh>(null);
  const slideRef = useRef(slotX(0));

  // A new run starts at the first slot, not wherever the last one finished.
  useEffect(() => {
    slideRef.current = slotX(0);
    if (platenRef.current) platenRef.current.position.x = slotX(0);
  }, [runId]);

  useFrame((state, delta) => {
    const line = timeline.current;
    const now = performance.now();

    const travel = line?.running
      ? platenTravel(now, line.biteAt, line.descentMs, reducedMotion)
      : 0;
    const open = line?.running ? windowOpen(now, line.biteAt, reducedMotion) : 0;

    if (platenRef.current) {
      // The bed slides while the platen is up, so `damp` rather than a fixed
      // step: it is frame-rate independent and eases out on its own.
      slideRef.current = THREE.MathUtils.damp(slideRef.current, slotX(line?.slot ?? 0), 7, delta);
      platenRef.current.position.x = slideRef.current;
      // A slow breath, so the press is not a still image before the first run.
      platenRef.current.position.y =
        (reducedMotion ? 0 : Math.sin(state.clock.elapsedTime * 0.8) * 0.02) - travel * PLATEN_TRAVEL;
    }

    if (ringRef.current) {
      ringRef.current.position.x = slideRef.current;
      // The target ring squeezes onto the registration mark as the platen falls,
      // so the tightening is the timing cue. Reduced motion cannot animate a
      // squeeze, so there the cue moves to the inner ring's opacity instead.
      const scale = reducedMotion ? 1 : 1 + 0.45 * (1 - travel);
      ringRef.current.scale.setScalar(scale);
    }

    if (ringInnerRef.current) {
      const material = ringInnerRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.16 + open * 0.7;
    }
  });

  return (
    <group>
      <RoundedBox args={[3.5, 0.22, 2.3]} radius={0.03} smoothness={2} position={[0, -0.11, 0]}>
        <meshStandardMaterial color={palette.inkSoft} roughness={0.9} metalness={0.04} />
      </RoundedBox>

      {/* The sheet, sitting proud of the bed. */}
      <mesh position={[0, SHEET_TOP / 2, 0]}>
        <boxGeometry args={[3.05, SHEET_TOP, 1.9]} />
        <meshStandardMaterial color={palette.paper} roughness={1} metalness={0} />
      </mesh>

      <group ref={ringRef} position={[slotX(0), SHEET_TOP + 0.014, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.016, 6, 72]} />
          <meshBasicMaterial color={palette.stain} transparent opacity={0.7} />
        </mesh>
        <mesh ref={ringInnerRef} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.33, 0.014, 6, 72]} />
          <meshBasicMaterial color={palette.stain} transparent opacity={0.3} />
        </mesh>
      </group>

      {/* One print per resolved impression, in its slot, crooked if it slipped. */}
      {impressions.map((quality, index) => (
        <mesh
          key={`${runId}-${index}`}
          position={[slotX(index), SHEET_TOP + 0.016, 0]}
          rotation={[-Math.PI / 2, 0, (quality === 'miss' ? 0.22 : quality === 'good' ? 0.09 : 0.02) * (index % 2 ? 1 : -1)]}
        >
          <planeGeometry args={[0.46, 0.46]} />
          <meshBasicMaterial
            map={printed}
            color={palette.ink}
            transparent
            opacity={quality === 'perfect' ? 0.95 : quality === 'good' ? 0.64 : 0.2}
            depthWrite={false}
          />
        </mesh>
      ))}

      {[-POST_X, POST_X].map((x) => (
        <RoundedBox
          key={x}
          args={[0.18, BEAM_Y, 0.18]}
          radius={0.025}
          smoothness={2}
          position={[x, BEAM_Y / 2, 0]}
        >
          <meshStandardMaterial color={palette.inkSoft} roughness={0.75} metalness={0.25} />
        </RoundedBox>
      ))}
      <RoundedBox args={[2.9, 0.18, 0.26]} radius={0.025} smoothness={2} position={[0, BEAM_Y, 0]}>
        <meshStandardMaterial color={palette.inkSoft} roughness={0.75} metalness={0.25} />
      </RoundedBox>

      {/* Everything below this group moves with the bite. */}
      <group ref={platenRef}>
        {/* One heavy slab. An overhanging cap on top of it made the platen read
            as a table rather than as the flat iron a platen actually is. */}
        <RoundedBox args={[1.15, 0.3, 1.0]} radius={0.035} smoothness={2} position={[0, 1.11, 0]}>
          <meshStandardMaterial color={palette.inkSoft} roughness={0.58} metalness={0.18} />
        </RoundedBox>
        {/* The maker's ring, cast into the platen face. No spindle above it: a
            rod that reached the beam would either have to slide with the platen
            (so it drifts out from under the beam) or stay put (so the platen
            appears to detach). A cap and a clear gap read as a platen hung from
            its yoke, which is what this machine is. */}
        <mesh position={[0, 1.263, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshBasicMaterial map={cast} color={palette.paper} transparent opacity={0.3} depthWrite={false} />
        </mesh>
        {/* The type-metal seal. At the bite its underside is on the paper. */}
        <RoundedBox args={[0.6, 0.1, 0.6]} radius={0.015} smoothness={2} position={[0, 0.91, 0]}>
          <meshStandardMaterial color={palette.ink} roughness={0.32} metalness={0.72} />
        </RoundedBox>
      </group>

      {/* Intensities are high because this scene composites normally, not with
          multiply. Three's diffuse term divides by pi, so a directional light at
          the strength that reads correctly over cream paper lands near black
          here. The paper still has to stay under 1.0 so the sheet does not clip
          to a white hole. */}
      <ambientLight color={palette.paper} intensity={0.92} />
      <directionalLight color={palette.paper} position={[-3, 5, 4]} intensity={2.0} />
      <directionalLight color="#9fb6d4" position={[4, 2, -2]} intensity={0.7} />
    </group>
  );
}

export interface PressSceneProps extends PressProps {
  active: boolean;
  /**
   * Only read so the palette is re-resolved when the page flips. The press is
   * drawn in real light rather than multiplied onto the sheet, so both themes
   * need their own values, and `getComputedStyle` is only worth calling on an
   * actual theme change.
   */
  theme?: 'light' | 'dark';
  onContextLost?: () => void;
}

export default function PressScene({ active, theme = 'light', onContextLost, ...press }: PressSceneProps) {
  const narrow = typeof window !== 'undefined' && window.innerWidth < 768;
  // Off-screen and idle: stop the loop. The run pauses with the section, so no
  // progress is lost by not drawing.
  const frameloop = press.running || active ? 'always' : 'demand';

  return (
    <Canvas
      dpr={narrow ? [1, 1.1] : [1, 1.25]}
      camera={{ position: [0, LOOK_AT[1] + CAMERA_LIFT, 6], fov: CAMERA_FOV }}
      gl={{ antialias: !narrow, alpha: true, powerPreference: 'high-performance' }}
      frameloop={frameloop}
      flat
    >
      <FitCamera
        halfWidth={FRAME_HALF_WIDTH}
        halfHeight={FRAME_HALF_HEIGHT}
        lift={CAMERA_LIFT}
        fov={CAMERA_FOV}
        target={LOOK_AT}
      />
      <StaticFrame reducedMotion={press.reducedMotion} />
      <ContextGuard onContextLost={onContextLost} />
      <Press {...press} />
    </Canvas>
  );
}
