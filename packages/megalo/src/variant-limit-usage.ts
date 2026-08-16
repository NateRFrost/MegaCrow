import type { Limits } from "src/backend/version-configuration";
import type { AST } from "src/frontend/abstract-syntax-tree";
import { ElementKind } from "src/frontend/abstract-syntax-tree/elements";
import type { IR } from "src/frontend/intermediate-representation";
import type { VariableMetadata } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variable_metadata";
import type { StringTableEntry } from "src/frontend/intermediate-representation/game/string_table";
import { STRING_TABLE_LANGUAGES } from "src/frontend/language-configuration/omni/strings";
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

const utf8 = new TextEncoder();

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

const countVariableMetadata = (
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

const stringEntryUtf8Bytes = (entry: StringTableEntry): number => {
  let total = 0;
  for (const language of STRING_TABLE_LANGUAGES) {
    const value = entry[language];
    if (typeof value === "string" && value.length > 0) {
      total += utf8.encode(value).length;
    }
  }
  return total;
};

const countElements = (ast: AST | undefined, kind: ElementKind): number => {
  if (ast === undefined) {
    return 0;
  }
  let count = 0;
  for (const element of ast.elements) {
    if (element.elementKind === kind) {
      count++;
    }
  }
  return count;
};

const pushItem = (items: VariantLimitItem[], item: VariantLimitItem): void => {
  if (item.max <= 0) {
    return;
  }
  items.push(item);
};

/**
 * Build UI-ready used/max rows from lowered IR (+ optional AST for declaration counts).
 * Rows with `max <= 0` are omitted.
 */
export const buildVariantLimitUsage = (
  ir: IR,
  limits: Limits,
  options: {
    ast?: AST;
    usedBytes?: number | null;
  } = {}
): VariantLimitUsage => {
  const { ast, usedBytes } = options;
  const engine = ir.gameVariant.gameEngine;
  const items: VariantLimitItem[] = [];

  pushItem(items, {
    id: "storage",
    label: "Encoded size",
    used: usedBytes ?? 0,
    max: limits.encodedSize,
    section: "storage",
    format: "bytes",
  });

  pushItem(items, {
    id: "triggers",
    label: "Triggers",
    used: engine.triggers.length,
    max: limits.triggers,
    section: "script",
  });
  pushItem(items, {
    id: "conditions",
    label: "Conditions",
    used: engine.conditions.length,
    max: limits.conditions,
    section: "script",
  });
  pushItem(items, {
    id: "actions",
    label: "Actions",
    used: engine.actions.length,
    max: limits.actions,
    section: "script",
  });

  const strings = ir.gameVariant.scriptStrings.toArray();
  pushItem(items, {
    id: "strings",
    label: "Script strings",
    used: strings.length,
    max: limits.strings,
    section: "strings",
  });
  pushItem(items, {
    id: "string-bytes",
    label: "String bytes",
    used: strings.reduce((sum, entry) => sum + stringEntryUtf8Bytes(entry), 0),
    max: limits.stringBytes,
    section: "strings",
    format: "bytes",
  });

  for (const scope of SCOPE_ORDER) {
    const scopeLimits = limits.variables[scope];
    const metadata =
      engine.variableMetadata[
        scope === VariableScope.Global
          ? "global"
          : scope === VariableScope.Player
            ? "player"
            : scope === VariableScope.Team
              ? "team"
              : scope === VariableScope.Object
                ? "object"
                : "temporary"
      ];
    for (const type of TYPE_ORDER) {
      const max = scopeLimits[type];
      if (max === undefined) {
        continue;
      }
      pushItem(items, {
        id: `var-${scope}-${type}`,
        label: `${SCOPE_LABELS[scope]} ${TYPE_LABELS[type]}`,
        used: countVariableMetadata(metadata, type),
        max,
        section: "variables",
      });
    }
  }

  pushItem(items, {
    id: "hud-widgets",
    label: "HUD widgets",
    used: engine.hudWidgets.length,
    max: limits.hudWidgets,
    section: "declarations",
  });
  pushItem(items, {
    id: "options",
    label: "Custom options",
    used: ir.gameVariant.userDefinedOptions.length,
    max: limits.userDefinedOptions,
    section: "declarations",
  });
  pushItem(items, {
    id: "stats",
    label: "Game statistics",
    used: engine.statistics.length,
    max: limits.gameStatistics,
    section: "declarations",
  });
  pushItem(items, {
    id: "object-filters",
    label: "Map object filters",
    used: engine.objectFilters.length,
    max: limits.objectFilters,
    section: "declarations",
  });
  pushItem(items, {
    id: "loadouts",
    label: "Loadouts",
    used: countElements(ast, ElementKind.LOADOUT),
    max: limits.loadouts,
    section: "declarations",
  });
  pushItem(items, {
    id: "loadout-palettes",
    label: "Loadout palettes",
    used:
      ir.gameVariant.baseVariant.loadoutTraits.loadoutPalettes?.length ??
      countElements(ast, ElementKind.LOADOUT_PALETTE),
    max: limits.loadoutPalettes,
    section: "declarations",
  });
  pushItem(items, {
    id: "requisition-palettes",
    label: "Requisition palettes",
    used: countElements(ast, ElementKind.REQUISITION_PALETTE),
    max: limits.requisitionPalettes,
    section: "declarations",
  });
  pushItem(items, {
    id: "player-traits",
    label: "Player trait sets",
    used: ir.gameVariant.playerTraits.length,
    max: limits.playerTraitSets,
    section: "declarations",
  });
  pushItem(items, {
    id: "teams",
    label: "Teams",
    used: ir.gameVariant.baseVariant.teamOptions.teams?.length ?? 0,
    max: limits.teams,
    section: "declarations",
  });
  pushItem(items, {
    id: "map-permissions",
    label: "Map permission exceptions",
    used: ir.gameVariant.mapPermissions?.exceptMapIds.length ?? 0,
    max: limits.mapPermissionExceptions,
    section: "declarations",
  });
  pushItem(items, {
    id: "objects-used",
    label: "Objects used",
    used: engine.objectsUsed.filter(Boolean).length,
    max: limits.objectsUsed,
    section: "declarations",
  });

  return { items };
};
