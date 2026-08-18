import { e_game_engine_team_options_designator_switch_type } from "@blamnetwork/blf/haloreach/v12065_11_08_24_1738_tu1actual";
import { DesignatorSwitchType } from "src/frontend/intermediate-representation/game/game_engine_default";

export const encodeDesignatorSwitchType = (
  value: DesignatorSwitchType
): e_game_engine_team_options_designator_switch_type => {
  switch (value) {
    case DesignatorSwitchType.none:
      return e_game_engine_team_options_designator_switch_type.none;
    case DesignatorSwitchType.random:
      return e_game_engine_team_options_designator_switch_type.random;
    case DesignatorSwitchType.rotate:
      return e_game_engine_team_options_designator_switch_type.rotate;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
