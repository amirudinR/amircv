import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Particles } from './Particles'
import { Rig } from './Rig'

/**
 * Scene palette.
 *
 * The hero canvas is composited over the cream page with `mix-blend-mode:
 * multiply`, so every colour the scene emits is a *multiplier* on the paper,
 * not a colour in its own right. Three consequences drive all the values
 * below:
 *
 *  1. Transparent pixels leave the sheet untouched, so `alpha: true` stays.
 *  2. The form must land mid-tone. A near-black object multiplies to a heavy
 *     blob with no readable form.
 *  3. Nothing can fake a highlight or a glow: a glow has no meaning in a
 *     multiply composite. Form has to come from diffuse shading only.
 */
export interface ScenePalette {
  /** Raw tokens, resolved once per mount. */
  ink: THREE.Color
  inkSoft: THREE.Color
  paper: THREE.Color
  stain: THREE.Color
  /**
   * The form's base colour: `--scene-ink` lifted most of the way to
   * `--scene-paper`. Multiplying by the raw ink would give near-black; this
   * mid warm grey is what lets diffuse shading produce a *range* of ink tones
   * between paper and solid.
   */
  body: THREE.Color
}

/**
 * The --scene-* tokens are declared unconditionally on :root in
 * src/styles/global.css, so these are unreachable in practice. They exist
 * because an unresolved custom property makes THREE.Color fall back to opaque
 * white, and white multiplies to "no change" — the form would silently vanish
 * instead of failing loudly. Values mirror the tokens exactly.
 */
const FALLBACK_SCENE_COLORS = {
  ink: '#2a2620',
  inkSoft: '#6b6355',
  paper: '#f4f0e6',
  stain: '#8c2f24',
} as const

/**
 * How far the body tone is lifted from ink toward paper.
 *
 * At 0.62 the form still multiplied down to a heavy mid-grey mass that read as
 * a ball sitting on the page rather than a mark printed on it. Lifting it
 * further lets the diffuse range stay inside the light half of the sheet, so
 * the darkest facet is still visibly lighter than the type beside it.
 */
const BODY_TONE_LIFT = 0.76

/** Resting orientation of the construction circles, plus the sway amplitude. */
const CIRCLES_REST = { x: 0.32, y: -0.2, z: 0.18 } as const
const CIRCLES_SWAY = { x: 0.025, y: 0.04, z: 0.02 } as const

function readScenePalette(): ScenePalette {
  const style = typeof document === 'undefined' ? null : getComputedStyle(document.documentElement)
  const read = (token: string, fallback: string) => {
    const value = style?.getPropertyValue(token).trim() ?? ''
    return new THREE.Color(value || fallback)
  }
  const ink = read('--scene-ink', FALLBACK_SCENE_COLORS.ink)
  const paper = read('--scene-paper', FALLBACK_SCENE_COLORS.paper)
  return {
    ink,
    inkSoft: read('--scene-ink-soft', FALLBACK_SCENE_COLORS.inkSoft),
    paper,
    stain: read('--scene-stain', FALLBACK_SCENE_COLORS.stain),
    body: ink.clone().lerp(paper, BODY_TONE_LIFT),
  }
}

/**
 * The form. An icosahedron at detail 1 with flat shading is 80 crisp facets —
 * a cut, embossed seal. A smooth subdivided sphere reads as a rendered blob
 * no matter how it is lit, and the old detail-3 sphere also cost 1280
 * triangles of vertex work for a surface you cannot see the shape of.
 *
 * The radius is deliberately small relative to the 45-degree camera at z=6
 * (a visible height of ~5 units): at 1.44 the form filled the right half of
 * the hero and read as a sphere, at 1.02 it reads as a stamped mark sitting
 * behind the type.
 */
function CoreForm({ palette, reducedMotion }: { palette: ScenePalette; reducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (reducedMotion || !meshRef.current) return
    const t = state.clock.elapsedTime
    // A bounded sway, not a spin. A printed mark does not revolve, and a
    // bounded curve returns the form to rest instead of accumulating rotation
    // that would carry the facets away from the typography sitting on top.
    // Driven off elapsed time, so it is frame-rate independent by construction.
    meshRef.current.rotation.y = Math.sin(t * 0.06) * 0.085
    meshRef.current.rotation.x = Math.sin(t * 0.045 + 1.1) * 0.05
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.02, 1]} />
      {/* Matte ink: high roughness, no metalness, no emission. The previous
          metalness 0.72 / roughness 0.32 pair is precisely what made this read
          as glossy plastic. */}
      <meshStandardMaterial color={palette.body} flatShading roughness={0.94} metalness={0} />
    </mesh>
  )
}

/**
 * Three hairline circles, as a drafting instrument would draw them: soft ink,
 * low opacity, unlit. Ring opacity sits near 0.12–0.22 rather than 0.3 so that
 * after multiply they stay below the value of the construction lines in the
 * HTML layer instead of competing with them.
 */
function ConstructionCircles({
  palette,
  reducedMotion,
}: {
  palette: ScenePalette
  reducedMotion: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (reducedMotion || !groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.rotation.set(
      CIRCLES_REST.x + Math.sin(t * 0.03) * CIRCLES_SWAY.x,
      CIRCLES_REST.y + Math.sin(t * 0.022 + 0.8) * CIRCLES_SWAY.y,
      CIRCLES_REST.z + Math.sin(t * 0.03 + 0.4) * CIRCLES_SWAY.z,
    )
  })

  return (
    <group ref={groupRef}>
      <mesh rotation={[0.18, 0.1, 0]}>
        <torusGeometry args={[1.92, 0.009, 8, 96]} />
        <meshBasicMaterial color={palette.inkSoft} transparent opacity={0.22} />
      </mesh>
      <mesh rotation={[1.12, -0.28, 0.54]}>
        <torusGeometry args={[2.12, 0.007, 8, 96]} />
        <meshBasicMaterial color={palette.inkSoft} transparent opacity={0.16} />
      </mesh>
      <mesh rotation={[-0.48, 0.78, 0.16]}>
        <torusGeometry args={[2.3, 0.005, 8, 96]} />
        <meshBasicMaterial color={palette.inkSoft} transparent opacity={0.12} />
      </mesh>
    </group>
  )
}

// Request one frame for static reduced-motion scenes, then stop rendering.
function StaticFrame({ reducedMotion }: { reducedMotion: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (!reducedMotion) return
    invalidate()
  }, [reducedMotion, invalidate])
  return null
}

// A context can come up fine and still be lost later to a driver crash or GPU
// reset. Report it upward so the hero can unmount and show static artwork
// instead of freezing on a dead frame.
function ContextGuard({ onContextLost }: { onContextLost?: () => void }) {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    if (!onContextLost) return
    const canvas = gl.domElement
    const handleLost = (event: Event) => {
      event.preventDefault()
      onContextLost()
    }
    canvas.addEventListener('webglcontextlost', handleLost)
    return () => canvas.removeEventListener('webglcontextlost', handleLost)
  }, [gl, onContextLost])
  return null
}

interface HeroSceneProps {
  reducedMotion: boolean
  active?: boolean
  onContextLost?: () => void
  /**
   * Current theme, so the palette is re-read when the page flips. Most of the
   * scene reads the same in both themes — only `--scene-stain` changes — but
   * re-reading is one `getComputedStyle` call per toggle, and hard-coding the
   * assumption would make the next token added to the dark block silently
   * wrong here.
   */
  theme?: 'light' | 'dark'
}

export default function HeroScene({ reducedMotion, active = true, onContextLost, theme = 'light' }: HeroSceneProps) {
  // Once per theme, not per frame.
  const palette = useMemo(readScenePalette, [theme])

  const particleCount = useMemo(() => {
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 8 : 8
    const narrow = typeof window !== 'undefined' && window.innerWidth < 768
    return narrow ? 72 : cores <= 4 ? 150 : 260
  }, [])

  const narrow = typeof window !== 'undefined' && window.innerWidth < 768
  const isStatic = reducedMotion || !active

  return (
    // `flat` selects NoToneMapping. ACES' filmic curve is a photographic
    // response: it desaturates and crushes mid-tones, which fights a print
    // look. Straight linear-to-sRGB keeps the shading arithmetic honest. The
    // light intensities below total under 1.0 so the lit side never clips to
    // white, which would multiply to "no change" and punch a hole in the form.
    <Canvas
      dpr={narrow ? [1, 1.1] : [1, 1.25]}
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ antialias: !narrow, alpha: true, powerPreference: 'high-performance' }}
      frameloop={isStatic ? 'demand' : 'always'}
      flat
    >
      <StaticFrame reducedMotion={isStatic} />
      <ContextGuard onContextLost={onContextLost} />
      {/* Soft warm fill: puts the shadow side at a readable mid-tone. */}
      <ambientLight color={palette.paper} intensity={0.38} />
      {/* The one light direction the form is modelled from, warm, upper left. */}
      <directionalLight color={palette.paper} position={[-4, 5, 4]} intensity={0.5} />
      {/* Oxblood, weak and distance-limited, from the lower right: a stain in
          the sheet rather than a second light direction. */}
      <pointLight
        color={palette.stain}
        position={[3, -2.5, 2.5]}
        intensity={3.2}
        distance={9}
        decay={2}
      />
      <CoreForm palette={palette} reducedMotion={reducedMotion} />
      <ConstructionCircles palette={palette} reducedMotion={reducedMotion} />
      <Particles
        count={particleCount}
        reducedMotion={reducedMotion}
        inkSoft={palette.inkSoft}
        stain={palette.stain}
      />
      <Rig reducedMotion={reducedMotion} />
    </Canvas>
  )
}
