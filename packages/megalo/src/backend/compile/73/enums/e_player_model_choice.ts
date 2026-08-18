import { e_player_model_choice } from "@blamnetwork/blf/haloreach/v12065_11_08_24_1738_tu1actual";
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
