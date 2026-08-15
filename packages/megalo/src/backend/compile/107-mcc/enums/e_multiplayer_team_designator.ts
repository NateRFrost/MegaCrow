import { e_multiplayer_team_designator } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import {
  MultiplayerTeamDesignator,
  type MultiplayerTeamDesignator as MultiplayerTeamDesignatorName,
} from "src/frontend/intermediate-representation/game/game_engine_default";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const MULTIPLAYER_TEAM_DESIGNATOR_TO_BLF = {
  [MultiplayerTeamDesignator.none]: e_multiplayer_team_designator.none,
  [MultiplayerTeamDesignator.defenders]:
    e_multiplayer_team_designator.defenders,
  [MultiplayerTeamDesignator.attackers]:
    e_multiplayer_team_designator.attackers,
  [MultiplayerTeamDesignator.third_party]:
    e_multiplayer_team_designator.third_party,
  [MultiplayerTeamDesignator.fourth_party]:
    e_multiplayer_team_designator.fourth_party,
  [MultiplayerTeamDesignator.fifth_party]:
    e_multiplayer_team_designator.fifth_party,
  [MultiplayerTeamDesignator.sixth_party]:
    e_multiplayer_team_designator.sixth_party,
  [MultiplayerTeamDesignator.seventh_party]:
    e_multiplayer_team_designator.seventh_party,
  [MultiplayerTeamDesignator.eighth_party]:
    e_multiplayer_team_designator.eighth_party,
  [MultiplayerTeamDesignator.neutral]: e_multiplayer_team_designator.neutral,
} as const satisfies Record<
  MultiplayerTeamDesignatorName,
  e_multiplayer_team_designator
>;

export const encodeMultiplayerTeamDesignator = (
  value: MultiplayerTeamDesignatorName
): e_multiplayer_team_designator =>
  mapMegaloEnum(value, MULTIPLAYER_TEAM_DESIGNATOR_TO_BLF);
