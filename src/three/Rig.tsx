import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface RigProps {
  reducedMotion: boolean
}

const ORIGIN = new THREE.Vector3(0, 0, 0)
const target = new THREE.Vector3()

/** Pointer follow damping, in e-folds per second. */
const FOLLOW_RATE = 2.4
/** Pointer travel, in world units at the origin plane. */
const TRAVEL_X = 0.24
const TRAVEL_Y = 0.16
/** Clamp the damping step so restoring a backgrounded tab does not snap. */
const MAX_DELTA = 0.1

// Camera parallax: ease toward the pointer offset, always look at the origin.
export function Rig({ reducedMotion }: RigProps) {
  useFrame((state, delta) => {
    if (reducedMotion) return
    // Exponential damping rather than a fixed lerp factor. `lerp(target, 0.035)`
    // is frame-rate dependent — it would follow the pointer roughly twice as
    // fast on a 144Hz panel as on a 60Hz one.
    const step = 1 - Math.exp(-FOLLOW_RATE * Math.min(delta, MAX_DELTA))
    target.set(state.pointer.x * TRAVEL_X, state.pointer.y * TRAVEL_Y, state.camera.position.z)
    state.camera.position.lerp(target, step)
    state.camera.lookAt(ORIGIN)
  })
  return null
}
