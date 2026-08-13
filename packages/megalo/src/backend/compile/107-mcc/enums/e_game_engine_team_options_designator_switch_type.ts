import { e_game_engine_team_options_designator_switch_type } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { DesignatorSwitchType } from "src/frontend/intermediate-representation/game/game_engine_default";

export const encodeDesignatorSwitchType = (
  value: DesignatorSwitchType
): e_game_engine_team_options_designator_switch_type => {
  switch (value) {
    case DesignatorSwitchType.None:
      return e_game_engine_team_options_designator_switch_type.none;
    case DesignatorSwitchType.Random:
      return e_game_engine_team_options_designator_switch_type.random;
    case DesignatorSwitchType.Rotate:
      return e_game_engine_team_options_designator_switch_type.rotate;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
