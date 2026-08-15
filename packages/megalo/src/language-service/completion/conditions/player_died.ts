import { KILLER_TYPE_KEYWORDS } from "src/frontend/language-configuration/omni/conditions";
import {
  ParameterType,
  suggestEnum,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ConditionCompletionContext,
} from "src/language-service/completion/types";

/** `player_died <player> <killer_type>` */
export const completePlayerDied = (
  ctx: ConditionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.Player);
    case 1:
      return suggestEnum(ctx, KILLER_TYPE_KEYWORDS);
    default:
      return [];
  }
};
