import {
  ParameterType,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ConditionCompletionContext,
} from "src/language-service/completion/types";

/** Fallback for conditions without a dedicated completer. */
export const completeConditionDefault = (
  ctx: ConditionCompletionContext
): CompletionItem[] =>
  suggestTyped(ctx, [
    ParameterType.Integer,
    ParameterType.Player,
    ParameterType.Object,
    ParameterType.Team,
    ParameterType.Timer,
  ]);
