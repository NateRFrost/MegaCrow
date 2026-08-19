import type { SourceCodeLocation } from "src/diagnostics";
import { isAstErrorNode } from "src/frontend/abstract-syntax-tree";
import type {
  VariableEntryNode,
  VariablesElementNode,
} from "src/frontend/abstract-syntax-tree/elements/variables";
import { megaloVariableNetworkState } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_variable_metadata";
import {
  VARIABLE_SCOPE_NAMES,
  VARIABLE_TYPE_NAMES,
} from "src/frontend/language-configuration/omni/variables";
import { isSameLineAs } from "src/language-service/completion/elements/property";
import {
  ParameterType,
  suggestEnum,
  suggestKeywords,
  suggestTyped,
  withContinueCompletion,
  withEnterBlockBody,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ElementCompletionContext,
} from "src/language-service/completion/types";

const containsInclusive = (
  location: SourceCodeLocation,
  offset: number
): boolean =>
  offset >= location.start.localOffset && offset <= location.end.localOffset;

const completeInitial = (
  ctx: ElementCompletionContext,
  entry: VariableEntryNode
): CompletionItem[] => {
  if (isAstErrorNode(entry.type)) {
    return [];
  }
  switch (entry.type.value) {
    case "number":
    case "timer":
      return suggestTyped(ctx, ParameterType.Integer);
    case "player":
      return suggestTyped(ctx, ParameterType.Player);
    case "team":
      return suggestTyped(ctx, ParameterType.Team);
    case "object":
      return suggestTyped(ctx, ParameterType.Object);
    default:
      return [];
  }
};

const completeEntrySlot = (
  ctx: ElementCompletionContext,
  entry: VariableEntryNode
): CompletionItem[] | undefined => {
  if (containsInclusive(entry.network.location, ctx.offset)) {
    return suggestEnum(ctx, megaloVariableNetworkState).map(
      withContinueCompletion
    );
  }
  if (containsInclusive(entry.type.location, ctx.offset)) {
    return suggestKeywords(ctx, VARIABLE_TYPE_NAMES, "keyword").map(
      withContinueCompletion
    );
  }
  if (containsInclusive(entry.name.location, ctx.offset)) {
    return [];
  }
  if (containsInclusive(entry.initial.location, ctx.offset)) {
    return completeInitial(ctx, entry);
  }
  return;
};

export const completeVariables = (
  ctx: ElementCompletionContext
): CompletionItem[] => {
  const element = ctx.element as VariablesElementNode;

  if (
    isSameLineAs(ctx.snapshot, ctx.offset, element.keywordLocation) &&
    ctx.offset >= element.keywordLocation.end.localOffset
  ) {
    return suggestKeywords(ctx, VARIABLE_SCOPE_NAMES, "keyword").map(
      withEnterBlockBody
    );
  }

  for (const entry of element.entries) {
    if (
      ctx.offset < entry.location.start.localOffset ||
      ctx.offset > entry.location.end.localOffset
    ) {
      continue;
    }
    const slot = completeEntrySlot(ctx, entry);
    if (slot !== undefined) {
      return slot;
    }
  }

  return [
    ...suggestKeywords(ctx, ["end"], "keyword"),
    ...suggestEnum(ctx, megaloVariableNetworkState).map(withContinueCompletion),
  ];
};
