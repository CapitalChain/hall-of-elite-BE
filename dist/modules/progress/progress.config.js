"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NUM_TARGETS = exports.MAX_POINTS_FOR_DISPLAY = exports.MIN_POINTS_START = exports.REWARD_TARGET_THRESHOLDS = void 0;
/**
 * Reward target thresholds in POINTS (not percentage).
 * Target 1 = 0 points; Target 2 = 75+ points; … Target 10 = 98+ points.
 * User points are increased based on payout tier and trading activity.
 */
exports.REWARD_TARGET_THRESHOLDS = [
    0, // Target 1
    75, // Target 2
    80, // Target 3
    85, // Target 4
    88, // Target 5
    90, // Target 6
    92, // Target 7
    94, // Target 8
    96, // Target 9
    98, // Target 10
];
/** Default points for every user; progress scale starts at 25. */
exports.MIN_POINTS_START = 25;
/** Max points used for progress bar scale (25–100). */
exports.MAX_POINTS_FOR_DISPLAY = 100;
exports.NUM_TARGETS = exports.REWARD_TARGET_THRESHOLDS.length;
//# sourceMappingURL=progress.config.js.map