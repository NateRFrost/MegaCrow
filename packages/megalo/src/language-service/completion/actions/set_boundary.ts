import { boundaryShape } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  ParameterType,
  suggestEnum,
  suggestKeywords,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `set_boundary <object> <shape> [width|radius|…]` */
export const completeSetBoundary = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.Object);
    case 1:
      return suggestEnum(ctx, boundaryShape);
    default:
      return [
        ...suggestKeywords(ctx, [
          "width",
          "radius",
          "length",
          "depth",
          "neg_height",
          "pos_height",
          "height",
        ]),
        ...suggestTyped(ctx, ParameterType.Integer),
      ];
  }
};
