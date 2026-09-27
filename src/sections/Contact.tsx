import { useEffect, useRef, useState } from 'react';
import type { Profile, Social, WorkPreferences } from '@/data/types';
import { Section } from '@/components/Section';
import { useMagnetic } from '@/hooks/useMagnetic';
import styles from './Contact.module.css';

interface ContactProps {
  profile: Profile;
  socials: Social[];
  preferences: WorkPreferences;
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

export function Contact({ profile, socials, preferences }: ContactProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const requestRef = useRef(0);
  const mailRef = useMagnetic<HTMLAnchorElement>(0.3);

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
    <Section id="contact" eyebrow="07 — Contact" title="Let's build something" className={styles.contact}>
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.inner}>
        <p className={`reveal ${styles.statement}`}>
          Have a <span className={styles.accentWord}>project</span> in mind?
        </p>

        <p className={`reveal ${styles.lede}`}>
          {profile.availability}. Based in {profile.location} — happy to chat about new
          opportunities, collaborations, or just a good technical challenge.
        </p>

        {/* Relocation logistics live here rather than in a section of their own:
            they are part of the same conversation as "how do I reach you". */}
        <div className={`reveal ${styles.prefs}`}>
          <h3 className={styles.prefsHeading}>Practical details</h3>

          <dl className={styles.prefsList}>
            {preferences.items.map((item) => (
              <div key={item.label} className={styles.prefsRow}>
                <dt className={styles.prefsLabel}>{item.label}</dt>
                <dd className={styles.prefsValue}>{item.value}</dd>
              </div>
            ))}
          </dl>

          {preferences.note && (
            <p className={styles.prefsNote}>
              <span className={styles.prefsNoteLabel}>Note</span>
              {preferences.note}
            </p>
          )}
        </div>

        <div className={`reveal ${styles.emailRow}`}>
          <a ref={mailRef} href={`mailto:${profile.email}`} className={styles.mailButton}>
            <span className={styles.mailButtonLabel}>Email</span>
            <span className={styles.mailAddress}>{profile.email}</span>
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
              aria-label={`${social.platform}: ${social.label} (opens in a new tab)`}
            >
              <span className={styles.socialPlatform}>{social.platform}</span>
              <span className={styles.socialLabel}>{social.label}</span>
            </a>
          ))}
        </nav>

        <div className={`reveal ${styles.actions}`}>
          <a
            href="/resume.pdf"
            className={styles.resumeLink}
            aria-label="Download CV as a PDF file"
          >
            Download CV (PDF)
          </a>
          <button
            type="button"
            className={styles.printButton}
            onClick={() => window.print()}
            aria-label="Print this CV, or save it as a PDF from the print dialog"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>
    </Section>
  );
}
