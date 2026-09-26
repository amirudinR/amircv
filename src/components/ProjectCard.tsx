import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import type { Project } from '@/data/types';
import { Badge } from '@/components/Badge';
import { PhoneMockup } from '@/components/PhoneMockup';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import styles from './ProjectCard.module.css';

const MAX_TILT = 2;

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [demoActive, setDemoActive] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const frameRef = useRef<number | null>(null);
  const pendingRef = useRef<{ rx: number; ry: number } | null>(null);
  const isTouch = useMemo(
    () => window.matchMedia('(hover: none), (pointer: coarse)').matches,
    [],
  );

  // Tilt is written to CSS variables so pointer movement never re-renders the
  // card subtree (which contains the interactive phone demo).
  const applyTilt = useCallback(() => {
    frameRef.current = null;
    const node = ref.current;
    const pending = pendingRef.current;
    if (!node || !pending) return;
    node.style.setProperty('--tilt-x', `${pending.rx.toFixed(2)}deg`);
    node.style.setProperty('--tilt-y', `${pending.ry.toFixed(2)}deg`);
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (reducedMotion || isTouch || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      pendingRef.current = { rx: -py * 2 * MAX_TILT, ry: px * 2 * MAX_TILT };
      frameRef.current ??= window.requestAnimationFrame(applyTilt);
    },
    [reducedMotion, isTouch, applyTilt],
  );

  const handleMouseLeave = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    pendingRef.current = null;
    const node = ref.current;
    node?.style.setProperty('--tilt-x', '0deg');
    node?.style.setProperty('--tilt-y', '0deg');
  }, []);

  useEffect(
    () => () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const style: CSSProperties = {
    '--tilt-x': '0deg',
    '--tilt-y': '0deg',
  } as CSSProperties;

  // A Google Play listing is a store link, not a live demo, and both fields
  // currently hold the same URL on store projects — so dedupe by href and
  // label each link for what it actually is.
  const links = [
    ...(project.storeUrl ? [{ href: project.storeUrl, label: 'Store' }] : []),
    ...(project.liveUrl && project.liveUrl !== project.storeUrl
      ? [{ href: project.liveUrl, label: 'Live site' }]
      : []),
    ...(project.repoUrl ? [{ href: project.repoUrl, label: 'Code' }] : []),
  ].filter(
    (link, index, all) => all.findIndex((other) => other.href === link.href) === index,
  );

  const proof = [
    project.rating,
    project.installs ? `${project.installs} installs` : undefined,
  ].filter(Boolean);

  return (
    <article
      ref={ref}
      className={`${styles.card}${project.featured ? ` ${styles.featured}` : ''}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {project.featured && <span className={styles.featuredTag}>Featured</span>}

      <div className={styles.header}>
        <h3 className={styles.title}>{project.title}</h3>
        <span className={styles.year}>{project.year}</span>
      </div>

      {proof.length > 0 && (
        <p className={styles.proof} title="Publicly listed on Google Play">
          {proof.join(' · ')}
        </p>
      )}

      <p className={styles.summary}>{project.summary}</p>

      {project.featured && (project.challenge || project.engineering) && (
        <details className={styles.caseDetails}>
          <summary>Explore engineering decisions</summary>
          <dl className={styles.caseStudy}>
            {project.challenge && (
              <div>
                <dt>Challenge</dt>
                <dd>{project.challenge}</dd>
              </div>
            )}
            {project.engineering && (
              <div>
                <dt>Engineering</dt>
                <dd>{project.engineering}</dd>
              </div>
            )}
          </dl>
        </details>
      )}

      {project.impact && project.impact.length > 0 && (
        <div className={styles.outcomes}>
          {project.featured && <p className={styles.outcomeLabel}>Outcome</p>}
          <ul className={styles.impact}>
            {project.impact.map((item) => (
              <li key={item}>
                <svg
                  className={styles.checkIcon}
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {project.tech.length > 0 && (
        <div className={styles.tech}>
          {project.tech.map((name) => (
            <Badge key={name} label={name} level={1} />
          ))}
        </div>
      )}

      {links.length > 0 && (
        <div className={styles.links}>
          {links.map((link) => (
            <a
              key={link.href}
              className={styles.link}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${project.title}: ${link.label} (opens in a new tab)`}
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      )}

      {project.mockupType && (
        <div
          className={`${styles.demo}${demoActive ? ` ${styles.demoActive}` : ''}`}
          tabIndex={0}
          role="group"
          aria-label={`Interactive demo: ${project.title}. Focus to explore the controls inside.`}
          onPointerEnter={() => setDemoActive(true)}
          onPointerLeave={() => setDemoActive(false)}
          onFocus={() => setDemoActive(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setDemoActive(false);
            }
          }}
        >
          <span className={styles.demoHint} aria-hidden="true">
            Interactive demo
          </span>
          <div className={styles.demoDevice} inert={!demoActive}>
            <PhoneMockup
              type={project.mockupType}
              size={project.featured ? 'md' : 'sm'}
            />
          </div>
        </div>
      )}
    </article>
  );
}
