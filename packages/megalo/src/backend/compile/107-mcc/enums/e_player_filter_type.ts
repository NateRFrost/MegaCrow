import { e_player_filter_type } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import {
  PlayerFilterType,
  type PlayerFilterType as PlayerFilterTypeName,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const PLAYER_FILTER_TYPE_TO_BLF = {
  [PlayerFilterType.no_one]: e_player_filter_type.no_one,
  [PlayerFilterType.everyone]: e_player_filter_type.everyone,
  [PlayerFilterType.allies]: e_player_filter_type.allies,
  [PlayerFilterType.enemies]: e_player_filter_type.enemies,
  [PlayerFilterType.player]: e_player_filter_type.specific_player,
  [PlayerFilterType.all]: e_player_filter_type.normal,
} as const satisfies Record<PlayerFilterTypeName, e_player_filter_type>;

export const encodePlayerFilterType = (
  value: PlayerFilterTypeName
): e_player_filter_type => mapMegaloEnum(value, PLAYER_FILTER_TYPE_TO_BLF);
