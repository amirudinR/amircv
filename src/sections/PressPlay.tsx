import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';
import type { Profile } from '@/data/types';
import { Section } from '@/components/Section';
import { SceneBoundary } from '@/components/SceneBoundary';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useResolvedTheme } from '@/hooks/useTheme';
import { shouldRenderScene } from '@/lib/webgl';
import {
  GOOD_WINDOW_MS,
  IMPRESSIONS_PER_RUN,
  PERFECT_WINDOW_MS,
  RETURN_MS,
  VERDICT,
  descentFor,
  gradeRun,
  judge,
  platenTravel,
  scheduleRun,
  summariseRun,
  windowOpen,
  type Impression,
  type Timeline,
} from '@/lib/press';
import styles from './PressPlay.module.css';

const PressScene = lazy(() => import('@/three/PressScene'));

const LAST = IMPRESSIONS_PER_RUN - 1;

/** Beat after the last bite before the sheet is called done. */
const SETTLE_MS = 520;
/**
 * How far into the return the bed starts sliding to the next slot. Halfway, so
 * the move is finished before the next descent rather than sliding through it.
 */
const SLIDE_AT = RETURN_MS * 0.5;

/** Slot index from a run, used to place the platen and the prints. */
const SLOTS = Array.from({ length: IMPRESSIONS_PER_RUN }, (_, index) => index);

interface Run {
  id: number;
  /** Wall-clock ms at which each impression is due. */
  bites: number[];
  /** Resolved qualities, in order. Always a prefix: impressions cannot be skipped. */
  results: Impression[];
  /** The impression the platen is currently working on. */
  cursor: number;
  done: boolean;
}

/**
 * The press, drawn in flat CSS.
 *
 * Not a notice that the game needs 3D. The judgement is arithmetic over a
 * timestamp and needs no renderer at all, so a machine that cannot give us a
 * context gets the same game with the machine left out. It reads
 * `--travel` and `--open` from the stage, the same numbers the 3D scene
 * computes.
 */
function PressFallback({
  monogram,
  impressions,
  runId,
}: {
  monogram: string;
  impressions: Impression[];
  runId: number;
}) {
  return (
    <>
      <span className={styles.fbFrame} />
      <span className={styles.fbPlaten}>
        <span className={styles.fbPlatenMark}>{monogram}</span>
      </span>
      <span className={styles.fbRing} />
      <span className={styles.fbRingInner} />
      <ul className={styles.fbPrints}>
        {impressions.map((quality, index) => (
          <li
            key={`${runId}-${index}`}
            className={['fbPrint', `fbPrint_${quality}`].map((name) => styles[name]).join(' ')}
            style={{ '--slot': index } as CSSProperties}
          >
            {monogram}
          </li>
        ))}
      </ul>
    </>
  );
}

interface PressPlayProps {
  profile: Profile;
}

export function PressPlay({ profile }: PressPlayProps) {
  const reducedMotion = usePrefersReducedMotion();
  const theme = useResolvedTheme();
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const stampRef = useRef<HTMLButtonElement>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const runRef = useRef<Run | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const lastPointerRef = useRef(0);
  const [run, setRun] = useState<Run | null>(null);
  const [active, setActive] = useState(false);
  // The 3D scene is not mounted until the section is first approached: a second
  // WebGL context costs real memory on a page whose hero already owns one, and
  // most visitors never scroll this far.
  const [mounted3d, setMounted3d] = useState(false);
  const [sceneEnabled, setSceneEnabled] = useState(() => shouldRenderScene());

  // First letter of each of the first two words: "Amirudin Ridwan" -> "AR". The
  // same mark the hero's seal carries, so the section does not invent a second
  // identity for the same person.
  const monogram = useMemo(
    () =>
      profile.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase() || '·',
    [profile.name],
  );

  const commit = useCallback((next: Run | null) => {
    runRef.current = next;
    setRun(next);
  }, []);

  const start = useCallback(() => {
    const bites = scheduleRun(performance.now());
    const next: Run = { id: (runRef.current?.id ?? 0) + 1, bites, results: [], cursor: 0, done: false };
    commit(next);
    timelineRef.current = { running: true, biteAt: bites[0], descentMs: descentFor(0), slot: 0 };
    // The strike is a button, so Space already works once it holds focus. This
    // is the one focus change the game makes, and it follows a click.
    stampRef.current?.focus();
  }, [commit]);

  /**
   * Judge one press.
   *
   * Anything after the window is ignored rather than judged: the rAF loop
   * resolves the impression at the same deadline, and letting a late tap through
   * would record two impressions for one bite.
   */
  const strike = useCallback(() => {
    const current = runRef.current;
    const line = timelineRef.current;
    if (!current || !line?.running || current.done) return;

    const bite = current.bites[current.cursor];
    const now = performance.now();
    if (now < bite - descentFor(current.cursor)) return;
    if (now > bite + GOOD_WINDOW_MS) return;

    commit({ ...current, results: [...current.results, judge(now - bite)] });
  }, [commit]);

  /**
   * One control, two jobs: start a run when there is nothing to strike, strike
   * when there is. Split into two buttons it would read as two actions, and a
   * player would have to know which is live.
   */
  const act = useCallback(() => {
    const current = runRef.current;
    if (!current || current.done) start();
    else strike();
  }, [start, strike]);

  // The clock. One rAF for the whole run, writing to the DOM only through custom
  // properties, and only while a run is live.
  useEffect(() => {
    let frame = 0;

    const tick = () => {
      frame = requestAnimationFrame(tick);
      const current = runRef.current;
      const line = timelineRef.current;
      const stage = stageRef.current;

      if (!current || !line?.running) {
        if (stage) {
          stage.style.setProperty('--travel', '0');
          stage.style.setProperty('--open', '0');
          // Keep the last slot. The 3D platen damps to wherever the run ended and
          // stays there, so zeroing this would snap the CSS press back to the
          // first slot and leave the two renderers showing different machines.
          stage.style.setProperty('--slot-norm', ((line?.slot ?? 0) / LAST).toFixed(4));
        }
        return;
      }

      const now = performance.now();
      const bite = current.bites[current.cursor];
      const unresolved = current.results.length === current.cursor;

      if (unresolved) {
        if (now > bite + GOOD_WINDOW_MS) {
          // Nobody pulled the bar. Decided on a deadline rather than waiting for
          // a tap that is never coming.
          commit({ ...current, results: [...current.results, 'miss'] });
          return;
        }
      } else if (current.cursor < LAST) {
        if (now >= bite + SLIDE_AT) {
          const cursor = current.cursor + 1;
          commit({ ...current, cursor });
          line.slot = cursor;
          line.biteAt = current.bites[cursor];
          line.descentMs = descentFor(cursor);
          return;
        }
      } else if (now >= bite + RETURN_MS + SETTLE_MS) {
        line.running = false;
        commit({ ...current, done: true });
        return;
      }

      if (stage) {
        stage.style.setProperty(
          '--travel',
          platenTravel(now, line.biteAt, line.descentMs, reducedMotion).toFixed(4),
        );
        stage.style.setProperty('--open', windowOpen(now, line.biteAt, reducedMotion).toFixed(3));
        // The CSS press slides on a slot index; the 3D one damps towards it
        // inside the render loop instead, because it has a frame to do it in.
        stage.style.setProperty('--slot-norm', (line.slot / LAST).toFixed(4));
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [commit, reducedMotion]);

  // A run pauses when the section scrolls away, by sliding every remaining bite
  // forward by however long the reader was gone. Reading on a phone should not
  // cost you the run.
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const now = performance.now();
        if (entry.isIntersecting) {
          setActive(true);
          setMounted3d(true);
          if (pausedAtRef.current !== null) {
            const shift = now - pausedAtRef.current;
            pausedAtRef.current = null;
            const current = runRef.current;
            if (current && !current.done) {
              commit({ ...current, bites: current.bites.map((b) => b + shift) });
              if (timelineRef.current) timelineRef.current.biteAt += shift;
            }
          }
        } else {
          setActive(false);
          if (runRef.current && !runRef.current.done) pausedAtRef.current = now;
        }
      },
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [commit]);

  const live = useMemo(() => (run && run.results.length > 0 ? summariseRun(run.results) : null), [run]);
  const summary = useMemo(() => (run?.done ? gradeRun(run.results) : null), [run]);
  // The chip belongs to the run in progress; once the sheet is done the grade
  // line below it says something more useful than "Good" ever could.
  const lastVerdict =
    run && !run.done && run.results.length > 0 ? run.results[run.results.length - 1] : null;
  const score = summary?.score ?? live?.score ?? 0;
  const max = summary?.max ?? live?.max ?? 0;
  const nextSlot = run?.results.length ?? 0;

  /**
   * Judged on pointerdown, not click: a click waits for release and the whole
   * judgement is a 110 ms window. Touch is excluded there on purpose — a finger
   * landing on the control while the page is still coasting from a scroll would
   * strike the press by accident — so touch goes through `click` instead.
   */
  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    lastPointerRef.current = performance.now();
    act();
  };

  const handleClick = () => {
    // A mouse press already acted in pointerdown; this is its trailing click.
    // The window is generous because it also has to survive a synthetic click
    // from assistive tech, which must not be swallowed by an unrelated mouse
    // press a moment earlier.
    if (performance.now() - lastPointerRef.current < 700) return;
    act();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    // A held key repeats, and a repeat is not a second press on the bar.
    if (event.repeat) return;
    // Also suppresses the native click, so keys cannot double-strike and Space
    // does not scroll the page while the press has focus.
    event.preventDefault();
    act();
  };

  const use3d = sceneEnabled && mounted3d;

  return (
    <Section id="press" eyebrow="06 — The press" title="Ink Press, five impressions">
      <div className={styles.layout} ref={sectionRef}>
        <div className={styles.stage} ref={stageRef}>
          {use3d ? (
            <SceneBoundary
              fallback={<PressFallback monogram={monogram} impressions={run?.results ?? []} runId={run?.id ?? 0} />}
              onError={() => setSceneEnabled(false)}
            >
              <Suspense
                fallback={<PressFallback monogram={monogram} impressions={run?.results ?? []} runId={run?.id ?? 0} />}
              >
                <PressScene
                  monogram={monogram}
                  reducedMotion={reducedMotion}
                  running={run !== null && !run.done}
                  timeline={timelineRef}
                  impressions={run?.results ?? []}
                  runId={run?.id ?? 0}
                  active={active}
                  theme={theme}
                  onContextLost={() => setSceneEnabled(false)}
                />
              </Suspense>
            </SceneBoundary>
          ) : (
            <PressFallback monogram={monogram} impressions={run?.results ?? []} runId={run?.id ?? 0} />
          )}

          {lastVerdict && (
            <span
              className={[styles.chip, styles[`chip_${lastVerdict}`]].filter(Boolean).join(' ')}
              aria-hidden="true"
            >
              {VERDICT[lastVerdict]}
            </span>
          )}
        </div>

        <div className={styles.panel}>
          <p className={styles.intro}>
            A platen press pulls a type-metal seal onto paper. The bite is
            instant — land the strike as the seal touches the sheet and the mark
            prints deep, early or late and it prints light or crooked.
          </p>

          <dl className={styles.readout}>
            <div>
              <dt>Score</dt>
              <dd>
                {score}
                {max > 0 && <span className={styles.readoutMax}> / {max}</span>}
              </dd>
            </div>
            <div>
              <dt>Combo</dt>
              <dd>{live?.combo ?? 0}</dd>
            </div>
            <div>
              <dt>Impression</dt>
              <dd>
                {Math.min(nextSlot + (run && !run.done ? 1 : 0), IMPRESSIONS_PER_RUN)} / {IMPRESSIONS_PER_RUN}
              </dd>
            </div>
          </dl>

          <button
            ref={stampRef}
            type="button"
            className={styles.stamp}
            onPointerDown={handlePointerDown}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
          >
            {run?.done ? 'Print another run' : run ? 'Strike the press' : 'Start a print run'}
          </button>

          <p className={styles.hint}>
            Tap the control, or press <kbd>Space</kbd>. Within {PERFECT_WINDOW_MS} ms of
            the bite prints a perfect impression; {GOOD_WINDOW_MS} ms still takes.
          </p>

          {reducedMotion && (
            <p className={styles.motionNote}>
              Reduced motion is on, so the platen is stationary and the inner
              ring lights up when the bite opens. Strike then.
            </p>
          )}

          {/* The sheet as a record: legible at any size, and what the status
              line below actually describes. */}
          <ol className={styles.sheet} aria-label="Impressions this run">
            {SLOTS.map((index) => {
              const quality = run?.results[index];
              const isNext = index === nextSlot && run !== null && !run.done;
              const className = [
                styles.slot,
                quality ? styles[`slot_${quality}`] : styles.slotPending,
                isNext ? styles.slotNext : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <li key={index} className={className}>
                  <span className={styles.slotMark} aria-hidden="true">
                    {monogram}
                  </span>
                  <span className={styles.slotVerdict}>
                    {quality ? VERDICT[quality] : isNext ? 'Next' : '—'}
                  </span>
                </li>
              );
            })}
          </ol>

          <p className={styles.announce} aria-live="polite" aria-atomic="true">
            {summary
              ? `Run complete. ${summary.perfect} perfect, ${summary.good} good, ${summary.miss} missed. ` +
                `${summary.score} of ${summary.max}. ${summary.grade}. ${summary.note}`
              : lastVerdict && run
                ? `Impression ${run.results.length} of ${IMPRESSIONS_PER_RUN}, ${VERDICT[lastVerdict]}. ` +
                  `Score ${live?.score ?? 0}, combo ${live?.combo ?? 0}.`
                : ''}
          </p>

          {summary && (
            <p className={styles.grade}>
              <span className={styles.gradeTitle}>{summary.grade}</span>
              {summary.note}
            </p>
          )}
        </div>
      </div>
    </Section>
  );
}
