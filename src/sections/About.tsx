import { useEffect, useRef } from 'react';
import { Section } from '@/components/Section';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { About, Stat } from '@/data/types';
import styles from './About.module.css';

interface ParsedStat {
  target: number;
  suffix: string;
  decimals: number;
}

/** Split values like "5+", "1.2k", "98%" into number + suffix. */
function parseStatValue(value: string): ParsedStat | null {
  const match = /^(\d+(?:\.\d+)?)(.*)$/.exec(value.trim());
  if (!match) return null;
  const numStr = match[1] ?? '';
  const target = Number.parseFloat(numStr);
  if (Number.isNaN(target)) return null;
  const decimals = numStr.includes('.') ? (numStr.split('.')[1]?.length ?? 0) : 0;
  return { target, suffix: match[2] ?? '', decimals };
}

interface StatCardProps {
  stat: Stat;
  reducedMotion: boolean;
}

function StatCard({ stat, reducedMotion }: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const cardEl = cardRef.current;
    const valueEl = valueRef.current;
    if (!cardEl || !valueEl) return;

    const parsed = parseStatValue(stat.value);

    // Reduced motion (or non-numeric value): show final value directly.
    if (reducedMotion || !parsed) {
      valueEl.textContent = stat.value;
      return;
    }

    const counter = { n: 0 };
    const render = () => {
      valueEl.textContent = `${counter.n.toFixed(parsed.decimals)}${parsed.suffix}`;
    };

    // Keep meaningful content visible before the card enters the viewport.
    // Starting at zero during page load made off-screen stats appear broken to
    // assistive technology and in snapshots.
    valueEl.textContent = stat.value;

    const trigger = ScrollTrigger.create({
      trigger: cardEl,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        counter.n = 0;
        render();
        gsap.to(counter, {
          n: parsed.target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: render,
          onComplete: () => {
            valueEl.textContent = stat.value;
          },
        });
      },
    });

    return () => {
      trigger.kill();
      gsap.killTweensOf(counter);
    };
  }, [stat.value, reducedMotion]);

  return (
    <div ref={cardRef} className={`reveal ${styles.statCard}`}>
      <span ref={valueRef} className={styles.statValue}>
        {stat.value}
      </span>
      <span className={styles.statLabel}>{stat.label}</span>
    </div>
  );
}

export function About({ about }: { about: About }) {
  const reducedMotion = usePrefersReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // Gentle parallax: stats column drifts slower. Desktop only.
  useEffect(() => {
    if (reducedMotion) return;
    const gridEl = gridRef.current;
    const statsEl = statsRef.current;
    if (!gridEl || !statsEl) return;

    const ctx = gsap.context(() => {
      gsap.matchMedia().add('(min-width: 900px)', () => {
        gsap.fromTo(
          statsEl,
          { y: 0 },
          {
            y: -30,
            ease: 'none',
            scrollTrigger: {
              trigger: gridEl,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        );
      });
    }, gridEl);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <Section id="about" eyebrow="01 — About" title="A bit about me">
      <div ref={gridRef} className={styles.grid}>
        <div className={styles.bio}>
          {about.bio.map((paragraph, index) => (
            <p key={index} className={`reveal ${styles.paragraph}`}>
              {paragraph}
            </p>
          ))}
          <aside className={`reveal ${styles.focus}`}>
            <p className={`eyebrow ${styles.focusLabel}`}>Current Focus</p>
            <p className={styles.focusText}>{about.currentFocus}</p>
          </aside>
        </div>
        <div ref={statsRef} className={styles.stats}>
          {about.stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} reducedMotion={reducedMotion} />
          ))}
        </div>
      </div>
    </Section>
  );
}
