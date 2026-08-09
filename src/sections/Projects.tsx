import { Section } from '@/components/Section';
import { ProjectCard } from '@/components/ProjectCard';
import type { Project } from '@/data/types';
import styles from './Projects.module.css';

interface ProjectsProps {
  projects: Project[];
}

const STAGGER_STEP = 80;
const STAGGER_MAX = 400;

export function Projects({ projects }: ProjectsProps) {
  return (
    <Section id="projects" eyebrow="04 — Projects" title="Selected work">
      <div className={styles.grid}>
        {projects.map((project, index) => (
          <div
            key={project.id}
            className={`reveal ${styles.cell}${project.featured ? ` ${styles.cellFeatured}` : ''}`}
            style={{ transitionDelay: `${Math.min(index * STAGGER_STEP, STAGGER_MAX)}ms` }}
          >
            <ProjectCard project={project} />
          </div>
        ))}
      </div>

      <div className={`reveal ${styles.more}`}>
        <p className={styles.note}>
          A few highlights from recent work — more experiments and open-source
          projects live on my GitHub.
        </p>
        <a
          className={styles.moreLink}
          href="https://github.com/amirudinR"
          target="_blank"
          rel="noreferrer"
        >
          More on GitHub ↗
        </a>
      </div>
    </Section>
  );
}
