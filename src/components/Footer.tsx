import type { Profile, Social } from '@/data/types';
import { scrollToTarget } from '@/lib/gsap';
import styles from './Footer.module.css';

interface FooterProps {
  profile: Profile;
  socials: Social[];
}

export function Footer({ profile, socials }: FooterProps) {
  const year = new Date().getFullYear();

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
                  aria-label={`${social.platform}: ${social.label}`}
                  rel="noopener noreferrer"
                >
                  {social.platform}
                </a>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className={styles.topButton} onClick={() => scrollToTarget(0)}>
          Back to top ↑
        </button>
      </div>
    </footer>
  );
}
