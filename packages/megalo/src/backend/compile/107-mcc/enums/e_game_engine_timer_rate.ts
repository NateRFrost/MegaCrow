import { e_game_engine_timer_rate } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import {
  BUILT_IN_LOCATION,
  type Diagnostics,
  type SourceLocation,
} from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";

const RATE_MAGNITUDES = [
  10, 25, 50, 75, 100, 125, 150, 175, 200, 300, 400, 500, 1000,
] as const;

const RATE_BY_MAGNITUDE_MINUS: readonly e_game_engine_timer_rate[] = [
  e_game_engine_timer_rate.minus_10x,
  e_game_engine_timer_rate.minus_25x,
  e_game_engine_timer_rate.minus_50x,
  e_game_engine_timer_rate.minus_75x,
  e_game_engine_timer_rate.minus_100x,
  e_game_engine_timer_rate.minus_125x,
  e_game_engine_timer_rate.minus_150x,
  e_game_engine_timer_rate.minus_175x,
  e_game_engine_timer_rate.minus_200x,
  e_game_engine_timer_rate.minus_300x,
  e_game_engine_timer_rate.minus_400x,
  e_game_engine_timer_rate.minus_500x,
  e_game_engine_timer_rate.minus_1000x,
];

const RATE_BY_MAGNITUDE_PLUS: readonly e_game_engine_timer_rate[] = [
  e_game_engine_timer_rate._10x,
  e_game_engine_timer_rate._25x,
  e_game_engine_timer_rate._50x,
  e_game_engine_timer_rate._75x,
  e_game_engine_timer_rate._100x,
  e_game_engine_timer_rate._125x,
  e_game_engine_timer_rate._150x,
  e_game_engine_timer_rate._175x,
  e_game_engine_timer_rate._200x,
  e_game_engine_timer_rate._300x,
  e_game_engine_timer_rate._400x,
  e_game_engine_timer_rate._500x,
  e_game_engine_timer_rate._1000x,
];

const TIMER_RATE_SNAP_WARN_DISTANCE = 0.05;

const nearestMagnitudeIndex = (mag: number): number => {
  let best = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let i = 0; i < RATE_MAGNITUDES.length; i++) {
    const dist = Math.abs(RATE_MAGNITUDES[i]! - mag);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
};

/**
 * Map a source timer-rate multiplier to BLF `e_game_engine_timer_rate`.
 * Warns when the multiplier is snapped to a discrete wire step.
 */
export const encodeGameEngineTimerRate = (
  multiplier: number,
  diagnostics?: Diagnostics,
  location: SourceLocation = BUILT_IN_LOCATION
): e_game_engine_timer_rate => {
  const pct = -multiplier * 100;
  if (pct === 0) {
    return e_game_engine_timer_rate.zero;
  }
  const wireNegative = pct < 0;
  let mag = Math.round(Math.abs(pct));
  if (mag > 1000) {
    mag = 1000;
  }
  let idx = (RATE_MAGNITUDES as readonly number[]).indexOf(mag);
  if (idx < 0) {
    idx = nearestMagnitudeIndex(mag);
  }
  const snappedMag = RATE_MAGNITUDES[idx]!;
  const usedMultiplier =
    (multiplier < 0 ? -1 : multiplier > 0 ? 1 : 0) * (snappedMag / 100);
  if (
    diagnostics !== undefined &&
    Math.abs(multiplier - usedMultiplier) > TIMER_RATE_SNAP_WARN_DISTANCE
  ) {
    diagnostics.addWarning(
      diagnosticMessages.timerRateSnapped(
        String(multiplier),
        String(usedMultiplier)
      ),
      location
    );
  }
  return wireNegative
    ? RATE_BY_MAGNITUDE_MINUS[idx]!
    : RATE_BY_MAGNITUDE_PLUS[idx]!;
};
