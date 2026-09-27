import * as THREE from 'three';

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
export const FALLBACK_SCENE_COLORS = {
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

export function readScenePalette(): ScenePalette {
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
