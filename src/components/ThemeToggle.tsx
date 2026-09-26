import { useTheme } from '@/hooks/useTheme';
import styles from './ThemeToggle.module.css';

interface ThemeToggleProps {
  /** Merged onto the root button, so the nav can own the layout slot. */
  className?: string;
}

/**
 * Sun and moon are drawn rather than fetched: two extra network requests for
 * ~200 bytes of geometry would be a bad trade on a page whose largest asset is
 * the WebGL bundle. Hairline strokes match the construction-circle language of
 * the hero, so the control reads as part of the sheet.
 */
function SunIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.25" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2" />
      <path d="M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
    </svg>
  );
}

function MoonIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 14.6A8.6 8.6 0 019.4 3.5a8.6 8.6 0 1011.1 11.1z" />
    </svg>
  );
}

/**
 * The glyph shows the theme you would *get* by pressing it, not the one you are
 * in: a moon means pressing this turns the page dark. Combined with the
 * accessible name ("Switch to dark theme") that is unambiguous, where a
 * current-state icon reads as a status light and leaves the action a guess.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  const root = [styles.toggle, className].filter(Boolean).join(' ');

  return (
    <button type="button" className={root} onClick={toggle} aria-label={label} title={label} data-theme-state={theme}>
      <span className={styles.icon} aria-hidden="true">
        <SunIcon className={styles.sun} />
        <MoonIcon className={styles.moon} />
      </span>
    </button>
  );
}
