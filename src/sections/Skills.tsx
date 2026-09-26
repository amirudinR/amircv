import { useState, type CSSProperties } from 'react';
import { Section } from '@/components/Section';
import { Badge } from '@/components/Badge';
import type { SkillGroup } from '@/data/types';
import styles from './Skills.module.css';

interface SkillsProps {
  groups: SkillGroup[];
}

export function Skills({ groups }: SkillsProps) {
  const [focusedCategory, setFocusedCategory] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const selectedGroup = groups.find((group) =>
    group.skills.some((skill) => skill.name === selectedSkill),
  );
  const visibleGroups =
    focusedCategory === null ? groups : groups.filter((group) => group.category === focusedCategory);
  const visibleSkillCount = visibleGroups.reduce(
    (total, group) => total + group.skills.length,
    0,
  );

  const handleCategoryChange = (category: string | null) => {
    setFocusedCategory(category);
    // Keep the selection meaningful: drop it when its card is filtered out.
    if (category !== null) {
      setSelectedSkill((current) => {
        if (current === null) return null;
        return groups.find((group) => group.category === category)?.skills.some(
          (skill) => skill.name === current,
        )
          ? current
          : null;
      });
    }
  };

  return (
    <Section id="skills" eyebrow="02 — Skills" title="What I work with">
      <div className={styles.filters} role="group" aria-label="Filter skill categories">
        <button
          type="button"
          aria-pressed={focusedCategory === null}
          onClick={() => handleCategoryChange(null)}
        >
          All expertise
        </button>
        {groups.map((group) => (
          <button
            key={group.category}
            type="button"
            aria-pressed={focusedCategory === group.category}
            onClick={() => handleCategoryChange(group.category)}
          >
            {group.category}
          </button>
        ))}
      </div>
      <p className={styles.selectionHelp} aria-live="polite">
        {focusedCategory === null
          ? `Showing all ${groups.length} expertise areas, ${visibleSkillCount} skills.`
          : `Showing ${focusedCategory}, ${visibleSkillCount} skills.`}
        {selectedGroup
          ? ` Same expertise group as ${selectedSkill}: ${selectedGroup.category}.`
          : ' Select a skill to highlight others in its group.'}
      </p>
      <div className={styles.grid}>
        {groups.map((group, index) => (
          <article
            key={group.category}
            hidden={focusedCategory !== null && focusedCategory !== group.category}
            className={`reveal ${styles.card}`}
            style={{ transitionDelay: `${index * 100}ms` } as CSSProperties}
          >
            <header className={styles.header}>
              <h3 className={styles.category}>{group.category}</h3>
              <span className={styles.index}>
                {group.skills.length} skills
              </span>
            </header>
            <ul className={styles.badges}>
              {group.skills.map((skill) => {
                const isSelected = selectedSkill === skill.name;
                const isRelated = selectedGroup?.category === group.category;
                const skillClass = [
                  styles.skill,
                  isSelected ? styles.skillSelected : '',
                  isRelated ? styles.skillRelated : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <li key={skill.name} className={styles.skillItem}>
                    <button
                      type="button"
                      className={skillClass}
                      aria-pressed={isSelected}
                      onClick={() => setSelectedSkill(isSelected ? null : skill.name)}
                    >
                      <Badge label={skill.name} level={skill.level} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  );
}
