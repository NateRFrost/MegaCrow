import { MEGACROW_BUILD_STRING } from "src/build-info";
import type { MegaloCompilerContext } from "src/context";
import { BUILT_IN_LOCATION } from "src/diagnostics";
import type { ParserSymbolContext } from "src/frontend/abstract-syntax-tree/symbol-context";
import type { BuiltInGameOptionName } from "src/frontend/language-configuration/omni/game_options";
import { STRING_TABLE_LANGUAGES } from "src/frontend/language-configuration/omni/strings";
import { VariableScope, VariableType } from "src/frontend/symbol-table";
import type { MegaloVersion } from "src/version";

export const addBuiltInConstants = (
  _megaloVersion: MegaloVersion,
  symbolParser: ParserSymbolContext
): void => {
  const addBuiltInConstant = (name: string, value: number) => {
    symbolParser.addConstantToScope({
      name,
      declaration: BUILT_IN_LOCATION,
      value,
    });
  };

  addBuiltInConstant("true", 1);
  addBuiltInConstant("false", 0);
};

export const addBuiltInVariables = (
  frontend: MegaloCompilerContext,
  symbolParser: ParserSymbolContext
): void => {
  const addBuiltInVariable = (
    name: string,
    type: VariableType = VariableType.Number
  ) => {
    symbolParser.addVariableToScope({
      name,
      declaration: BUILT_IN_LOCATION,
      type,
      scope: VariableScope.Global,
    });
  };

  // Constants, a bit hacky
  symbolParser.addVariableToScope({
    name: "none",
    declaration: BUILT_IN_LOCATION,
    type: VariableType.Object,
    scope: VariableScope.Global,
  });
  symbolParser.addVariableToScope({
    name: "none",
    declaration: BUILT_IN_LOCATION,
    type: VariableType.Player,
    scope: VariableScope.Global,
  });
  symbolParser.addVariableToScope({
    name: "none",
    declaration: BUILT_IN_LOCATION,
    type: VariableType.Team,
    scope: VariableScope.Global,
  });

  // Halo: Reach
  addBuiltInVariable("round_index");
  addBuiltInVariable("symmetric_gametype");
  addBuiltInVariable("round_timer", VariableType.Timer);
  addBuiltInVariable("sudden_death_timer", VariableType.Timer);
  addBuiltInVariable("grace_period_timer", VariableType.Timer);

  addBuiltInVariable("local_player", VariableType.Player);
  addBuiltInVariable("target_player", VariableType.Player);

  addBuiltInVariable("target_object", VariableType.Object);

  addBuiltInVariable("neutral", VariableType.Team);
  addBuiltInVariable("local_team", VariableType.Team);
  // MegaloEdit Headache #2: encoded as TargetTeam; MegaloEdit does not parse this name.
  if (frontend.megacrowExtensions.targetTeam) {
    addBuiltInVariable("target_team", VariableType.Team);
  }
  addBuiltInVariable("attackers", VariableType.Team);
  addBuiltInVariable("defenders", VariableType.Team);
  addBuiltInVariable("third_party", VariableType.Team);
  addBuiltInVariable("fourth_party", VariableType.Team);
  addBuiltInVariable("fifth_party", VariableType.Team);
  addBuiltInVariable("sixth_party", VariableType.Team);
  addBuiltInVariable("seventh_party", VariableType.Team);
  addBuiltInVariable("eighth_party", VariableType.Team);
};

export const addBuiltInGameOptions = (
  megaloVersion: MegaloVersion,
  symbolParser: ParserSymbolContext
): void => {
  const addBuiltInGameOption = (name: BuiltInGameOptionName) => {
    symbolParser.addGameOptionToScope({
      name,
      declaration: BUILT_IN_LOCATION,
      type: VariableType.Number,
    });
  };

  // Halo: Reach
  addBuiltInGameOption("score_to_win_round");
  addBuiltInGameOption("fire_teams_enabled");
  addBuiltInGameOption("teams_enabled");
  addBuiltInGameOption("round_time_limit");
  addBuiltInGameOption("round_count");
  addBuiltInGameOption("perfection_enabled");
  addBuiltInGameOption("early_victory_win_count");
  addBuiltInGameOption("sudden_death_time_limit");
  addBuiltInGameOption("grace_period_time_limit");
  addBuiltInGameOption("lives_per_round");
  addBuiltInGameOption("team_lives_per_round");
  addBuiltInGameOption("respawn_time");
  addBuiltInGameOption("suicide_respawn_penalty");
  addBuiltInGameOption("betrayal_respawn_penalty");
  addBuiltInGameOption("respawn_time_growth");
  addBuiltInGameOption("loadout_selection_time");
  addBuiltInGameOption("respawn_traits_duration");
  addBuiltInGameOption("friendly_fire_enabled");
  addBuiltInGameOption("betrayal_booting_enabled");
  addBuiltInGameOption("enemy_voice_enabled");
  addBuiltInGameOption("open_channel_voice_enabled");
  addBuiltInGameOption("dead_player_voice_enabled");
  addBuiltInGameOption("grenades_on_map");
  addBuiltInGameOption("shortcuts_on_map");
  addBuiltInGameOption("equipment_on_map");
  addBuiltInGameOption("powerups_on_map");
  addBuiltInGameOption("turrets_on_map");
  addBuiltInGameOption("indestructible_vehicles");
  addBuiltInGameOption("weapon_set");
  addBuiltInGameOption("vehicle_set");
  addBuiltInGameOption("red_powerup_duration");
  addBuiltInGameOption("blue_powerup_duration");
  addBuiltInGameOption("yellow_powerup_duration");
  addBuiltInGameOption("team_scoring_mode");

  if (megaloVersion.version >= 107) {
    addBuiltInGameOption("tu1_always_spillover_damage");
    addBuiltInGameOption("tu1_armor_lock_stickies_remain");
    addBuiltInGameOption("tu1_attached_damage_bypass_shields");
    addBuiltInGameOption("tu1_active_camo_override_energy_curve");
    addBuiltInGameOption("tu1_sword_gun_clang_kills");
    addBuiltInGameOption("tu1_magnum_is_automatic");
    addBuiltInGameOption("tu1_headshot_weapon_reticule_bloom_multiplier");
    addBuiltInGameOption("tu1_armor_lock_damage_to_energy_transfer");
    addBuiltInGameOption("tu1_armor_lock_damage_to_energy_cap");
    addBuiltInGameOption("tu1_active_camo_override_energy_curve_min");
    addBuiltInGameOption("tu1_active_camo_override_energy_curve_max");
    addBuiltInGameOption("tu1_magnum_damage_multiplier");
    addBuiltInGameOption("tu1_magnum_fire_recovery_time_multiplier");
  }
};

/** Undocumented MegaCrow builtin string carrying the app build identity. */
export const addBuiltInStrings = (
  frontend: MegaloCompilerContext,
  symbolParser: ParserSymbolContext
): void => {
  if (!frontend.megacrowExtensions.megacrowVersionString) {
    return;
  }

  for (const language of STRING_TABLE_LANGUAGES) {
    symbolParser.addStringToScope({
      name: "mc_version",
      language,
      content: MEGACROW_BUILD_STRING,
      declaration: BUILT_IN_LOCATION,
    });
  }
};
