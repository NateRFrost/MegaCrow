import { COMPARISON_OPERATOR_NAMES } from "src/frontend/abstract-syntax-tree/elements/trigger/operand";
import {
  ParameterType,
  suggestEnum,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ConditionCompletionContext,
} from "src/language-service/completion/types";

/** `if <operand> <comparison> <operand>` */
export const completeIf = (
  ctx: ConditionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
    case 2:
      return suggestTyped(ctx, [
        ParameterType.Integer,
        ParameterType.Player,
        ParameterType.Object,
        ParameterType.Team,
        ParameterType.Timer,
      ]);
    case 1:
      return suggestEnum(ctx, COMPARISON_OPERATOR_NAMES);
    default:
      return [];
  }
};
