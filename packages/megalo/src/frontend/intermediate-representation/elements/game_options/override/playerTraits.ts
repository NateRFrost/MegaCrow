import {
  type OverrideEntryNode,
  OverrideValueKind,
} from "src/frontend/abstract-syntax-tree/elements/game_options";
import { lowerPlayerTraitOptions } from "src/frontend/intermediate-representation/elements/game_options/player_traits";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

export const lowerPlayerTraitsOverride = (
  entry: OverrideEntryNode,
  ctx: ElementLowerContext
) => {
  if (entry.name.kind !== "player_traits_override") {
    return;
  }
  if (entry.value.kind !== OverrideValueKind.NESTED) {
    return;
  }
  const traits = lowerPlayerTraitOptions(
    entry.value.body.options,
    asParameterLoweringContext(ctx),
    entry.location
  );
  const map = ctx.ir.gameVariant.baseVariant.mapOverrideOptions;
  const respawn = ctx.ir.gameVariant.baseVariant.respawnOptions;
  switch (entry.name.option) {
    case "base_player_traits":
      map.basePlayerTraits = traits;
      break;
    case "red_powerup_traits":
      map.redPowerupTraits = traits;
      break;
    case "blue_powerup_traits":
      map.bluePowerupTraits = traits;
      break;
    case "yellow_powerup_traits":
      map.yellowPowerupTraits = traits;
      break;
    case "respawn_traits":
      respawn.respawnPlayerTraits = [traits];
      break;
  }
};
