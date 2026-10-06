/**
 * The single source of truth for what a FOMO score *looks* like.
 *
 * Before this existed the thresholds had already drifted: the Radar feed
 * treated anything under 60 as "low", the hero demo used 50, and neither ever
 * showed green. One rule now, used by both, so the landing page can never
 * promise a colour the product doesn't deliver.
 *
 * The bands deliberately mirror the calibration anchors in lib/scoring.ts —
 * if those move, these move with them, or the colour stops meaning anything:
 *
 *   75-100  act on it      green
 *   50-74   context only   amber
 *   0-49    safely skip    red
 *
 * Green for high is the conventional read (green = this one is for you).
 * It also fixes a real complaint: a 72 shown in alarm-red looked urgent while
 * reading as "too low to bother", which is the worst of both signals.
 */
export type ScoreTone = "high" | "mid" | "low";

export const TONE_HIGH_MIN = 75;
export const TONE_MID_MIN = 50;

export function scoreTone(score: number | null | undefined): ScoreTone {
  if (score == null) return "mid";
  if (score >= TONE_HIGH_MIN) return "high";
  if (score >= TONE_MID_MIN) return "mid";
  return "low";
}

/** Convenience for className strings: `tone-high` | `tone-mid` | `tone-low`. */
export function toneClass(score: number | null | undefined): string {
  return `tone-${scoreTone(score)}`;
}
