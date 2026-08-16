import { scriptableGameButtons } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  ParameterType,
  suggestEnum,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `get_button_time <player> <button> <out>` */
export const completeGetButtonTime = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.Player);
    case 1:
      return suggestEnum(ctx, scriptableGameButtons);
    case 2:
      return suggestTyped(ctx, ParameterType.Integer, { writable: true });
    default:
      return [];
  }
};
