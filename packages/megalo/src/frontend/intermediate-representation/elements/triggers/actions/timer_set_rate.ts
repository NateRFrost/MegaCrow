import type { ASTParameterNode } from "../../../../abstract-syntax-tree/parameters";
import type { SourceCodeLocation } from "../../../../../diagnostics";
import { diagnosticMessages } from "../../../../../diagnostics/messages";
import {
  ActionType,
  GameEngineTimerRate,
  type Action,
} from "../../../game/megalogamengine/megalogamengine_actions";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "../../../parameters/context";
import { resolveCustomTimerReference } from "../../../parameters";
import { lowerFloatParam } from "../../../parameters/common";
import { requireParamCount } from "../helpers";

/**
 * MegaloEdit `timer_rate_from_real_rate`
 */
const TIMER_RATE_REALS = [
  0,
  0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3, 4, 5, 10,
  -0.1, -0.25, -0.5, -0.75, -1, -1.25, -1.5, -1.75, -2, -3, -4, -5, -10,
] as const;

/** Half the smallest adjacent gap in `TIMER_RATE_REALS` (0 ↔ 0.1). */
const TIMER_RATE_SNAP_WARN_DISTANCE = 0.05;

/** MegaloEdit nearest-neighbor over `TIMER_RATE_REALS` (ties keep earlier index). */
const timerRateFromRealRate = (
  real: number
): { rate: GameEngineTimerRate; used: number; distance: number } => {
  let bestIndex = 0;
  let bestDistSq = Number.POSITIVE_INFINITY;
  for (let i = 0; i < TIMER_RATE_REALS.length; i++) {
    const delta = real - TIMER_RATE_REALS[i]!;
    const distSq = delta * delta;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestIndex = i;
    }
  }
  return {
    rate: bestIndex as GameEngineTimerRate,
    used: TIMER_RATE_REALS[bestIndex]!,
    distance: Math.sqrt(bestDistSq),
  };
};

const parseTimerRate = (
  node: ASTParameterNode,
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): GameEngineTimerRate => {
  const real = lowerFloatParam(
    node,
    asParameterLoweringContext(ctx),
    "timer rate",
    location
  ).value;
  const { rate, used, distance } = timerRateFromRealRate(real);
  if (distance > TIMER_RATE_SNAP_WARN_DISTANCE) {
    ctx.diagnostics.addWarning(
      diagnosticMessages.timerRateSnapped(String(real), String(used)),
      node.location
    );
  }
  return rate;
};

export const lowerTimerSetRate = (
  parameters: ASTParameterNode[],
  ctx: ElementLowerContext,
  location: SourceCodeLocation
): Action => {
  requireParamCount(parameters, 2, location);
  return {
    type: ActionType.TimerSetRate,
    parameters: {
      timer: resolveCustomTimerReference(
        parameters[0]!,
        asParameterLoweringContext(ctx)
      ),
      rate: parseTimerRate(parameters[1]!, ctx, location),
    },
  };
};
