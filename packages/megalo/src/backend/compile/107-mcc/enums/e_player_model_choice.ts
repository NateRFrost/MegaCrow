import { e_player_model_choice } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { PlayerModelChoice } from "src/frontend/intermediate-representation/game/game_engine_default";

export const encodePlayerModelChoice = (
  value: PlayerModelChoice
): e_player_model_choice => {
  switch (value) {
    case PlayerModelChoice.Spartan:
      return e_player_model_choice.spartan;
    case PlayerModelChoice.Elite:
      return e_player_model_choice.elite;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
