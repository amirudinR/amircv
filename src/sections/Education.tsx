import type { CSSProperties } from 'react';
import { Section } from '@/components/Section';
import type { EducationItem } from '@/data/types';
import styles from './Education.module.css';

interface EducationProps {
  items: EducationItem[];
}

export function Education({ items }: EducationProps) {
  return (
    <Section id="education" eyebrow="05 — Education" title="Education">
      <div className={styles.list}>
        {items.map((item, index) => (
          <article
            key={item.id}
            className={`reveal ${styles.row}`}
            style={{ transitionDelay: `${index * 80}ms` } as CSSProperties}
          >
            <div className={styles.inner}>
              <div className={styles.info}>
                <h3 className={styles.degree}>
                  {item.degree} in {item.field}
                </h3>
                <p className={styles.institution}>{item.institution}</p>
                {item.honors && (
                  <span className={styles.honors}>{item.honors}</span>
                )}
              </div>
              <span className={styles.period}>
                {item.start} — {item.end}
              </span>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
