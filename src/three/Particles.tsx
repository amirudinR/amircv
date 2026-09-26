import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Simple seeded PRNG so the field is stable across renders
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface ParticlesProps {
  count: number
  reducedMotion: boolean
  /** Passed in from the palette so the tokens are resolved once, up top. */
  inkSoft: THREE.Color
  stain: THREE.Color
}

/**
 * Paper dust, not confetti.
 *
 * Under `mix-blend-mode: multiply` each speck multiplies the sheet it lands
 * on, so the field is kept deliberately weak: desaturated soft ink with a
 * minority of oxblood, at low opacity, with a size distribution skewed small.
 * A uniform field of saturated bright specks read as coloured dots scattered
 * over the page rather than as artefacts of printing on it.
 */
export function Particles({ count, reducedMotion, inkSoft, stain }: ParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const groupRef = useRef<THREE.Group>(null)

  // Scatter restrained points in a spherical shell (radius 3.2–6.5)
  const transforms = useMemo(() => {
    const rand = mulberry32(1337)
    const dummy = new THREE.Object3D()
    const list: THREE.Matrix4[] = []
    for (let i = 0; i < count; i++) {
      const radius = 3.2 + rand() * 3.3
      const theta = rand() * Math.PI * 2
      const phi = Math.acos(2 * rand() - 1)
      dummy.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
      )
      dummy.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI)
      // Skewed small: real dust is mostly fine grit with the occasional
      // fleck, and an even spread of equal specks reads as a particle effect.
      const s = 0.3 + Math.pow(rand(), 1.8) * 0.85
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      list.push(dummy.matrix.clone())
    }
    return list
  }, [count])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    transforms.forEach((matrix, i) => {
      mesh.setMatrixAt(i, matrix)
      // One in five carries the stain colour; the rest stay neutral ink.
      mesh.setColorAt(i, i % 5 === 0 ? stain : inkSoft)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [transforms, inkSoft, stain])

  useFrame((state: { clock: THREE.Clock }) => {
    if (reducedMotion || !groupRef.current) return
    const t = state.clock.elapsedTime
    // Bounded drift, same reasoning as the core form: nothing accumulates
    // rotation, so the field always settles back to where it started.
    groupRef.current.rotation.y = Math.sin(t * 0.02) * 0.05
    groupRef.current.rotation.x = Math.sin(t * 0.03) * 0.045
    groupRef.current.position.y = Math.sin(t * 0.05) * 0.06
  })

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <tetrahedronGeometry args={[0.032]} />
        {/* No `color` prop: it would multiply against the per-instance colour
            above, and the default white leaves it as a pass-through. Unlit on
            purpose — dust has no form to shade, and unlit is the cheaper pass.
            depthWrite off so overlapping transparent instances do not carve
            hard edges into each other; depthTest stays on so the form still
            occludes the dust behind it. */}
        <meshBasicMaterial transparent opacity={0.28} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}
