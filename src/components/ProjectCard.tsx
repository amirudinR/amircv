import { useCallback, useEffect, useMemo, useRef } from 'react';
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

      {(project.liveUrl || project.repoUrl) && (
        <div className={styles.links}>
          {project.liveUrl && (
            <a
              className={styles.link}
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
            >
              Live ↗
            </a>
          )}
          {project.repoUrl && (
            <a
              className={styles.link}
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
            >
              Code ↗
            </a>
          )}
        </div>
      )}

      {project.mockupType && (
        <div className={styles.demo}>
          <PhoneMockup
            type={project.mockupType}
            size={project.featured ? 'md' : 'sm'}
          />
        </div>
      )}
    </article>
  );
}
