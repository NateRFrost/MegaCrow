import {
  VARIABLE_SCOPE_NAMES,
  VARIABLE_TYPE_NAMES,
} from "src/frontend/language-configuration/omni/variables";

/** Top-level element keywords (parser registry names). */
export const TOP_LEVEL_ELEMENT_KEYWORDS = [
  "base",
  "include",
  "localized_include",
  "string_table",
  "constants",
  "variables",
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
  "trigger",
] as const;

/** Trigger-body keywords (plus `not` on conditions). */
export const TRIGGER_BODY_KEYWORDS = [
  "action",
  "condition",
  "temporary",
  "begin",
  "end",
  "not",
] as const;

/** Variable-declaration vocabulary (`local number foo 0`). */
export const VARIABLE_DECLARATION_KEYWORDS = [
  "local",
  "networked",
  "networked_high",
  ...VARIABLE_SCOPE_NAMES,
  ...VARIABLE_TYPE_NAMES,
] as const;

/** Boolean literals registered as built-in constants. */
export const BOOLEAN_LITERAL_KEYWORDS = ["true", "false"] as const;

/**
 * Names MegaloEdit will parse as identifiers, but which are language
 * keywords. MegaCrow’s `reservedKeywords` extension errors when they are used
 * as declaration names.
 */
export const RESERVED_VARIABLE_NAME_KEYWORDS = [
  ...TOP_LEVEL_ELEMENT_KEYWORDS,
  ...TRIGGER_BODY_KEYWORDS,
  ...VARIABLE_DECLARATION_KEYWORDS,
  ...BOOLEAN_LITERAL_KEYWORDS,
] as const;

export type ReservedVariableNameKeyword =
  (typeof RESERVED_VARIABLE_NAME_KEYWORDS)[number];

const RESERVED_VARIABLE_NAME_KEYWORD_SET = new Set<string>(
  RESERVED_VARIABLE_NAME_KEYWORDS
);

export const isReservedVariableName = (name: string): boolean =>
  RESERVED_VARIABLE_NAME_KEYWORD_SET.has(name);
