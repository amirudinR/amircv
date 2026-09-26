import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import styles from './Nav.module.css';

interface NavLink {
  id: string;
  label: string;
}

interface NavProps {
  links: NavLink[];
}

export function Nav({ links }: NavProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [activeId, setActiveId] = useState<string>(links[0]?.id ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuId = 'primary-navigation';

  // More opaque background once past the top fold
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-spy: mark the link whose section is in view
  useEffect(() => {
    const sections = links
      .map((link) => document.getElementById(link.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [links]);

  // Escape closes the mobile menu and returns focus to the toggle
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // Close the mobile menu when the layout returns to the desktop breakpoint
  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)');
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsOpen(false);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
    setActiveId(id);
    setIsOpen(false);
    // Keep focus out of the panel that just became hidden
    if (window.matchMedia('(max-width: 767px)').matches) {
      toggleRef.current?.focus();
    }
  };

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    setIsOpen(false);
  };

  const navClass = [styles.nav, isScrolled ? styles.scrolled : '']
    .filter(Boolean)
    .join(' ');
  const activeIndex = Math.max(0, links.findIndex((link) => link.id === activeId));
  const sectionProgress = links.length > 1 ? (activeIndex / (links.length - 1)) * 100 : 100;
  const progressStyle = { '--section-progress': `${sectionProgress}%` } as CSSProperties;
  const panelClass = [styles.panel, isOpen ? styles.open : '']
    .filter(Boolean)
    .join(' ');
  const toggleClass = [styles.toggle, isOpen ? styles.toggleOpen : '']
    .filter(Boolean)
    .join(' ');

  return (
    <header className={navClass}>
      <nav className={`container ${styles.inner}`} aria-label="Primary">
        <a href="#" className={styles.logo} onClick={handleLogoClick}>
           AR<span className={styles.logoDot}>.</span>
        </a>

        <ul className={styles.links}>
          {links.map((link) => {
            const isActive = link.id === activeId;
            return (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  className={`${styles.link} ${isActive ? styles.active : ''}`}
                  aria-current={isActive ? 'location' : undefined}
                  onClick={(event) => handleLinkClick(event, link.id)}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>

        <button
          ref={toggleRef}
          type="button"
          className={toggleClass}
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span className={styles.toggleBar} />
          <span className={styles.toggleBar} />
        </button>
        <span className={styles.sectionProgress} style={progressStyle} aria-hidden="true">
          <span className={styles.sectionProgressLabel}>
            {String(activeIndex + 1).padStart(2, '0')} / {String(links.length).padStart(2, '0')}
          </span>
          <span className={styles.sectionProgressTrack}>
            <span className={styles.sectionProgressFill} />
          </span>
        </span>
      </nav>

      <div id={menuId} className={panelClass} aria-hidden={!isOpen}>
        <ul className={styles.panelLinks}>
          {links.map((link) => {
            const isActive = link.id === activeId;
            return (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  className={`${styles.panelLink} ${isActive ? styles.active : ''}`}
                  aria-current={isActive ? 'location' : undefined}
                  tabIndex={isOpen ? undefined : -1}
                  onClick={(event) => handleLinkClick(event, link.id)}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
}
