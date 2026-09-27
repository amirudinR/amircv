/**
 * WebGL capability probing.
 *
 * The hero scene is decorative, so a machine that cannot render it should
 * degrade to the static paper artwork instead of throwing. R3F's own
 * `fallback` prop covers "context never came up"; this module covers the
 * cases we can decide *before* mounting, plus context loss afterwards.
 *
 * Results are memoised because a probe allocates a real GL context.
 */

interface NetworkInformationLike {
  saveData?: boolean;
  effectiveType?: string;
}

interface NavigatorHints extends Navigator {
  connection?: NetworkInformationLike;
  deviceMemory?: number;
}

const CONTEXT_TYPES = ['webgl2', 'webgl'] as const;

// Only bail out on hardware that is genuinely unable to keep up. Mid-tier
// machines are handled by the adaptive particle/dpr logic inside the scene.
const MIN_CORES = 2;
const MIN_DEVICE_MEMORY_GB = 2;

/**
 * A successful probe is cached for good. A failure is not: Chrome's GPU process
 * is still starting on a first load, and a context requested in that window can
 * come back null on a machine that supports WebGL perfectly well. Caching that
 * would disable the 3D scene for the whole page lifetime over a transient, and
 * the visitor would get the static artwork on hardware that could have run it.
 *
 * The retry is rate-limited instead, so a section that asks on every render does
 * not allocate a context per frame.
 */
const NEGATIVE_RETRY_MS = 1000;
let webglSupported: boolean | null = null;
let lastProbeAt = 0;

function probeWebGL(): boolean {
  if (typeof document === 'undefined') return false;

  for (const type of CONTEXT_TYPES) {
    let context: RenderingContext | null = null;
    try {
      context = document.createElement('canvas').getContext(type);
    } catch {
      continue;
    }

    if (context) {
      // Hand the context slot back so the probe does not count against the
      // browser's limit of live contexts.
      const lose = (context as WebGLRenderingContext).getExtension?.('WEBGL_lose_context');
      lose?.loseContext();
      return true;
    }
  }

  return false;
}

/** True when a WebGL context can actually be created in this browser. */
export function supportsWebGL(): boolean {
  if (webglSupported === true) return true;

  const now = Date.now();
  if (webglSupported === false && now - lastProbeAt < NEGATIVE_RETRY_MS) return false;

  lastProbeAt = now;
  webglSupported = probeWebGL();
  return webglSupported;
}

/** True when the user asked for less data, or the device is very low spec. */
export function prefersReducedData(): boolean {
  if (typeof navigator === 'undefined') return false;

  const nav = navigator as NavigatorHints;

  if (nav.connection?.saveData === true) return true;
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < MIN_DEVICE_MEMORY_GB) return true;
  if (
    typeof navigator.hardwareConcurrency === 'number' &&
    navigator.hardwareConcurrency < MIN_CORES
  ) {
    return true;
  }

  return false;
}

/**
 * Whether the hero should mount its 3D scene at all. When this is false the
 * static paper artwork is shown instead — no wasted bundle parse, no GL work.
 */
export function shouldRenderScene(): boolean {
  return supportsWebGL() && !prefersReducedData();
}
