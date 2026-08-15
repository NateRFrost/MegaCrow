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

/** `hud_widget_set_meter <widget> off|<timer>|<value> <max>` */
export const completeHudWidgetSetMeter = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.HudWidget);
    case 1:
      return [
        ...suggestKeywords(ctx, ["off"], "enumMember"),
        ...suggestTyped(ctx, ParameterType.Timer),
        ...suggestTyped(ctx, ParameterType.Integer),
      ];
    case 2: {
      const second = ctx.statement.parameters[1];
      if (second?.kind === SyntaxKind.KEYWORD && second.value === "off") {
        return [];
      }
      // If second was a timer, no third; if integer value, suggest max
      return suggestTyped(ctx, ParameterType.Integer);
    }
    default:
      return [];
  }
};
