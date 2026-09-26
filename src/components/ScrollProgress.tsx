import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import styles from './ScrollProgress.module.css';

export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    if (reducedMotion) {
      const update = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        gsap.set(bar, { scaleX: max > 0 ? window.scrollY / max : 0 });
      };
      update();
      window.addEventListener('scroll', update, { passive: true });
      return () => window.removeEventListener('scroll', update);
    }

    const tween = gsap.fromTo(
      bar,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.15,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reducedMotion]);

  return (
    <div className={styles.track} aria-hidden="true">
      <div ref={barRef} className={styles.bar} />
    </div>
  );
}
