import type { CompiledEngineStats } from "src/backend/compile/engineStats";
import type { Limits } from "src/backend/version-configuration";
import { VariableScope, VariableType } from "src/frontend/symbol-table";

export type VariantLimitSection =
  | "storage"
  | "script"
  | "strings"
  | "variables"
  | "declarations";

export interface VariantLimitItem {
  format?: "bytes" | "count";
  id: string;
  label: string;
  max: number;
  section: VariantLimitSection;
  used: number;
}

export interface VariantLimitUsage {
  items: VariantLimitItem[];
}

export {
  type CompiledEngineStats,
  collectCompiledEngineStats,
  scriptStringEntryEncodedBytes,
  scriptStringTableEncodedBytes,
} from "src/backend/compile/engineStats";

const SCOPE_LABELS: Record<VariableScope, string> = {
  [VariableScope.Global]: "Global",
  [VariableScope.Player]: "Player",
  [VariableScope.Team]: "Team",
  [VariableScope.Object]: "Object",
  [VariableScope.Temporary]: "Temporary",
};

const TYPE_LABELS: Record<VariableType, string> = {
  [VariableType.Number]: "number",
  [VariableType.Timer]: "timer",
  [VariableType.Team]: "team",
  [VariableType.Player]: "player",
  [VariableType.Object]: "object",
};

const SCOPE_ORDER: VariableScope[] = [
  VariableScope.Global,
  VariableScope.Player,
  VariableScope.Team,
  VariableScope.Object,
  VariableScope.Temporary,
];

const TYPE_ORDER: VariableType[] = [
  VariableType.Number,
  VariableType.Object,
  VariableType.Player,
  VariableType.Team,
  VariableType.Timer,
];

const pushItem = (items: VariantLimitItem[], item: VariantLimitItem): void => {
  if (item.max <= 0) {
    return;
  }
  items.push(item);
};

/** Map compiler stats + version limits into UI meter rows. */
export const formatVariantLimitUsage = (
  stats: CompiledEngineStats,
  limits: Limits
): VariantLimitUsage => {
  const items: VariantLimitItem[] = [];

  const add = (
    id: string,
    label: string,
    used: number,
    max: number,
    section: VariantLimitSection,
    format?: "bytes" | "count"
  ): void => {
    pushItem(items, { id, label, used, max, section, format });
  };

  add(
    "storage",
    "Encoded size",
    stats.encodedSize,
    limits.encodedSize,
    "storage",
    "bytes"
  );
  add("triggers", "Triggers", stats.triggers, limits.triggers, "script");
  add(
    "conditions",
    "Conditions",
    stats.conditions,
    limits.conditions,
    "script"
  );
  add("actions", "Actions", stats.actions, limits.actions, "script");
  add("strings", "Script strings", stats.strings, limits.strings, "strings");
  add(
    "string-bytes",
    "String bytes",
    stats.stringBytes,
    limits.stringBytes,
    "strings",
    "bytes"
  );

  for (const scope of SCOPE_ORDER) {
    const scopeLimits = limits.variables[scope];
    for (const type of TYPE_ORDER) {
      const max = scopeLimits[type];
      if (max === undefined) {
        continue;
      }
      add(
        `var-${scope}-${type}`,
        `${SCOPE_LABELS[scope]} ${TYPE_LABELS[type]}`,
        stats.variables[scope][type] ?? 0,
        max,
        "variables"
      );
    }
  }

  add(
    "hud-widgets",
    "HUD widgets",
    stats.hudWidgets,
    limits.hudWidgets,
    "declarations"
  );
  add(
    "options",
    "Custom options",
    stats.userDefinedOptions,
    limits.userDefinedOptions,
    "declarations"
  );
  add(
    "stats",
    "Game statistics",
    stats.gameStatistics,
    limits.gameStatistics,
    "declarations"
  );
  add(
    "object-filters",
    "Map object filters",
    stats.objectFilters,
    limits.objectFilters,
    "declarations"
  );
  add("loadouts", "Loadouts", stats.loadouts, limits.loadouts, "declarations");
  add(
    "loadout-palettes",
    "Loadout palettes",
    stats.loadoutPalettes,
    limits.loadoutPalettes,
    "declarations"
  );
  add(
    "requisition-palettes",
    "Requisition palettes",
    stats.requisitionPalettes,
    limits.requisitionPalettes,
    "declarations"
  );
  add(
    "player-traits",
    "Player trait sets",
    stats.playerTraitSets,
    limits.playerTraitSets,
    "declarations"
  );
  add("teams", "Teams", stats.teams, limits.teams, "declarations");
  add(
    "map-permissions",
    "Map permission exceptions",
    stats.mapPermissionExceptions,
    limits.mapPermissionExceptions,
    "declarations"
  );
  add(
    "objects-used",
    "Objects used",
    stats.objectsUsed,
    limits.objectsUsed,
    "declarations"
  );

  return { items };
};
