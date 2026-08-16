import { conditionType } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_conditions";
import {
  filterByFuzzy,
  withContinueCompletion,
} from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ConditionNameCompletionContext,
} from "src/language-service/completion/types";
import { hoverDocumentationForId } from "src/language-service/hover";

export const suggestConditionNames = (
  ctx: ConditionNameCompletionContext
): CompletionItem[] =>
  filterByFuzzy(
    conditionType.names
      .filter((name) => !conditionType.isDeprecated(name))
      .map((label) => {
        const documentation = hoverDocumentationForId("condition", label);
        const entry: CompletionItem = {
          label,
          kind: "function",
          sortText: label,
          detail: "condition",
          ...(documentation === undefined ? {} : { documentation }),
        };
        return withContinueCompletion(entry);
      }),
    ctx.prefix.text
  );
