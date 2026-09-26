import type { ExperienceItem } from '@/data/types';
import { Badge } from '@/components/Badge';
import styles from './TimelineItem.module.css';

interface TimelineItemProps {
  item: ExperienceItem;
  index: number;
}

export function TimelineItem({ item, index }: TimelineItemProps) {
  const period = `${item.start} — ${item.end ?? 'Present'}`;
  const isCurrent = item.end === null;

  return (
    <article
      className={`${styles.card} reveal`}
      data-current={isCurrent || undefined}
      style={{ transitionDelay: `${Math.min(index * 80, 400)}ms` }}
    >
      <div className={styles.inner}>
        <div className={styles.head}>
          <h3 className={styles.role}>{item.role}</h3>
          <p className={styles.period}>{period}</p>
        </div>

        <p className={styles.meta}>
          <span className={styles.company}>{item.company}</span>
          <span className={styles.location}>{item.location}</span>
          {isCurrent && (
            <span className={styles.current}>
              Current role
            </span>
          )}
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
      </div>
    </article>
  );
}
