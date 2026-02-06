/**
 * Reward target thresholds in POINTS (not percentage).
 * Target 1 = 0 points; Target 2 = 75+ points; … Target 10 = 98+ points.
 * User points are increased based on payout tier and trading activity.
 */
export declare const REWARD_TARGET_THRESHOLDS: readonly number[];
/** Default points for every user; progress scale starts at 25. */
export declare const MIN_POINTS_START = 25;
/** Max points used for progress bar scale (25–100). */
export declare const MAX_POINTS_FOR_DISPLAY = 100;
export declare const NUM_TARGETS: number;
//# sourceMappingURL=progress.config.d.ts.map