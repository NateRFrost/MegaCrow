import { e_player_model_choice } from "@blamnetwork/blf/haloreach/v11860_10_07_24_0147_omaha_release";
import {
  PlayerModelChoice,
  type PlayerModelChoice as PlayerModelChoiceName,
} from "src/frontend/intermediate-representation/game/game_engine_default";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const PLAYER_MODEL_CHOICE_TO_BLF = {
  [PlayerModelChoice.spartan]: e_player_model_choice.spartan,
  [PlayerModelChoice.elite]: e_player_model_choice.elite,
} as const satisfies Record<PlayerModelChoiceName, e_player_model_choice>;

export const encodePlayerModelChoice = (
  value: PlayerModelChoiceName
): e_player_model_choice => mapMegaloEnum(value, PLAYER_MODEL_CHOICE_TO_BLF);
