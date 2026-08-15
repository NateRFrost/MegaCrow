import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import {
  ObjectListType,
  ParameterType,
  suggestObjectList,
  suggestTeamOrPlayerTarget,
  suggestTyped,
} from "src/language-service/completion/helpers";
import type {
  ActionCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";

/** `submit_incident_with_custom_value <incident> <cause> <effect> <value>` */
export const completeSubmitIncidentWithCustomValue = (
  ctx: ActionCompletionContext
): CompletionItem[] => {
  if (ctx.slotIndex === 0) {
    return suggestObjectList(ctx, ObjectListType.Incidents);
  }
  const p = ctx.statement.parameters;
  let i = 1;
  const cause = suggestTeamOrPlayerTarget(ctx, i);
  if (cause.length > 0) {
    return cause;
  }
  const causeHead = p[i];
  i =
    causeHead?.kind === SyntaxKind.KEYWORD &&
    (causeHead.value === "player" || causeHead.value === "team")
      ? i + 2
      : i + 1;
  const effect = suggestTeamOrPlayerTarget(ctx, i);
  if (effect.length > 0) {
    return effect;
  }
  const effectHead = p[i];
  const effectEnd =
    effectHead?.kind === SyntaxKind.KEYWORD &&
    (effectHead.value === "player" || effectHead.value === "team")
      ? i + 2
      : i + 1;
  if (ctx.slotIndex === effectEnd) {
    return suggestTyped(ctx, ParameterType.Integer);
  }
  return [];
};
