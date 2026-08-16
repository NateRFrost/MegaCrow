import { TEMPORARY_STORAGE_NAMES } from "src/frontend/abstract-syntax-tree/elements/trigger/temporary";
import {
  ParameterType,
  suggestKeywords,
  suggestTyped,
  withContinueCompletion,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  TemporaryCompletionContext,
} from "src/language-service/completion/types";

const completeInitial = (ctx: TemporaryCompletionContext): CompletionItem[] => {
  switch (ctx.statement.storage.value) {
    case "number":
      return suggestTyped(ctx, ParameterType.Integer);
    case "object":
      return [
        ...suggestKeywords(ctx, ["none"], "keyword"),
        ...suggestTyped(ctx, ParameterType.Object),
      ];
    case "team":
      return [
        ...suggestKeywords(ctx, ["none"], "keyword"),
        ...suggestTyped(ctx, ParameterType.Team),
      ];
    case "player":
      return [
        ...suggestKeywords(ctx, ["none"], "keyword"),
        ...suggestTyped(ctx, ParameterType.Player),
      ];
    default:
      return [];
  }
};

/** All storage types — do not prefix-filter so replacing `player` still lists siblings. */
const completeStorage = (ctx: TemporaryCompletionContext): CompletionItem[] => {
  const prefix = ctx.prefix.text;
  return TEMPORARY_STORAGE_NAMES.map((name) =>
    withContinueCompletion({
      label: name,
      kind: "keyword",
      detail: "type",
      sortText: name,
      ...(prefix.length > 0 ? { filterText: prefix } : {}),
    })
  );
};

export const completeTemporary = (
  ctx: TemporaryCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return completeStorage(ctx);
    case 1:
      return [];
    case 2:
      return completeInitial(ctx);
    default:
      return [];
  }
};
