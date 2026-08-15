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

/** `navpoint_set_icon <object> <icon>` / `num <number>` / `coop spawning` */
export const completeNavpointSetIcon = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  const NAVPOINT_ICON_KEYWORDS = [
    "none",
    "speaker",
    "dead_teammate",
    "unused",
    "target",
    "destination",
    "bomb",
    "flag",
    "skull",
    "king",
    "vip",
    "lock",
    "num",
    "ordnance",
    "interface",
    "recon",
    "ammunition",
    "recover",
    "defend",
    "neutralize",
    "coop spawning",
  ] as const;

  switch (ctx.slotIndex) {
    case 0:
      return suggestTyped(ctx, ParameterType.Object);
    case 1:
      return suggestKeywords(ctx, [...NAVPOINT_ICON_KEYWORDS], "enumMember");
    case 2: {
      const icon = ctx.statement.parameters[1];
      if (icon?.kind === SyntaxKind.KEYWORD && icon.value === "num") {
        return suggestTyped(ctx, ParameterType.Integer);
      }
      return [];
    }
    default:
      return [];
  }
};
