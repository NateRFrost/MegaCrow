import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import {
  ObjectListType,
  suggestObjectList,
  suggestTeamOrPlayerTarget,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `submit_incident <incident> <cause_target> <effect_target>` */
export const completeSubmitIncident = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  if (ctx.slotIndex === 0) {
    return suggestObjectList(ctx, ObjectListType.Incidents);
  }
  const afterIncident = 1;
  const cause = suggestTeamOrPlayerTarget(ctx, afterIncident);
  if (cause.length > 0) {
    return cause;
  }
  const causeHead = ctx.statement.parameters[afterIncident];
  const causeEnd =
    causeHead?.kind === SyntaxKind.KEYWORD &&
    (causeHead.value === "player" || causeHead.value === "team")
      ? afterIncident + 2
      : afterIncident + 1;
  return suggestTeamOrPlayerTarget(ctx, causeEnd);
};
