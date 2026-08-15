import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import {
  ParameterType,
  suggestKeywords,
  suggestTeamOrPlayerTarget,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `play_sound [everyone|player …|team …] [immediate] <sound>` */
export const completePlaySound = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  const p = ctx.statement.parameters;
  const first = p[0];
  const hasTarget =
    first?.kind === SyntaxKind.KEYWORD &&
    (first.value === "everyone" ||
      first.value === "player" ||
      first.value === "team");

  if (!hasTarget && ctx.slotIndex === 0) {
    return [
      ...suggestTeamOrPlayerTarget(ctx, 0),
      ...suggestKeywords(ctx, ["immediate"]),
      ...suggestTyped(ctx, ParameterType.String),
    ];
  }

  if (hasTarget) {
    const target = suggestTeamOrPlayerTarget(ctx, 0);
    if (target.length > 0) {
      return target;
    }
    const targetEnd =
      first.value === "player" || first.value === "team" ? 2 : 1;
    if (ctx.slotIndex === targetEnd) {
      return [
        ...suggestKeywords(ctx, ["immediate"]),
        ...suggestTyped(ctx, ParameterType.String),
      ];
    }
    if (
      ctx.slotIndex === targetEnd + 1 &&
      p[targetEnd]?.kind === SyntaxKind.KEYWORD &&
      p[targetEnd].value === "immediate"
    ) {
      return suggestTyped(ctx, ParameterType.String);
    }
    return [];
  }

  if (
    ctx.slotIndex === 1 &&
    first?.kind === SyntaxKind.KEYWORD &&
    first.value === "immediate"
  ) {
    return suggestTyped(ctx, ParameterType.String);
  }
  return [];
};
