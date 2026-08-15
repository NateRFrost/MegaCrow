import {
  ParameterType,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `create_tunnel <from> <to> <type> <radius> <out>` */
export const completeCreateTunnel = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.Object);
    case 1:
      return suggestTyped(ctx, ParameterType.Object);
    case 2:
      return [];
    case 3:
      return suggestTyped(ctx, ParameterType.Integer);
    case 4:
      return suggestTyped(ctx, ParameterType.Object);
    default:
      return [];
  }
};
