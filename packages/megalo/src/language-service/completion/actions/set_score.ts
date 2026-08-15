import { mathOperation } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
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

/** `set_score <math_operation> <value> <team_or_player_target>` */
export const completeSetScore = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  switch (ctx.slotIndex) {
    case 0:
      return suggestEnum(ctx, mathOperation);
    case 1:
      return suggestTyped(ctx, ParameterType.Integer);
    default:
      return suggestTeamOrPlayerTarget(ctx, 2);
  }
};
