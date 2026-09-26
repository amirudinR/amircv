import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import styles from './RotatingText.module.css';

interface RotatingTextProps {
  items: string[];
  intervalMs?: number;
  className?: string;
}

/**
 * A decorative word/phrase that cycles through a list.
 *
 * Accessibility decisions, since this animates on a timer:
 * - No live region. A polite region firing every couple of seconds interrupts
 *   whatever the user is reading, and a rotation carries no state the user
 *   asked for. The announcement is dropped rather than throttled.
 * - The visual stack is `aria-hidden`; the full list is exposed once as static
 *   text, so the content survives for anyone reading linearly.
 * - The wrapper is focusable and pauses on hover *and* focus. WCAG 2.2.2 wants
 *   a pause control for motion that starts on its own; a hover-only pause is
 *   unreachable without a mouse, so the focus stop is the real control.
 * - The interval also stops while the tab is hidden, so a background tab is not
 *   burning frames to animate nothing.
 */
export function RotatingText({ items, intervalMs = 2600, className }: RotatingTextProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [tabHidden, setTabHidden] = useState(
    () => typeof document !== 'undefined' && document.hidden,
  );

  useEffect(() => {
    const onVisibilityChange = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  const rotating =
    !reducedMotion && !interacted && !tabHidden && items.length > 1 && intervalMs > 0;

  useEffect(() => {
    if (!rotating) return;
    const id = window.setInterval(() => {
      setActive((index) => (index + 1) % items.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [rotating, items.length, intervalMs]);

  // `items` is a prop, so a shorter list must not leave the stack with nothing
  // visible.
  const current = items.length > 0 ? active % items.length : 0;
  const rootClass = [styles.root, className].filter(Boolean).join(' ');

  return (
    <span
      className={rootClass}
      tabIndex={0}
      onMouseEnter={() => setInteracted(true)}
      onMouseLeave={() => setInteracted(false)}
      onFocus={() => setInteracted(true)}
      onBlur={() => setInteracted(false)}
    >
      <span className={styles.stack} aria-hidden="true">
        {items.map((item, index) => (
          <span
            key={item}
            className={`${styles.item}${index === current ? ` ${styles.itemActive}` : ''}`}
          >
            {item}
          </span>
        ))}
      </span>
      {/* The whole list, once, for anyone not watching the animation. */}
      <span className={styles.staticCopy}>{items.join(', ')}</span>
    </span>
  );
}
