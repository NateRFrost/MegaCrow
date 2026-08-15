import {
  ParameterType,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `device_set_position_track <object> <animation> <interp>` */
export const completeDeviceSetPositionTrack = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.Object);
    case 1:
      return [];
    case 2:
      return suggestTyped(ctx, ParameterType.Integer);
    default:
      return [];
  }
};
