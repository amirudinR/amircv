import { useCallback } from 'react';
import type { Profile, Social } from '@/data/types';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import styles from './Footer.module.css';

interface FooterProps {
  profile: Profile;
  socials: Social[];
}

export function Footer({ profile, socials }: FooterProps) {
  const reducedMotion = usePrefersReducedMotion();
  const year = new Date().getFullYear();

  const scrollToTop = useCallback(() => {
    const reduce =
      reducedMotion ||
      (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }, [reducedMotion]);

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <p className={styles.copy}>
          © {year} {profile.name}
        </p>

        {socials.length > 0 && (
          <ul className={styles.socials}>
            {socials.map((social) => (
              <li key={social.platform}>
                <a
                  className={styles.socialLink}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className={styles.topButton} onClick={scrollToTop}>
          Back to top ↑
        </button>
      </div>
    </footer>
  );
}
