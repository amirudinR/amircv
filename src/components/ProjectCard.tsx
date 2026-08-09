import { useCallback, useMemo, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import type { Project } from '@/data/types';
import { Badge } from '@/components/Badge';
import { PhoneMockup } from '@/components/PhoneMockup';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import styles from './ProjectCard.module.css';

const MAX_TILT = 4;

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const reducedMotion = usePrefersReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [tilt, setTilt] = useState<{ rx: number; ry: number } | null>(null);
  const isTouch = useMemo(
    () => window.matchMedia('(hover: none), (pointer: coarse)').matches,
    [],
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (reducedMotion || isTouch || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      setTilt({ rx: -py * 2 * MAX_TILT, ry: px * 2 * MAX_TILT });
    },
    [reducedMotion, isTouch],
  );

  const handleMouseLeave = useCallback(() => setTilt(null), []);

  const style: CSSProperties = {
    transform: tilt
      ? `perspective(900px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`
      : 'perspective(900px) rotateX(0deg) rotateY(0deg)',
  };

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

      {project.mockupType && (
        <div className={styles.demo}>
          <PhoneMockup
            type={project.mockupType}
            size={project.featured ? 'md' : 'sm'}
          />
        </div>
      )}

      <p className={styles.summary}>{project.summary}</p>

      {project.featured && project.challenge && project.engineering && (
        <dl className={styles.caseStudy}>
          <div>
            <dt>Challenge</dt>
            <dd>{project.challenge}</dd>
          </div>
          <div>
            <dt>Engineering</dt>
            <dd>{project.engineering}</dd>
          </div>
        </dl>
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
    </article>
  );
}
