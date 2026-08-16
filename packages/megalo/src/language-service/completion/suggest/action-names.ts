import { getConfigurationForVersion } from "src/backend/version-configuration";
import { ElementKind } from "src/frontend/abstract-syntax-tree/elements";
import type { TriggerElementNode } from "src/frontend/abstract-syntax-tree/elements/trigger";
import { actionType } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import {
  filterByFuzzy,
  snippetTabstop,
  withBlockEndSnippet,
  withContinueCompletion,
} from "src/language-service/completion/helpers";
import type {
  ActionNameCompletionContext,
  CompletionItem,
} from "src/language-service/completion/types";
import { hoverDocumentationForId } from "src/language-service/hover";
import type { AnalysisSnapshot } from "src/language-service/snapshot";

/** Actions with no operands — do not append a trailing space. */
const ACTIONS_WITHOUT_OPERANDS = new Set(["end_round", "break_into_debugger"]);

/** True when `offset` is inside a `trigger pregame` (including nested begin / for_each). */
export const isInsidePregameTrigger = (
  snapshot: AnalysisSnapshot,
  offset: number
): boolean => {
  for (const element of snapshot.ast.elements) {
    if (element.elementKind !== ElementKind.TRIGGER) {
      continue;
    }
    const trigger = element as TriggerElementNode;
    const { start, end } = trigger.location;
    if (offset < start.localOffset || offset > end.localOffset) {
      continue;
    }
    return trigger.name.value.toLowerCase() === "pregame";
  }
  return false;
};

export const suggestActionNames = (
  ctx: ActionNameCompletionContext
): CompletionItem[] => {
  const supported = actionType.supportedMembers(ctx.snapshot.version);
  let names = actionType.names.filter(
    (name) => !actionType.isDeprecated(name) && supported.has(name)
  );
  if (isInsidePregameTrigger(ctx.snapshot, ctx.offset)) {
    const allowed = new Set<string>(
      getConfigurationForVersion(ctx.snapshot.version).pregameActions
    );
    names = names.filter((name) => allowed.has(name));
  }

  return filterByFuzzy(
    names.map((label) => {
      const documentation = hoverDocumentationForId("action", label);
      const entry: CompletionItem = {
        label,
        kind: "function",
        sortText: label,
        detail: "action",
        ...(documentation === undefined ? {} : { documentation }),
      };
      if (label === "begin") {
        return withBlockEndSnippet(entry);
      }
      if (label === "for_each") {
        return withBlockEndSnippet(entry, snippetTabstop(1, "general"));
      }
      if (ACTIONS_WITHOUT_OPERANDS.has(label)) {
        return entry;
      }
      return withContinueCompletion(entry);
    }),
    ctx.prefix.text
  );
};
