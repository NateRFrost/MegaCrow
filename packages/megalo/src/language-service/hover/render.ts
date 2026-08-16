import {
  isBuiltInVariable,
  SymbolKind,
  type SymbolTableEntry,
  VariableScope,
  VariableType,
} from "src/frontend/symbol-table";
import type { HoverContribution } from "src/language-service/hover/types";
import { hoverMessageKey, translateHover } from "src/localization/hover";

/** Render a registry contribution to markdown (copy from hover i18n). */
export const renderContributionMarkdown = (
  contribution: HoverContribution
): string => {
  const summary = translateHover(
    hoverMessageKey(contribution.kind, contribution.id, "summary")
  );
  const displayId =
    contribution.kind === "param"
      ? (contribution.id.split(".").at(-1) ?? contribution.id)
      : contribution.id;
  const kindLabel = translateHover(`ui.kind.${contribution.kind}`);
  const title = `\`${displayId}\``;
  const lines: string[] = [`**${kindLabel}** ${title}`, "", summary];
  if (contribution.grammar !== undefined && contribution.grammar.length > 0) {
    lines.push("", "```megalo", contribution.grammar, "```");
  }
  if (contribution.params !== undefined && contribution.params.length > 0) {
    lines.push("", `**${translateHover("ui.parameters")}**`);
    for (const name of contribution.params) {
      const detail = translateHover(
        hoverMessageKey(contribution.kind, contribution.id, `params.${name}`)
      );
      lines.push(`- \`${name}\` — ${detail}`);
    }
  }
  return lines.join("\n");
};

const variableTypeLabel = (type: VariableType): string => {
  switch (type) {
    case VariableType.Number:
      return "number";
    case VariableType.Timer:
      return "timer";
    case VariableType.Team:
      return "team";
    case VariableType.Player:
      return "player";
    case VariableType.Object:
      return "object";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
};

const variableScopeLabel = (scope: VariableScope): string => {
  switch (scope) {
    case VariableScope.Global:
      return "global";
    case VariableScope.Team:
      return "team";
    case VariableScope.Player:
      return "player";
    case VariableScope.Object:
      return "object";
    case VariableScope.Temporary:
      return "temporary";
    default: {
      const _exhaustive: never = scope;
      return _exhaustive;
    }
  }
};

const symbolDetail = (entry: SymbolTableEntry): string => {
  switch (entry.kind) {
    case SymbolKind.Variable:
      return variableTypeLabel(entry.type);
    case SymbolKind.Constant:
      return translateHover("ui.symbol.constant");
    case SymbolKind.String:
      return translateHover("ui.symbol.string");
    case SymbolKind.GameOption:
      return translateHover("ui.symbol.game_option");
    case SymbolKind.HudWidget:
      return translateHover("ui.symbol.hud_widget");
    case SymbolKind.Loadout:
      return translateHover("ui.symbol.loadout");
    case SymbolKind.LoadoutPalette:
      return translateHover("ui.symbol.loadout_palette");
    case SymbolKind.RequisitionPalette:
      return translateHover("ui.symbol.requisition_palette");
    case SymbolKind.ObjectListItem:
      return entry.objectType.replaceAll("_", " ");
    case SymbolKind.ObjectFilter:
      return translateHover("ui.symbol.object_filter");
    case SymbolKind.PlayerTraits:
      return translateHover("ui.symbol.player_traits");
    case SymbolKind.GameStat:
      return translateHover("ui.symbol.game_stat");
    default: {
      const _exhaustive: never = entry;
      return _exhaustive;
    }
  }
};

/** Thin symbol hover (type / kind) — chrome from hover i18n. */
export const renderSymbolMarkdown = (entry: SymbolTableEntry): string => {
  const detail = symbolDetail(entry);
  const lines: string[] = [`**${detail}** \`${entry.name}\``];

  if (entry.kind === SymbolKind.Variable) {
    const bits = [
      variableScopeLabel(entry.scope),
      variableTypeLabel(entry.type),
    ];
    if (isBuiltInVariable(entry)) {
      bits.push(translateHover("ui.symbol.built_in"));
    }
    lines.push("", bits.join(" · "));
  } else if (entry.kind === SymbolKind.ObjectListItem) {
    lines.push(
      "",
      `${translateHover("ui.symbol.object_list")}: \`${entry.objectType}\``
    );
  }

  return lines.join("\n");
};
