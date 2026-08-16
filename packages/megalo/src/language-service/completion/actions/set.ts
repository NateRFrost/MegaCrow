import { mathOperation } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  ParameterType,
  suggestEnum,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `set <variable> <math_operation> <variable>` */
export const completeSet = (ctx: ActionCompletionContext): CompletionItem[] => {
  const rhs = suggestTyped(ctx, [
    ParameterType.Integer,
    ParameterType.Timer,
    ParameterType.Team,
    ParameterType.Player,
    ParameterType.Object,
  ]);
  const lhs = suggestTyped(
    ctx,
    [
      ParameterType.Integer,
      ParameterType.Timer,
      ParameterType.Team,
      ParameterType.Player,
      ParameterType.Object,
    ],
    { writable: true }
  );
  switch (ctx.slotIndex) {
    case 0:
      return lhs;
    case 2:
      return rhs;
    case 1:
      return suggestEnum(ctx, mathOperation);
    default:
      return [];
  }
};
