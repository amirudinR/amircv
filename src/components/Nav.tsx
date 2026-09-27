import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { scrollToTarget } from '@/lib/gsap';
import { ThemeToggle } from './ThemeToggle';
import styles from './Nav.module.css';

interface NavLink {
  id: string;
  label: string;
}

interface NavProps {
  links: NavLink[];
}

/** Bar height — keep in sync with `.inner` in Nav.module.css. */
const HEADER_HEIGHT = 68;
/** Reading line: just below the bar, so a section only becomes current once its
 *  heading has cleared the header. Matches the offset that anchor navigation
 *  lands sections at (`scroll-padding-top`), so a link you click lights up
 *  immediately. */
const READING_LINE = HEADER_HEIGHT + 24;
/** Within this many pixels of the bottom, the last link is always current. */
const BOTTOM_EPSILON = 2;
/** Scroll distance after which the bar switches to its opaque state. */
const SCROLLED_AT = 40;
/** Where the bar stops being a menu button. Keep in step with Nav.module.css. */
const DESKTOP_QUERY = '(min-width: 900px)';

export function Nav({ links }: NavProps) {
  const [activeId, setActiveId] = useState<string>(links[0]?.id ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuId = 'primary-navigation';

  // One passive, rAF-coalesced handler resolves both the opaque bar state and
  // the current section. No IntersectionObserver: with sections of wildly
  // different heights, "last entry to report wins" made the active link jump
  // around, and the final link rarely lit up at the bottom of the page.
  useEffect(() => {
    const ids = links.map((link) => link.id);
    if (ids.length === 0) return;

    let frame = 0;
    let disposed = false;
    // Cached in document space: a section's top only moves when the layout
    // above it reflows, not while the page scrolls.
    let entries: { id: string; top: number }[] = [];
    let pageHeight = 0;
    let stale = true;
    let scrolled = false;
    let currentId = activeId;

    const measure = () => {
      pageHeight = document.documentElement.scrollHeight;
      entries = ids
        .map((id) => {
          const element = document.getElementById(id);
          if (!element) return null;
          return { id, top: element.getBoundingClientRect().top + window.scrollY };
        })
        .filter((entry): entry is { id: string; top: number } => entry !== null);
    };

    const resolve = () => {
      frame = 0;
      if (stale) {
        measure();
        stale = false;
      }
      if (entries.length === 0) return;

      const y = window.scrollY;

      if ((y > SCROLLED_AT) !== scrolled) {
        scrolled = y > SCROLLED_AT;
        setIsScrolled(scrolled);
      }

      const maxScroll = Math.max(0, pageHeight - window.innerHeight);
      let next: string;
      if (y >= maxScroll - BOTTOM_EPSILON) {
        // The last section is followed by the footer, so its heading can sit
        // above the reading line while it is still fully in view. At the
        // bottom of the page, the final link is the honest answer.
        next = entries[entries.length - 1].id;
      } else {
        // Last section whose top has reached the reading line. Independent of
        // section heights, and always defined.
        const line = y + READING_LINE;
        next = entries[0].id;
        for (const entry of entries) {
          if (entry.top > line) break;
          next = entry.id;
        }
      }

      // Only re-render when the answer actually changed.
      if (next !== currentId) {
        currentId = next;
        setActiveId(next);
      }
    };

    const schedule = () => {
      if (!disposed && frame === 0) frame = requestAnimationFrame(resolve);
    };
    const invalidate = () => {
      stale = true;
      schedule();
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', invalidate, { passive: true });

    // The page reflows after load — web fonts swap, the lazy WebGL hero mounts,
    // media decodes. A stale cached height is the usual reason the last link
    // never lights up, so re-measure whenever the document resizes.
    const observer = new ResizeObserver(invalidate);
    observer.observe(document.documentElement);
    observer.observe(document.body);
    void document.fonts?.ready.then(invalidate);

    resolve();

    return () => {
      disposed = true;
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', invalidate);
      observer.disconnect();
    };
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

  // Close the mobile menu when the layout returns to the desktop breakpoint.
  // Must stay in step with the same breakpoint in Nav.module.css, which is why
  // it is named rather than inlined at both ends.
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsOpen(false);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (target) scrollToTarget(target);
    setIsOpen(false);
    // The panel just collapsed and took focus with it, so hand focus back.
    if (isOpen) toggleRef.current?.focus();
  };

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    scrollToTarget(0);
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

        <ThemeToggle className={styles.themeToggle} />

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

      {/* `inert` on the collapsed panel does what the hand-rolled tabIndex
          bookkeeping did, and more: the links leave the tab order *and* the
          accessibility tree. `visibility: hidden` covers browsers without
          `inert`, so `aria-hidden` is not needed on top of either. */}
      <div id={menuId} className={panelClass} inert={!isOpen}>
        <ul className={styles.panelLinks}>
          {links.map((link) => {
            const isActive = link.id === activeId;
            return (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  className={`${styles.panelLink} ${isActive ? styles.active : ''}`}
                  aria-current={isActive ? 'location' : undefined}
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
