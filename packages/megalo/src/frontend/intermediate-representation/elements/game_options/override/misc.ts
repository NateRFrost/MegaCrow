import type { OverrideEntryNode } from "src/frontend/abstract-syntax-tree/elements/game_options";
import {
  resolveSimpleBoolean,
  resolveSimpleNumber,
  resolveTeamScoringMode,
} from "src/frontend/intermediate-representation/elements/game_options/override/helpers";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
import { setField } from "src/frontend/intermediate-representation/setField";

/** Returns true if `optionName` was handled as a misc override. */
export const tryLowerMiscOverride = (
  optionName: string,
  entry: OverrideEntryNode,
  ctx: ElementLowerContext
): boolean => {
  const { diagnostics, ir } = ctx;
  const base = ir.gameVariant.baseVariant;
  const misc = base.miscellaneousOptions;

  switch (optionName) {
    case "teams_enabled": {
      const value = resolveSimpleBoolean(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        misc,
        "teamsEnabled",
        value.value,
        value.location
      );
      return true;
    }
    case "fire_teams_enabled": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        ir.gameVariant,
        "fireTeamsEnabled",
        value.value,
        value.location
      );
      return true;
    }
    case "score_to_win_round": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        ir.gameVariant,
        "scoreToWinRound",
        value.value,
        value.location
      );
      return true;
    }
    case "team_scoring_mode": {
      const value = resolveTeamScoringMode(entry.value);
      setField(
        ir.locations,
        diagnostics,
        base,
        "teamScoringMethod",
        value.value,
        value.location
      );
      return true;
    }
    case "round_time_limit": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        misc,
        "roundTimeLimitMinutes",
        value.value,
        value.location
      );
      return true;
    }
    case "round_count": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        misc,
        "roundCount",
        value.value,
        value.location
      );
      return true;
    }
    case "early_victory_win_count": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        misc,
        "earlyVictoryWinCount",
        value.value,
        value.location
      );
      return true;
    }
    case "sudden_death_time_limit": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        misc,
        "suddenDeathTimeLimitSeconds",
        value.value,
        value.location
      );
      return true;
    }
    case "perfection_enabled": {
      const value = resolveSimpleBoolean(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        misc,
        "perfectionEnabled",
        value.value,
        value.location
      );
      return true;
    }
    case "grace_period_time_limit": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        misc,
        "gracePeriodTimeLimitSeconds",
        value.value,
        value.location
      );
      return true;
    }
    default:
      return false;
  }
};
