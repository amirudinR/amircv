import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { Particles } from './Particles'
import { Rig } from './Rig'

const ACCENT = '#4D7CFE'
const ACCENT_2 = '#A78BFA'

function CoreIcosahedron({ reducedMotion }: { reducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_state, delta) => {
    if (reducedMotion || !meshRef.current) return
    meshRef.current.rotation.y += delta * 0.12
    meshRef.current.rotation.x += delta * 0.05
  })

  const shape = (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.6, 5]} />
      <MeshDistortMaterial
        color={ACCENT}
        distort={0.35}
        speed={2}
        roughness={0.2}
        metalness={0.8}
      />
    </mesh>
  )

  if (reducedMotion) return shape

  return (
    <Float speed={1.5} floatIntensity={1.2} rotationIntensity={0.4}>
      {shape}
    </Float>
  )
}

// Renders one static frame when reducedMotion is on
function StaticFrame({ reducedMotion }: { reducedMotion: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (reducedMotion) invalidate()
  }, [reducedMotion, invalidate])
  return null
}

interface HeroSceneProps {
  reducedMotion: boolean
}

export default function HeroScene({ reducedMotion }: HeroSceneProps) {
  const particleCount = useMemo(() => {
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 8 : 8
    const narrow = typeof window !== 'undefined' ? window.innerWidth < 768 : false
    return narrow ? 110 : cores <= 4 ? 240 : 460
  }, [])

  const narrow = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <Canvas
      dpr={narrow ? [1, 1.2] : [1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ antialias: !narrow, alpha: true, powerPreference: 'high-performance' }}
      frameloop={reducedMotion ? 'never' : 'always'}
    >
      <StaticFrame reducedMotion={reducedMotion} />
      <ambientLight intensity={0.4} />
      <pointLight position={[6, 4, 6]} intensity={40} color={ACCENT} />
      <pointLight position={[-6, -3, 4]} intensity={30} color={ACCENT_2} />
      <CoreIcosahedron reducedMotion={reducedMotion} />
      <Particles count={particleCount} reducedMotion={reducedMotion} />
      <Rig reducedMotion={reducedMotion} />
    </Canvas>
  )
}
