import styles from './Badge.module.css';

interface BadgeProps {
  label: string;
  level?: 1 | 2 | 3;
}

export function Badge({ label, level = 1 }: BadgeProps) {
  const badgeClass = [
    styles.badge,
    level === 2 ? styles.level2 : '',
    level === 3 ? styles.level3 : '',
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={badgeClass}>{label}</span>;
}
