import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

/** Request one frame for static reduced-motion scenes, then stop rendering. */
export function StaticFrame({ reducedMotion }: { reducedMotion: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (!reducedMotion) return
    invalidate()
  }, [reducedMotion, invalidate])
  return null
}

/**
 * A context can come up fine and still be lost later to a driver crash or GPU
 * reset. Report it upward so the section can unmount and show static artwork
 * instead of freezing on a dead frame.
 */
export function ContextGuard({ onContextLost }: { onContextLost?: () => void }) {
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

const DEFAULT_TARGET: [number, number, number] = [0, 0, 0]

/**
 * Pull the camera back until the requested box fits.
 *
 * `fov` is vertical, so a portrait container sees a much narrower slice of the
 * world than a landscape one at the same distance — a fixed camera position
 * crops the machine off both sides on a phone. Both axes are solved and the
 * larger distance wins, so the framing holds at every aspect ratio instead of
 * only the one it was tuned at.
 */
export function FitCamera({
  halfWidth,
  halfHeight,
  lift,
  fov,
  target = DEFAULT_TARGET,
  minDistance = 1.6,
}: {
  halfWidth: number
  halfHeight?: number
  /** Camera height above the look-at point. Sets how far we look down. */
  lift: number
  fov: number
  target?: [number, number, number]
  minDistance?: number
}) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height)
    const tan = Math.tan((fov * Math.PI) / 360)
    const forWidth = halfWidth / (tan * aspect)
    // A tall container already sees plenty vertically, so this only binds when
    // the canvas is wider than it is deep.
    const forHeight = halfHeight ? halfHeight / tan : 0
    const distance = Math.max(minDistance, forWidth, forHeight)
    camera.position.set(0, target[1] + lift, distance)
    camera.lookAt(target[0], target[1], target[2])
    camera.updateProjectionMatrix()
  }, [camera, size, halfWidth, halfHeight, lift, fov, target, minDistance])

  return null
}
