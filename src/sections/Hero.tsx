import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Profile, Social } from '@/data/types';
import { gsap } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useMagnetic } from '@/hooks/useMagnetic';
import styles from './Hero.module.css';

const HeroScene = lazy(() => import('@/three/HeroScene'));

const PROOF_POINTS = [
  { value: '4+', label: 'Published apps' },
  { value: '4.6', label: 'Google Play rating' },
  { value: 'Offline-first', label: 'Core specialty' },
  { value: 'Worldwide', label: 'Open to relocation' },
];

const ARCHITECTURE_NODES = [
  {
    id: 'local',
    label: 'LOCAL',
    title: 'Local-first foundation',
    detail: 'Interfaces stay useful close to the user, with clear boundaries for offline work and device state.',
    position: 'nodeLocal',
  },
  {
    id: 'sync',
    label: 'SYNC',
    title: 'Resilient sync layer',
    detail: 'Changes are shaped for reliable handoff between local state and connected services.',
    position: 'nodeSync',
  },
  {
    id: 'cloud',
    label: 'CLOUD',
    title: 'Connected services',
    detail: 'Cloud capabilities extend the product without hiding the experience behind infrastructure.',
    position: 'nodeCloud',
  },
  {
    id: 'ai',
    label: 'AI',
    title: 'Useful intelligence',
    detail: 'AI appears where it removes friction, with human-readable states and deliberate fallbacks.',
    position: 'nodeAi',
  },
] as const;

interface HeroProps {
  profile: Profile;
  socials: Social[];
}

export function Hero({ profile, socials }: HeroProps) {
  const reducedMotion = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const primaryCtaRef = useMagnetic<HTMLAnchorElement>();
  const secondaryCtaRef = useMagnetic<HTMLAnchorElement>();
  const [activeNodeId, setActiveNodeId] = useState<(typeof ARCHITECTURE_NODES)[number]['id']>('local');
  const [isSceneActive, setIsSceneActive] = useState(true);

  // Pause the WebGL loop whenever the hero leaves the viewport.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSceneActive(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Split name so the last word carries the gradient accent.
  const nameParts = profile.name.trim().split(/\s+/);
  const lastWord = nameParts.pop() ?? profile.name;
  const firstWords = nameParts.join(' ');
  const activeNode = ARCHITECTURE_NODES.find((node) => node.id === activeNodeId) ?? ARCHITECTURE_NODES[0];

  // Entrance sequence: eyebrow → name → role → tagline → CTAs → socials.
  useEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-animate]',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.12,
          delay: 0.2,
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  // Scroll parallax: content drifts up + fades, background sinks slower.
  useLayoutEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // Parallax is softened on narrow viewports.
      mm.add({ isMobile: '(max-width: 767px)' }, (mmCtx) => {
        const isMobile = mmCtx.conditions?.isMobile ?? false;

        gsap.to(contentRef.current, {
          yPercent: isMobile ? -8 : -15,
          autoAlpha: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });

        gsap.to(bgRef.current, {
          yPercent: isMobile ? 10 : 20,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section id="home" ref={sectionRef} className={styles.hero}>
      <div ref={bgRef} className={styles.bg}>
        <div className={styles.gradient} aria-hidden="true" />
        <div className={styles.grid} aria-hidden="true" />
        <div className={`${styles.aurora} ${styles.auroraOne}`} aria-hidden="true" />
        <div className={`${styles.aurora} ${styles.auroraTwo}`} aria-hidden="true" />
        <div className={styles.signalRings} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
         <div className={styles.canvas} aria-hidden="true">
           <Suspense fallback={null}>
             <HeroScene reducedMotion={reducedMotion} active={isSceneActive} />
           </Suspense>
         </div>
       </div>

      <div ref={contentRef} className={`container ${styles.content}`}>
        <p className={`eyebrow ${styles.eyebrowRow}`} data-animate>
          <span className={styles.statusDot} aria-hidden="true" />
          {profile.availability}
        </p>

        <h1 className={styles.name} data-animate>
          {firstWords && <>{firstWords} </>}
          <span className={styles.nameAccent}>{lastWord}</span>
        </h1>

        <p className={styles.role} data-animate>
          {profile.role}
        </p>

        <p className={styles.tagline} data-animate>
          {profile.tagline}
        </p>

        <div className={styles.ctas} data-animate>
          <a ref={primaryCtaRef} href="#projects" className={styles.ctaPrimary}>
            View Projects
          </a>
          <a
            ref={secondaryCtaRef}
            href="/resume.pdf"
            download
            className={styles.ctaSecondary}
          >
            Download CV
          </a>
        </div>

        <ul className={styles.socials} data-animate>
          {socials.map((social) => (
            <li key={social.platform}>
              <a
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className={styles.socialLink}
                aria-label={`${social.platform}: ${social.label}`}
              >
                {social.label}
              </a>
            </li>
          ))}
        </ul>

        <dl className={styles.proofStrip} data-animate aria-label="Career highlights">
          {PROOF_POINTS.map((point) => (
            <div key={point.label} className={styles.proofItem}>
              <dt>{point.label}</dt>
              <dd>{point.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div
        className={styles.architecture}
        role="group"
        aria-label="Illustrative product architecture"
      >
        <div className={styles.architectureLine} aria-hidden="true" />
        <p className={styles.architectureLabel}>Illustrative architecture</p>
        <div className={styles.nodeMap} role="group" aria-label="Architecture layers">
          {ARCHITECTURE_NODES.map((node) => (
            <button
              key={node.id}
              type="button"
              className={`${styles.architectureNode} ${styles[node.position]} ${node.id === activeNodeId ? styles.nodeActive : ''}`}
              aria-pressed={node.id === activeNodeId}
              aria-controls="hero-architecture-detail"
              onClick={() => setActiveNodeId(node.id)}
            >
              <span className={styles.nodeDot} aria-hidden="true" />
              <span>{node.label}</span>
            </button>
          ))}
        </div>
        <div id="hero-architecture-detail" className={styles.detailPanel} aria-live="polite">
          <span className="eyebrow">{activeNode.label}</span>
          <strong>{activeNode.title}</strong>
          <p>{activeNode.detail}</p>
        </div>
      </div>

      <div className={styles.scrollIndicator} aria-hidden="true">
        <span className={styles.scrollLabel}>Scroll</span>
        <span className={styles.scrollLine} />
      </div>
    </section>
  );
}
