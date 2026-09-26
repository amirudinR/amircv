import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Profile, Social } from '@/data/types';
import { gsap } from '@/lib/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useMagnetic } from '@/hooks/useMagnetic';
import { SceneBoundary } from '@/components/SceneBoundary';
import { AnimatedBeam, type AnimatedBeamNode } from '@/components/AnimatedBeam';
import { PaperStamp } from '@/components/PaperStamp';
import { shouldRenderScene } from '@/lib/webgl';
import styles from './Hero.module.css';

const HeroScene = lazy(() => import('@/three/HeroScene'));

/** Wide enough for the ink plate to carry the right-hand column. */
const WIDE_QUERY = '(min-width: 768px)';

/**
 * Checked against the Google Play developer listing: ten published apps, and
 * Equalizer as the only title with a public rating — 4.3 from 24 reviews and
 * 1K+ installs. Every entry is a number a reader can go and verify.
 */
const PROOF_POINTS = [
  { value: '10', label: 'Apps on Google Play' },
  { value: '4.3', label: 'Equalizer rating' },
  { value: '1K+', label: 'Equalizer installs' },
  { value: '4+', label: 'Years in tech' },
];

interface FlowNode extends AnimatedBeamNode {
  /** Short claim shown in the caption under the diagram. */
  title: string;
}

const FLOW_NODES: FlowNode[] = [
  {
    id: 'local',
    label: 'Local',
    title: 'Local-first writes',
    detail:
      'SQLite and Room are the source of truth and the interface never blocks on a request, so a dead connection or a flat battery cannot lose a sale.',
  },
  {
    id: 'sync',
    label: 'Sync',
    title: 'Queued, idempotent handoff',
    detail:
      'Mutations go through a durable outbox and replay under an idempotency key, so a till can trade offline all morning and reconcile without duplicate invoices.',
  },
  {
    id: 'peripherals',
    label: 'Peripherals',
    title: 'Hardware as a first-class path',
    detail:
      'ESC/POS thermal printers, LED and camera modules, audio sessions and speech-to-text are driven natively, with invoices rendered locally when the backend is unreachable.',
  },
  {
    id: 'ai',
    label: 'AI',
    title: 'AI where it earns its place',
    detail:
      'n8n and agentic workflows clear the boring edges — invoice extraction, WhatsApp order intake, report drafts — behind a review step, never silently in front of the user.',
  },
];

function isWideViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(WIDE_QUERY).matches;
}

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
  const printCtaRef = useMagnetic<HTMLButtonElement>();
  const [activeNodeId, setActiveNodeId] = useState<string>(FLOW_NODES[0].id);
  const [isSceneActive, setIsSceneActive] = useState(true);
  const [isWide, setIsWide] = useState(isWideViewport);
  // Decided once on mount: no WebGL, Save-Data, or a very low-spec device
  // keeps the static paper artwork instead of mounting a scene it can't run.
  const [sceneEnabled, setSceneEnabled] = useState(() => shouldRenderScene());
  // Below the breakpoint the plate is decorative at best and pure GPU cost at
  // worst, so the scene is not mounted there at all — the printed sheet, grid
  // and diagram carry the composition on their own.
  const mountScene = sceneEnabled && isWide;

  // Follow the breakpoint so a resize back to desktop restores the plate.
  useEffect(() => {
    const query = window.matchMedia(WIDE_QUERY);
    const sync = () => setIsWide(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  // Pause the WebGL loop whenever the hero leaves the viewport.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node || !mountScene) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsSceneActive(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [mountScene]);

  // Split name so the last word carries the letterpress accent.
  const nameParts = profile.name.trim().split(/\s+/);
  const lastWord = nameParts.pop() ?? profile.name;
  const firstWords = nameParts.join(' ');
  const activeNode = FLOW_NODES.find((node) => node.id === activeNodeId) ?? FLOW_NODES[0];

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Entrance sequence: availability → name → role → tagline → CTAs → socials →
  // proof strip → plate.
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

  // Scroll parallax: the type lifts off the page and only dissolves once it is
  // actually leaving, so the hero never sits as blank paper with only the
  // scene on it. The plate sinks slower, which reads as depth.
  useLayoutEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // Parallax is softened on narrow viewports.
      mm.add({ isMobile: '(max-width: 767px)' }, (mmCtx) => {
        const isMobile = mmCtx.conditions?.isMobile ?? false;

        gsap
          .timeline({
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          })
          .to(contentRef.current, { yPercent: isMobile ? -8 : -14, ease: 'power1.out' }, 0)
          .to(contentRef.current, { autoAlpha: 0, ease: 'power2.in' }, 0.62);

        gsap.to(bgRef.current, {
          yPercent: isMobile ? 4 : 10,
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
      {/* The paper ground. `isolation: isolate` on this layer keeps the canvas
          multiply blend inside the plate, so the type above it is never
          darkened by the scene. */}
      <div ref={bgRef} className={styles.bg} aria-hidden="true">
        <div className={styles.vignette} />
        <div className={styles.grid} />
        <div className={styles.rings}>
          <span />
          <span />
          <span />
        </div>
        <div className={styles.canvas} aria-hidden="true">
          {mountScene && (
            <SceneBoundary fallback={null} onError={() => setSceneEnabled(false)}>
              <Suspense fallback={null}>
                <HeroScene
                  reducedMotion={reducedMotion}
                  active={isSceneActive}
                  onContextLost={() => setSceneEnabled(false)}
                />
              </Suspense>
            </SceneBoundary>
          )}
        </div>
      </div>

      <div ref={contentRef} className={`container ${styles.content}`}>
        <div className={styles.copy}>
          <p className={`eyebrow ${styles.availability}`} data-animate>
            <span className={styles.statusDot} aria-hidden="true" />
            {profile.availability}
          </p>

          <h1 className={styles.name} data-animate>
            {firstWords}
            <span className={`${styles.nameAccent} press`}>{lastWord}</span>
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
            <a ref={secondaryCtaRef} href="/resume.pdf" download className={styles.ctaSecondary}>
              Download CV
            </a>
            <button
              ref={printCtaRef}
              type="button"
              className={styles.ctaPrint}
              onClick={handlePrint}
            >
              Print / Save as PDF
            </button>
          </div>

          <div className={styles.socialRow} data-animate>
            <span className={styles.socialLabel}>Elsewhere</span>
            <ul className={styles.socials}>
              {socials.map((social) => (
                <li key={social.platform}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    aria-label={`${social.platform}: ${social.label}`}
                  >
                    {social.platform}
                  </a>
                </li>
              ))}
            </ul>
            {/* A stamp applies its own short legend rather than repeating the
                status line verbatim. Derived from the same data — no new claim —
                so it stays honest if `availability` is reworded. */}
            <PaperStamp className={styles.stamp}>
              {profile.availability.split(/\s+/).slice(0, 3).join(' ')}
            </PaperStamp>
          </div>

          <dl className={styles.proofStrip} data-animate aria-label="Career highlights">
            {PROOF_POINTS.map((point) => (
              <div key={point.label} className={styles.proofItem}>
                <dt>{point.label}</dt>
                <dd>{point.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className={styles.plate} data-animate>
          <AnimatedBeam
            nodes={FLOW_NODES}
            activeId={activeNodeId}
            onSelect={setActiveNodeId}
            label="How I build"
            className={styles.diagram}
          />
          {/* Mirrors the detail already carried by each node's accessible name,
              so it is decoration and must not be announced twice. */}
          <p className={styles.diagramNote} aria-hidden="true">
            <span className={styles.diagramNoteTitle}>{activeNode.title}</span>
            {activeNode.detail}
          </p>
        </div>
      </div>

      <div className={styles.scrollIndicator} aria-hidden="true">
        <span className={styles.scrollLabel}>Scroll</span>
        <span className={styles.scrollLine} />
      </div>
    </section>
  );
}
