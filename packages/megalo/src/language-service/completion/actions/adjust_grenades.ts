import {
  grenadeType,
  mathOperation,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  ParameterType,
  suggestEnum,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `adjust_grenades <player> <grenade_type> <math_operation> <value>` */
export const completeAdjustGrenades = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.Player);
    case 1:
      return suggestEnum(ctx, grenadeType);
    case 2:
      return suggestEnum(ctx, mathOperation);
    case 3:
      return suggestTyped(ctx, ParameterType.Integer);
    default:
      return [];
  }
};
