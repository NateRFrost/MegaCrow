import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import {
  ParameterType,
  suggestKeywords,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `object_face_object <object> <target> [offset <x> <y> <z>]` */
export const completeObjectFaceObject = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
    case 1:
      return suggestTyped(ctx, ParameterType.Object);
    case 2:
      return suggestKeywords(ctx, ["offset"]);
    case 3:
    case 4:
    case 5: {
      const offset = ctx.statement.parameters[2];
      if (offset?.kind === SyntaxKind.KEYWORD && offset.value === "offset") {
        return suggestTyped(ctx, ParameterType.Integer);
      }
      return [];
    }
    default:
      return [];
  }
};
