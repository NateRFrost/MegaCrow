import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import { loadoutPaletteType } from "src/frontend/intermediate-representation/game/megalogamengine/loadoutPaletteType";
import {
  suggestEnum,
  suggestTeamOrPlayerTarget,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `set_loadout_palette <team_or_player_target> <palette_type>` */
export const completeSetLoadoutPalette = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  const first = ctx.statement.parameters[0];

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
    return suggestEnum(ctx, loadoutPaletteType);
  }
  return [];
};
