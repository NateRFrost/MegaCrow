import { e_condition_type } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";
import {
  ConditionType,
  type ConditionType as ConditionTypeName,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_conditions";

const CONDITION_TYPE_TO_BLF = {
  [ConditionType.if]: e_condition_type.if,
  [ConditionType.object_in_area]: e_condition_type.object_in_area,
  [ConditionType.player_died]: e_condition_type.player_died,
  [ConditionType.team_disposition]: e_condition_type.team_disposition,
  [ConditionType.timer_expired]: e_condition_type.timer_expired,
  [ConditionType.object_is_type]: e_condition_type.object_is_type,
  [ConditionType.team_is_active]: e_condition_type.team_is_active,
  [ConditionType.object_out_of_bounds]: e_condition_type.object_out_of_bounds,
  [ConditionType.player_is_fire_team_leader]:
    e_condition_type.player_is_fire_team_leader,
  [ConditionType.player_assisted_with_kill]:
    e_condition_type.player_assisted_with_kill,
  [ConditionType.object_matches_filter]: e_condition_type.object_matches_filter,
  [ConditionType.player_is_active]: e_condition_type.player_is_active,
  [ConditionType.equipment_is_active]: e_condition_type.equipment_is_active,
  [ConditionType.player_is_spartan]: e_condition_type.player_is_spartan,
  [ConditionType.player_is_elite]: e_condition_type.player_is_elite,
  [ConditionType.player_is_editor]: e_condition_type.player_is_editor,
  [ConditionType.game_is_forge]: e_condition_type.game_is_forge,
} as const satisfies Record<ConditionTypeName, e_condition_type>;

export const encodeConditionType = (
  value: ConditionTypeName
): e_condition_type => mapMegaloEnum(value, CONDITION_TYPE_TO_BLF);
