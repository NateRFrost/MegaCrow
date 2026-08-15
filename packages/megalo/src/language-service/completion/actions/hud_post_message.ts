import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import { megaloSound } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_sounds";
import {
  ParameterType,
  suggestEnum,
  suggestTeamOrPlayerTarget,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `hud_post_message <team_or_player_target> <sound> <dynamic_string>` */
export const completeHudPostMessage = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  const p = ctx.statement.parameters;
  const first = p[0];

  if (ctx.slotIndex === 0) {
    return suggestTeamOrPlayerTarget(ctx, 0);
  }

  if (
    first?.kind === SyntaxKind.KEYWORD &&
    (first.value === "player" || first.value === "team") &&
    ctx.slotIndex === 1
  ) {
    return suggestTeamOrPlayerTarget(ctx, 0);
  }

  const targetEnd =
    first?.kind === SyntaxKind.KEYWORD &&
    (first.value === "player" || first.value === "team")
      ? 2
      : 1;

  if (ctx.slotIndex === targetEnd) {
    return suggestEnum(ctx, megaloSound);
  }
  if (ctx.slotIndex === targetEnd + 1) {
    return suggestTyped(ctx, ParameterType.DynamicString);
  }
  return [];
};
