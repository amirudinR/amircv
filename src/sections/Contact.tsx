import { useEffect, useRef, useState } from 'react';
import type { Profile, Social } from '@/data/types';
import { Section } from '@/components/Section';
import { useMagnetic } from '@/hooks/useMagnetic';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
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
      try {
        textarea.select();
        return document.execCommand('copy');
      } finally {
        textarea.remove();
      }
    } catch {
      return false;
    }
  }
}

export function Contact({ profile, socials }: ContactProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const requestRef = useRef(0);
  const mailRef = useMagnetic<HTMLAnchorElement>(0.3);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    if (isPending) return;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setIsPending(true);
    const ok = await copyEmail(profile.email);
    if (requestRef.current !== requestId) return;
    setIsPending(false);
    setCopied(ok);
    setCopyError(!ok);
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      setCopyError(false);
    }, 3000);
  };

  return (
    <Section
      id="contact"
      eyebrow="06 — Contact"
      title="Let's build something"
      className={`${styles.contact} ${reducedMotion ? styles.reducedMotion : ''}`}
    >
      <div className={styles.ambient} aria-hidden="true" />
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
          <button
            type="button"
            className={styles.copyButton}
            onClick={handleCopy}
            disabled={isPending}
            aria-describedby="contact-copy-status"
          >
            {isPending ? 'Copying' : copied ? 'Copied' : copyError ? 'Retry copy' : 'Copy'}
          </button>
          <span id="contact-copy-status" className={styles.copyStatus} aria-live="polite">
            {copied
              ? 'Email address copied to clipboard.'
              : copyError
                ? 'Copy failed. Long-press the email address to copy it manually.'
                : ''}
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
