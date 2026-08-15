import { e_explicit_team_type } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { ExplicitTeam } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_team";

const EXPLICIT_TEAM_TYPE_TO_BLF = {
  [ExplicitTeam.None]: e_explicit_team_type.none,
  [ExplicitTeam.Team0]: e_explicit_team_type.team_0,
  [ExplicitTeam.Team1]: e_explicit_team_type.team_1,
  [ExplicitTeam.Team2]: e_explicit_team_type.team_2,
  [ExplicitTeam.Team3]: e_explicit_team_type.team_3,
  [ExplicitTeam.Team4]: e_explicit_team_type.team_4,
  [ExplicitTeam.Team5]: e_explicit_team_type.team_5,
  [ExplicitTeam.Team6]: e_explicit_team_type.team_6,
  [ExplicitTeam.Team7]: e_explicit_team_type.team_7,
  [ExplicitTeam.neutral]: e_explicit_team_type.neutral,
  [ExplicitTeam.Global0]: e_explicit_team_type.global_0,
  [ExplicitTeam.Global1]: e_explicit_team_type.global_1,
  [ExplicitTeam.Global2]: e_explicit_team_type.global_2,
  [ExplicitTeam.Global3]: e_explicit_team_type.global_3,
  [ExplicitTeam.Global4]: e_explicit_team_type.global_4,
  [ExplicitTeam.Global5]: e_explicit_team_type.global_5,
  [ExplicitTeam.Global6]: e_explicit_team_type.global_6,
  [ExplicitTeam.Global7]: e_explicit_team_type.global_7,
  [ExplicitTeam.CurrentTeam]: e_explicit_team_type.current_team,
  [ExplicitTeam.LocalTeam]: e_explicit_team_type.local_team,
  [ExplicitTeam.TargetTeam]: e_explicit_team_type.target_team,
  [ExplicitTeam.Temporary0]: e_explicit_team_type.temporary_0,
  [ExplicitTeam.Temporary1]: e_explicit_team_type.temporary_1,
  [ExplicitTeam.Temporary2]: e_explicit_team_type.temporary_2,
  [ExplicitTeam.Temporary3]: e_explicit_team_type.temporary_3,
  [ExplicitTeam.Temporary4]: e_explicit_team_type.temporary_4,
  [ExplicitTeam.Temporary5]: e_explicit_team_type.temporary_5,
} as const satisfies Record<ExplicitTeam, e_explicit_team_type>;

export const encodeExplicitTeamType = (
  value: ExplicitTeam
): e_explicit_team_type => EXPLICIT_TEAM_TYPE_TO_BLF[value];
