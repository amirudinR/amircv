import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const ACCENT = '#4D7CFE'
const ACCENT_2 = '#A78BFA'

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
}

export function Particles({ count, reducedMotion }: ParticlesProps) {
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
      const s = 0.45 + rand() * 0.55
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      list.push(dummy.matrix.clone())
    }
    return list
  }, [count])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const blue = new THREE.Color(ACCENT)
    const violet = new THREE.Color(ACCENT_2)
    transforms.forEach((matrix, i) => {
      mesh.setMatrixAt(i, matrix)
      mesh.setColorAt(i, i % 3 === 0 ? violet : blue)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [transforms])

  useFrame((state: { clock: THREE.Clock }, delta: number) => {
    if (reducedMotion || !groupRef.current) return
    const t = state.clock.elapsedTime
    // Slow group spin + subtle drift
    groupRef.current.rotation.y += delta * 0.022
    groupRef.current.rotation.x = Math.sin(t * 0.12) * 0.045
    groupRef.current.position.y = Math.sin(t * 0.22) * 0.06
  })

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <tetrahedronGeometry args={[0.035]} />
        <meshBasicMaterial transparent opacity={0.62} />
      </instancedMesh>
    </group>
  )
}
