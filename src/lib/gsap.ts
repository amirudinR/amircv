import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

/** The live Lenis instance, or null when smooth scroll is not running. */
let activeLenis: Lenis | null = null;

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** The live Lenis instance, or `null` when smooth scroll is not running. */
export function getSmoothScroll(): Lenis | null {
  return activeLenis;
}

export interface ScrollToTargetOptions {
  /** Skip the animation and jump. Reduced motion forces this regardless. */
  immediate?: boolean;
}

/**
 * The single entry point for programmatic scrolling.
 *
 * Delegates to Lenis when it is running, and falls back to a native scroll when
 * it is not — which is always a possibility, because `initSmoothScroll` bails
 * out for reduced motion and for coarse pointers. Safe to call before init has
 * run and after its cleanup has fired; both simply take the native path.
 *
 * `prefers-reduced-motion` is read here, at call time, so callers never repeat
 * the check (and so a preference toggled after init is honoured).
 *
 * Offsets: both paths land a target 88px below the top of the viewport, the
 * height of the fixed header plus breathing room. Lenis subtracts the root's
 * `scroll-padding-top` when it resolves an element target, and the native
 * fallback gets the same 88px from that same declaration when
 * `scrollIntoView` honours it — so the two paths agree, and neither can drift
 * from `html { scroll-padding-top }` in global.css.
 */
export function scrollToTarget(
  target: number | string | HTMLElement,
  { immediate = false }: ScrollToTargetOptions = {},
): void {
  // Reduced motion means jump, never animate. Lenis would also force this
  // internally (respectReducedMotion defaults to true), but deciding it here
  // keeps both paths identical.
  const jump = immediate || prefersReducedMotion();

  let resolved: HTMLElement | number;
  if (typeof target === 'number') {
    resolved = target;
  } else {
    // Resolve ids and selectors the same way Lenis would, so both paths
    // navigate to the same element.
    const element =
      typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    if (!element) {
      // Anchor gone (or a typo) — a silent no-op, as before.
      return;
    }
    resolved = element;
  }

  const lenis = activeLenis;
  if (lenis) {
    lenis.scrollTo(resolved, {
      immediate: jump,
      // Scroll even if Lenis has been stopped or locked, e.g. mid-teardown.
      force: true,
    });
    return;
  }

  if (typeof resolved === 'number') {
    window.scrollTo({ top: resolved, behavior: jump ? 'auto' : 'smooth' });
    return;
  }
  resolved.scrollIntoView({ behavior: jump ? 'auto' : 'smooth', block: 'start' });
}

/**
 * Lenis smooth scroll wired into the GSAP ticker + ScrollTrigger.
 * Fully disabled when the user prefers reduced motion, or on coarse pointers
 * where the platform already scrolls smoothly.
 * Returns a cleanup function.
 */
export function initSmoothScroll(): () => void {
  const reduceMotion = prefersReducedMotion();
  const coarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (reduceMotion || coarsePointer) {
    return () => {};
  }

  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  activeLenis = lenis;

  lenis.on('scroll', ScrollTrigger.update);

  const tick = (time: number) => {
    lenis.raf(time * 1000);
  };
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    // Only clear the instance we own: a second init may already have replaced it.
    if (activeLenis === lenis) activeLenis = null;
    gsap.ticker.remove(tick);
    lenis.destroy();
  };
}
