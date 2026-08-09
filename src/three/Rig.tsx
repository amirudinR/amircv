import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface RigProps {
  reducedMotion: boolean
}

const target = new THREE.Vector3()

// Camera parallax: lerp toward pointer offset, always look at origin
export function Rig({ reducedMotion }: RigProps) {
  useFrame((state) => {
    if (reducedMotion) return
    target.set(state.pointer.x * 0.6, state.pointer.y * 0.6, state.camera.position.z)
    state.camera.position.lerp(target, 0.05)
    state.camera.lookAt(0, 0, 0)
  })
  return null
}
