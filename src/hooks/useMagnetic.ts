import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { gsap } from '@/lib/gsap';

const MAX_OFFSET = 6; // px

/**
 * Magnetic hover: element drifts toward the cursor (max ~6px) and springs
 * back elastically on leave. Skipped on touch devices / reduced motion.
 */
export function useMagnetic<T extends HTMLElement = HTMLElement>(
  strength = 0.3,
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const skip =
      window.matchMedia('(hover: none)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (skip) return;

    const clamp = (v: number) => Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, v * strength));
    const xTo = gsap.quickTo(el, 'x', { duration: 0.3, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.3, ease: 'power3' });

    const onMove = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const relX = event.clientX - (rect.left + rect.width / 2);
      const relY = event.clientY - (rect.top + rect.height / 2);
      xTo(clamp(relX));
      yTo(clamp(relY));
    };

    const onLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      gsap.killTweensOf(el);
    };
  }, [strength]);

  return ref;
}
