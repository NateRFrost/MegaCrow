import type { IR } from "src/frontend/intermediate-representation";
import type { VariableMetadata } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variable_metadata";
import type { StringTableEntry } from "src/frontend/intermediate-representation/game/string_table";
import { STRING_TABLE_LANGUAGES } from "src/frontend/language-configuration/omni/strings";
import { VariableScope, VariableType } from "src/frontend/symbol-table";

/**
 * Used counts taken from the compiled custom variant (MegaloEdit `EngineStats`).
 * Format for UI via {@link formatVariantLimitUsage} in `variant-limit-usage.ts`.
 */
export interface CompiledEngineStats {
  actions: number;
  conditions: number;
  encodedSize: number;
  gameStatistics: number;
  hudWidgets: number;
  loadoutPalettes: number;
  loadouts: number;
  mapPermissionExceptions: number;
  objectFilters: number;
  objectsUsed: number;
  playerTraitSets: number;
  requisitionPalettes: number;
  stringBytes: number;
  strings: number;
  teams: number;
  triggers: number;
  userDefinedOptions: number;
  variables: Record<VariableScope, Partial<Record<VariableType, number>>>;
}

/** Compiled Reach custom-variant fields we read for stats (shared across builds). */
export interface CompiledCustomVariantSnapshot {
  m_base_variant?: {
    m_loadouts?: {
      m_loadout_palettes?: readonly unknown[];
    };
    m_team_options?: {
      m_teams?: readonly unknown[];
    };
  };
  m_game_engine: {
    m_actions: readonly unknown[];
    m_conditions: readonly unknown[];
    m_global_variable_metadata: CompiledVariableMetadata;
    m_hud_widgets: readonly unknown[];
    m_object_filters: readonly unknown[];
    m_object_variable_metadata: CompiledVariableMetadata;
    m_objects_used: readonly boolean[];
    m_player_variable_metadata: CompiledVariableMetadata;
    m_statistics: readonly unknown[];
    m_team_variable_metadata: CompiledVariableMetadata;
    m_triggers: readonly unknown[];
  };
  m_map_permissions?: {
    m_except_map_ids?: readonly unknown[];
  };
  m_player_traits: readonly unknown[];
  m_script_strings: {
    strings: readonly (readonly (string | null)[])[];
  };
  m_user_defined_options: readonly unknown[];
}

interface CompiledVariableMetadata {
  m_numeric_variables: readonly unknown[];
  m_object_variables: readonly unknown[];
  m_player_variables: readonly unknown[];
  m_team_variables: readonly unknown[];
  m_timer_variables: readonly unknown[];
}

const utf8 = new TextEncoder();

const TYPE_ORDER: VariableType[] = [
  VariableType.Number,
  VariableType.Object,
  VariableType.Player,
  VariableType.Team,
  VariableType.Timer,
];

/** Wire byte length for one localized script-string row (MegaloEdit-style). */
export const scriptStringEntryEncodedBytes = (
  entry: StringTableEntry
): number => {
  const values = STRING_TABLE_LANGUAGES.map((language) => {
    const value = entry[language];
    return typeof value === "string" ? value : null;
  });
  const reference = values[0] ?? null;
  let deduplicate = reference !== null;
  if (deduplicate) {
    for (let i = 1; i < values.length; i++) {
      if (values[i] !== reference) {
        deduplicate = false;
        break;
      }
    }
  }
  if (deduplicate && reference !== null) {
    return utf8.encode(reference).length + 1;
  }
  let total = 0;
  for (const value of values) {
    if (value !== null) {
      total += utf8.encode(value).length + 1;
    }
  }
  return total;
};

export const scriptStringTableEncodedBytes = (ir: IR): number =>
  ir.gameVariant.scriptStrings
    .toArray()
    .reduce((sum, entry) => sum + scriptStringEntryEncodedBytes(entry), 0);

const compiledScriptStringBytes = (
  strings: readonly (readonly (string | null)[])[]
): number => {
  const count = strings[0]?.length ?? 0;
  let total = 0;
  for (let index = 0; index < count; index++) {
    const values = strings.map((language) => language[index] ?? null);
    const reference = values[0] ?? null;
    let deduplicate = reference !== null;
    if (deduplicate) {
      for (let i = 1; i < values.length; i++) {
        if (values[i] !== reference) {
          deduplicate = false;
          break;
        }
      }
    }
    if (deduplicate && reference !== null) {
      total += utf8.encode(reference).length + 1;
      continue;
    }
    for (const value of values) {
      if (value !== null) {
        total += utf8.encode(value).length + 1;
      }
    }
  }
  return total;
};

const countCompiledVariableMetadata = (
  metadata: CompiledVariableMetadata,
  type: VariableType
): number => {
  switch (type) {
    case VariableType.Number:
      return metadata.m_numeric_variables.length;
    case VariableType.Timer:
      return metadata.m_timer_variables.length;
    case VariableType.Team:
      return metadata.m_team_variables.length;
    case VariableType.Player:
      return metadata.m_player_variables.length;
    case VariableType.Object:
      return metadata.m_object_variables.length;
  }
};

const countIrVariableMetadata = (
  metadata: VariableMetadata,
  type: VariableType
): number => {
  switch (type) {
    case VariableType.Number:
      return metadata.numericVariables.length;
    case VariableType.Timer:
      return metadata.timerVariables.length;
    case VariableType.Team:
      return metadata.teamVariables.length;
    case VariableType.Player:
      return metadata.playerVariables.length;
    case VariableType.Object:
      return metadata.objectVariables.length;
  }
};

const emptyVariableCounts = (): CompiledEngineStats["variables"] => ({
  [VariableScope.Global]: {},
  [VariableScope.Player]: {},
  [VariableScope.Team]: {},
  [VariableScope.Object]: {},
  [VariableScope.Temporary]: {},
});

/**
 * Read used counts from the compiled variant + IR (temps / authored declarations).
 * Call after `compile()` so arrays reflect what would be written.
 */
export const collectCompiledEngineStats = (
  gametype: CompiledCustomVariantSnapshot,
  ir: IR,
  encodedSize: number
): CompiledEngineStats => {
  const engine = gametype.m_game_engine;
  const meta = ir.gameVariant.gameEngine.variableMetadata;
  const variables = emptyVariableCounts();

  const scopeMeta: Array<{
    scope: VariableScope;
    compiled?: CompiledVariableMetadata;
    irMeta: VariableMetadata;
  }> = [
    {
      scope: VariableScope.Global,
      compiled: engine.m_global_variable_metadata,
      irMeta: meta.global,
    },
    {
      scope: VariableScope.Player,
      compiled: engine.m_player_variable_metadata,
      irMeta: meta.player,
    },
    {
      scope: VariableScope.Object,
      compiled: engine.m_object_variable_metadata,
      irMeta: meta.object,
    },
    {
      scope: VariableScope.Team,
      compiled: engine.m_team_variable_metadata,
      irMeta: meta.team,
    },
    {
      scope: VariableScope.Temporary,
      irMeta: meta.temporary,
    },
  ];

  for (const { scope, compiled, irMeta } of scopeMeta) {
    for (const type of TYPE_ORDER) {
      variables[scope][type] = compiled
        ? countCompiledVariableMetadata(compiled, type)
        : countIrVariableMetadata(irMeta, type);
    }
  }

  return {
    encodedSize,
    triggers: engine.m_triggers.length,
    conditions: engine.m_conditions.length,
    actions: engine.m_actions.length,
    strings: gametype.m_script_strings.strings[0]?.length ?? 0,
    stringBytes: compiledScriptStringBytes(gametype.m_script_strings.strings),
    variables,
    hudWidgets: engine.m_hud_widgets.length,
    userDefinedOptions: gametype.m_user_defined_options.length,
    gameStatistics: engine.m_statistics.length,
    objectFilters: engine.m_object_filters.length,
    loadouts: ir.gameVariant.gameEngine.loadouts.length,
    loadoutPalettes: ir.gameVariant.gameEngine.loadoutPalettes.length,
    requisitionPalettes: ir.gameVariant.gameEngine.requisitionPalettes.length,
    playerTraitSets: gametype.m_player_traits.length,
    teams: ir.gameVariant.baseVariant.teamOptions.teams?.length ?? 0,
    mapPermissionExceptions:
      gametype.m_map_permissions?.m_except_map_ids?.length ?? 0,
    objectsUsed: engine.m_objects_used.filter(Boolean).length,
  };
};
