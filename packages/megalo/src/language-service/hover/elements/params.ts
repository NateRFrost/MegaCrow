import {
  BUILT_IN_GAME_OPTION_NAMES,
  PLAYER_TRAITS_OVERRIDE_OPTIONS,
} from "src/frontend/language-configuration/omni/game_options";
import { defineParamHover } from "src/language-service/hover/registry";
import type { HoverContribution } from "src/language-service/hover/types";

const p = (
  element: string,
  name: string,
  grammar?: string
): HoverContribution =>
  defineParamHover(`${element}.${name}`, {
    ...(grammar === undefined ? {} : { grammar }),
  });

const ELEMENTS_WITH_END = [
  "variables",
  "constants",
  "game_options",
  "hud_widgets",
  "loadout",
  "loadout_palette",
  "teams",
  "engine_data",
  "player_rating",
  "map_permissions",
  "game_stats",
  "map_object",
  "requisition_palette",
  "string_table",
] as const;

const PLAYER_TRAIT_OPTION_NAMES = [
  "damage_resistance",
  "body_recharge",
  "shield_recharge",
  "vampirism",
  "headshot_immunity",
  "body_multiplier",
  "shield_multiplier",
  "assassination_immunity",
  "damage_modifier",
  "melee_damage_modifier",
  "initial_primary_weapon",
  "initial_secondary_weapon",
  "initial_equipment",
  "initial_grenades",
  "recharging_grenades",
  "infinite_ammo",
  "bottomless_clip",
  "weapon_pickup",
  "drop_equipment",
  "infinite_equipment",
  "speed",
  "gravity",
  "vehicle_usage",
  "jump_modifier",
  "sprinting",
  "equipment_usage",
  "active_camo",
  "waypoint",
  "gamertag_visibility",
  "color",
  "tracker_mode",
  "tracker_range",
] as const;

const PLAYER_RATING_PARAM_NAMES = [
  "rating_scale",
  "kill_weight",
  "assist_weight",
  "betrayal_weight",
  "death_weight",
  "normalize_by_max_kills",
  "base_value",
  "range",
  "loss_scalar",
  "custom_stat_0",
  "custom_stat_1",
  "custom_stat_2",
  "custom_stat_3",
  "expansion_0",
  "expansion_1",
  "show_in_scoreboard",
] as const;

/**
 * Hover for element body keywords / property keys.
 * Ids are `elementName.paramName` (e.g. `game_options.override`).
 * Prose lives in `locales/hover/{en,ja}.json` under `param.<id>.summary`.
 */
export const elementParamHovers: readonly HoverContribution[] = [
  ...ELEMENTS_WITH_END.map((element) => p(element, "end", "end")),

  p("variables", "global", "variables global"),
  p("variables", "team", "variables team"),
  p("variables", "player", "variables player"),
  p("variables", "object", "variables object"),
  p("variables", "local", "local <type> <name> <initial>"),
  p("variables", "networked", "networked <type> <name> <initial>"),
  p("variables", "networked_high", "networked_high <type> <name> <initial>"),
  p("variables", "number"),
  p("variables", "timer"),

  p("constants", "number", "number <name> <value>"),

  p("game_options", "lock", "lock <option_name>"),
  p("game_options", "hide", "hide <option_name>"),
  p("game_options", "override", "override <name> …"),
  p("game_options", "option", "option <name> …"),
  p("game_options", "ranged_option", "ranged_option <name> …"),
  p("game_options", "player_traits", "player_traits <name> … end"),
  p("game_options", "loadout_palette"),
  ...PLAYER_TRAIT_OPTION_NAMES.map((name) => p("game_options", name)),
  ...BUILT_IN_GAME_OPTION_NAMES.map((name) => p("game_options", name)),
  ...PLAYER_TRAITS_OVERRIDE_OPTIONS.map((name) => p("game_options", name)),

  p("loadout", "name"),
  p("loadout", "primary_weapon"),
  p("loadout", "backpack_weapon"),
  p("loadout", "equipment"),
  p("loadout", "grenades"),

  p("loadout_palette", "item", "item <loadout_name>"),

  p("teams", "model"),
  p("teams", "designator_switch_type"),
  p("teams", "team", "team … end"),
  p("teams", "name"),
  p("teams", "designator"),
  p("teams", "color"),
  p("teams", "fireteam_count"),

  p("engine_data", "name"),
  p("engine_data", "description"),
  p("engine_data", "icon"),
  p("engine_data", "category"),

  ...PLAYER_RATING_PARAM_NAMES.map((name) => p("player_rating", name)),

  p("map_permissions", "default", "default {allow|deny}"),
  p("map_permissions", "exception", "exception <map> …"),

  p("game_stats", "number"),
  p("game_stats", "timer"),
  p("game_stats", "delta"),
  p("game_stats", "percentage"),
  p("game_stats", "none"),
  p("game_stats", "team"),

  p("map_object", "label"),
  p("map_object", "type"),
  p("map_object", "team"),
  p("map_object", "user_data"),
  p("map_object", "min"),

  p("requisition_palette", "baseline", "baseline {enabled|disabled}"),
  p(
    "requisition_palette",
    "item",
    "item <name> {available|unavailable|disabled}"
  ),
  p("requisition_palette", "enabled"),
  p("requisition_palette", "disabled"),
  p("requisition_palette", "available"),
  p("requisition_palette", "unavailable"),
];
