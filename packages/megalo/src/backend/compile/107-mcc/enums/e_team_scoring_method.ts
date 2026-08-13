import { e_team_scoring_method } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { TeamScoringMethod } from "../../../../frontend/intermediate-representation/game/game_engine_default";

export const encodeTeamScoringMethod = (
  value: TeamScoringMethod
): e_team_scoring_method => {
  switch (value) {
    case TeamScoringMethod.Sum:
      return e_team_scoring_method.sum;
    case TeamScoringMethod.Minimum:
      return e_team_scoring_method.minimum;
    case TeamScoringMethod.Maximum:
      return e_team_scoring_method.maximum;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
