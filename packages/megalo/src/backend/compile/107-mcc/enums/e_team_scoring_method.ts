import { e_team_scoring_method } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import {
  TeamScoringMethod,
  type TeamScoringMethod as TeamScoringMethodName,
} from "src/frontend/intermediate-representation/game/game_engine_default";
import { mapMegaloEnum } from "src/frontend/intermediate-representation/megaloEnum";

const TEAM_SCORING_METHOD_TO_BLF = {
  [TeamScoringMethod.sum]: e_team_scoring_method.sum,
  [TeamScoringMethod.minimum]: e_team_scoring_method.minimum,
  [TeamScoringMethod.maximum]: e_team_scoring_method.maximum,
} as const satisfies Record<TeamScoringMethodName, e_team_scoring_method>;

export const encodeTeamScoringMethod = (
  value: TeamScoringMethodName
): e_team_scoring_method => mapMegaloEnum(value, TEAM_SCORING_METHOD_TO_BLF);
