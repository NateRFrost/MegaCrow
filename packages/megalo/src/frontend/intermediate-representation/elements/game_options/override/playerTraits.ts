import {
  type OverrideEntryNode,
  OverrideValueKind,
} from "src/frontend/abstract-syntax-tree/elements/game_options";
import { lowerPlayerTraitOptions } from "src/frontend/intermediate-representation/elements/game_options/player_traits";
import type { PlayerTraits } from "src/frontend/intermediate-representation/game/game_engine_player_traits";
import {
  asParameterLoweringContext,
  type ElementLowerContext,
} from "src/frontend/intermediate-representation/parameters/context";

const mergePlayerTraits = (
  base: PlayerTraits,
  overlay: PlayerTraits
): PlayerTraits => ({
  appearance: { ...base.appearance, ...overlay.appearance },
  movement: { ...base.movement, ...overlay.movement },
  sensors: { ...base.sensors, ...overlay.sensors },
  shieldVitality: { ...base.shieldVitality, ...overlay.shieldVitality },
  weapons: { ...base.weapons, ...overlay.weapons },
});

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
      map.basePlayerTraits = map.basePlayerTraits
        ? mergePlayerTraits(map.basePlayerTraits, traits)
        : traits;
      break;
    case "red_powerup_traits":
      map.redPowerupTraits = map.redPowerupTraits
        ? mergePlayerTraits(map.redPowerupTraits, traits)
        : traits;
      break;
    case "blue_powerup_traits":
      map.bluePowerupTraits = map.bluePowerupTraits
        ? mergePlayerTraits(map.bluePowerupTraits, traits)
        : traits;
      break;
    case "yellow_powerup_traits":
      map.yellowPowerupTraits = map.yellowPowerupTraits
        ? mergePlayerTraits(map.yellowPowerupTraits, traits)
        : traits;
      break;
    case "respawn_traits":
      respawn.respawnPlayerTraits = [
        respawn.respawnPlayerTraits?.[0]
          ? mergePlayerTraits(respawn.respawnPlayerTraits[0], traits)
          : traits,
      ];
      break;
  }
};
