import { e_game_engine_category } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { EngineCategories } from "../../../intermediate-representation/engine-categories";

export const encodeGameEngineCategory = (
  value: EngineCategories
): e_game_engine_category => {
  switch (value) {
    case EngineCategories.ctf:
      return e_game_engine_category.ctf;
    case EngineCategories.slayer:
      return e_game_engine_category.slayer;
    case EngineCategories.oddball:
      return e_game_engine_category.oddball;
    case EngineCategories.koth:
      return e_game_engine_category.koth;
    case EngineCategories.juggernaut:
      return e_game_engine_category.juggernaut;
    case EngineCategories.territories:
      return e_game_engine_category.territories;
    case EngineCategories.assault:
      return e_game_engine_category.assault;
    case EngineCategories.infection:
      return e_game_engine_category.infection;
    case EngineCategories.vip:
      return e_game_engine_category.vip;
    case EngineCategories.invasion:
      return e_game_engine_category.invasion;
    case EngineCategories.stockpile:
      return e_game_engine_category.stockpile;
    case EngineCategories.action_sack:
      return e_game_engine_category.action_sack;
    case EngineCategories.race:
      return e_game_engine_category.race;
    case EngineCategories.headhunter:
      return e_game_engine_category.headhunter;
    case EngineCategories.wip:
      return e_game_engine_category.wip;
    case EngineCategories.dogfight:
      return e_game_engine_category.dogfight;
    case EngineCategories.insane:
      return e_game_engine_category.insane;
    case EngineCategories.bungie:
      return e_game_engine_category.bungie;
    case EngineCategories.ms343:
      return e_game_engine_category.ms343;
    case EngineCategories.heroic:
      return e_game_engine_category.heroic;
    case EngineCategories.legendary:
      return e_game_engine_category.legendary;
    case EngineCategories.mythic:
      return e_game_engine_category.mythic;
    case EngineCategories.mantis:
      return e_game_engine_category.mantis;
    case EngineCategories.shishka:
      return e_game_engine_category.shishka;
    case EngineCategories.huevos:
      return e_game_engine_category.huevos;
    case EngineCategories.jonnyo:
      return e_game_engine_category.jonnyo;
    case EngineCategories.dangerboy:
      return e_game_engine_category.dangerboy;
    case EngineCategories.holiday:
      return e_game_engine_category.holiday;
    case EngineCategories.community:
      return e_game_engine_category.community;
    case EngineCategories.matchmaking:
      return e_game_engine_category.matchmaking;
    case EngineCategories.pre_game_warm_up:
      return e_game_engine_category.pre_game_warm_up;
    default: {
      const _exhaustive: never = value;
      return _exhaustive;
    }
  }
};
