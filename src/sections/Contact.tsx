import { useEffect, useRef, useState } from 'react';
import type { Profile, Social } from '@/data/types';
import { Section } from '@/components/Section';
import { useMagnetic } from '@/hooks/useMagnetic';
import styles from './Contact.module.css';

interface ContactProps {
  profile: Profile;
  socials: Social[];
}

async function copyEmail(email: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(email);
    return true;
  } catch {
    // Fallback for older browsers / non-secure contexts
    try {
      const textarea = document.createElement('textarea');
      textarea.value = email;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
}

export function Contact({ profile, socials }: ContactProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const mailRef = useMagnetic<HTMLAnchorElement>(0.3);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    const ok = await copyEmail(profile.email);
    if (!ok) return;
    setCopied(true);
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Section id="contact" eyebrow="06 — Contact" title="Let's build something" className={styles.contact}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.inner}>
        <p className={`reveal ${styles.statement}`}>
          Have a <span className={styles.accentWord}>project</span> in mind?
        </p>

        <p className={`reveal ${styles.lede}`}>
          {profile.availability} Based in {profile.location} — happy to chat about new
          opportunities, collaborations, or just a good technical challenge.
        </p>

        <div className={`reveal ${styles.emailRow}`}>
          <a ref={mailRef} href={`mailto:${profile.email}`} className={styles.mailButton}>
            {profile.email}
          </a>
          <button type="button" className={styles.copyButton} onClick={handleCopy}>
            {copied ? 'Copied ✓' : 'Copy'}
          </button>
          <span className={styles.srStatus} aria-live="polite">
            {copied ? 'Email address copied to clipboard' : ''}
          </span>
        </div>

        <nav className={`reveal ${styles.socials}`} aria-label="Social links">
          {socials.map((social) => (
            <a
              key={social.platform}
              href={social.url}
              target="_blank"
              rel="noreferrer"
              className={styles.socialLink}
            >
              {social.label}
            </a>
          ))}
        </nav>

        <a href="/resume.pdf" className={`reveal ${styles.resumeLink}`}>
          Download CV (PDF)
        </a>
      </div>
    </Section>
  );
}
