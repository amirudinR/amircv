import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * Observes `.reveal` elements inside the returned ref (and the ref element
 * itself) and adds `.is-visible` once when they enter the viewport.
 * With reduced motion, everything is revealed immediately.
 */
export function useSectionReveal<T extends HTMLElement = HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const targets: HTMLElement[] = [];
    if (root.classList.contains('reveal')) targets.push(root);
    root.querySelectorAll<HTMLElement>('.reveal').forEach((el) => targets.push(el));

    if (targets.length === 0) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      // Begin shortly before content enters the viewport. A low threshold also
      // prevents tall cards from remaining invisible when less than 15% can
      // fit on small screens.
      { threshold: 0.01, rootMargin: '0px 0px 160px 0px' },
    );

    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return ref;
}
