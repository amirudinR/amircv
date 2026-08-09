import { useLayoutEffect, useRef } from 'react';
import type { ExperienceItem } from '@/data/types';
import { Section } from '@/components/Section';
import { TimelineItem } from '@/components/TimelineItem';
import { gsap } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import styles from './Experience.module.css';

interface ExperienceProps {
  items: ExperienceItem[];
}

export function Experience({ items }: ExperienceProps) {
  const listRef = useRef<HTMLOListElement | null>(null);
  const progressRef = useRef<HTMLSpanElement | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Progress line scrubbed to scroll position through the timeline.
  useLayoutEffect(() => {
    if (reducedMotion) {
      gsap.set(progressRef.current, { scaleY: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        progressRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: listRef.current,
            start: 'top 70%',
            end: 'bottom 60%',
            scrub: 0.5,
          },
        },
      );
    }, listRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  // Light up each node dot as its card scrolls into view.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const entries = Array.from(list.querySelectorAll<HTMLLIElement>('li'));

    if (reducedMotion) {
      entries.forEach((entry) => entry.classList.add(styles.active));
      return;
    }

    const observer = new IntersectionObserver(
      (observed) => {
        observed.forEach((obs) => {
          if (obs.isIntersecting) {
            obs.target.classList.add(styles.active);
            observer.unobserve(obs.target);
          }
        });
      },
      { threshold: 0.35 },
    );

    entries.forEach((entry) => observer.observe(entry));
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <Section id="experience" eyebrow="03 — Experience" title="Where I've worked">
      <div className={styles.timeline}>
        <span className={styles.rail} aria-hidden="true" />
        <span ref={progressRef} className={styles.progress} aria-hidden="true" />

        <ol ref={listRef} className={styles.list}>
          {items.map((item, i) => (
            <li key={item.id} className={styles.entry}>
              <span className={styles.dot} aria-hidden="true" />
              <TimelineItem item={item} index={i} />
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
