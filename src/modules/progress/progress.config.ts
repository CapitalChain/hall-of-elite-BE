/**
 * Reward target thresholds in POINTS (not percentage).
 * Target 1 = 0 points; Target 2 = 75+ points; … Target 10 = 98+ points.
 * User points are increased based on payout tier and trading activity.
 */
export const REWARD_TARGET_THRESHOLDS: readonly number[] = [
  0,   // Target 1
  75,  // Target 2
  80,  // Target 3
  85,  // Target 4
  88,  // Target 5
  90,  // Target 6
  92,  // Target 7
  94,  // Target 8
  96,  // Target 9
  98,  // Target 10
] as const;

/** Default points for every user; progress scale starts at 25. */
export const MIN_POINTS_START = 25;

/** Max points used for progress bar scale (25–100). */
export const MAX_POINTS_FOR_DISPLAY = 100;

export const NUM_TARGETS = REWARD_TARGET_THRESHOLDS.length;
