import type { ReactNode } from 'react';
import { useSectionReveal } from '@/hooks/useSectionReveal';
import styles from './Section.module.css';

interface SectionProps {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Section({ id, eyebrow, title, children, className }: SectionProps) {
  const sectionRef = useSectionReveal<HTMLElement>();

  const sectionClass = [styles.section, className].filter(Boolean).join(' ');

  return (
    <section id={id} ref={sectionRef} className={sectionClass}>
      <div className="container">
        <header className={styles.header}>
          <p className="eyebrow reveal">{eyebrow}</p>
          <h2 className={`reveal ${styles.title}`}>{title}</h2>
          <span className={`reveal ${styles.bar}`} aria-hidden="true" />
        </header>
        {children}
      </div>
    </section>
  );
}
