import { useId } from 'react';
import type { CSSProperties } from 'react';
import styles from './PaperStamp.module.css';

interface PaperStampProps {
  /** The stamped words, e.g. "OPEN TO RELOCATION". */
  children: string;
  /** Slight rotation in degrees. Default something like -7. */
  tilt?: number;
  /** Visual weight. */
  tone?: 'accent' | 'muted';
  className?: string;
}

export function PaperStamp({ children, tilt = -7, tone = 'accent', className }: PaperStampProps) {
  // useId() emits characters that are not valid inside a url(#…) reference,
  // so reduce it to a plain token before it becomes an SVG filter id.
  const filterId = `stamp-ink-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const style = { '--stamp-tilt': `${tilt}deg`, filter: `url(#${filterId})` } as CSSProperties;
  const rootClass = [styles.stamp, className].filter(Boolean).join(' ');

  return (
    <span className={rootClass} style={style} data-tone={tone} aria-hidden="true">
      <svg className={styles.inkDefs} width="0" height="0" aria-hidden="true">
        <defs>
          <filter
            id={filterId}
            x="-2%"
            y="-9%"
            width="104%"
            height="118%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.42"
              numOctaves={2}
              seed={4}
              result="grain"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="grain"
              scale={1.9}
              xChannelSelector="R"
              yChannelSelector="G"
              result="torn"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.03 0.07"
              numOctaves={1}
              seed={21}
              result="pressure"
            />
            <feColorMatrix
              in="pressure"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
              result="coverage"
            />
            <feComponentTransfer in="coverage" result="ink">
              <feFuncA type="linear" slope="0.55" intercept="0.52" />
            </feComponentTransfer>
            <feComposite in="torn" in2="ink" operator="in" />
          </filter>
        </defs>
      </svg>
      <span className={styles.frame}>
        <span className={styles.rule}>
          <span className={styles.label} data-ink={children}>
            {children}
          </span>
        </span>
      </span>
    </span>
  );
}
