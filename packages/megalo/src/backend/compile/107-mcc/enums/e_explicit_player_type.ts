import { e_explicit_player_type } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { ExplicitPlayer } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_explicit_player";

const EXPLICIT_PLAYER_TYPE_TO_BLF = {
  [ExplicitPlayer.None]: e_explicit_player_type.no_player,
  [ExplicitPlayer.Player0]: e_explicit_player_type.player_0,
  [ExplicitPlayer.Player1]: e_explicit_player_type.player_1,
  [ExplicitPlayer.Player2]: e_explicit_player_type.player_2,
  [ExplicitPlayer.Player3]: e_explicit_player_type.player_3,
  [ExplicitPlayer.Player4]: e_explicit_player_type.player_4,
  [ExplicitPlayer.Player5]: e_explicit_player_type.player_5,
  [ExplicitPlayer.Player6]: e_explicit_player_type.player_6,
  [ExplicitPlayer.Player7]: e_explicit_player_type.player_7,
  [ExplicitPlayer.Player8]: e_explicit_player_type.player_8,
  [ExplicitPlayer.Player9]: e_explicit_player_type.player_9,
  [ExplicitPlayer.Player10]: e_explicit_player_type.player_10,
  [ExplicitPlayer.Player11]: e_explicit_player_type.player_11,
  [ExplicitPlayer.Player12]: e_explicit_player_type.player_12,
  [ExplicitPlayer.Player13]: e_explicit_player_type.player_13,
  [ExplicitPlayer.Player14]: e_explicit_player_type.player_14,
  [ExplicitPlayer.Player15]: e_explicit_player_type.player_15,
  [ExplicitPlayer.Global0]: e_explicit_player_type.global_0,
  [ExplicitPlayer.Global1]: e_explicit_player_type.global_1,
  [ExplicitPlayer.Global2]: e_explicit_player_type.global_2,
  [ExplicitPlayer.Global3]: e_explicit_player_type.global_3,
  [ExplicitPlayer.Global4]: e_explicit_player_type.global_4,
  [ExplicitPlayer.Global5]: e_explicit_player_type.global_5,
  [ExplicitPlayer.Global6]: e_explicit_player_type.global_6,
  [ExplicitPlayer.Global7]: e_explicit_player_type.global_7,
  [ExplicitPlayer.Current]: e_explicit_player_type.current,
  [ExplicitPlayer.Hud]: e_explicit_player_type.hud,
  [ExplicitPlayer.HudTarget]: e_explicit_player_type.hud_target,
  [ExplicitPlayer.Killer]: e_explicit_player_type.killer,
  [ExplicitPlayer.Temporary0]: e_explicit_player_type.temporary_0,
  [ExplicitPlayer.Temporary1]: e_explicit_player_type.temporary_1,
  [ExplicitPlayer.Temporary2]: e_explicit_player_type.temporary_2,
} as const satisfies Record<ExplicitPlayer, e_explicit_player_type>;

export const encodeExplicitPlayerType = (
  value: ExplicitPlayer
): e_explicit_player_type => EXPLICIT_PLAYER_TYPE_TO_BLF[value];
