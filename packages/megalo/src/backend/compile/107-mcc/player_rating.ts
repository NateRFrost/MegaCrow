import type { c_game_engine_custom_variant } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import type { IR } from "../../../frontend/intermediate-representation";

export const compilePlayerRatings = (
  ir: IR,
  gameVariant: c_game_engine_custom_variant
): void => {
  const playerRatings = ir.gameVariant.playerRatings;
  if (playerRatings === undefined) {
    return;
  }

  const ratings = gameVariant.m_player_ratings;
  if (playerRatings.ratingScale !== undefined) {
    ratings.m_rating_scale = playerRatings.ratingScale;
  }
  if (playerRatings.killWeight !== undefined) {
    ratings.m_kill_weight = playerRatings.killWeight;
  }
  if (playerRatings.assistWeight !== undefined) {
    ratings.m_assist_weight = playerRatings.assistWeight;
  }
  if (playerRatings.betrayalWeight !== undefined) {
    ratings.m_betrayal_weight = playerRatings.betrayalWeight;
  }
  if (playerRatings.deathWeight !== undefined) {
    ratings.m_death_weight = playerRatings.deathWeight;
  }
  if (playerRatings.normalizeByMaxKills !== undefined) {
    ratings.m_normalize_by_max_kills = playerRatings.normalizeByMaxKills;
  }
  if (playerRatings.base !== undefined) {
    ratings.m_base = playerRatings.base;
  }
  if (playerRatings.range !== undefined) {
    ratings.m_range = playerRatings.range;
  }
  if (playerRatings.lossScalar !== undefined) {
    ratings.m_loss_scalar = playerRatings.lossScalar;
  }
  if (playerRatings.customStat0 !== undefined) {
    ratings.m_custom_stat_0 = playerRatings.customStat0;
  }
  if (playerRatings.customStat1 !== undefined) {
    ratings.m_custom_stat_1 = playerRatings.customStat1;
  }
  if (playerRatings.customStat2 !== undefined) {
    ratings.m_custom_stat_2 = playerRatings.customStat2;
  }
  if (playerRatings.customStat3 !== undefined) {
    ratings.m_custom_stat_3 = playerRatings.customStat3;
  }
  if (playerRatings.expansion0 !== undefined) {
    ratings.m_expansion_0 = playerRatings.expansion0;
  }
  if (playerRatings.expansion1 !== undefined) {
    ratings.m_expansion_1 = playerRatings.expansion1;
  }
  if (playerRatings.showInScoreboard !== undefined) {
    ratings.m_show_in_scoreboard = playerRatings.showInScoreboard;
  }
};
