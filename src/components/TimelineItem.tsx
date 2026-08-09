import type { ExperienceItem } from '@/data/types';
import { Badge } from '@/components/Badge';
import styles from './TimelineItem.module.css';

interface TimelineItemProps {
  item: ExperienceItem;
  index: number;
}

export function TimelineItem({ item, index }: TimelineItemProps) {
  const period = `${item.start} — ${item.end ?? 'Present'}`;

  return (
    <article
      className={`${styles.card} reveal`}
      style={{ transitionDelay: `${Math.min(index * 80, 400)}ms` }}
    >
      <span className={styles.index} aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className={styles.topRow}>
        <h3 className={styles.role}>{item.role}</h3>
        <span className={styles.period}>{period}</span>
      </div>

      <p className={styles.meta}>
        {item.company} · {item.location}
      </p>

      <p className={styles.summary}>{item.summary}</p>

      {item.achievements.length > 0 && (
        <ul className={styles.achievements}>
          {item.achievements.map((achievement) => (
            <li key={achievement}>{achievement}</li>
          ))}
        </ul>
      )}

      {item.tech.length > 0 && (
        <div className={styles.tech}>
          {item.tech.map((name) => (
            <Badge key={name} label={name} level={1} />
          ))}
        </div>
      )}
    </article>
  );
}
