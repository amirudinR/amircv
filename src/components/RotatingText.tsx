import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import styles from './RotatingText.module.css';

interface RotatingTextProps {
  items: string[];
  intervalMs?: number;
}

export function RotatingText({ items, intervalMs = 2600 }: RotatingTextProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reducedMotion || items.length < 2) return;
    const id = window.setInterval(() => {
      setActive((index) => (index + 1) % items.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [reducedMotion, items.length, intervalMs]);

  return (
    <span className={styles.stack}>
      {items.map((item, index) => (
        <span
          key={item}
          className={`${styles.item}${index === active ? ` ${styles.itemActive}` : ''}`}
          aria-hidden={index !== active}
        >
          {item}
        </span>
      ))}
    </span>
  );
}