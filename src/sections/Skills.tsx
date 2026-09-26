import { useState } from 'react';
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

  // One predicate feeds both the `hidden` attribute on the cards and the counts
  // in the status line, so the narration can never describe a different set of
  // skills from the one on screen.
  const isCategoryVisible = (category: string) =>
    focusedCategory === null || focusedCategory === category;

  const visibleGroups = groups.filter((group) => isCategoryVisible(group.category));
  const visibleSkillCount = visibleGroups.reduce(
    (total, group) => total + group.skills.length,
    0,
  );

  const selectedGroup = groups.find((group) =>
    group.skills.some((skill) => skill.name === selectedSkill),
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
      {/* Announced, but only the state change that was asked for: the skill
          count. The previous copy also narrated the selected skill's group on
          every click, which `aria-pressed` on the button already conveys. */}
      <p className={styles.status} aria-live="polite" aria-atomic="true">
        {focusedCategory === null
          ? `${visibleSkillCount} skills across ${visibleGroups.length} areas`
          : `${focusedCategory} — ${visibleSkillCount} ${visibleSkillCount === 1 ? 'skill' : 'skills'}`}
      </p>
      <p className={styles.hint}>Pick a skill to mark it and lift the rest of its group.</p>
      <div className={styles.grid}>
        {groups.map((group) => {
          const isVisible = isCategoryVisible(group.category);

          return (
            <article
              key={group.category}
              hidden={!isVisible}
              className={`reveal ${styles.card}`}
            >
              <header className={styles.header}>
                <h3 className={styles.category}>{group.category}</h3>
                <span className={styles.index}>{group.skills.length} skills</span>
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
          );
        })}
      </div>
    </Section>
  );
}
