import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { Particles } from './Particles'
import { Rig } from './Rig'

const ACCENT = '#4D7CFE'
const ACCENT_2 = '#A78BFA'

function CoreIcosahedron({ reducedMotion }: { reducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((_state, delta) => {
    if (reducedMotion || !meshRef.current) return
    meshRef.current.rotation.y += delta * 0.08
    meshRef.current.rotation.x += delta * 0.025
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.48, 3]} />
      <MeshDistortMaterial
        color={ACCENT}
        distort={0.12}
        speed={0.45}
        roughness={0.32}
        metalness={0.72}
      />
    </mesh>
  )
}

function OrbitalWire({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_state, delta) => {
    if (reducedMotion || !groupRef.current) return
    groupRef.current.rotation.z += delta * 0.035
    groupRef.current.rotation.y -= delta * 0.018
  })

  return (
    <group ref={groupRef} rotation={[0.32, -0.2, 0.18]}>
      <mesh rotation={[0.18, 0.1, 0]}>
        <torusGeometry args={[1.92, 0.008, 8, 96]} />
        <meshBasicMaterial color={ACCENT_2} transparent opacity={0.3} />
      </mesh>
      <mesh rotation={[1.12, -0.28, 0.54]}>
        <torusGeometry args={[2.12, 0.006, 8, 96]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.24} />
      </mesh>
      <mesh rotation={[-0.48, 0.78, 0.16]}>
        <torusGeometry args={[2.3, 0.004, 8, 96]} />
        <meshBasicMaterial color={ACCENT_2} transparent opacity={0.18} />
      </mesh>
    </group>
  )
}

function ArchitectureNodes({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const nodes = useMemo(() => [
    { position: [-2.15, 0.62, 0.15] as const, color: ACCENT_2 },
    { position: [1.85, 1.2, -0.1] as const, color: ACCENT },
    { position: [2.35, -0.72, 0.2] as const, color: ACCENT_2 },
    { position: [-1.2, -1.55, 0.05] as const, color: ACCENT },
  ], [])

  useFrame((_state, delta) => {
    if (reducedMotion || !groupRef.current) return
    groupRef.current.rotation.z += delta * 0.012
  })

  return (
    <group ref={groupRef}>
      {nodes.map((node, index) => (
        <group key={index} position={node.position}>
          <mesh>
            <sphereGeometry args={[0.09, 12, 12]} />
            <meshBasicMaterial color={node.color} transparent opacity={0.9} />
          </mesh>
          <mesh>
            <ringGeometry args={[0.13, 0.145, 24]} />
            <meshBasicMaterial color={node.color} transparent opacity={0.42} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
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

interface HeroSceneProps {
  reducedMotion: boolean
  active?: boolean
}

export default function HeroScene({ reducedMotion, active = true }: HeroSceneProps) {
  const particleCount = useMemo(() => {
    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 8 : 8
    const narrow = typeof window !== 'undefined' ? window.innerWidth < 768 : false
    return narrow ? 72 : cores <= 4 ? 150 : 260
  }, [])

  const narrow = typeof window !== 'undefined' && window.innerWidth < 768
  const isStatic = reducedMotion || !active

  return (
    <Canvas
      dpr={narrow ? [1, 1.1] : [1, 1.25]}
      camera={{ position: [0, 0, 6], fov: 45 }}
      gl={{ antialias: !narrow, alpha: true, powerPreference: 'high-performance' }}
      frameloop={isStatic ? 'demand' : 'always'}
    >
      <StaticFrame reducedMotion={isStatic} />
      <ambientLight intensity={0.28} />
      <pointLight position={[5, 3, 5]} intensity={18} color={ACCENT} />
      <pointLight position={[-4, -2, 3]} intensity={12} color={ACCENT_2} />
      <CoreIcosahedron reducedMotion={reducedMotion} />
      <OrbitalWire reducedMotion={reducedMotion} />
      <ArchitectureNodes reducedMotion={reducedMotion} />
      <Particles count={particleCount} reducedMotion={reducedMotion} />
      <Rig reducedMotion={reducedMotion} />
    </Canvas>
  )
}
