import type { CSSProperties } from 'react';
import { Section } from '@/components/Section';
import { Badge } from '@/components/Badge';
import type { SkillGroup } from '@/data/types';
import styles from './Skills.module.css';

interface SkillsProps {
  groups: SkillGroup[];
}

export function Skills({ groups }: SkillsProps) {
  return (
    <Section id="skills" eyebrow="02 — Skills" title="What I work with">
      <div className={styles.grid}>
        {groups.map((group, index) => (
          <article
            key={group.category}
            className={`reveal ${styles.card}`}
            style={{ transitionDelay: `${index * 100}ms` } as CSSProperties}
          >
            <header className={styles.header}>
              <h3 className={styles.category}>{group.category}</h3>
              <span className={styles.index} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
            </header>
            <div className={styles.badges}>
              {group.skills.map((skill) => (
                <Badge key={skill.name} label={skill.name} level={skill.level} />
              ))}
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
