import {
  ParameterType,
  suggestBoolean,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

export const completeTeamSetVehicleSpawning = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.Team);
    case 1:
      return suggestBoolean(ctx);
    default:
      return [];
  }
};
