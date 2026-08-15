import {
  ObjectListType,
  ParameterType,
  suggestKeywords,
  suggestObjectList,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `hud_widget_set_icon <widget> none|<icon>` */
export const completeHudWidgetSetIcon = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.HudWidget);
    case 1:
      return [
        ...suggestKeywords(ctx, ["none"], "enumMember"),
        ...suggestObjectList(ctx, ObjectListType.HudWidgetIcons),
      ];
    default:
      return [];
  }
};
