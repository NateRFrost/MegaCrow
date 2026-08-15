import { conditionType } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_conditions";
import { filterByPrefix } from "src/language-service/completion/helpers";
import type {
  CompletionItem,
  ConditionNameCompletionContext,
} from "src/language-service/completion/types";

export const suggestConditionNames = (
  ctx: ConditionNameCompletionContext
): CompletionItem[] =>
  filterByPrefix(
    conditionType.acceptedNames
      .filter((name) => !conditionType.isDeprecated(name))
      .map((label) => ({
        label,
        kind: "function" as const,
        sortText: label,
        detail: "condition",
      })),
    ctx.prefix.text
  );
