import { useEffect, useMemo, useRef, useState } from 'react';
import { Section } from '@/components/Section';
import { RotatingText } from '@/components/RotatingText';
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

/**
 * True while the document is laid out for print.
 *
 * This matters because ScrollTrigger measures against `innerHeight`: a printed
 * page is far taller than the viewport, so every card counts as "in view" and
 * every counter starts its count-up. Whatever the print snapshot catches is
 * what lands on paper, so a 1.6s tween racing the print dialog can put "0+" in
 * a recruiter's hands. Matching print means the counters never start.
 */
function usePrintLayout(): boolean {
  const [printing, setPrinting] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('print').matches,
  );

  useEffect(() => {
    const mql = window.matchMedia('print');
    const sync = () => setPrinting(mql.matches);

    sync();
    mql.addEventListener('change', sync);
    // Chrome fires beforeprint ahead of generating the print layout, and the
    // media-query change event is not ordered consistently across engines.
    // Listening to both is the cheap way to be sure the counters are settled
    // before anything is snapshotted.
    window.addEventListener('beforeprint', sync);
    return () => {
      mql.removeEventListener('change', sync);
      window.removeEventListener('beforeprint', sync);
    };
  }, []);

  return printing;
}

interface StatCardProps {
  stat: Stat;
  reducedMotion: boolean;
  printing: boolean;
}

function StatCard({ stat, reducedMotion, printing }: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const parsed = useMemo(() => parseStatValue(stat.value), [stat.value]);

  // React owns the text. The tween reports a value; it never writes to the node,
  // so StrictMode's double mount cannot leave a stale frame behind and React
  // never has to fight a tween for ownership of the element.
  const [display, setDisplay] = useState(stat.value);

  useEffect(() => {
    // Nothing to animate: the authored string is already on screen, and it stays
    // the single source of truth for reduced motion, print and unparsed values.
    if (printing || reducedMotion || !parsed) return;

    const cardEl = cardRef.current;
    if (!cardEl) return;

    const counter = { n: 0 };
    let lastShown: number | null = null;

    const trigger = ScrollTrigger.create({
      trigger: cardEl,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          n: parsed.target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: () => {
            // One render per visible step rather than one per frame: "4+" has
            // five distinct values across the whole tween, so 60 renders a
            // second would be 57 wasted commits per card.
            const shown = Number(counter.n.toFixed(parsed.decimals));
            if (shown === lastShown) return;
            lastShown = shown;
            setDisplay(`${shown.toFixed(parsed.decimals)}${parsed.suffix}`);
          },
          // Land on the authored string, not on a re-formatted number.
          onComplete: () => setDisplay(stat.value),
        });
      },
    });

    return () => {
      trigger.kill();
      gsap.killTweensOf(counter);
      // A killed tween (print started, reduced motion toggled, unmounted) can
      // otherwise leave a mid-count number in state.
      setDisplay(stat.value);
    };
  }, [stat.value, parsed, reducedMotion, printing]);

  return (
    <div ref={cardRef} className={`reveal ${styles.statCard}`}>
      <span className={styles.statValue}>{display}</span>
      <span className={styles.statLabel}>{stat.label}</span>
    </div>
  );
}

/** Readable, stable key for a bio paragraph — the strings are unique. */
function paragraphId(text: string, index: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .split('-')
    .filter(Boolean)
    .slice(0, 5)
    .join('-');
  return slug || `bio-${index + 1}`;
}

const statsKicker = ['By the numbers', 'At a glance', 'In the ledger'];

export function About({ about }: { about: About }) {
  const reducedMotion = usePrefersReducedMotion();
  const printing = usePrintLayout();
  const gridRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const paragraphs = useMemo(
    () => about.bio.map((text, index) => ({ id: paragraphId(text, index), text })),
    [about.bio],
  );

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
          {paragraphs.map((paragraph) => (
            <p key={paragraph.id} className={`reveal ${styles.paragraph}`}>
              {paragraph.text}
            </p>
          ))}
          <aside className={`reveal ${styles.focus}`}>
            <p className={`eyebrow ${styles.focusLabel}`}>Current Focus</p>
            <p className={styles.focusText}>{about.currentFocus}</p>
          </aside>
        </div>
        <div ref={statsRef} className={styles.stats}>
          <p className={`reveal ${styles.statsKicker}`}>
            <RotatingText items={statsKicker} intervalMs={3400} />
          </p>
          {about.stats.map((stat) => (
            <StatCard
              key={stat.label}
              stat={stat}
              reducedMotion={reducedMotion}
              printing={printing}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}
