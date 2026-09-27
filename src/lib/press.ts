/**
 * Ink Press — the rules of the game, in one module.
 *
 * The 3D scene, the no-WebGL fallback, and the HUD all read the timeline from
 * here. If the judgement arithmetic lived in the section and the platen motion
 * in the scene, the two would agree only as long as nobody edited one of them.
 */

/** Impressions in one print run. */
export const IMPRESSIONS_PER_RUN = 5;

/**
 * How far the platen travels between rest and contact, in scene units.
 *
 * Sized so the seal face lands on the paper rather than through it: the sheet is
 * 0.06 thick with its top face at y=0.06, and the seal's underside rests at
 * y=0.86, so the bite is 0.8 of travel. The 3D geometry and this number are one
 * fact split across two files, so the arithmetic is written out here.
 */
export const PLATEN_TRAVEL = 0.8;

/** How long the platen takes to fall. Shortens every impression so the run ramps. */
const BASE_DESCENT_MS = 980;
const DESCENT_STEP_MS = 90;

/** Contact → platen back at rest. */
export const RETURN_MS = 540;
/** Rest between one impression and the next, for the bed to slide along. */
const GAP_MS = 430;
/** Pressing Start to the first bite, so the raise is seen before it is used. */
const LEAD_IN_MS = 820;

/** Half-widths of the judgement windows, in ms either side of the bite. */
export const PERFECT_WINDOW_MS = 110;
export const GOOD_WINDOW_MS = 265;

export type Impression = 'perfect' | 'good' | 'miss';

/**
 * The live timeline, held in a ref and mutated in place rather than put in
 * state: it changes every frame, and re-rendering React sixty times a second
 * to move a platen is how you make a 3D scene stutter.
 */
export interface Timeline {
  running: boolean
  /** Wall-clock ms at which the current impression is due to bite. */
  biteAt: number
  /** How long the current impression takes to fall. */
  descentMs: number
  /** Which slot on the sheet the platen is heading for. */
  slot: number
}

const IMPRESSION_SCORE: Record<Impression, number> = { perfect: 120, good: 60, miss: 0 };

/** Combo bonus per consecutive non-miss, capped so a long run cannot run away. */
const COMBO_STEP = 0.25;
const COMBO_CAP = 4;

export function descentFor(index: number): number {
  return BASE_DESCENT_MS - DESCENT_STEP_MS * index;
}

/** Bite times, in wall-clock ms, for a run started at `startedAt`. */
export function scheduleRun(startedAt: number): number[] {
  const bites: number[] = [];
  let cursor = startedAt + LEAD_IN_MS;
  for (let i = 0; i < IMPRESSIONS_PER_RUN; i += 1) {
    bites.push(cursor);
    // The next bite has to clear this impression's return, the rest gap, and its
    // own descent, or the platen would still be falling when it is due.
    cursor += RETURN_MS + GAP_MS + descentFor(i);
  }
  return bites;
}

export function judge(errorMs: number): Impression {
  const error = Math.abs(errorMs);
  if (error <= PERFECT_WINDOW_MS) return 'perfect';
  if (error <= GOOD_WINDOW_MS) return 'good';
  return 'miss';
}

export function impressionScore(quality: Impression, comboBefore: number): number {
  const base = IMPRESSION_SCORE[quality];
  if (base === 0) return 0;
  return Math.round(base * (1 + Math.min(comboBefore, COMBO_CAP) * COMBO_STEP));
}

/** Every bite perfect. Used as the denominator for the run's progress bar. */
export function maxRunScore(count = IMPRESSIONS_PER_RUN): number {
  let total = 0;
  for (let i = 0; i < count; i += 1) total += impressionScore('perfect', i);
  return total;
}

export function summariseRun(results: Impression[]) {
  let score = 0;
  let combo = 0;
  let bestCombo = 0;
  let perfect = 0;
  let good = 0;
  let miss = 0;

  for (const quality of results) {
    score += impressionScore(quality, combo);
    if (quality === 'miss') {
      miss += 1;
      combo = 0;
    } else {
      if (quality === 'perfect') perfect += 1;
      else good += 1;
      combo += 1;
      if (combo > bestCombo) bestCombo = combo;
    }
  }

  return { score, max: maxRunScore(results.length), combo, bestCombo, perfect, good, miss };
}

const GRADES: { test: (r: ReturnType<typeof summariseRun>) => boolean; grade: string; note: string }[] = [
  {
    test: (r) => r.perfect === IMPRESSIONS_PER_RUN,
    grade: 'Master impression',
    note: 'Five perfect bites. The forme held its register for a whole run.',
  },
  {
    test: (r) => r.perfect >= 3,
    grade: 'Clean run',
    note: 'Mostly square on the sheet. A pressman would sign this one.',
  },
  {
    test: (r) => r.perfect + r.good >= 4,
    grade: 'Passable',
    note: 'Readable, if a little light in places. Ink would have needed topping up.',
  },
  {
    test: () => true,
    grade: 'Reprint needed',
    note: 'The forme drifted. Lock it down and pull another run.',
  },
];

export function gradeRun(results: Impression[]) {
  const summary = summariseRun(results);
  const entry = GRADES.find((candidate) => candidate.test(summary)) ?? GRADES[GRADES.length - 1];
  return { ...summary, grade: entry.grade, note: entry.note };
}

export const VERDICT: Record<Impression, string> = {
  perfect: 'Perfect',
  good: 'Good',
  miss: 'Miss',
};

/**
 * What the platen is doing, as a single number: 0 at rest, 1 in contact with the
 * sheet. Both renderers consume this, so the 3D platen and the CSS fallback can
 * never be out of step with the timing that judged you.
 *
 * Under reduced motion the descent is removed rather than slowed: a platen that
 * eases down is motion, and motion is what the preference is about. The platen
 * holds at rest and then *is* down, and the cue moves to the registration ring
 * (see `windowOpen`) so the bite is still readable.
 */
export function platenTravel(now: number, biteAt: number, descentMs: number, reducedMotion: boolean): number {
  if (reducedMotion) return now >= biteAt ? 1 : 0;

  const descendStart = biteAt - descentMs;
  if (now < descendStart) return 0;
  if (now < biteAt) return smoothstep((now - descendStart) / descentMs);
  if (now < biteAt + RETURN_MS) return 1 - smoothstep((now - biteAt) / RETURN_MS);
  return 0;
}

/** 1 when the judgement window is open, easing to 0 outside it. Drives the ring. */
export function windowOpen(now: number, biteAt: number, reducedMotion: boolean): number {
  if (reducedMotion) {
    // The whole cue: a discrete on/off band around the bite, which is the one
    // thing the player has to read.
    return Math.abs(now - biteAt) <= GOOD_WINDOW_MS ? 1 : 0;
  }
  // Otherwise a decaying pulse, so the ring can be seen tightening without
  // telling you which of the two rings you are aiming at.
  const since = now - biteAt;
  if (since < 0) return 0;
  return Math.max(0, 1 - since / (GOOD_WINDOW_MS * 2));
}

function smoothstep(t: number): number {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  return clamped * clamped * (3 - 2 * clamped);
}
