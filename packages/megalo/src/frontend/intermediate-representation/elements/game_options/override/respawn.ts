import type { OverrideEntryNode } from "src/frontend/abstract-syntax-tree/elements/game_options";
import { resolveSimpleNumber } from "src/frontend/intermediate-representation/elements/game_options/override/helpers";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";
import { setField } from "src/frontend/intermediate-representation/setField";

/** Returns true if `optionName` was handled as a respawn override. */
export const tryLowerRespawnOverride = (
  optionName: string,
  entry: OverrideEntryNode,
  ctx: ElementLowerContext
): boolean => {
  const { diagnostics, ir } = ctx;
  const respawn = ir.gameVariant.baseVariant.respawnOptions;

  switch (optionName) {
    case "loadout_selection_time": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        respawn,
        "loadoutCamTime",
        value.value,
        value.location,
        optionName
      );
      return true;
    }
    case "lives_per_round": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        respawn,
        "livesPerRound",
        value.value,
        value.location,
        optionName
      );
      return true;
    }
    case "team_lives_per_round": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        respawn,
        "teamLivesPerRound",
        value.value,
        value.location,
        optionName
      );
      return true;
    }
    case "respawn_time": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        respawn,
        "respawnTimeSeconds",
        value.value,
        value.location,
        optionName
      );
      return true;
    }
    case "suicide_respawn_penalty": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        respawn,
        "suicidePenaltySeconds",
        value.value,
        value.location,
        optionName
      );
      return true;
    }
    case "betrayal_respawn_penalty": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        respawn,
        "betrayalPenaltySeconds",
        value.value,
        value.location,
        optionName
      );
      return true;
    }
    case "respawn_time_growth": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        respawn,
        "respawnGrowthSeconds",
        value.value,
        value.location,
        optionName
      );
      return true;
    }
    case "respawn_traits_duration": {
      const value = resolveSimpleNumber(entry.value, ctx);
      setField(
        ir.locations,
        diagnostics,
        respawn,
        "respawnPlayerTraitsDurationSeconds",
        value.value,
        value.location,
        optionName
      );
      return true;
    }
    default:
      return false;
  }
};
