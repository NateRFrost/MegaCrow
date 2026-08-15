import { OPEN_ENDED_POSITION } from "src/diagnostics";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import {
  matchesParameterType,
  ParameterType,
} from "src/frontend/abstract-syntax-tree/parameters";
import {
  playerFilterType,
  teamOrPlayerTarget,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { MegaloEnumDef } from "src/frontend/intermediate-representation/megaloEnum";
import { ObjectListType } from "src/frontend/object-lists";
import {
  SymbolKind,
  type SymbolTableEntry,
  VariableScope,
  VariableType,
} from "src/frontend/symbol-table";
import type {
  ActionCompletionContext,
  CompletionContextBase,
  CompletionItem,
  CompletionKind,
  ConditionCompletionContext,
} from "src/language-service/completion/types";

type SuggestCtx = CompletionContextBase;

/** Sentinel ends (and starts) mean "open" — visible through EOF / from file start. */
const isOpenEnded = (offset: number): boolean =>
  offset === OPEN_ENDED_POSITION.localOffset;

const isVisibleAt = (entry: SymbolTableEntry, offset: number): boolean => {
  const { start, end } = entry.range;
  const afterStart =
    isOpenEnded(start.localOffset) || offset >= start.localOffset;
  const beforeEnd = isOpenEnded(end.localOffset) || offset < end.localOffset;
  return afterStart && beforeEnd;
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

const parameterTypeLabel = (type: ParameterType): string => {
  switch (type) {
    case ParameterType.Integer:
    case ParameterType.Float:
      return "number";
    case ParameterType.Timer:
      return "timer";
    case ParameterType.Team:
      return "team";
    case ParameterType.Player:
      return "player";
    case ParameterType.Object:
      return "object";
    case ParameterType.String:
    case ParameterType.QuotedString:
    case ParameterType.DynamicString:
      return "string";
    case ParameterType.HudWidget:
      return "hud widget";
    case ParameterType.Loadout:
      return "loadout";
    case ParameterType.LoadoutPalette:
      return "loadout palette";
    case ParameterType.RequisitionPalette:
      return "requisition palette";
    case ParameterType.ObjectFilter:
      return "object filter";
    case ParameterType.PlayerTraits:
      return "player traits";
    case ParameterType.Keyword:
      return "keyword";
    case ParameterType.MathOperation:
      return "math operation";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
};

/** Human-readable type shown beside completion labels in the IDE. */
export const completionDetailForEntry = (entry: SymbolTableEntry): string => {
  switch (entry.kind) {
    case SymbolKind.Variable:
      return variableTypeLabel(entry.type);
    case SymbolKind.Constant:
      return "constant";
    case SymbolKind.String:
      return "string";
    case SymbolKind.GameOption:
      return "game option";
    case SymbolKind.HudWidget:
      return "hud widget";
    case SymbolKind.Loadout:
      return "loadout";
    case SymbolKind.LoadoutPalette:
      return "loadout palette";
    case SymbolKind.RequisitionPalette:
      return "requisition palette";
    case SymbolKind.ObjectListItem:
      return entry.objectType.replaceAll("_", " ");
    case SymbolKind.ObjectFilter:
      return "object filter";
    case SymbolKind.PlayerTraits:
      return "player traits";
    case SymbolKind.GameStat:
      return "game stat";
    default: {
      const _exhaustive: never = entry;
      return _exhaustive;
    }
  }
};

/** Bare refs: globals/temps (+ constants). Member-scoped names need `root.`. */
const isBareReferenceScope = (scope: VariableScope): boolean =>
  scope === VariableScope.Global || scope === VariableScope.Temporary;

const memberScopeForRootType = (
  rootType: VariableType
): VariableScope | undefined => {
  switch (rootType) {
    case VariableType.Player:
      return VariableScope.Player;
    case VariableType.Team:
      return VariableScope.Team;
    case VariableType.Object:
      return VariableScope.Object;
    default:
      return;
  }
};

/** Built-in `.member` names that are not declared in `variables` blocks. */
const builtinMembersFor = (
  rootType: VariableType,
  type: ParameterType
): string[] => {
  const names: string[] = [];
  const wantsNumber =
    type === ParameterType.Integer || type === ParameterType.Float;
  if (rootType === VariableType.Player) {
    if (wantsNumber) {
      names.push(
        "score",
        "player_score",
        "player_money",
        "player_rating",
        "rating"
      );
    }
    if (type === ParameterType.Team) {
      names.push("team");
    }
  } else if (rootType === VariableType.Team) {
    if (wantsNumber) {
      names.push("score");
    }
  } else if (rootType === VariableType.Object) {
    if (wantsNumber) {
      names.push("user_data");
    }
    if (type === ParameterType.Team) {
      names.push("team");
    }
  }
  return names;
};

const resolveVisibleRootType = (
  ctx: SuggestCtx,
  rootName: string
): VariableType | undefined => {
  for (const entry of ctx.snapshot.ast.symbolTable.toArray()) {
    if (entry.name !== rootName) {
      continue;
    }
    if (!isVisibleAt(entry, ctx.offset)) {
      continue;
    }
    if (entry.kind === SymbolKind.Variable) {
      return entry.type;
    }
  }
  return;
};

export const filterByPrefix = (
  items: CompletionItem[],
  prefix: string
): CompletionItem[] => {
  if (prefix.length === 0) {
    return items;
  }
  const lower = prefix.toLowerCase();
  return items.filter((entry) => entry.label.toLowerCase().startsWith(lower));
};

/**
 * While replacing an existing token, keep every candidate visible: skip
 * prefix-filtering and set `filterText` to the current prefix so Monaco does
 * not hide siblings of an exact match.
 */
export const forReplacingToken = (
  ctx: SuggestCtx,
  items: CompletionItem[]
): CompletionItem[] => {
  const prefix = ctx.prefix.text;
  if (prefix.length === 0) {
    return items;
  }
  return items.map((item) =>
    item.filterText === undefined ? { ...item, filterText: prefix } : item
  );
};

export interface SuggestOptions {
  /** Offer all candidates while the cursor is inside/replacing a value token. */
  replacingToken?: boolean;
}

const finalizeSuggestions = (
  ctx: SuggestCtx,
  items: CompletionItem[],
  options?: SuggestOptions
): CompletionItem[] => {
  if (options?.replacingToken === true) {
    return forReplacingToken(ctx, items);
  }
  return filterByPrefix(items, ctx.prefix.text);
};

const item = (
  label: string,
  kind: CompletionKind,
  extras?: Partial<CompletionItem>
): CompletionItem => ({
  label,
  kind,
  sortText: label,
  ...extras,
});

export const suggestKeywords = (
  ctx: SuggestCtx,
  names: readonly string[],
  kind: CompletionKind = "keyword"
): CompletionItem[] =>
  filterByPrefix(
    names.map((name) => item(name, kind)),
    ctx.prefix.text
  );

export const suggestEnum = (
  ctx: SuggestCtx,
  def:
    | MegaloEnumDef<string>
    | Pick<MegaloEnumDef<string>, "acceptedNames" | "isDeprecated">
    | readonly string[]
): CompletionItem[] => {
  let names: readonly string[];
  if (Array.isArray(def)) {
    names = def;
  } else if ("acceptedNames" in def) {
    names = def.acceptedNames.filter(
      (name) => !("isDeprecated" in def && def.isDeprecated?.(name))
    );
  } else {
    names = [];
  }
  return filterByPrefix(
    names.map((name) => item(name, "enumMember")),
    ctx.prefix.text
  );
};

const pushUnique = (
  items: CompletionItem[],
  seen: Set<string>,
  label: string,
  kind: CompletionKind,
  extras?: Partial<CompletionItem>
): void => {
  if (seen.has(label)) {
    return;
  }
  seen.add(label);
  items.push(item(label, kind, extras));
};

const suggestMembers = (
  ctx: SuggestCtx,
  type: ParameterType,
  rootName: string
): CompletionItem[] => {
  const rootType = resolveVisibleRootType(ctx, rootName);
  if (rootType === undefined) {
    return [];
  }
  const memberScope = memberScopeForRootType(rootType);
  if (memberScope === undefined) {
    return [];
  }

  const items: CompletionItem[] = [];
  const seen = new Set<string>();

  for (const name of builtinMembersFor(rootType, type)) {
    pushUnique(items, seen, name, "property", {
      detail: parameterTypeLabel(type),
    });
  }

  for (const entry of ctx.snapshot.ast.symbolTable.toArray()) {
    if (entry.kind !== SymbolKind.Variable) {
      continue;
    }
    if (entry.scope !== memberScope) {
      continue;
    }
    if (!matchesParameterType(entry, type)) {
      continue;
    }
    pushUnique(items, seen, entry.name, "property", {
      detail: completionDetailForEntry(entry),
    });
  }

  return filterByPrefix(items, ctx.prefix.text);
};

export const suggestTyped = (
  ctx: SuggestCtx,
  type: ParameterType,
  options?: SuggestOptions
): CompletionItem[] => {
  if (ctx.prefix.memberOf !== undefined) {
    return suggestMembers(ctx, type, ctx.prefix.memberOf);
  }

  const items: CompletionItem[] = [];
  const seen = new Set<string>();
  for (const entry of ctx.snapshot.ast.symbolTable.toArray()) {
    if (!isVisibleAt(entry, ctx.offset)) {
      continue;
    }
    if (!matchesParameterType(entry, type)) {
      continue;
    }
    if (
      entry.kind === SymbolKind.Variable &&
      !isBareReferenceScope(entry.scope)
    ) {
      continue;
    }
    const kind: CompletionKind =
      entry.kind === SymbolKind.Constant ? "constant" : "variable";
    pushUnique(items, seen, entry.name, kind, {
      detail: completionDetailForEntry(entry),
    });
  }
  return finalizeSuggestions(ctx, items, options);
};

export const suggestObjectList = (
  ctx: SuggestCtx,
  objectType: ObjectListType,
  options?: { quoted?: boolean }
): CompletionItem[] => {
  const quoted = options?.quoted === true || ctx.prefix.quoted;
  const items: CompletionItem[] = [];
  for (const entry of ctx.snapshot.ast.symbolTable.toArray()) {
    if (entry.kind !== SymbolKind.ObjectListItem) {
      continue;
    }
    if (entry.objectType !== objectType) {
      continue;
    }
    const label = entry.name;
    items.push(
      item(label, "enumMember", {
        insertText: quoted ? `"${label}"` : label,
        detail: completionDetailForEntry(entry),
      })
    );
  }
  return filterByPrefix(items, ctx.prefix.text);
};

export const suggestSymbolKind = (
  ctx: SuggestCtx,
  kind: SymbolKind
): CompletionItem[] => {
  const items: CompletionItem[] = [];
  const seen = new Set<string>();
  for (const entry of ctx.snapshot.ast.symbolTable.toArray()) {
    if (entry.kind !== kind) {
      continue;
    }
    if (!isVisibleAt(entry, ctx.offset)) {
      continue;
    }
    if (
      entry.kind === SymbolKind.Variable &&
      !isBareReferenceScope(entry.scope)
    ) {
      continue;
    }
    pushUnique(items, seen, entry.name, "variable", {
      detail: completionDetailForEntry(entry),
    });
  }
  return filterByPrefix(items, ctx.prefix.text);
};

/**
 * Team-or-player target: after `team`/`player` keywords suggest typed refs;
 * otherwise suggest kind keywords + `everyone`.
 */
export const suggestTeamOrPlayerTarget = (
  ctx: ActionCompletionContext | ConditionCompletionContext,
  paramStart: number
): CompletionItem[] => {
  const parameters =
    ctx.kind === "action-operands"
      ? ctx.statement.parameters
      : ctx.statement.operands;
  const head = parameters[paramStart];
  if (head?.kind === SyntaxKind.KEYWORD) {
    if (head.value === "team" && ctx.slotIndex === paramStart + 1) {
      return suggestTyped(ctx, ParameterType.Team);
    }
    if (head.value === "player" && ctx.slotIndex === paramStart + 1) {
      return suggestTyped(ctx, ParameterType.Player);
    }
  }

  if (ctx.slotIndex === paramStart) {
    return suggestEnum(ctx, teamOrPlayerTarget);
  }
  return [];
};

/** Player filter: kind keyword, then optional player/team ref. */
export const suggestPlayerFilter = (
  ctx: ActionCompletionContext,
  paramStart: number
): CompletionItem[] => {
  const first = ctx.statement.parameters[paramStart];
  if (first?.kind === SyntaxKind.KEYWORD) {
    if (first.value === "player" && ctx.slotIndex === paramStart + 1) {
      return suggestTyped(ctx, ParameterType.Player);
    }
    if (first.value === "team" && ctx.slotIndex === paramStart + 1) {
      return suggestTyped(ctx, ParameterType.Team);
    }
  }
  if (ctx.slotIndex === paramStart) {
    return suggestEnum(ctx, playerFilterType);
  }
  return [];
};

export const suggestBoolean = (ctx: SuggestCtx): CompletionItem[] =>
  suggestKeywords(ctx, ["true", "false"], "enumMember");

export { ObjectListType, ParameterType, SymbolKind };
