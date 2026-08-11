import { e_multiplayer_team_designator } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { MultiplayerTeamDesignator } from "../../../intermediate-representation/game/game_engine_default";

export const encodeMultiplayerTeamDesignator = (
  value: MultiplayerTeamDesignator
): e_multiplayer_team_designator => {
  switch (value) {
    case MultiplayerTeamDesignator.None:
      return e_multiplayer_team_designator.none;
    case MultiplayerTeamDesignator.Defenders:
      return e_multiplayer_team_designator.defenders;
    case MultiplayerTeamDesignator.Attackers:
      return e_multiplayer_team_designator.attackers;
    case MultiplayerTeamDesignator.ThirdParty:
      return e_multiplayer_team_designator.third_party;
    case MultiplayerTeamDesignator.FourthParty:
      return e_multiplayer_team_designator.fourth_party;
    case MultiplayerTeamDesignator.FifthParty:
      return e_multiplayer_team_designator.fifth_party;
    case MultiplayerTeamDesignator.SixthParty:
      return e_multiplayer_team_designator.sixth_party;
    case MultiplayerTeamDesignator.SeventhParty:
      return e_multiplayer_team_designator.seventh_party;
    case MultiplayerTeamDesignator.EighthParty:
      return e_multiplayer_team_designator.eighth_party;
    case MultiplayerTeamDesignator.Neutral:
      return e_multiplayer_team_designator.neutral;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
